import { PrismaClient } from '@prisma/client';
import { childSessionMonitoringService } from '../childSessionMonitoringService';
import { parentalNotificationService } from '../parentalNotificationService';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  childProfile: {
    findUnique: jest.fn(),
  },
  securityLog: {
    create: jest.fn(),
  },
} as any;

// Mock parental notification service
jest.mock('../parentalNotificationService', () => ({
  parentalNotificationService: {
    sendNotification: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ChildSessionMonitoringService', () => {
  const mockChildId = 'child-123';
  const mockSessionId = 'session-456';
  const mockParentId = 'parent-789';

  const mockSessionData = {
    childId: mockChildId,
    sessionId: mockSessionId,
    loginTime: new Date(),
    lastActivity: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Test Browser',
    deviceInfo: 'Desktop',
  };

  const mockChild = {
    id: mockChildId,
    name: 'Test Child',
    parent: {
      id: mockParentId,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
    mockPrisma.securityLog.create.mockResolvedValue({});
  });

  describe('startSession', () => {
    it('should start a new session successfully', async () => {
      await childSessionMonitoringService.startSession(mockSessionData);

      // Verify session is stored
      const activeSession = childSessionMonitoringService.getActiveSession(mockChildId);
      expect(activeSession).toBeTruthy();
      expect(activeSession?.sessionId).toBe(mockSessionId);
      expect(activeSession?.childId).toBe(mockChildId);
    });

    it('should terminate existing sessions when starting a new one', async () => {
      // Start first session
      await childSessionMonitoringService.startSession(mockSessionData);

      // Start second session with different session ID
      const newSessionData = {
        ...mockSessionData,
        sessionId: 'session-new',
      };

      await childSessionMonitoringService.startSession(newSessionData);

      // Verify only the new session is active
      const activeSession = childSessionMonitoringService.getActiveSession(mockChildId);
      expect(activeSession?.sessionId).toBe('session-new');
    });

    it('should log session start event', async () => {
      await childSessionMonitoringService.startSession(mockSessionData);

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          childId: mockChildId,
          event: 'SESSION_START',
          ipAddress: mockSessionData.ipAddress,
          userAgent: mockSessionData.userAgent,
          metadata: JSON.stringify({
            sessionId: mockSessionId,
            ipAddress: mockSessionData.ipAddress,
            userAgent: mockSessionData.userAgent,
          }),
          severity: 'INFO',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should notify parent of login', async () => {
      await childSessionMonitoringService.startSession(mockSessionData);

      expect(parentalNotificationService.sendNotification).toHaveBeenCalledWith(
        mockParentId,
        expect.objectContaining({
          type: 'CHILD_LOGIN',
          title: 'Child Logged In',
          message: 'Test Child has logged into their learning account',
        })
      );
    });
  });

  describe('validateSession', () => {
    beforeEach(async () => {
      await childSessionMonitoringService.startSession(mockSessionData);
    });

    it('should validate session with matching IP and user agent', async () => {
      const isValid = await childSessionMonitoringService.validateSession(
        mockSessionId,
        mockSessionData.ipAddress,
        mockSessionData.userAgent
      );

      expect(isValid).toBe(true);
    });

    it('should reject session with different IP address', async () => {
      const isValid = await childSessionMonitoringService.validateSession(
        mockSessionId,
        '192.168.1.2', // Different IP
        mockSessionData.userAgent
      );

      expect(isValid).toBe(false);
    });

    it('should handle session with different user agent', async () => {
      const isValid = await childSessionMonitoringService.validateSession(
        mockSessionId,
        mockSessionData.ipAddress,
        'Different Browser' // Different user agent
      );

      // Should still be valid but log suspicious activity
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'UNUSUAL_LOCATION',
            severity: 'MEDIUM',
          }),
        })
      );
    });

    it('should return false for non-existent session', async () => {
      const isValid = await childSessionMonitoringService.validateSession(
        'non-existent-session',
        mockSessionData.ipAddress,
        mockSessionData.userAgent
      );

      expect(isValid).toBe(false);
    });
  });

  describe('updateActivity', () => {
    beforeEach(async () => {
      await childSessionMonitoringService.startSession(mockSessionData);
    });

    it('should update session activity', async () => {
      const originalActivity = childSessionMonitoringService.getActiveSession(mockChildId)?.lastActivity;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await childSessionMonitoringService.updateActivity(mockSessionId);

      const updatedActivity = childSessionMonitoringService.getActiveSession(mockChildId)?.lastActivity;
      expect(updatedActivity).not.toEqual(originalActivity);
    });

    it('should handle non-existent session gracefully', async () => {
      await expect(
        childSessionMonitoringService.updateActivity('non-existent-session')
      ).resolves.not.toThrow();
    });
  });

  describe('terminateSession', () => {
    beforeEach(async () => {
      await childSessionMonitoringService.startSession(mockSessionData);
    });

    it('should terminate session successfully', async () => {
      await childSessionMonitoringService.terminateSession(mockSessionId, 'USER_LOGOUT');

      const activeSession = childSessionMonitoringService.getActiveSession(mockChildId);
      expect(activeSession).toBeNull();
    });

    it('should log session end event', async () => {
      await childSessionMonitoringService.terminateSession(mockSessionId, 'USER_LOGOUT');

      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          childId: mockChildId,
          event: 'SESSION_END',
          ipAddress: 'unknown',
          userAgent: 'unknown',
          metadata: JSON.stringify({
            sessionId: mockSessionId,
            reason: 'USER_LOGOUT',
            duration: expect.any(Number),
          }),
          severity: 'INFO',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should notify parent of logout', async () => {
      await childSessionMonitoringService.terminateSession(mockSessionId, 'USER_LOGOUT');

      expect(parentalNotificationService.sendNotification).toHaveBeenCalledWith(
        mockParentId,
        expect.objectContaining({
          type: 'CHILD_LOGOUT',
          title: 'Child Logged Out',
          message: 'Test Child has logged out of their learning account (USER_LOGOUT)',
        })
      );
    });

    it('should notify parent of security event for security violations', async () => {
      await childSessionMonitoringService.terminateSession(mockSessionId, 'SECURITY_VIOLATION');

      expect(parentalNotificationService.sendNotification).toHaveBeenCalledWith(
        mockParentId,
        expect.objectContaining({
          type: 'SECURITY_ALERT',
          title: 'Security Alert',
          priority: 'HIGH',
        })
      );
    });

    it('should handle non-existent session gracefully', async () => {
      await expect(
        childSessionMonitoringService.terminateSession('non-existent-session', 'TEST')
      ).resolves.not.toThrow();
    });
  });

  describe('getSessionDuration', () => {
    it('should return correct session duration', async () => {
      const startTime = Date.now();
      await childSessionMonitoringService.startSession(mockSessionData);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = childSessionMonitoringService.getSessionDuration(mockSessionId);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be less than 1 second
    });

    it('should return 0 for non-existent session', () => {
      const duration = childSessionMonitoringService.getSessionDuration('non-existent-session');
      expect(duration).toBe(0);
    });
  });

  describe('getSessionStats', () => {
    it('should return correct session statistics', async () => {
      await childSessionMonitoringService.startSession(mockSessionData);

      const stats = childSessionMonitoringService.getSessionStats();
      expect(stats.activeSessions).toBe(1);
      expect(stats.totalSessions).toBe(1);
      expect(stats.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should return zero stats when no sessions', () => {
      const stats = childSessionMonitoringService.getSessionStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.averageSessionDuration).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      // Start a session
      await childSessionMonitoringService.startSession(mockSessionData);

      // Manually set the session to be expired by modifying the login time
      const activeSession = childSessionMonitoringService.getActiveSession(mockChildId);
      if (activeSession) {
        activeSession.loginTime = new Date(Date.now() - 25 * 60 * 1000); // 25 minutes ago
      }

      await childSessionMonitoringService.cleanupExpiredSessions();

      // Session should be terminated
      const sessionAfterCleanup = childSessionMonitoringService.getActiveSession(mockChildId);
      expect(sessionAfterCleanup).toBeNull();
    });
  });

  describe('suspicious activity detection', () => {
    beforeEach(async () => {
      await childSessionMonitoringService.startSession(mockSessionData);
    });

    it('should detect multiple concurrent logins', async () => {
      // Try to start another session for the same child
      const newSessionData = {
        ...mockSessionData,
        sessionId: 'session-concurrent',
      };

      await childSessionMonitoringService.startSession(newSessionData);

      // Should log suspicious activity
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'MULTIPLE_LOGINS',
            severity: 'MEDIUM',
          }),
        })
      );
    });

    it('should handle high severity security events', async () => {
      // Simulate IP address change during session validation
      await childSessionMonitoringService.validateSession(
        mockSessionId,
        '192.168.1.100', // Different IP
        mockSessionData.userAgent
      );

      // Should log high severity event and terminate session
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: 'UNUSUAL_LOCATION',
            severity: 'HIGH',
          }),
        })
      );

      // Session should be terminated
      const activeSession = childSessionMonitoringService.getActiveSession(mockChildId);
      expect(activeSession).toBeNull();
    });
  });
});