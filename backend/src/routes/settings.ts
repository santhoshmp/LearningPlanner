import express from 'express';
import { settingsService, UserSettingsInput, ChildSettingsInput } from '../services/settingsService';
import { authenticateToken, requireParent } from '../middleware/auth';
import { validate } from '../utils/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const userSettingsUpdateSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  language: Joi.string().min(2).max(10).optional(),
  timezone: Joi.string().max(50).optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  privacyLevel: Joi.string().valid('minimal', 'standard', 'full').optional(),
  dataSharingConsent: Joi.boolean().optional(),
});

const childSettingsUpdateSchema = Joi.object({
  contentFilterLevel: Joi.string().valid('strict', 'moderate', 'relaxed').optional(),
  sessionTimeLimit: Joi.number().integer().min(5).max(480).optional(),
  breakReminders: Joi.boolean().optional(),
  parentalNotifications: Joi.boolean().optional(),
  aiAssistanceEnabled: Joi.boolean().optional(),
  videoAutoplay: Joi.boolean().optional(),
});

const bulkUpdateSchema = Joi.object({
  userSettings: userSettingsUpdateSchema.optional(),
  childSettings: Joi.array().items(
    Joi.object({
      childId: Joi.string().required(),
      settings: childSettingsUpdateSchema.required(),
    })
  ).optional(),
});

const settingsImportSchema = Joi.object({
  userSettings: Joi.object().required(),
  childSettings: Joi.array().items(Joi.object()).required(),
  exportedAt: Joi.date().required(),
});

/**
 * Get user settings
 * GET /api/settings/user
 */
router.get('/user', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const settings = await settingsService.getUserSettings(req.user.userId);

    res.json({
      success: true,
      message: 'User settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user settings',
      error: {
        code: 'USER_SETTINGS_FETCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update user settings
 * PUT /api/settings/user
 */
router.put('/user', authenticateToken, requireParent, validate(userSettingsUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updatedSettings = await settingsService.updateUserSettings(req.user.userId, req.body);

    res.json({
      success: true,
      message: 'User settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid theme') || 
          error.message.includes('Invalid privacy level') ||
          error.message.includes('must be a string')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: {
        code: 'USER_SETTINGS_UPDATE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get child settings
 * GET /api/settings/child/:childId
 */
router.get('/child/:childId', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const settings = await settingsService.getChildSettings(childId);

    res.json({
      success: true,
      message: 'Child settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Get child settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child settings',
      error: {
        code: 'CHILD_SETTINGS_FETCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update child settings
 * PUT /api/settings/child/:childId
 */
router.put('/child/:childId', authenticateToken, requireParent, validate(childSettingsUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    const updatedSettings = await settingsService.updateChildSettings(
      childId, 
      req.body, 
      req.user.userId
    );

    res.json({
      success: true,
      message: 'Child settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update child settings error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Child profile not found or access denied') {
        return res.status(403).json({
          success: false,
          message: 'Access denied or child profile not found'
        });
      }
      
      if (error.message.includes('Invalid content filter level') || 
          error.message.includes('Session time limit must be')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update child settings',
      error: {
        code: 'CHILD_SETTINGS_UPDATE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get all settings for a user (user + all children)
 * GET /api/settings/all
 */
router.get('/all', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allSettings = await settingsService.getAllUserSettings(req.user.userId);

    res.json({
      success: true,
      message: 'All settings retrieved successfully',
      data: allSettings
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all settings',
      error: {
        code: 'ALL_SETTINGS_FETCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Bulk update settings (user + multiple children)
 * PUT /api/settings/bulk
 */
router.put('/bulk', authenticateToken, requireParent, validate(bulkUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { userSettings, childSettings } = req.body;

    if (!userSettings && !childSettings) {
      return res.status(400).json({
        success: false,
        message: 'At least one of userSettings or childSettings must be provided'
      });
    }

    const updatedSettings = await settingsService.bulkUpdateSettings(
      req.user.userId,
      userSettings,
      childSettings
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Child profile') && error.message.includes('not found or access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: {
        code: 'BULK_SETTINGS_UPDATE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Export all settings
 * GET /api/settings/export
 */
router.get('/export', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exportData = await settingsService.exportSettings(req.user.userId);

    res.json({
      success: true,
      message: 'Settings exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Export settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: {
        code: 'SETTINGS_EXPORT_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Download settings as JSON file
 * GET /api/settings/download
 */
router.get('/download', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exportData = await settingsService.exportSettings(req.user.userId);
    const jsonData = JSON.stringify(exportData, null, 2);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settings-export-${req.user.userId}-${Date.now()}.json"`);
    res.setHeader('Content-Length', Buffer.byteLength(jsonData));

    res.send(jsonData);
  } catch (error) {
    console.error('Download settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to download settings',
      error: {
        code: 'SETTINGS_DOWNLOAD_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Import settings from JSON data
 * POST /api/settings/import
 */
router.post('/import', authenticateToken, requireParent, validate(settingsImportSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const importedSettings = await settingsService.importSettings(req.user.userId, req.body);

    res.json({
      success: true,
      message: 'Settings imported successfully',
      data: importedSettings
    });
  } catch (error) {
    console.error('Import settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          message: `Import validation failed: ${error.message}`
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: {
        code: 'SETTINGS_IMPORT_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Synchronize settings across devices
 * POST /api/settings/sync
 */
router.post('/sync', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await settingsService.synchronizeSettings(req.user.userId);

    res.json({
      success: true,
      message: 'Settings synchronized successfully'
    });
  } catch (error) {
    console.error('Sync settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize settings',
      error: {
        code: 'SETTINGS_SYNC_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Reset user settings to defaults
 * POST /api/settings/user/reset
 */
router.post('/user/reset', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Reset to default settings
    const defaultSettings: UserSettingsInput = {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      privacyLevel: 'standard',
      dataSharingConsent: false,
    };

    const resetSettings = await settingsService.updateUserSettings(req.user.userId, defaultSettings);

    res.json({
      success: true,
      message: 'User settings reset to defaults successfully',
      data: resetSettings
    });
  } catch (error) {
    console.error('Reset user settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset user settings',
      error: {
        code: 'USER_SETTINGS_RESET_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Reset child settings to defaults
 * POST /api/settings/child/:childId/reset
 */
router.post('/child/:childId/reset', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    // Reset to default settings
    const defaultSettings: ChildSettingsInput = {
      contentFilterLevel: 'moderate',
      sessionTimeLimit: 60,
      breakReminders: true,
      parentalNotifications: true,
      aiAssistanceEnabled: true,
      videoAutoplay: false,
    };

    const resetSettings = await settingsService.updateChildSettings(
      childId, 
      defaultSettings, 
      req.user.userId
    );

    res.json({
      success: true,
      message: 'Child settings reset to defaults successfully',
      data: resetSettings
    });
  } catch (error) {
    console.error('Reset child settings error:', error);
    
    if (error instanceof Error && error.message === 'Child profile not found or access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied or child profile not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset child settings',
      error: {
        code: 'CHILD_SETTINGS_RESET_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

export default router;