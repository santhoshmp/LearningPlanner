import { PrismaClient, UserSettings, ChildSettings, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Default settings for new users
const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  privacyLevel: 'standard',
  dataSharingConsent: false,
};

// Default settings for new child profiles
const DEFAULT_CHILD_SETTINGS: Omit<ChildSettings, 'id' | 'childId' | 'createdAt' | 'updatedAt'> = {
  contentFilterLevel: 'moderate',
  sessionTimeLimit: 60,
  breakReminders: true,
  parentalNotifications: true,
  aiAssistanceEnabled: true,
  videoAutoplay: false,
};

// Valid values for settings validation
const VALID_THEMES = ['light', 'dark', 'auto'];
const VALID_PRIVACY_LEVELS = ['minimal', 'standard', 'full'];
const VALID_CONTENT_FILTER_LEVELS = ['strict', 'moderate', 'relaxed'];

export interface UserSettingsInput {
  theme?: string;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  privacyLevel?: string;
  dataSharingConsent?: boolean;
}

export interface ChildSettingsInput {
  contentFilterLevel?: string;
  sessionTimeLimit?: number;
  breakReminders?: boolean;
  parentalNotifications?: boolean;
  aiAssistanceEnabled?: boolean;
  videoAutoplay?: boolean;
}

export interface SettingsExportData {
  userSettings: UserSettings;
  childSettings: ChildSettings[];
  exportedAt: Date;
}

