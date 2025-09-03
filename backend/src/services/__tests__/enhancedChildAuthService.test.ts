import { authService } from '../authService';
import { PrismaClient } from '@prisma/client';
import { redisService } from '../redisService';
import { emailService } from '../emailService';

// Mock dependencies
jest.mock('../redisService');
jest.mock('../emailService');

const prisma = new PrismaClient();

describe('Enhanced Child Authentication Service', () => {
  let testParent: any;
  let testChild: any;
  let mockDeviceInfo: any;
  const uniqueId = Date.now();

  beforeAll(async () => {
    try {
      // Create test parent with unique email
      testParent = await prisma.user.create({
        data: {
          email: `testparent${uniqueId}@example.com`,
          passwordHash: await authService.hashPassword('TestPassword123!'),
          firstName: 'Test',
          lastName: 'Parent',
          role: 'PARENT',
          isEmailVerified: true
        }
      });

      // Create test child with unique username
      testChild = await prisma.childProfile.create({
        data: {
          parentId: testParent.id,
          name: 'Test Child',
          age: 8,
          gradeLevel: '3',
          username: `testchild${uniqueId}`,
          pinHash: await authService.hashPassword('1234'),
          isActive: true
        }
      });

      mockDeviceInfo = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        platform: 'iOS',
        isMobile: true,
        screenResolution: '1024x768',
        language: 'en-US',
        timezone: 'America/New_York'
      };
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data in correct order
      if (testChild?.id) {
        await prisma.childLoginSession.deleteMany({
          where: { childId: testChild.id }
        });
        await prisma.refreshToken.deleteMany({
          where: { childId: testChild.id }
        });
        await prisma.securityLog.deleteMany({
          where: { childId: testChild.id }
        });
        await prisma.childProfile.delete({
          where: { id: testChild.id }
        });
      }
      
      if (testParent?.id) {
        await prisma.securityLog.deleteMany({
          where: { userId: testParent.id }
        });
        await prisma.notification.deleteMany({
          where: { userId: testParent.id }
        });
        await prisma.user.delete({
          where: { id: testParent.id }
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Redis service methods
    (redisService.setSession as jest.Mock).mockResolvedValue(true);
    (redisService.getSession as jest.Mock).mockResolvedValue(null);
    (redisService.deleteSession as jest.Mock).mockResolvedValue(true);
    
    // Mock email service
    (emailService.sendChildLoginNotification as jest.Mock).mockResolvedValue(true);
  });

  describe('authenticateChild', () => {
    it('should successfully authenticate child with valid credentials', async () => {
      const loginRequest = {
        credentials: {
          username: testChild.username,
          pin: '1234'
        },
        deviceInfo: mockDeviceInfo,
        ipAddress: '192.168.1.100'
      };

      const result = await authService.authenticateChild(loginRequest);

      expect(result).toHaveProperty('child');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('sessionId');
      expect(result.child.id).toBe(testChild.id);
      expect(result.child).not.toHaveProperty('pinHash');
      expect(result.expiresIn).toBe(20 * 60); // 20 minutes

      // Verify login session was created
      const session = await prisma.childLoginSession.findUnique({
        where: { id: result.sessionId }
      });
      expect(session).toBeTruthy();
      expect(session?.childId).toBe(testChild.id);
      expect(session?.isActive).toBe(true);

      // Verify parental notification was sent
      expect(emailService.sendChildLoginNotification).toHaveBeenCalledWith(
        testParent.email,
        testParent.firstName,
        testChild.name,
        'iPhone/iPad',
        expect.any(String)
      );
    });

    it('should fail authentication with invalid username', async () => {
      const loginRequest = {
        credentials: {
          username: 'invaliduser',
          pin: '1234'
        },
        deviceInfo: mockDeviceInfo,
        ipAddress: '192.168.1.100'
      };

      await expect(authService.authenticateChild(loginRequest))
        .rejects.toThrow('Invalid credentials');

      // Verify security log was created
      const securityLogs = await prisma.securityLog.findMany({
        where: {
          eventType: 'AUTHENTICATION',
          details: {
            path: ['action'],
            equals: 'CHILD_LOGIN_FAILED'
          }
        }
      });
      expect(securityLogs.length).toBeGreaterThan(0);
    });

    it('should fail authentication with invalid PIN', async () => {
      const loginRequest = {
        credentials: {
          username: testChild.username,
          pin: '9999'
        },
        deviceInfo: mockDeviceInfo,
        ipAddress: '192.168.1.100'
      };

      await expect(authService.authenticateChild(loginRequest))
        .rejects.toThrow('Invalid credentials');
    });

    it('should block login after multiple failed attempts', async () => {
      const loginRequest = {
        credentials: {
          username: testChild.username,
          pin: '9999'
        },
        deviceInfo: mockDeviceInfo,
        ipAddress: '192.168.1.101'
      };

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await authService.authenticateChild(loginRequest);
        } catch (error) {
          // Expected to fail
        }
      }

      // Next attempt should be blocked
      await expect(authService.authenticateChild(loginRequest))
        .rejects.toThrow('Account temporarily locked');
    });
  });

  describe('validateChildSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test session
      const session = await prisma.childLoginSession.create({
        data: {
          childId: testChild.id,
          loginTime: new Date(),
          deviceInfo: mockDeviceInfo as any,
          ipAddress: '192.168.1.100',
          isActive: true
        }
      });
      sessionId = session.id;
    });

    it('should validate active session', async () => {
      const isValid = await authService.validateChildSession(sessionId);
      expect(isValid).toBe(true);
    });

    it('should invalidate expired session', async () => {
      // Update session to be older than max duration
      const oldTime = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      await prisma.childLoginSession.update({
        where: { id: sessionId },
        data: { loginTime: oldTime }
      });

      const isValid = await authService.validateChildSession(sessionId);
      expect(isValid).toBe(false);

      // Verify session was marked as inactive
      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });
      expect(session?.isActive).toBe(false);
    });

    it('should invalidate non-existent session', async () => {
      const isValid = await authService.validateChildSession('non-existent-id');
      expect(isValid).toBe(false);
    });
  });

  describe('logoutChild', () => {
    let sessionId: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create test session and refresh token
      const session = await prisma.childLoginSession.create({
        data: {
          childId: testChild.id,
          loginTime: new Date(),
          deviceInfo: mockDeviceInfo as any,
          ipAddress: '192.168.1.100',
          isActive: true
        }
      });
      sessionId = session.id;

      const token = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token',
          childId: testChild.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      refreshToken = token.token;
    });

    it('should logout child and update session', async () => {
      await authService.logoutChild(testChild.id, sessionId);

      // Verify session was updated
      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });
      expect(session?.isActive).toBe(false);
      expect(session?.logoutTime).toBeTruthy();
      expect(session?.sessionDuration).toBeGreaterThan(0);

      // Verify refresh tokens were revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { childId: testChild.id, isRevoked: false }
      });
      expect(tokens.length).toBe(0);
    });

    it('should logout all sessions when no session ID provided', async () => {
      await authService.logoutChild(testChild.id);

      // Verify all sessions were marked inactive
      const activeSessions = await prisma.childLoginSession.findMany({
        where: { childId: testChild.id, isActive: true }
      });
      expect(activeSessions.length).toBe(0);
    });
  });

  describe('updateChildSessionActivity', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await prisma.childLoginSession.create({
        data: {
          childId: testChild.id,
          loginTime: new Date(),
          deviceInfo: mockDeviceInfo as any,
          ipAddress: '192.168.1.100',
          isActive: true,
          activitiesCompleted: 0,
          badgesEarned: 0
        }
      });
      sessionId = session.id;
    });

    it('should update activity completion count', async () => {
      await authService.updateChildSessionActivity(
        testChild.id,
        sessionId,
        'ACTIVITY_COMPLETED'
      );

      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });
      expect(session?.activitiesCompleted).toBe(1);
    });

    it('should update badge earned count', async () => {
      await authService.updateChildSessionActivity(
        testChild.id,
        sessionId,
        'BADGE_EARNED'
      );

      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });
      expect(session?.badgesEarned).toBe(1);
    });

    it('should handle help requests without updating counters', async () => {
      await authService.updateChildSessionActivity(
        testChild.id,
        sessionId,
        'HELP_REQUESTED'
      );

      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });
      expect(session?.activitiesCompleted).toBe(0);
      expect(session?.badgesEarned).toBe(0);
    });
  });

  describe('getChildSessionHistory', () => {
    beforeEach(async () => {
      // Create multiple test sessions
      for (let i = 0; i < 5; i++) {
        await prisma.childLoginSession.create({
          data: {
            childId: testChild.id,
            loginTime: new Date(Date.now() - i * 60 * 60 * 1000), // Each session 1 hour apart
            deviceInfo: mockDeviceInfo as any,
            ipAddress: '192.168.1.100',
            isActive: i === 0 // Only the most recent is active
          }
        });
      }
    });

    it('should return session history with default limit', async () => {
      const sessions = await authService.getChildSessionHistory(testChild.id);
      expect(sessions.length).toBeLessThanOrEqual(10);
      expect(sessions[0].loginTime.getTime()).toBeGreaterThan(sessions[1].loginTime.getTime());
    });

    it('should respect custom limit', async () => {
      const sessions = await authService.getChildSessionHistory(testChild.id, 3);
      expect(sessions.length).toBe(3);
    });
  });

  describe('getActiveChildSessions', () => {
    beforeEach(async () => {
      // Create active and inactive sessions
      await prisma.childLoginSession.create({
        data: {
          childId: testChild.id,
          loginTime: new Date(),
          deviceInfo: mockDeviceInfo as any,
          ipAddress: '192.168.1.100',
          isActive: true
        }
      });

      await prisma.childLoginSession.create({
        data: {
          childId: testChild.id,
          loginTime: new Date(Date.now() - 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 30 * 60 * 1000),
          deviceInfo: mockDeviceInfo as any,
          ipAddress: '192.168.1.100',
          isActive: false
        }
      });
    });

    it('should return only active sessions', async () => {
      const activeSessions = await authService.getActiveChildSessions(testChild.id);
      expect(activeSessions.length).toBeGreaterThan(0);
      activeSessions.forEach(session => {
        expect(session.isActive).toBe(true);
      });
    });
  });

  describe('Device description helper', () => {
    it('should identify iOS devices correctly', () => {
      const iosDeviceInfo = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        platform: 'iOS',
        isMobile: true
      };

      // This tests the private method indirectly through authentication
      const loginRequest = {
        credentials: {
          username: testChild.username,
          pin: '1234'
        },
        deviceInfo: iosDeviceInfo,
        ipAddress: '192.168.1.100'
      };

      // The device description is tested through the email notification call
      return authService.authenticateChild(loginRequest).then(() => {
        expect(emailService.sendChildLoginNotification).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(String),
          'iPhone/iPad',
          expect.any(String)
        );
      });
    });

    it('should identify Android devices correctly', () => {
      const androidDeviceInfo = {
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        platform: 'Android',
        isMobile: true
      };

      const loginRequest = {
        credentials: {
          username: testChild.username,
          pin: '1234'
        },
        deviceInfo: androidDeviceInfo,
        ipAddress: '192.168.1.100'
      };

      return authService.authenticateChild(loginRequest).then(() => {
        expect(emailService.sendChildLoginNotification).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(String),
          'Android device',
          expect.any(String)
        );
      });
    });
  });
});