import { SessionManager, SessionData, UserRole } from '../sessionManager';
import { User } from '../../types/auth';

describe('SessionManager', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true,
    });

    // Clear console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveSession', () => {
    it('should save parent session data correctly', () => {
      const parentUser: User = {
        id: 'parent-123',
        email: 'parent@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARENT',
        isEmailVerified: true
      };

      const sessionData: SessionData = {
        user: parentUser,
        userRole: 'parent',
        accessToken: 'parent-access-token',
        refreshToken: 'parent-refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      SessionManager.saveSession(sessionData);

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'parent-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'parent-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(parentUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('userRole', 'parent');
      expect(localStorage.setItem).toHaveBeenCalledWith('loginTime', '2023-01-01T00:00:00.000Z');
      expect(localStorage.setItem).not.toHaveBeenCalledWith('sessionId', expect.anything());
    });

    it('should save child session data with sessionId', () => {
      const childUser: User = {
        id: 'child-123',
        username: 'testchild',
        name: 'Test Child',
        role: 'CHILD',
        parentId: 'parent-123',
        age: 8,
        grade: '3rd'
      };

      const sessionData: SessionData = {
        user: childUser,
        userRole: 'child',
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z',
        sessionId: 'session-123'
      };

      SessionManager.saveSession(sessionData);

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'child-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'child-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(childUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('userRole', 'child');
      expect(localStorage.setItem).toHaveBeenCalledWith('loginTime', '2023-01-01T00:00:00.000Z');
      expect(localStorage.setItem).toHaveBeenCalledWith('sessionId', 'session-123');
    });

    it('should handle localStorage errors gracefully', () => {
      const sessionData: SessionData = {
        user: { id: 'user-123', role: 'PARENT' } as User,
        userRole: 'parent',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      // Mock localStorage.setItem to throw an error
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => SessionManager.saveSession(sessionData)).toThrow('Failed to save session data');
    });
  });

  describe('loadSession', () => {
    it('should load parent session data correctly', () => {
      const parentUser: User = {
        id: 'parent-123',
        email: 'parent@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARENT',
        isEmailVerified: true
      };

      mockLocalStorage = {
        accessToken: 'parent-access-token',
        refreshToken: 'parent-refresh-token',
        user: JSON.stringify(parentUser),
        userRole: 'parent',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.loadSession();

      expect(result).toEqual({
        user: parentUser,
        userRole: 'parent',
        accessToken: 'parent-access-token',
        refreshToken: 'parent-refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z',
        sessionId: undefined
      });
    });

    it('should load child session data with sessionId', () => {
      const childUser: User = {
        id: 'child-123',
        username: 'testchild',
        name: 'Test Child',
        role: 'CHILD',
        parentId: 'parent-123',
        age: 8,
        grade: '3rd'
      };

      mockLocalStorage = {
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        user: JSON.stringify(childUser),
        userRole: 'child',
        loginTime: '2023-01-01T00:00:00.000Z',
        sessionId: 'session-123'
      };

      const result = SessionManager.loadSession();

      expect(result).toEqual({
        user: childUser,
        userRole: 'child',
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z',
        sessionId: 'session-123'
      });
    });

    it('should return null when required fields are missing', () => {
      mockLocalStorage = {
        accessToken: 'token',
        // Missing refreshToken, user, userRole
      };

      const result = SessionManager.loadSession();
      expect(result).toBeNull();
    });

    it('should return null when user data is corrupted', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: 'invalid-json',
        userRole: 'parent'
      };

      const result = SessionManager.loadSession();
      expect(result).toBeNull();
    });

    it('should return null when user object is invalid', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: JSON.stringify({ name: 'Test' }), // Missing id and role
        userRole: 'parent'
      };

      const result = SessionManager.loadSession();
      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = SessionManager.loadSession();
      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should validate parent session correctly', () => {
      const parentSession: SessionData = {
        user: {
          id: 'parent-123',
          email: 'parent@test.com',
          role: 'PARENT'
        } as User,
        userRole: 'parent',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(parentSession);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual(parentSession);
    });

    it('should validate child session correctly', () => {
      const childSession: SessionData = {
        user: {
          id: 'child-123',
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD'
        } as User,
        userRole: 'child',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z',
        sessionId: 'session-123'
      };

      const result = SessionManager.validateSession(childSession);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual(childSession);
    });

    it('should detect missing user ID', () => {
      const invalidSession: SessionData = {
        user: { role: 'PARENT' } as User,
        userRole: 'parent',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing user ID');
    });

    it('should detect role mismatch', () => {
      const invalidSession: SessionData = {
        user: { id: 'user-123', role: 'PARENT' } as User,
        userRole: 'child', // Mismatch
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Role mismatch: userRole=child, user.role=PARENT');
    });

    it('should detect missing tokens', () => {
      const invalidSession: SessionData = {
        user: { id: 'user-123', role: 'PARENT' } as User,
        userRole: 'parent',
        accessToken: '',
        refreshToken: '',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing access token');
      expect(result.errors).toContain('Missing refresh token');
    });

    it('should detect missing child username/name', () => {
      const invalidSession: SessionData = {
        user: { id: 'child-123', role: 'CHILD' } as User,
        userRole: 'child',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Child user missing username or name');
    });

    it('should detect missing parent email', () => {
      const invalidSession: SessionData = {
        user: { id: 'parent-123', role: 'PARENT' } as User,
        userRole: 'parent',
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.validateSession(invalidSession);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parent user missing email');
    });
  });

  describe('clearSession', () => {
    it('should remove all session data from localStorage', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: 'user-data',
        userRole: 'parent',
        loginTime: 'time',
        sessionId: 'session-123'
      };

      SessionManager.clearSession();

      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userRole');
      expect(localStorage.removeItem).toHaveBeenCalledWith('loginTime');
      expect(localStorage.removeItem).toHaveBeenCalledWith('sessionId');
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      expect(() => SessionManager.clearSession()).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should correctly identify child sessions', () => {
      mockLocalStorage.userRole = 'child';
      expect(SessionManager.isChildSession()).toBe(true);

      mockLocalStorage.userRole = 'parent';
      expect(SessionManager.isChildSession()).toBe(false);

      delete mockLocalStorage.userRole;
      expect(SessionManager.isChildSession()).toBe(false);
    });

    it('should correctly identify parent sessions', () => {
      mockLocalStorage.userRole = 'parent';
      expect(SessionManager.isParentSession()).toBe(true);

      mockLocalStorage.userRole = 'child';
      expect(SessionManager.isParentSession()).toBe(false);

      delete mockLocalStorage.userRole;
      expect(SessionManager.isParentSession()).toBe(false);
    });

    it('should get current user role', () => {
      mockLocalStorage.userRole = 'child';
      expect(SessionManager.getCurrentUserRole()).toBe('child');

      mockLocalStorage.userRole = 'parent';
      expect(SessionManager.getCurrentUserRole()).toBe('parent');

      delete mockLocalStorage.userRole;
      expect(SessionManager.getCurrentUserRole()).toBeNull();
    });

    it('should detect session existence', () => {
      mockLocalStorage = {
        accessToken: 'token',
        user: 'user-data',
        userRole: 'parent'
      };
      expect(SessionManager.hasSession()).toBe(true);

      delete mockLocalStorage.accessToken;
      expect(SessionManager.hasSession()).toBe(false);

      mockLocalStorage.accessToken = 'token';
      delete mockLocalStorage.user;
      expect(SessionManager.hasSession()).toBe(false);
    });

    it('should update tokens correctly', () => {
      SessionManager.updateTokens('new-access-token', 'new-refresh-token');

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });

    it('should handle token update errors', () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => SessionManager.updateTokens('token', 'refresh')).toThrow('Failed to update session tokens');
    });

    it('should calculate session age correctly', () => {
      const loginTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      mockLocalStorage.loginTime = loginTime.toISOString();

      const age = SessionManager.getSessionAge();
      expect(age).toBeGreaterThan(4 * 60 * 1000); // At least 4 minutes
      expect(age).toBeLessThan(6 * 60 * 1000); // Less than 6 minutes
    });

    it('should return 0 for missing login time', () => {
      delete mockLocalStorage.loginTime;
      expect(SessionManager.getSessionAge()).toBe(0);
    });

    it('should handle invalid login time', () => {
      mockLocalStorage.loginTime = 'invalid-date';
      const age = SessionManager.getSessionAge();
      expect(age).toBe(0);
    });
  });

  describe('createSessionFromAuthResult', () => {
    it('should create parent session from auth result', () => {
      const authResult = {
        user: {
          id: 'parent-123',
          email: 'parent@test.com',
          role: 'PARENT'
        } as User,
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const result = SessionManager.createSessionFromAuthResult(authResult);

      expect(result.user).toEqual(authResult.user);
      expect(result.userRole).toBe('parent');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.loginTime).toBeDefined();
      expect(result.sessionId).toBeUndefined();
    });

    it('should create child session from auth result with sessionId', () => {
      const authResult = {
        user: {
          id: 'child-123',
          username: 'testchild',
          role: 'CHILD'
        } as User,
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const result = SessionManager.createSessionFromAuthResult(authResult, 'session-123');

      expect(result.user).toEqual(authResult.user);
      expect(result.userRole).toBe('child');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.loginTime).toBeDefined();
      expect(result.sessionId).toBe('session-123');
    });
  });

  describe('repairSession', () => {
    it('should repair session with missing userRole', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: JSON.stringify({ id: 'child-123', role: 'CHILD', username: 'testchild' }),
        userRole: '', // Empty userRole (not null, which would cause loadSession to fail)
        loginTime: '2023-01-01T00:00:00.000Z'
      };

      const result = SessionManager.repairSession();

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('userRole', 'child');
    });

    it('should repair session with missing loginTime', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: JSON.stringify({ id: 'parent-123', role: 'PARENT', email: 'test@test.com' }),
        userRole: 'parent',
        loginTime: '' // Empty loginTime (not null)
      };

      const result = SessionManager.repairSession();

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('loginTime', expect.any(String));
    });

    it('should return false for unrepairable sessions', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: JSON.stringify({ name: 'Test' }), // Missing id and role
        userRole: 'parent'
      };

      const result = SessionManager.repairSession();
      expect(result).toBe(false);
    });

    it('should return false when no session exists', () => {
      mockLocalStorage = {};
      const result = SessionManager.repairSession();
      expect(result).toBe(false);
    });

    it('should handle repair errors gracefully', () => {
      mockLocalStorage = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: JSON.stringify({ id: 'user-123', role: 'PARENT' }),
        userRole: 'parent'
      };

      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = SessionManager.repairSession();
      expect(result).toBe(false);
    });
  });
});