class SettingsService {
  /**
   * Get user settings, creating defaults if they don't exist
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        settings = await this.createDefaultUserSettings(userId);
      }

      return settings;
    } catch (error) {
      logger.error('Error getting user settings:', error);
      throw new Error('Failed to retrieve user settings');
    }
  }

  /**
   * Update user settings with validation
   */
  async updateUserSettings(userId: string, updates: UserSettingsInput): Promise<UserSettings> {
    try {
      // Validate settings
      this.validateUserSettings(updates);

      // Ensure settings exist first
      await this.getUserSettings(userId);

      const updatedSettings = await prisma.userSettings.update({
        where: { userId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.info(`User settings updated for user ${userId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Get child settings, creating defaults if they don't exist
   */
  async getChildSettings(childId: string): Promise<ChildSettings> {
    try {
      let settings = await prisma.childSettings.findUnique({
        where: { childId },
      });

      if (!settings) {
        settings = await this.createDefaultChildSettings(childId);
      }

      return settings;
    } catch (error) {
      logger.error('Error getting child settings:', error);
      throw new Error('Failed to retrieve child settings');
    }
  }

  /**
   * Update child settings with validation and privacy enforcement
   */
  async updateChildSettings(childId: string, updates: ChildSettingsInput, parentId?: string): Promise<ChildSettings> {
    try {
      // Validate settings
      this.validateChildSettings(updates);

      // Verify parent ownership if parentId provided
      if (parentId) {
        const child = await prisma.childProfile.findFirst({
          where: { id: childId, parentId },
        });
        if (!child) {
          throw new Error('Child profile not found or access denied');
        }
      }

      // Ensure settings exist first
      await this.getChildSettings(childId);

      // Apply privacy preference enforcement
      const enforcedUpdates = await this.enforcePrivacyPreferences(childId, updates);

      const updatedSettings = await prisma.childSettings.update({
        where: { childId },
        data: {
          ...enforcedUpdates,
          updatedAt: new Date(),
        },
      });

      logger.info(`Child settings updated for child ${childId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating child settings:', error);
      throw error;
    }
  }

  /**
   * Get all settings for a user (user settings + all child settings)
   */
  async getAllUserSettings(userId: string): Promise<{
    userSettings: UserSettings;
    childSettings: ChildSettings[];
  }> {
    try {
      const userSettings = await this.getUserSettings(userId);
      
      const children = await prisma.childProfile.findMany({
        where: { parentId: userId },
        select: { id: true },
      });

      const childSettings = await Promise.all(
        children.map(child => this.getChildSettings(child.id))
      );

      return { userSettings, childSettings };
    } catch (error) {
      logger.error('Error getting all user settings:', error);
      throw new Error('Failed to retrieve user settings');
    }
  }

  /**
   * Bulk update settings for user and children
   */
  async bulkUpdateSettings(
    userId: string,
    userUpdates?: UserSettingsInput,
    childUpdates?: { childId: string; settings: ChildSettingsInput }[]
  ): Promise<{
    userSettings: UserSettings;
    childSettings: ChildSettings[];
  }> {
    try {
      const results = await prisma.$transaction(async (tx) => {
        let updatedUserSettings: UserSettings;
        
        if (userUpdates) {
          this.validateUserSettings(userUpdates);
          await this.getUserSettings(userId); // Ensure exists
          updatedUserSettings = await tx.userSettings.update({
            where: { userId },
            data: { ...userUpdates, updatedAt: new Date() },
          });
        } else {
          updatedUserSettings = await this.getUserSettings(userId);
        }

        const updatedChildSettings: ChildSettings[] = [];
        
        if (childUpdates && childUpdates.length > 0) {
          for (const { childId, settings } of childUpdates) {
            // Verify parent ownership
            const child = await tx.childProfile.findFirst({
              where: { id: childId, parentId: userId },
            });
            if (!child) {
              throw new Error(`Child profile ${childId} not found or access denied`);
            }

            this.validateChildSettings(settings);
            await this.getChildSettings(childId); // Ensure exists
            
            const enforcedSettings = await this.enforcePrivacyPreferences(childId, settings);
            
            const updated = await tx.childSettings.update({
              where: { childId },
              data: { ...enforcedSettings, updatedAt: new Date() },
            });
            updatedChildSettings.push(updated);
          }
        }

        return { userSettings: updatedUserSettings, childSettings: updatedChildSettings };
      });

      logger.info(`Bulk settings update completed for user ${userId}`);
      return results;
    } catch (error) {
      logger.error('Error in bulk settings update:', error);
      throw error;
    }
  }

  /**
   * Export all settings for a user
   */
  async exportSettings(userId: string): Promise<SettingsExportData> {
    try {
      const { userSettings, childSettings } = await this.getAllUserSettings(userId);
      
      return {
        userSettings,
        childSettings,
        exportedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  /**
   * Import settings for a user (with validation)
   */
  async importSettings(userId: string, settingsData: SettingsExportData): Promise<{
    userSettings: UserSettings;
    childSettings: ChildSettings[];
  }> {
    try {
      const { userSettings: userSettingsData, childSettings: childSettingsData } = settingsData;

      // Validate imported data
      this.validateUserSettings(userSettingsData);
      childSettingsData.forEach(childSetting => {
        this.validateChildSettings(childSetting);
      });

      // Get user's current children to validate import
      const userChildren = await prisma.childProfile.findMany({
        where: { parentId: userId },
        select: { id: true },
      });
      const userChildIds = new Set(userChildren.map(c => c.id));

      const results = await prisma.$transaction(async (tx) => {
        // Update user settings
        await this.getUserSettings(userId); // Ensure exists
        const updatedUserSettings = await tx.userSettings.update({
          where: { userId },
          data: {
            theme: userSettingsData.theme,
            language: userSettingsData.language,
            timezone: userSettingsData.timezone,
            emailNotifications: userSettingsData.emailNotifications,
            pushNotifications: userSettingsData.pushNotifications,
            privacyLevel: userSettingsData.privacyLevel,
            dataSharingConsent: userSettingsData.dataSharingConsent,
            updatedAt: new Date(),
          },
        });

        // Update child settings (only for children that belong to this user)
        const updatedChildSettings: ChildSettings[] = [];
        for (const childSetting of childSettingsData) {
          if (userChildIds.has(childSetting.childId)) {
            await this.getChildSettings(childSetting.childId); // Ensure exists
            
            const enforcedSettings = await this.enforcePrivacyPreferences(childSetting.childId, childSetting);
            
            const updated = await tx.childSettings.update({
              where: { childId: childSetting.childId },
              data: {
                ...enforcedSettings,
                updatedAt: new Date(),
              },
            });
            updatedChildSettings.push(updated);
          }
        }

        return { userSettings: updatedUserSettings, childSettings: updatedChildSettings };
      });

      logger.info(`Settings imported for user ${userId}`);
      return results;
    } catch (error) {
      logger.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Synchronize settings across devices (placeholder for future implementation)
   */
  async synchronizeSettings(userId: string): Promise<void> {
    try {
      // This would implement cross-device synchronization logic
      // For now, we just ensure settings exist and are up to date
      await this.getAllUserSettings(userId);
      logger.info(`Settings synchronized for user ${userId}`);
    } catch (error) {
      logger.error('Error synchronizing settings:', error);
      throw new Error('Failed to synchronize settings');
    }
  }

  /**
   * Create default user settings
   */
  private async createDefaultUserSettings(userId: string): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.create({
        data: {
          userId,
          ...DEFAULT_USER_SETTINGS,
        },
      });
      
      logger.info(`Default user settings created for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Error creating default user settings:', error);
      throw error;
    }
  }

  /**
   * Create default child settings
   */
  private async createDefaultChildSettings(childId: string): Promise<ChildSettings> {
    try {
      const settings = await prisma.childSettings.create({
        data: {
          childId,
          ...DEFAULT_CHILD_SETTINGS,
        },
      });
      
      logger.info(`Default child settings created for child ${childId}`);
      return settings;
    } catch (error) {
      logger.error('Error creating default child settings:', error);
      throw error;
    }
  }

  /**
   * Validate user settings input
   */
  private validateUserSettings(settings: Partial<UserSettings>): void {
    if (settings.theme && !VALID_THEMES.includes(settings.theme)) {
      throw new Error(`Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}`);
    }

    if (settings.privacyLevel && !VALID_PRIVACY_LEVELS.includes(settings.privacyLevel)) {
      throw new Error(`Invalid privacy level. Must be one of: ${VALID_PRIVACY_LEVELS.join(', ')}`);
    }

    if (settings.language && typeof settings.language !== 'string') {
      throw new Error('Language must be a string');
    }

    if (settings.timezone && typeof settings.timezone !== 'string') {
      throw new Error('Timezone must be a string');
    }
  }

  /**
   * Validate child settings input
   */
  private validateChildSettings(settings: Partial<ChildSettings>): void {
    if (settings.contentFilterLevel && !VALID_CONTENT_FILTER_LEVELS.includes(settings.contentFilterLevel)) {
      throw new Error(`Invalid content filter level. Must be one of: ${VALID_CONTENT_FILTER_LEVELS.join(', ')}`);
    }

    if (settings.sessionTimeLimit !== undefined) {
      if (typeof settings.sessionTimeLimit !== 'number' || settings.sessionTimeLimit < 5 || settings.sessionTimeLimit > 480) {
        throw new Error('Session time limit must be a number between 5 and 480 minutes');
      }
    }
  }

  /**
   * Enforce privacy preferences when updating child settings
   */
  private async enforcePrivacyPreferences(childId: string, updates: Partial<ChildSettings>): Promise<Partial<ChildSettings>> {
    try {
      // Get the child's parent's privacy settings
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          parent: {
            include: {
              settings: true,
            },
          },
        },
      });

      if (!child?.parent?.settings) {
        return updates;
      }

      const parentPrivacyLevel = child.parent.settings.privacyLevel;
      const enforcedUpdates = { ...updates };

      // Apply privacy enforcement based on parent's privacy level
      switch (parentPrivacyLevel) {
        case 'minimal':
          // Most restrictive - override certain settings
          if (updates.aiAssistanceEnabled !== undefined) {
            enforcedUpdates.aiAssistanceEnabled = false;
          }
          if (updates.contentFilterLevel !== undefined) {
            enforcedUpdates.contentFilterLevel = 'strict';
          }
          if (updates.parentalNotifications !== undefined) {
            enforcedUpdates.parentalNotifications = true;
          }
          break;

        case 'standard':
          // Moderate restrictions
          if (updates.contentFilterLevel === 'relaxed') {
            enforcedUpdates.contentFilterLevel = 'moderate';
          }
          break;

        case 'full':
          // Least restrictive - allow all settings
          break;
      }

      return enforcedUpdates;
    } catch (error) {
      logger.error('Error enforcing privacy preferences:', error);
      return updates; // Return original updates if enforcement fails
    }
  }
}

export const settingsService = new SettingsService();