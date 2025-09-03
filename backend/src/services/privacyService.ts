import { prisma } from '../utils/database';
import { logger, logAuditEvent } from '../utils/logger';

interface PrivacySettings {
  dataCollection: boolean;
  contentLogging: boolean;
  aiUsageTracking: boolean;
  emailNotifications: boolean;
}

interface ChildPrivacySettings {
  contentFiltering: boolean;
  conversationLogging: boolean;
  aiInteractionEnabled: boolean;
}

/**
 * Service for managing privacy settings and data
 */
export const privacyService = {
  /**
   * Get privacy settings for a user
   * @param userId User ID
   * @returns Privacy settings
   */
  getPrivacySettings: async (userId: string): Promise<PrivacySettings> => {
    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          preferences: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Extract privacy settings from user preferences
      const preferences = user.preferences as any || {};
      const privacySettings = preferences.privacy || {};
      
      // Return settings with defaults for any missing values
      return {
        dataCollection: privacySettings.dataCollection !== false, // Default to true
        contentLogging: privacySettings.contentLogging !== false, // Default to true
        aiUsageTracking: privacySettings.aiUsageTracking !== false, // Default to true
        emailNotifications: privacySettings.emailNotifications !== false // Default to true
      };
    } catch (error) {
      logger.error('Error getting privacy settings:', error);
      throw new Error('Failed to get privacy settings');
    }
  },
  
  /**
   * Update privacy settings for a user
   * @param userId User ID
   * @param settings Updated privacy settings
   */
  updatePrivacySettings: async (userId: string, settings: PrivacySettings): Promise<void> => {
    try {
      // Get current user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          preferences: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update preferences with new privacy settings
      const preferences = user.preferences as any || {};
      preferences.privacy = settings;
      
      // Save updated preferences
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: preferences as any
        }
      });
      
      // Log the privacy settings update
      logAuditEvent(
        'privacy_settings_update',
        userId,
        `user:${userId}`,
        { settings },
        true
      );
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      throw new Error('Failed to update privacy settings');
    }
  },
  
  /**
   * Get privacy settings for a child
   * @param childId Child ID
   * @returns Child privacy settings
   */
  getChildPrivacySettings: async (childId: string): Promise<ChildPrivacySettings> => {
    try {
      // Get child profile from database
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: {
          id: true,
          preferences: true
        }
      });
      
      if (!child) {
        throw new Error('Child profile not found');
      }
      
      // Extract privacy settings from child preferences
      const preferences = child.preferences as any || {};
      const privacySettings = preferences.privacy || {};
      
      // Return settings with defaults for any missing values
      return {
        contentFiltering: privacySettings.contentFiltering !== false, // Default to true
        conversationLogging: privacySettings.conversationLogging !== false, // Default to true
        aiInteractionEnabled: privacySettings.aiInteractionEnabled !== false // Default to true
      };
    } catch (error) {
      logger.error('Error getting child privacy settings:', error);
      throw new Error('Failed to get child privacy settings');
    }
  },
  
  /**
   * Update privacy settings for a child
   * @param childId Child ID
   * @param parentId Parent ID (for authorization)
   * @param settings Updated child privacy settings
   */
  updateChildPrivacySettings: async (
    childId: string,
    parentId: string,
    settings: ChildPrivacySettings
  ): Promise<void> => {
    try {
      // Get child profile and verify parent relationship
      const child = await prisma.childProfile.findFirst({
        where: {
          id: childId,
          parentId
        },
        select: {
          id: true,
          preferences: true
        }
      });
      
      if (!child) {
        throw new Error('Child profile not found or not authorized');
      }
      
      // Update preferences with new privacy settings
      const preferences = child.preferences as any || {};
      preferences.privacy = {
        ...preferences.privacy,
        ...settings
      };
      
      // Save updated preferences
      await prisma.childProfile.update({
        where: { id: childId },
        data: {
          preferences: preferences as any
        }
      });
      
      // Log the privacy settings update
      logAuditEvent(
        'child_privacy_settings_update',
        parentId,
        `child:${childId}`,
        { settings },
        true
      );
    } catch (error) {
      logger.error('Error updating child privacy settings:', error);
      throw new Error('Failed to update child privacy settings');
    }
  },
  
  /**
   * Request data export for a user
   * @param userId User ID
   */
  requestDataExport: async (userId: string): Promise<void> => {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          children: {
            include: {
              studyPlans: true,
              progressRecords: true,
              achievements: true,
              helpRequests: true
            }
          }
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // In a real implementation, this would:
      // 1. Generate a data export file
      // 2. Store it securely
      // 3. Send an email with a secure download link
      
      // For now, we'll just log the request
      logAuditEvent(
        'data_export_request',
        userId,
        `user:${userId}`,
        { timestamp: new Date().toISOString() },
        true
      );
      
      // TODO: Implement actual data export functionality
    } catch (error) {
      logger.error('Error requesting data export:', error);
      throw new Error('Failed to request data export');
    }
  },
  
  /**
   * Delete user account and all associated data
   * @param userId User ID
   */
  deleteAccount: async (userId: string): Promise<void> => {
    try {
      // Log the account deletion request
      logAuditEvent(
        'account_deletion_request',
        userId,
        `user:${userId}`,
        { timestamp: new Date().toISOString() },
        true
      );
      
      // Delete the user (cascading delete will remove related data)
      await prisma.user.delete({
        where: { id: userId }
      });
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  },
  
  /**
   * Get data retention policy
   * @returns Data retention policy details
   */
  getDataRetentionPolicy: async () => {
    // This would typically come from a database or configuration
    // For now, we'll return a static policy
    return {
      userAccountData: '7 years after account deletion',
      childProfileData: '5 years after account deletion',
      conversationLogs: '1 year',
      analyticsData: '2 years',
      securityLogs: '3 years',
      inactiveAccounts: 'Deleted after 2 years of inactivity'
    };
  }
};

export default privacyService;