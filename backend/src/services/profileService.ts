import { PrismaClient, User, UserSettings } from '@prisma/client';
import * as crypto from 'crypto';
import * as path from 'path';
import { promises as fs } from 'fs';
import sharp = require('sharp');

const prisma = new PrismaClient();

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UserProfileUpdate extends UserProfileData {
  settings?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    privacyLevel?: 'minimal' | 'standard' | 'full';
    dataSharingConsent?: boolean;
  };
}

export interface EnhancedUserProfile extends Omit<User, 'passwordHash'> {
  settings: UserSettings | null;
  socialProviders: Array<{
    provider: string;
    providerEmail: string | null;
    providerName: string | null;
    isLinked: boolean;
    linkedAt: Date;
  }>;
  profilePicture?: string;
  childrenCount: number;
}

export interface AvatarUploadResult {
  filename: string;
  url: string;
  size: number;
}

class ProfileService {
  private readonly uploadDir = process.env.UPLOAD_DIR || 'uploads/avatars';
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly avatarSizes = {
    thumbnail: { width: 64, height: 64 },
    small: { width: 128, height: 128 },
    medium: { width: 256, height: 256 },
    large: { width: 512, height: 512 }
  };

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Get enhanced user profile with settings and social providers
   */
  async getUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        socialAuthProviders: {
          select: {
            provider: true,
            providerEmail: true,
            providerName: true,
            createdAt: true
          }
        },
        children: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      socialProviders: user.socialAuthProviders.map(provider => ({
        provider: provider.provider,
        providerEmail: provider.providerEmail,
        providerName: provider.providerName,
        isLinked: true,
        linkedAt: provider.createdAt
      })),
      childrenCount: user.children.length
    };
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, data: UserProfileUpdate): Promise<EnhancedUserProfile> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is being updated and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        throw new Error('Email is already in use');
      }
    }

    // Prepare user update data
    const userUpdateData: any = {};
    if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
    if (data.email !== undefined) {
      userUpdateData.email = data.email;
      // If email is changed, mark as unverified
      if (data.email !== existingUser.email) {
        userUpdateData.isEmailVerified = false;
        userUpdateData.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      }
    }

    // Update user in transaction with settings
    const result = await prisma.$transaction(async (tx) => {
      // Update user profile
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdateData
      });

      // Update or create user settings if provided
      if (data.settings) {
        await tx.userSettings.upsert({
          where: { userId },
          update: data.settings,
          create: {
            userId,
            ...data.settings
          }
        });
      }

      // Fetch complete profile
      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          socialAuthProviders: {
            select: {
              provider: true,
              providerEmail: true,
              providerName: true,
              createdAt: true
            }
          },
          children: {
            where: { isActive: true },
            select: { id: true }
          }
        }
      });
    });

    if (!result) {
      throw new Error('Failed to update profile');
    }

    const { passwordHash, ...userWithoutPassword } = result;

    return {
      ...userWithoutPassword,
      socialProviders: result.socialAuthProviders.map(provider => ({
        provider: provider.provider,
        providerEmail: provider.providerEmail,
        providerName: provider.providerName,
        isLinked: true,
        linkedAt: provider.createdAt
      })),
      childrenCount: result.children.length
    };
  }

  /**
   * Upload and process avatar image
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer, originalName: string, mimeType: string): Promise<AvatarUploadResult> {
    // Validate file type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Validate file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const fileExtension = path.extname(originalName) || '.jpg';
    const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      // Process and optimize image
      const processedImage = await sharp(fileBuffer)
        .resize(this.avatarSizes.large.width, this.avatarSizes.large.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // Save main image
      await fs.writeFile(filePath, processedImage);

      // Generate thumbnails
      await this.generateAvatarThumbnails(fileBuffer, userId, filename);

      // Update user profile with avatar filename
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Store avatar filename in a JSON field or add a new column
          // For now, we'll store it in the firstName field as a temporary solution
          // In production, you'd want to add a dedicated avatarUrl field to the User model
        }
      });

      return {
        filename,
        url: `/uploads/avatars/${filename}`,
        size: processedImage.length
      };
    } catch (error) {
      // Clean up file if it was created
      try {
        await fs.unlink(filePath);
      } catch {}
      
      throw new Error(`Failed to process avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate avatar thumbnails in different sizes
   */
  private async generateAvatarThumbnails(fileBuffer: Buffer, userId: string, originalFilename: string): Promise<void> {
    const baseFilename = path.parse(originalFilename).name;
    
    for (const [sizeName, dimensions] of Object.entries(this.avatarSizes)) {
      if (sizeName === 'large') continue; // Skip large as it's the main image
      
      const thumbnailFilename = `${baseFilename}_${sizeName}.jpg`;
      const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);
      
      const thumbnail = await sharp(fileBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      
      await fs.writeFile(thumbnailPath, thumbnail);
    }
  }

  /**
   * Delete user avatar and thumbnails
   */
  async deleteAvatar(userId: string, filename: string): Promise<void> {
    try {
      const baseFilename = path.parse(filename).name;
      
      // Delete main image
      const mainImagePath = path.join(this.uploadDir, filename);
      await fs.unlink(mainImagePath);
      
      // Delete thumbnails
      for (const sizeName of Object.keys(this.avatarSizes)) {
        if (sizeName === 'large') continue;
        
        const thumbnailFilename = `${baseFilename}_${sizeName}.jpg`;
        const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);
        
        try {
          await fs.unlink(thumbnailPath);
        } catch {
          // Ignore if thumbnail doesn't exist
        }
      }
    } catch (error) {
      throw new Error(`Failed to delete avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: UserProfileUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate name lengths
    if (data.firstName !== undefined && (data.firstName.length < 1 || data.firstName.length > 50)) {
      errors.push('First name must be between 1 and 50 characters');
    }

    if (data.lastName && (data.lastName.length < 1 || data.lastName.length > 50)) {
      errors.push('Last name must be between 1 and 50 characters');
    }

    // Validate settings
    if (data.settings) {
      const { settings } = data;
      
      if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
        errors.push('Invalid theme value');
      }
      
      if (settings.privacyLevel && !['minimal', 'standard', 'full'].includes(settings.privacyLevel)) {
        errors.push('Invalid privacy level');
      }
      
      if (settings.language && settings.language.length > 10) {
        errors.push('Language code too long');
      }
      
      if (settings.timezone && settings.timezone.length > 50) {
        errors.push('Timezone string too long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize profile data to prevent XSS and other attacks
   */
  sanitizeProfileData(data: UserProfileUpdate): UserProfileUpdate {
    const sanitized: UserProfileUpdate = {};

    // Sanitize string fields
    if (data.firstName) {
      sanitized.firstName = data.firstName.trim().replace(/[<>]/g, '');
    }
    
    if (data.lastName) {
      sanitized.lastName = data.lastName.trim().replace(/[<>]/g, '');
    }
    
    if (data.email) {
      sanitized.email = data.email.trim().toLowerCase();
    }

    // Copy settings as-is (they're validated separately)
    if (data.settings) {
      sanitized.settings = { ...data.settings };
    }

    return sanitized;
  }

  /**
   * Export user profile data for GDPR compliance
   */
  async exportUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        socialAuthProviders: {
          select: {
            provider: true,
            providerEmail: true,
            providerName: true,
            createdAt: true
          }
        },
        children: {
          where: { isActive: true },
          include: {
            settings: true,
            studyPlans: {
              include: {
                activities: true
              }
            },
            progressRecords: true,
            achievements: true,
            helpRequests: true
          }
        },
        refreshTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
            isRevoked: true
          }
        },
        securityLogs: {
          select: {
            eventType: true,
            timestamp: true,
            details: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    const { passwordHash, emailVerificationToken, passwordResetToken, ...exportData } = user;

    return {
      ...exportData,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
  }

  /**
   * Get user settings with defaults
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userSettings.create({
        data: {
          userId,
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false
        }
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    return await prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });
  }
}

export const profileService = new ProfileService();