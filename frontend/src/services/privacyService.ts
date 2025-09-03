import { default as api } from './api';

interface PrivacySettings {
  dataCollection: boolean;
  contentLogging: boolean;
  aiUsageTracking: boolean;
  emailNotifications: boolean;
}

export const privacyService = {
  /**
   * Get current privacy settings for a user
   * @param userId User ID
   * @returns Current privacy settings
   */
  getPrivacySettings: async (userId: string): Promise<PrivacySettings> => {
    try {
      const response = await api.get(`/privacy/settings/${userId}`);
      return response.data.settings;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }
  },
  
  /**
   * Update privacy settings for a user
   * @param userId User ID
   * @param settings Updated privacy settings
   */
  updatePrivacySettings: async (userId: string, settings: PrivacySettings): Promise<void> => {
    try {
      await api.put(`/privacy/settings/${userId}`, { settings });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },
  
  /**
   * Request data export for a user
   * @param userId User ID
   */
  requestDataExport: async (userId: string): Promise<void> => {
    try {
      await api.post(`/privacy/export/${userId}`);
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  },
  
  /**
   * Delete user account and all associated data
   * @param userId User ID
   */
  deleteAccount: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/privacy/account/${userId}`);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
  
  /**
   * Get data retention policy information
   * @returns Data retention policy details
   */
  getDataRetentionPolicy: async () => {
    try {
      const response = await api.get('/privacy/retention-policy');
      return response.data.policy;
    } catch (error) {
      console.error('Error fetching data retention policy:', error);
      throw error;
    }
  },
  
  /**
   * Update child privacy settings
   * @param childId Child ID
   * @param settings Privacy settings for the child
   */
  updateChildPrivacySettings: async (childId: string, settings: {
    contentFiltering: boolean;
    conversationLogging: boolean;
    aiInteractionEnabled: boolean;
  }): Promise<void> => {
    try {
      await api.put(`/privacy/child-settings/${childId}`, { settings });
    } catch (error) {
      console.error('Error updating child privacy settings:', error);
      throw error;
    }
  },
  
  /**
   * Get child privacy settings
   * @param childId Child ID
   * @returns Child privacy settings
   */
  getChildPrivacySettings: async (childId: string) => {
    try {
      const response = await api.get(`/privacy/child-settings/${childId}`);
      return response.data.settings;
    } catch (error) {
      console.error('Error fetching child privacy settings:', error);
      throw error;
    }
  }
};

export default privacyService;