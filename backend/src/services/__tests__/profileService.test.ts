import fs from 'fs/promises';
import path from 'path';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock fs/promises
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  }));
});

// Import after mocking
import { profileService } from '../profileService';

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return enhanced user profile with settings and social providers', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARENT',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-password',
        settings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        socialAuthProviders: [
          {
            provider: 'google',
            providerEmail: 'test@gmail.com',
            providerName: 'John Doe',
            createdAt: new Date(),
          },
        ],
        children: [{ id: 'child-1' }, { id: 'child-2' }],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await profileService.getUserProfile('user-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@example.com');
      expect(result?.settings).toBeDefined();
      expect(result?.socialProviders).toHaveLength(1);
      expect(result?.childrenCount).toBe(2);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await profileService.getUserProfile('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile and settings', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'old@example.com',
        firstName: 'Old',
        lastName: 'Name',
      };

      const updateData = {
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        settings: {
          theme: 'dark' as const,
          emailNotifications: false,
        },
      };

      const updatedUser = {
        id: 'user-1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Name',
        role: 'PARENT',
        isEmailVerified: false,
        emailVerificationToken: 'new-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-password',
        settings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'dark',
          emailNotifications: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        socialAuthProviders: [],
        children: [],
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser) // First call for existing user check
        .mockResolvedValueOnce(null); // Second call for email availability check
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(updatedUser),
            findUnique: jest.fn().mockResolvedValue(updatedUser),
          },
          userSettings: {
            upsert: jest.fn().mockResolvedValue(updatedUser.settings),
          },
        };
        return callback(mockTx);
      });

      const result = await profileService.updateUserProfile('user-1', updateData);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('New');
      expect(result.email).toBe('new@example.com');
      expect(result.isEmailVerified).toBe(false);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        profileService.updateUserProfile('non-existent', { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if email is already in use', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'old@example.com',
      };

      const emailUser = {
        id: 'user-2',
        email: 'taken@example.com',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(emailUser);

      await expect(
        profileService.updateUserProfile('user-1', { email: 'taken@example.com' })
      ).rejects.toThrow('Email is already in use');
    });
  });

  describe('uploadAvatar', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should upload and process avatar successfully', async () => {
      const fileBuffer = Buffer.from('fake-image-data');
      const originalName = 'avatar.jpg';
      const mimeType = 'image/jpeg';

      mockPrisma.user.update.mockResolvedValue({});

      const result = await profileService.uploadAvatar('user-1', fileBuffer, originalName, mimeType);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/^user-1_\d+_[a-f0-9]+\.jpg$/);
      expect(result.url).toMatch(/^\/uploads\/avatars\/user-1_\d+_[a-f0-9]+\.jpg$/);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should throw error for invalid file type', async () => {
      const fileBuffer = Buffer.from('fake-image-data');
      const originalName = 'avatar.gif';
      const mimeType = 'image/gif';

      await expect(
        profileService.uploadAvatar('user-1', fileBuffer, originalName, mimeType)
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw error for file too large', async () => {
      const fileBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const originalName = 'avatar.jpg';
      const mimeType = 'image/jpeg';

      await expect(
        profileService.uploadAvatar('user-1', fileBuffer, originalName, mimeType)
      ).rejects.toThrow('File size too large');
    });
  });

  describe('validateProfileData', () => {
    it('should validate correct profile data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        settings: {
          theme: 'dark' as const,
          privacyLevel: 'standard' as const,
        },
      };

      const result = profileService.validateProfileData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        firstName: '', // Too short
        lastName: 'A'.repeat(51), // Too long
        email: 'invalid-email', // Invalid format
        settings: {
          theme: 'invalid' as any,
          privacyLevel: 'invalid' as any,
        },
      };

      const result = profileService.validateProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('First name must be between 1 and 50 characters');
      expect(result.errors).toContain('Last name must be between 1 and 50 characters');
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Invalid theme value');
      expect(result.errors).toContain('Invalid privacy level');
    });
  });

  describe('sanitizeProfileData', () => {
    it('should sanitize profile data', () => {
      const dirtyData = {
        firstName: '  John<script>  ',
        lastName: '  Doe>alert()  ',
        email: '  JOHN@EXAMPLE.COM  ',
        settings: {
          theme: 'dark' as const,
        },
      };

      const result = profileService.sanitizeProfileData(dirtyData);

      expect(result.firstName).toBe('Johnscript');
      expect(result.lastName).toBe('Doealert()');
      expect(result.email).toBe('john@example.com');
      expect(result.settings?.theme).toBe('dark');
    });
  });

  describe('getUserSettings', () => {
    it('should return existing user settings', async () => {
      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: false,
        privacyLevel: 'standard',
        dataSharingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

      const result = await profileService.getUserSettings('user-1');

      expect(result).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      const defaultSettings = {
        id: 'settings-1',
        userId: 'user-1',
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.userSettings.create.mockResolvedValue(defaultSettings);

      const result = await profileService.getUserSettings('user-1');

      expect(result).toEqual(defaultSettings);
      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
        },
      });
    });
  });
});