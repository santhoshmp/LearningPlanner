import { ChildAuthErrorHandler, CHILD_ERROR_MESSAGES } from '../childErrorHandler';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true
  }
});

describe('ChildAuthErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ChildAuthErrorHandler.resetLoopDetection();
  });

  describe('Error Creation', () => {
    it('should create error with correct properties', () => {
      const error = ChildAuthErrorHandler.createError('INVALID_CREDENTIALS');
      
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.userFriendlyMessage).toContain('username or PIN');
      expect(error.severity).toBe('medium');
      expect(error.shouldRedirect).toBe(false);
    });

    it('should create unknown error for invalid code', () => {
      const error = ChildAuthErrorHandler.createError('INVALID_CODE');
      
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.userFriendlyMessage).toContain('unexpected');
    });
  });

  describe('Authentication Error Handling', () => {
    it('should detect network errors', () => {
      const networkError = new Error('Network Error');
      const error = ChildAuthErrorHandler.handleAuthenticationError(networkError);
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.userFriendlyMessage).toContain('trouble connecting');
    });

    it('should detect 401 errors as invalid credentials', () => {
      const authError = {
        response: { status: 401 }
      };
      const error = ChildAuthErrorHandler.handleAuthenticationError(authError);
      
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should detect server errors', () => {
      const serverError = {
        response: { status: 500 }
      };
      const error = ChildAuthErrorHandler.handleAuthenticationError(serverError);
      
      expect(error.code).toBe('SERVER_ERROR');
    });
  });

  describe('Authentication Loop Detection', () => {
    it('should detect authentication loops', () => {
      // Simulate multiple redirects
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      
      expect(ChildAuthErrorHandler.isLoopDetected()).toBe(true);
    });

    it('should reset loop detection', () => {
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      
      ChildAuthErrorHandler.resetLoopDetection();
      expect(ChildAuthErrorHandler.isLoopDetected()).toBe(false);
    });

    it('should handle authentication loop in error handling', () => {
      // Simulate loop condition
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      ChildAuthErrorHandler.recordRedirect('/child-login');
      
      const error = ChildAuthErrorHandler.handleAuthenticationError(new Error('Test'));
      
      expect(error.code).toBe('AUTHENTICATION_LOOP');
      expect(error.userFriendlyMessage).toContain('mixed up');
    });
  });

  describe('Session Validation', () => {
    it('should validate correct session data', () => {
      const validSession = {
        user: { id: '123', role: 'CHILD' },
        userRole: 'child',
        accessToken: 'valid-token-123',
        refreshToken: 'valid-refresh-123'
      };
      
      expect(ChildAuthErrorHandler.validateSession(validSession)).toBe(true);
    });

    it('should reject invalid session data', () => {
      const invalidSession = {
        user: { id: '123' }, // Missing role
        userRole: 'child',
        accessToken: 'token',
        refreshToken: 'refresh'
      };
      
      expect(ChildAuthErrorHandler.validateSession(invalidSession)).toBe(false);
    });

    it('should reject inconsistent role data', () => {
      const inconsistentSession = {
        user: { id: '123', role: 'PARENT' },
        userRole: 'child', // Inconsistent with user.role
        accessToken: 'token',
        refreshToken: 'refresh'
      };
      
      expect(ChildAuthErrorHandler.validateSession(inconsistentSession)).toBe(false);
    });
  });

  describe('Session Corruption Detection', () => {
    it('should detect missing tokens', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ id: '123', role: 'CHILD' });
        if (key === 'userRole') return 'child';
        return null; // Missing tokens
      });
      
      const issues = ChildAuthErrorHandler.getSessionCorruptionIssues();
      expect(issues).toContain('Missing access token');
      expect(issues).toContain('Missing refresh token');
    });

    it('should detect corrupted JSON', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return 'invalid-json{';
        if (key === 'userRole') return 'child';
        if (key === 'accessToken') return 'token';
        if (key === 'refreshToken') return 'refresh';
        return null;
      });
      
      const issues = ChildAuthErrorHandler.getSessionCorruptionIssues();
      expect(issues).toContain('Corrupted user data JSON');
    });

    it('should detect role inconsistency', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ id: '123', role: 'PARENT' });
        if (key === 'userRole') return 'child';
        if (key === 'accessToken') return 'token';
        if (key === 'refreshToken') return 'refresh';
        return null;
      });
      
      const issues = ChildAuthErrorHandler.getSessionCorruptionIssues();
      expect(issues).toContain('Role inconsistency: child/CHILD mismatch');
    });
  });

  describe('Network Retry Mechanism', () => {
    it('should retry network operations', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Network Error');
          (error as any).code = 'NETWORK_ERROR';
          throw error;
        }
        return Promise.resolve('success');
      });
      
      const result = await ChildAuthErrorHandler.withNetworkRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for retry delays

    it('should fail after max retries', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'NETWORK_ERROR';
      const operation = jest.fn().mockRejectedValue(networkError);
      
      await expect(ChildAuthErrorHandler.withNetworkRetry(operation)).rejects.toThrow('Network Error');
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 10000); // Increase timeout for retry delays

    it('should not retry non-network errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Other Error'));
      
      await expect(ChildAuthErrorHandler.withNetworkRetry(operation)).rejects.toThrow('Other Error');
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Session Cleanup', () => {
    it('should clean corrupted session data', () => {
      ChildAuthErrorHandler.cleanCorruptedSession();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userRole');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('loginTime');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sessionId');
    });
  });

  describe('Error Messages', () => {
    it('should have child-friendly messages', () => {
      Object.values(CHILD_ERROR_MESSAGES).forEach(errorConfig => {
        expect(errorConfig.userFriendlyMessage).toBeTruthy();
        expect(errorConfig.userFriendlyMessage.length).toBeGreaterThan(10);
        // Should contain emojis or friendly language
        expect(
          errorConfig.userFriendlyMessage.includes('!') ||
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(errorConfig.userFriendlyMessage)
        ).toBe(true);
      });
    });

    it('should have appropriate severity levels', () => {
      expect(CHILD_ERROR_MESSAGES.ACCOUNT_LOCKED.severity).toBe('critical');
      expect(CHILD_ERROR_MESSAGES.NETWORK_ERROR.severity).toBe('high');
      expect(CHILD_ERROR_MESSAGES.SESSION_EXPIRED.severity).toBe('medium');
    });
  });
});