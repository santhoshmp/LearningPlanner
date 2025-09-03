import { enhancedAuthService, EnhancedAuthService } from '../enhancedAuthService';
import { childSessionMonitoringService } from '../childSessionMonitoringService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

// Mock dependencies
jest.mock('../childSessionMonitoringService');
jest.mock('../utils/logger');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    childProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    }
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Get the mocked prisma instance
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();

const mockChildSessionMonitoring = childSessionMonitoringService as jest.Mocked<typeof childSessionMonitoringService>;

describe('EnhancedAuthService', () => {
  let authService: EnhancedAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new EnhancedAuthService();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('childLogin', () => {
    const mockChild = {
      id: 'child-123',
      username: 'testchild',
      name: 'Test Child',
      pin: 'hashed-pin',
      age: 8,
      grade: '3rd',
      parentId: 'parent-123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      parent: {
        id: 'parent-123',
        email: 'parent@test.com',
        firstName: 'Parent',
        lastName: 'User'
      }
    };

    it('should successfully authenticate child with valid credentials', async () => {
      const hashedPin = await bcrypt.hash('1234', 12);
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        ...mockChild,
        pin: hashedPin
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        childId: 'child-123',
        expiresAt: new Date(),
        sessionId: 'session-123'
      });
      mockChildSessionMonitoring.startSession.mockResolvedValue();

      const result = await authService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { username: 'testchild' },
        include: { parent: true }
      });

      expect(result.user).toEqual(
        expect.objectContaining({
          id: 'child-123',
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD',
          parentId: 'parent-123'
        })
      );
      expect(result.user).not.toHaveProperty('pin');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.expiresIn).toBe(1200); // 20 minutes

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          token: expect.any(String),
          childId: 'child-123',
          expiresAt: expect.any(Date),
          sessionId: expect.any(String)
        })
      });

      expect(mockChildSessionMonitoring.startSession).toHaveBeenCalledWith({
        childId: 'child-123',
        sessionId: expect.any(String),
        loginTime: expect.any(Date),
        lastActivity: expect.any(Date),
        ipAddress: '127.0.0.1',
        userAgent: 'test-user-agent',
        deviceInfo: expect.any(String)
      });
    });

    it('should fail with invalid username', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      await expect(authService.childLogin(
        'nonexistent',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      )).rejects.toThrow('Invalid credentials');

      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
      expect(mockChildSessionMonitoring.startSession).not.toHaveBeenCalled();
    });

    it('should fail with incorrect PIN', async () => {
      const hashedPin = await bcrypt.hash('correct-pin', 12);
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        ...mockChild,
        pin: hashedPin
      });

      await expect(authService.childLogin(
        'testchild',
        'wrong-pin',
        '127.0.0.1',
        'test-user-agent'
      )).rejects.toThrow('Invalid credentials');

      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
      expect(mockChildSessionMonitoring.startSession).not.toHaveBeenCalled();
    });

    it('should fail for inactive child profile', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        ...mockChild,
        isActive: false
      });

      await expect(authService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      )).rejects.toThrow('Account is inactive');
    });

    it('should generate proper JWT token structure', async () => {
      const hashedPin = await bcrypt.hash('1234', 12);
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        ...mockChild,
        pin: hashedPin
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        childId: 'child-123',
        expiresAt: new Date(),
        sessionId: 'session-123'
      });
      mockChildSessionMonitoring.startSession.mockResolvedValue();

      const result = await authService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      const decoded = jwt.decode(result.accessToken) as any;
      expect(decoded).toEqual(
        expect.objectContaining({
          childId: 'child-123',
          role: 'CHILD',
          sessionId: expect.any(String)
        })
      );
      expect(decoded).not.toHaveProperty('userId');
    });
  });

  describe('refreshToken', () => {
    const mockChildTokenRecord = {
      id: 'token-123',
      token: 'refresh-token',
      childId: 'child-123',
      userId: null,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: 'session-123',
      child: {
        id: 'child-123',
        username: 'testchild',
        name: 'Test Child',
        age: 8,
        grade: '3rd',
        parentId: 'parent-123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      user: null
    };

    const mockParentTokenRecord = {
      id: 'token-456',
      token: 'parent-refresh-token',
      userId: 'parent-123',
      childId: null,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: 'parent-session-123',
      user: {
        id: 'parent-123',
        email: 'parent@test.com',
        firstName: 'Parent',
        lastName: 'User',
        role: 'PARENT',
        isEmailVerified: true
      },
      child: null
    };

    it('should refresh child token successfully', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockChildTokenRecord);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'new-token-123',
        token: 'new-refresh-token',
        childId: 'child-123',
        expiresAt: new Date(),
        sessionId: 'session-123'
      });
      mockChildSessionMonitoring.validateSession.mockResolvedValue(true);

      const result = await authService.refreshToken(
        'refresh-token',
        '127.0.0.1',
        'test-user-agent'
      );

      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'refresh-token' },
        include: {
          user: true,
          child: { include: { parent: true } }
        }
      });

      expect(mockChildSessionMonitoring.validateSession).toHaveBeenCalledWith(
        'session-123',
        '127.0.0.1',
        'test-user-agent'
      );

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { isRevoked: true }
      });

      expect(result.user).toEqual(
        expect.objectContaining({
          id: 'child-123',
          username: 'testchild',
          role: 'CHILD'
        })
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBe('session-123');
      expect(result.expiresIn).toBe(1200);
    });

    it('should refresh parent token successfully', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockParentTokenRecord);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'new-token-456',
        token: 'new-parent-refresh-token',
        userId: 'parent-123',
        expiresAt: new Date(),
        sessionId: 'parent-session-123'
      });

      const result = await authService.refreshToken('parent-refresh-token');

      expect(result.user).toEqual(
        expect.objectContaining({
          id: 'parent-123',
          email: 'parent@test.com',
          role: 'PARENT'
        })
      );
      expect(result.expiresIn).toBe(900); // 15 minutes for parents
    });

    it('should fail with invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid-token'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should fail with expired refresh token', async () => {
      const expiredTokenRecord = {
        ...mockChildTokenRecord,
        expiresAt: new Date(Date.now() - 1000)
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      await expect(authService.refreshToken('expired-token'))
        .rejects.toThrow('Refresh token expired');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-123' }
      });
    });

    it('should fail with revoked refresh token', async () => {
      const revokedTokenRecord = {
        ...mockChildTokenRecord,
        isRevoked: true
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(revokedTokenRecord);
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      await expect(authService.refreshToken('revoked-token'))
        .rejects.toThrow('Refresh token expired');
    });

    it('should fail child token refresh with invalid session', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockChildTokenRecord);
      mockChildSessionMonitoring.validateSession.mockResolvedValue(false);

      await expect(authService.refreshToken(
        'refresh-token',
        '192.168.1.1', // Different IP
        'different-user-agent'
      )).rejects.toThrow('Invalid session');
    });

    it('should fail child token refresh for inactive child', async () => {
      const inactiveChildTokenRecord = {
        ...mockChildTokenRecord,
        child: {
          ...mockChildTokenRecord.child,
          isActive: false
        }
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(inactiveChildTokenRecord);
      mockChildSessionMonitoring.validateSession.mockResolvedValue(true);

      await expect(authService.refreshToken('refresh-token'))
        .rejects.toThrow('Child account is inactive');
    });

    it('should fail parent token refresh for unverified email', async () => {
      const unverifiedParentTokenRecord = {
        ...mockParentTokenRecord,
        user: {
          ...mockParentTokenRecord.user,
          isEmailVerified: false
        }
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(unverifiedParentTokenRecord);

      await expect(authService.refreshToken('parent-refresh-token'))
        .rejects.toThrow('Email not verified');
    });
  });

  describe('childLogout', () => {
    it('should logout child and revoke all tokens', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockChildSessionMonitoring.getActiveSession.mockReturnValue({
        sessionId: 'session-123',
        childId: 'child-123',
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        deviceInfo: 'Desktop'
      });
      mockChildSessionMonitoring.terminateSession.mockResolvedValue();

      await authService.childLogout('child-123', 'session-123');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { childId: 'child-123', isRevoked: false },
        data: { isRevoked: true }
      });

      expect(mockChildSessionMonitoring.terminateSession).toHaveBeenCalledWith(
        'session-123',
        'USER_LOGOUT'
      );
    });

    it('should handle logout without sessionId', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockChildSessionMonitoring.getActiveSession.mockReturnValue({
        sessionId: 'active-session-123',
        childId: 'child-123',
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        deviceInfo: 'Desktop'
      });
      mockChildSessionMonitoring.terminateSession.mockResolvedValue();

      await authService.childLogout('child-123');

      expect(mockChildSessionMonitoring.terminateSession).toHaveBeenCalledWith(
        'active-session-123',
        'USER_LOGOUT'
      );
    });
  });

  describe('Token Utilities', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign(
        { childId: 'child-123', role: 'CHILD', sessionId: 'session-123' },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );

      const result = await authService.verifyToken(token);

      expect(result).toEqual(
        expect.objectContaining({
          childId: 'child-123',
          role: 'CHILD',
          sessionId: 'session-123'
        })
      );
    });

    it('should reject invalid token', async () => {
      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow('Invalid or expired token');
    });

    it('should get token info without verification', () => {
      const token = jwt.sign(
        { childId: 'child-123', role: 'CHILD' },
        'test-jwt-secret'
      );

      const info = authService.getTokenInfo(token);

      expect(info).toEqual(
        expect.objectContaining({
          childId: 'child-123',
          role: 'CHILD'
        })
      );
    });

    it('should detect expired token', () => {
      const expiredToken = jwt.sign(
        { childId: 'child-123', role: 'CHILD' },
        'test-jwt-secret',
        { expiresIn: '-1m' }
      );

      const isExpired = authService.isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    it('should detect valid token', () => {
      const validToken = jwt.sign(
        { childId: 'child-123', role: 'CHILD' },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );

      const isExpired = authService.isTokenExpired(validToken);
      expect(isExpired).toBe(false);
    });
  });

  describe('Token Cleanup', () => {
    it('should clean up expired tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      const cleanedCount = await authService.cleanupExpiredTokens();

      expect(cleanedCount).toBe(5);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { isRevoked: true }
          ]
        }
      });
    });

    it('should revoke all user tokens', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await authService.revokeAllUserTokens('user-123');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRevoked: false },
        data: { isRevoked: true }
      });
    });

    it('should revoke all child tokens', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await authService.revokeAllChildTokens('child-123');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { childId: 'child-123', isRevoked: false },
        data: { isRevoked: true }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during child login', async () => {
      mockPrisma.childProfile.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(authService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      )).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors during token refresh', async () => {
      mockPrisma.refreshToken.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(authService.refreshToken('refresh-token'))
        .rejects.toThrow('Database error');
    });

    it('should handle session monitoring errors gracefully', async () => {
      const hashedPin = await bcrypt.hash('1234', 12);
      mockPrisma.childProfile.findUnique.mockResolvedValue({
        id: 'child-123',
        username: 'testchild',
        name: 'Test Child',
        pin: hashedPin,
        isActive: true,
        parent: {}
      });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        childId: 'child-123',
        expiresAt: new Date()
      });
      mockChildSessionMonitoring.startSession.mockRejectedValue(
        new Error('Session monitoring failed')
      );

      // Should still complete login even if session monitoring fails
      const result = await authService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      expect(result.user.id).toBe('child-123');
      expect(result.accessToken).toBeDefined();
    });
  });
});