import request from 'supertest';
import express from 'express';
import settingsRouter from '../settings';
import { settingsService } from '../../services/settingsService';
import { authenticateToken, requireParent } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/settingsService');
jest.mock('../../middleware/auth');
jest.mock('../../utils/validation', () => ({
  validate: (schema: any) => (req: any, res: any, next: any) => next(),
}));

const mockSettingsService = settingsService as jest.Mocked<typeof settingsService>;
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequireParent = requireParent as jest.MockedFunction<typeof requireParent>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/settings', settingsRouter);

// Mock middleware to add user to request
const mockUser = { userId: 'user-1', role: 'PARENT' };

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock authentication middleware
  (mockAuthenticateToken as any).mockImplementation((req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  });
  
  (mockRequireParent as any).mockImplementation((req: any, res: any, next: any) => {
    next();
  });
});

describe('Settings Routes', () => {
  describe('GET /api/settings/user', () => {
    it('should get user settings successfully', async () => {
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

      mockSettingsService.getUserSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/settings/user')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User settings retrieved successfully',
        data: {
          ...mockSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith('user-1');
    });

    it('should handle service errors', async () => {
      mockSettingsService.getUserSettings.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/settings/user')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to retrieve user settings');
    });
  });

  describe('PUT /api/settings/user', () => {
    it('should update user settings successfully', async () => {
      const updateData = {
        theme: 'dark',
        emailNotifications: false,
      };

      const updatedSettings = {
        id: 'settings-1',
        userId: 'user-1',
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: false,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.updateUserSettings.mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/settings/user')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User settings updated successfully',
        data: {
          ...updatedSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.updateUserSettings).toHaveBeenCalledWith('user-1', updateData);
    });

    it('should handle validation errors', async () => {
      mockSettingsService.updateUserSettings.mockRejectedValue(
        new Error('Invalid theme. Must be one of: light, dark, auto')
      );

      const response = await request(app)
        .put('/api/settings/user')
        .send({ theme: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid theme. Must be one of: light, dark, auto');
    });
  });

  describe('GET /api/settings/child/:childId', () => {
    it('should get child settings successfully', async () => {
      const mockSettings = {
        id: 'child-settings-1',
        childId: 'child-1',
        contentFilterLevel: 'moderate',
        sessionTimeLimit: 60,
        breakReminders: true,
        parentalNotifications: true,
        aiAssistanceEnabled: true,
        videoAutoplay: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.getChildSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/settings/child/child-1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Child settings retrieved successfully',
        data: {
          ...mockSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.getChildSettings).toHaveBeenCalledWith('child-1');
    });

    it('should handle missing child ID', async () => {
      const response = await request(app)
        .get('/api/settings/child/')
        .expect(404); // Express will return 404 for missing route parameter
    });
  });

  describe('PUT /api/settings/child/:childId', () => {
    it('should update child settings successfully', async () => {
      const updateData = {
        sessionTimeLimit: 90,
        videoAutoplay: true,
      };

      const updatedSettings = {
        id: 'child-settings-1',
        childId: 'child-1',
        contentFilterLevel: 'moderate',
        sessionTimeLimit: 90,
        breakReminders: true,
        parentalNotifications: true,
        aiAssistanceEnabled: true,
        videoAutoplay: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.updateChildSettings.mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/settings/child/child-1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Child settings updated successfully',
        data: {
          ...updatedSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.updateChildSettings).toHaveBeenCalledWith(
        'child-1',
        updateData,
        'user-1'
      );
    });

    it('should handle access denied errors', async () => {
      mockSettingsService.updateChildSettings.mockRejectedValue(
        new Error('Child profile not found or access denied')
      );

      const response = await request(app)
        .put('/api/settings/child/child-1')
        .send({ sessionTimeLimit: 90 })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied or child profile not found');
    });

    it('should handle validation errors', async () => {
      mockSettingsService.updateChildSettings.mockRejectedValue(
        new Error('Invalid content filter level. Must be one of: strict, moderate, relaxed')
      );

      const response = await request(app)
        .put('/api/settings/child/child-1')
        .send({ contentFilterLevel: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid content filter level. Must be one of: strict, moderate, relaxed');
    });
  });

  describe('GET /api/settings/all', () => {
    it('should get all settings successfully', async () => {
      const mockAllSettings = {
        userSettings: {
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
        childSettings: [{
          id: 'child-settings-1',
          childId: 'child-1',
          contentFilterLevel: 'moderate',
          sessionTimeLimit: 60,
          breakReminders: true,
          parentalNotifications: true,
          aiAssistanceEnabled: true,
          videoAutoplay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      };

      mockSettingsService.getAllUserSettings.mockResolvedValue(mockAllSettings);

      const response = await request(app)
        .get('/api/settings/all')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'All settings retrieved successfully',
        data: {
          userSettings: {
            ...mockAllSettings.userSettings,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          childSettings: mockAllSettings.childSettings.map(child => ({
            ...child,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })),
        },
      });

      expect(mockSettingsService.getAllUserSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('PUT /api/settings/bulk', () => {
    it('should bulk update settings successfully', async () => {
      const bulkUpdateData = {
        userSettings: { theme: 'dark' },
        childSettings: [
          { childId: 'child-1', settings: { sessionTimeLimit: 90 } },
        ],
      };

      const updatedSettings = {
        userSettings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        childSettings: [{
          id: 'child-settings-1',
          childId: 'child-1',
          contentFilterLevel: 'moderate',
          sessionTimeLimit: 90,
          breakReminders: true,
          parentalNotifications: true,
          aiAssistanceEnabled: true,
          videoAutoplay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      };

      mockSettingsService.bulkUpdateSettings.mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/settings/bulk')
        .send(bulkUpdateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Settings updated successfully',
        data: {
          userSettings: {
            ...updatedSettings.userSettings,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          childSettings: updatedSettings.childSettings.map(child => ({
            ...child,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })),
        },
      });

      expect(mockSettingsService.bulkUpdateSettings).toHaveBeenCalledWith(
        'user-1',
        bulkUpdateData.userSettings,
        bulkUpdateData.childSettings
      );
    });

    it('should handle empty bulk update request', async () => {
      const response = await request(app)
        .put('/api/settings/bulk')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one of userSettings or childSettings must be provided');
    });
  });

  describe('GET /api/settings/export', () => {
    it('should export settings successfully', async () => {
      const mockExportData = {
        userSettings: {
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
        childSettings: [{
          id: 'child-settings-1',
          childId: 'child-1',
          contentFilterLevel: 'moderate',
          sessionTimeLimit: 60,
          breakReminders: true,
          parentalNotifications: true,
          aiAssistanceEnabled: true,
          videoAutoplay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        exportedAt: new Date(),
      };

      mockSettingsService.exportSettings.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/settings/export')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Settings exported successfully',
        data: {
          userSettings: {
            ...mockExportData.userSettings,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          childSettings: mockExportData.childSettings.map(child => ({
            ...child,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })),
          exportedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.exportSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /api/settings/download', () => {
    it('should download settings as JSON file', async () => {
      const mockExportData = {
        userSettings: {
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
        childSettings: [],
        exportedAt: new Date(),
      };

      mockSettingsService.exportSettings.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/settings/download')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="settings-export-user-1-\d+\.json"/);
      expect(mockSettingsService.exportSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/settings/import', () => {
    it('should import settings successfully', async () => {
      const importData = {
        userSettings: {
          id: 'settings-1',
          userId: 'user-1',
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: false,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        childSettings: [],
        exportedAt: new Date(),
      };

      const importedSettings = {
        userSettings: importData.userSettings,
        childSettings: [],
      };

      mockSettingsService.importSettings.mockResolvedValue(importedSettings);

      const response = await request(app)
        .post('/api/settings/import')
        .send(importData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Settings imported successfully',
        data: {
          userSettings: {
            ...importedSettings.userSettings,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          childSettings: importedSettings.childSettings,
        },
      });

      expect(mockSettingsService.importSettings).toHaveBeenCalledWith('user-1', {
        ...importData,
        exportedAt: expect.any(String),
        userSettings: {
          ...importData.userSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should handle import validation errors', async () => {
      mockSettingsService.importSettings.mockRejectedValue(
        new Error('Invalid theme. Must be one of: light, dark, auto')
      );

      const response = await request(app)
        .post('/api/settings/import')
        .send({
          userSettings: { theme: 'invalid' },
          childSettings: [],
          exportedAt: new Date(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Import validation failed: Invalid theme. Must be one of: light, dark, auto');
    });
  });

  describe('POST /api/settings/sync', () => {
    it('should synchronize settings successfully', async () => {
      mockSettingsService.synchronizeSettings.mockResolvedValue();

      const response = await request(app)
        .post('/api/settings/sync')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Settings synchronized successfully',
      });

      expect(mockSettingsService.synchronizeSettings).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/settings/user/reset', () => {
    it('should reset user settings to defaults', async () => {
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

      mockSettingsService.updateUserSettings.mockResolvedValue(defaultSettings);

      const response = await request(app)
        .post('/api/settings/user/reset')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User settings reset to defaults successfully',
        data: {
          ...defaultSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.updateUserSettings).toHaveBeenCalledWith('user-1', {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
      });
    });
  });

  describe('POST /api/settings/child/:childId/reset', () => {
    it('should reset child settings to defaults', async () => {
      const defaultSettings = {
        id: 'child-settings-1',
        childId: 'child-1',
        contentFilterLevel: 'moderate',
        sessionTimeLimit: 60,
        breakReminders: true,
        parentalNotifications: true,
        aiAssistanceEnabled: true,
        videoAutoplay: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.updateChildSettings.mockResolvedValue(defaultSettings);

      const response = await request(app)
        .post('/api/settings/child/child-1/reset')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Child settings reset to defaults successfully',
        data: {
          ...defaultSettings,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(mockSettingsService.updateChildSettings).toHaveBeenCalledWith(
        'child-1',
        {
          contentFilterLevel: 'moderate',
          sessionTimeLimit: 60,
          breakReminders: true,
          parentalNotifications: true,
          aiAssistanceEnabled: true,
          videoAutoplay: false,
        },
        'user-1'
      );
    });

    it('should handle access denied for child reset', async () => {
      mockSettingsService.updateChildSettings.mockRejectedValue(
        new Error('Child profile not found or access denied')
      );

      const response = await request(app)
        .post('/api/settings/child/child-1/reset')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied or child profile not found');
    });
  });
});