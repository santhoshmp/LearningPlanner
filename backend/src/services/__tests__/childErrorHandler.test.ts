import { childErrorHandler } from '../childErrorHandler';
import { logger } from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

describe('ChildErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatErrorForChild', () => {
    it('should format authentication error for early age group', () => {
      const error = new Error('Authentication failed');
      error.name = 'AuthenticationError';
      
      const context = {
        childId: 'child-123',
        childAge: 7,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe("Oops! Let's try again! 🔑");
      expect(result.message).toContain('Something went wrong when you tried to log in');
      expect(result.icon).toBe('🔑');
      expect(result.severity).toBe('error');
      expect(result.parentNotification).toBe(true);
      expect(result.recoveryOptions).toHaveLength(3);
      expect(result.recoveryOptions[0].action).toBe('retry_login');
    });

    it('should format network error for middle age group', () => {
      const error = new Error('Network connection failed');
      error.name = 'NetworkError';
      
      const context = {
        childId: 'child-123',
        childAge: 10,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Connection Problem 🌐');
      expect(result.message).toContain('having trouble connecting to the internet');
      expect(result.icon).toBe('🌐');
      expect(result.severity).toBe('warning');
      expect(result.parentNotification).toBe(false);
    });

    it('should format activity error for teen age group', () => {
      const error = new Error('Activity loading failed');
      error.name = 'ActivityError';
      
      const context = {
        childId: 'child-123',
        childAge: 15,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Activity Error 🎯');
      expect(result.message).toContain('issue loading this activity');
      expect(result.icon).toBe('🎯');
      expect(result.severity).toBe('error');
      expect(result.recoveryOptions.length).toBeGreaterThan(0);
    });

    it('should format progress error with appropriate recovery options', () => {
      const error = new Error('Failed to save progress');
      error.name = 'ProgressError';
      
      const context = {
        childId: 'child-123',
        childAge: 12,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Progress Save Issue 💾');
      expect(result.severity).toBe('warning');
      expect(result.recoveryOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'retry_save' }),
          expect.objectContaining({ action: 'continue_without_save' })
        ])
      );
    });

    it('should format badge error with info severity', () => {
      const error = new Error('Badge system unavailable');
      error.name = 'BadgeError';
      
      const context = {
        childId: 'child-123',
        childAge: 8,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Badge Magic Loading! 🏅');
      expect(result.severity).toBe('info');
      expect(result.parentNotification).toBe(false);
    });

    it('should format session timeout error', () => {
      const error = new Error('Session expired');
      error.name = 'SessionError';
      
      const context = {
        childId: 'child-123',
        childAge: 11,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Session Timeout 🕐');
      expect(result.severity).toBe('info');
      expect(result.recoveryOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'redirect_login' })
        ])
      );
    });

    it('should handle unknown error types with default fallback', () => {
      const error = new Error('Unknown error occurred');
      error.name = 'UnknownError';
      
      const context = {
        childId: 'child-123',
        childAge: 9,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.title).toBe('Activity Problem 🎯');
      expect(result.icon).toBe('🎯');
      expect(result.recoveryOptions.length).toBeGreaterThan(0);
    });

    it('should require parent notification for security errors', () => {
      const error = new Error('Suspicious activity detected');
      error.name = 'SecurityError';
      
      const context = {
        childId: 'child-123',
        childAge: 10,
        timestamp: new Date()
      };

      const result = childErrorHandler.formatErrorForChild(error, context);

      expect(result.parentNotification).toBe(true);
    });
  });

  describe('logChildError', () => {
    it('should log error with child-specific context', async () => {
      const error = new Error('Test error');
      const context = {
        childId: 'child-123',
        childAge: 10,
        activityId: 'activity-456',
        sessionId: 'session-789',
        timestamp: new Date()
      };
      const friendlyError = {
        title: 'Test Error',
        message: 'Test message',
        icon: '🔧',
        severity: 'error' as const,
        parentNotification: false,
        recoveryOptions: []
      };

      await childErrorHandler.logChildError(context, error, friendlyError);

      expect(logger.error).toHaveBeenCalledWith(
        'Child Error Occurred',
        expect.objectContaining({
          childId: 'child-123',
          childAge: 10,
          errorType: expect.any(String),
          originalError: expect.objectContaining({
            name: 'Error',
            message: 'Test error'
          }),
          friendlyError: expect.objectContaining({
            title: 'Test Error',
            message: 'Test message',
            severity: 'error'
          }),
          context: expect.objectContaining({
            activityId: 'activity-456',
            sessionId: 'session-789'
          })
        })
      );
    });

    it('should trigger parent notification when required', async () => {
      const error = new Error('Authentication failed');
      const context = {
        childId: 'child-123',
        childAge: 8,
        timestamp: new Date()
      };
      const friendlyError = {
        title: 'Login Error',
        message: 'Login failed',
        icon: '🔑',
        severity: 'error' as const,
        parentNotification: true,
        recoveryOptions: []
      };

      await childErrorHandler.logChildError(context, error, friendlyError);

      expect(logger.info).toHaveBeenCalledWith(
        'Parent notification triggered for child error',
        expect.objectContaining({
          childId: 'child-123',
          errorType: 'authentication',
          severity: 'error'
        })
      );
    });
  });

  describe('trackErrorRecovery', () => {
    it('should track recovery attempts', async () => {
      await childErrorHandler.trackErrorRecovery(
        'child-123',
        'error-456',
        'retry_login',
        true
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Child error recovery attempted',
        expect.objectContaining({
          childId: 'child-123',
          errorId: 'error-456',
          recoveryAction: 'retry_login',
          successful: true,
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('age group categorization', () => {
    it('should categorize ages correctly', () => {
      const testCases = [
        { age: 5, expected: 'early' },
        { age: 7, expected: 'early' },
        { age: 8, expected: 'early' },
        { age: 9, expected: 'middle' },
        { age: 11, expected: 'middle' },
        { age: 12, expected: 'middle' },
        { age: 13, expected: 'teen' },
        { age: 16, expected: 'teen' },
        { age: 18, expected: 'teen' }
      ];

      testCases.forEach(({ age, expected }) => {
        const error = new Error('Test error');
        const context = {
          childId: 'child-123',
          childAge: age,
          timestamp: new Date()
        };

        const result = childErrorHandler.formatErrorForChild(error, context);
        
        // Verify the message matches the expected age group
        if (expected === 'early') {
          expect(result.message).toMatch(/let's|together|awesome/i);
        } else if (expected === 'middle') {
          expect(result.message).not.toMatch(/let's together/i);
          expect(result.message).toMatch(/don't worry|try again/i);
        } else {
          expect(result.message).toMatch(/please|technical/i);
        }
      });
    });
  });

  describe('error categorization', () => {
    it('should categorize errors by message content', () => {
      const testCases = [
        { message: 'Authentication failed', expected: 'authentication' },
        { message: 'Login token expired', expected: 'authentication' },
        { message: 'Network connection lost', expected: 'network' },
        { message: 'Fetch request failed', expected: 'network' },
        { message: 'Activity content not found', expected: 'activity' },
        { message: 'Progress save failed', expected: 'progress' },
        { message: 'Badge system error', expected: 'badge' },
        { message: 'Session timeout', expected: 'session' },
        { message: 'Permission denied', expected: 'permission' },
        { message: 'Random error', expected: 'activity' } // fallback
      ];

      testCases.forEach(({ message, expected }) => {
        const error = new Error(message);
        const context = {
          childId: 'child-123',
          childAge: 10,
          timestamp: new Date()
        };

        const result = childErrorHandler.formatErrorForChild(error, context);
        
        // Verify the error was categorized correctly by checking recovery options
        if (expected === 'authentication') {
          expect(result.recoveryOptions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ action: 'retry_login' })
            ])
          );
        } else if (expected === 'network') {
          expect(result.recoveryOptions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ action: 'retry_connection' })
            ])
          );
        }
      });
    });
  });
});