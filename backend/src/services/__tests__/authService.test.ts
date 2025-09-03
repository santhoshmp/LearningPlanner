import { authService, ParentRegistrationData } from '../authService';
import { emailService } from '../emailService';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../emailService');
jest.mock('../redisService');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn()
    },
    childProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    Role: {
      PARENT: 'PARENT',
      CHILD: 'CHILD'
    }
  };
});

// Get the mocked prisma instance
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();

const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerParent', () => {
    const validRegistrationData: ParentRegistrationData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should successfully register a new parent', async () => {
      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARENT',
        isEmailVerified: false,
        emailVerificationToken: 'verification-token',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.user.create.mockResolvedValue(mockUser);
      
      // Mock email service
      mockEmailService.sendVerificationEmail.mockResolvedValue();

      const result = await authService.registerParent(validRegistrationData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PARENT',
          isEmailVerified: false,
          passwordHash: expect.any(String),
          emailVerificationToken: expect.any(String)
        })
      });

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'John'
      );

      expect(result.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }));
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.verificationToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      await expect(authService.registerParent(validRegistrationData))
        .rejects.toThrow('User with this email already exists');

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isEmailVerified: false,
        emailVerificationToken: 'valid-token'
      };

      const mockUpdatedUser = {
        ...mockUser,
        isEmailVerified: true,
        emailVerificationToken: null
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await authService.verifyEmail('valid-token');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: 'valid-token' }
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null
        }
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        isEmailVerified: true
      }));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for invalid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token'))
        .rejects.toThrow('Invalid verification token');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if email already verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        isEmailVerified: true,
        emailVerificationToken: 'token'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.verifyEmail('token'))
        .rejects.toThrow('Email already verified');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('authenticateParent', () => {
    it('should successfully authenticate parent with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('TestPass123!', 12),
        role: 'PARENT',
        isEmailVerified: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt: new Date()
      });

      const result = await authService.authenticateParent({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });

      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 900 // 15 minutes
      }));
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.authenticateParent({
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for unverified email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'PARENT',
        isEmailVerified: false
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.authenticateParent({
        email: 'test@example.com',
        password: 'TestPass123!'
      })).rejects.toThrow('Please verify your email before logging in');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('DifferentPassword123!', 12),
        role: 'PARENT',
        isEmailVerified: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.authenticateParent({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPass123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPass123!';
      const hash = await bcrypt.hash(password, 12);

      const result = await authService.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'TestPass123!';
      const wrongPassword = 'WrongPass123!';
      const hash = await bcrypt.hash(password, 12);

      const result = await authService.comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a valid verification token', () => {
      const token = authService.generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // hex string
    });
  });

  describe('resetPassword', () => {
    it('should send reset email for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue();

      await authService.resetPassword('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date)
        }
      });

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'John'
      );
    });

    it('should not throw error for non-existing user (security)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.resetPassword('nonexistent@example.com'))
        .resolves.not.toThrow();

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('authenticateChild', () => {
    it('should successfully authenticate child with valid credentials', async () => {
      const mockChild = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        username: 'alice123',
        pinHash: await bcrypt.hash('1234', 12),
        preferences: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        childId: 'child-123',
        expiresAt: new Date()
      });

      const result = await authService.authenticateChild({
        username: 'alice123',
        pin: '1234'
      });

      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { 
          username: 'alice123',
          isActive: true
        }
      });

      expect(result).toEqual(expect.objectContaining({
        child: expect.objectContaining({
          id: 'child-123',
          username: 'alice123',
          name: 'Alice'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 900 // 15 minutes
      }));
      expect(result.child).not.toHaveProperty('pinHash');
    });

    it('should throw error for invalid username', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      await expect(authService.authenticateChild({
        username: 'nonexistent',
        pin: '1234'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid PIN', async () => {
      const mockChild = {
        id: 'child-123',
        username: 'alice123',
        pinHash: await bcrypt.hash('1234', 12),
        isActive: true
      };

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);

      await expect(authService.authenticateChild({
        username: 'alice123',
        pin: 'wrong-pin'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive child profile', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null); // isActive: true filter will return null

      await expect(authService.authenticateChild({
        username: 'alice123',
        pin: '1234'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshChildToken', () => {
    it('should successfully refresh child token', async () => {
      const mockChild = {
        id: 'child-123',
        parentId: 'parent-123',
        name: 'Alice',
        username: 'alice123',
        pinHash: 'hashed-pin',
        isActive: true,
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'VISUAL',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTokenRecord = {
        id: 'token-123',
        token: 'old-refresh-token',
        childId: 'child-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        child: mockChild
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'new-token-123',
        token: 'new-refresh-token',
        childId: 'child-123',
        expiresAt: new Date()
      });

      const result = await authService.refreshChildToken('old-refresh-token');

      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'old-refresh-token' },
        include: { child: true }
      });

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { isRevoked: true }
      });

      expect(result).toEqual(expect.objectContaining({
        child: expect.objectContaining({
          id: 'child-123',
          username: 'alice123',
          name: 'Alice'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 900
      }));
      expect(result.child).not.toHaveProperty('pinHash');
    });

    it('should throw error for invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshChildToken('invalid-token'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', async () => {
      const expiredTokenRecord = {
        id: 'token-123',
        token: 'expired-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // Expired
        child: null
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);

      await expect(authService.refreshChildToken('expired-token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logoutChild', () => {
    it('should successfully logout child', async () => {
      const activeTokens = [
        { id: 'token-1', token: 'refresh-token-1', childId: 'child-123' },
        { id: 'token-2', token: 'refresh-token-2', childId: 'child-123' }
      ];

      mockPrisma.refreshToken.findMany.mockResolvedValue(activeTokens);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await authService.logoutChild('child-123');

      expect(mockPrisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-123', isRevoked: false }
      });

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { childId: 'child-123', isRevoked: false },
        data: { isRevoked: true }
      });
    });
  });
});