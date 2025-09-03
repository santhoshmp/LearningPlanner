import { childAuthService } from '../childAuthService';
import { prisma } from '../../utils/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../utils/database');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('ChildAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateChild', () => {
    it('should authenticate child with valid credentials', async () => {
      const mockChild = {
        id: 'child-1',
        username: 'testchild',
        pin: 'hashedpin',
        parentId: 'parent-1',
        isActive: true
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild as any);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-token');

      const result = await childAuthService.authenticateChild('testchild', '1234', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(result.child).toEqual(mockChild);
    });

    it('should fail authentication with invalid credentials', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      const result = await childAuthService.authenticateChild('invalidchild', '1234', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or PIN');
    });

    it('should fail authentication with incorrect PIN', async () => {
      const mockChild = {
        id: 'child-1',
        username: 'testchild',
        pin: 'hashedpin',
        parentId: 'parent-1',
        isActive: true
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild as any);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await childAuthService.authenticateChild('testchild', 'wrongpin', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or PIN');
    });

    it('should fail authentication for inactive child', async () => {
      const mockChild = {
        id: 'child-1',
        username: 'testchild',
        pin: 'hashedpin',
        parentId: 'parent-1',
        isActive: false
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild as any);

      const result = await childAuthService.authenticateChild('testchild', '1234', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Child account is not active');
    });
  });

  describe('createLoginSession', () => {
    it('should create login session with device info', async () => {
      const mockSession = {
        id: 'session-1',
        childId: 'child-1',
        loginTime: new Date(),
        deviceInfo: { userAgent: 'test-agent', platform: 'web' },
        ipAddress: '127.0.0.1'
      };

      mockPrisma.childLoginSession.create.mockResolvedValue(mockSession as any);

      const result = await childAuthService.createLoginSession('child-1', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        platform: 'web'
      });

      expect(result).toEqual(mockSession);
      expect(mockPrisma.childLoginSession.create).toHaveBeenCalledWith({
        data: {
          childId: 'child-1',
          deviceInfo: { userAgent: 'test-agent', platform: 'web' },
          ipAddress: '127.0.0.1',
          loginTime: expect.any(Date)
        }
      });
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const mockSession = {
        id: 'session-1',
        childId: 'child-1',
        loginTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        logoutTime: null,
        isActive: true
      };

      mockPrisma.childLoginSession.findUnique.mockResolvedValue(mockSession as any);

      const result = await childAuthService.validateSession('session-1');

      expect(result.isValid).toBe(true);
      expect(result.session).toEqual(mockSession);
    });

    it('should invalidate expired session', async () => {
      const mockSession = {
        id: 'session-1',
        childId: 'child-1',
        loginTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago (expired)
        logoutTime: null,
        isActive: true
      };

      mockPrisma.childLoginSession.findUnique.mockResolvedValue(mockSession as any);

      const result = await childAuthService.validateSession('session-1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session expired');
    });
  });

  describe('logoutChild', () => {
    it('should logout child and update session', async () => {
      const mockSession = {
        id: 'session-1',
        childId: 'child-1',
        loginTime: new Date(Date.now() - 10 * 60 * 1000),
        logoutTime: null
      };

      mockPrisma.childLoginSession.findUnique.mockResolvedValue(mockSession as any);
      mockPrisma.childLoginSession.update.mockResolvedValue({
        ...mockSession,
        logoutTime: new Date(),
        sessionDuration: 600
      } as any);

      const result = await childAuthService.logoutChild('session-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.childLoginSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          logoutTime: expect.any(Date),
          sessionDuration: expect.any(Number)
        }
      });
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect multiple failed login attempts', async () => {
      const recentAttempts = [
        { success: false, timestamp: new Date(Date.now() - 2 * 60 * 1000) },
        { success: false, timestamp: new Date(Date.now() - 4 * 60 * 1000) },
        { success: false, timestamp: new Date(Date.now() - 6 * 60 * 1000) }
      ];

      const result = await childAuthService.detectSuspiciousActivity('child-1', recentAttempts);

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toBe('Multiple failed login attempts');
      expect(result.shouldNotifyParent).toBe(true);
    });

    it('should detect unusual login times', async () => {
      const lateNightLogin = new Date();
      lateNightLogin.setHours(2, 30, 0, 0); // 2:30 AM

      const result = await childAuthService.detectSuspiciousActivity('child-1', [], lateNightLogin);

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toBe('Unusual login time');
    });
  });
});