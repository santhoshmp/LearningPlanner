import express from 'express';
import multer from 'multer';
import { profileService } from '../services/profileService';
import { authenticateToken, requireParent } from '../middleware/auth';
import { validate } from '../utils/validation';
import Joi from 'joi';

const router = express.Router();

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// Validation schemas
const profileUpdateSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  email: Joi.string().email().optional(),
  settings: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    language: Joi.string().max(10).optional(),
    timezone: Joi.string().max(50).optional(),
    emailNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    privacyLevel: Joi.string().valid('minimal', 'standard', 'full').optional(),
    dataSharingConsent: Joi.boolean().optional(),
  }).optional(),
});

const settingsUpdateSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  language: Joi.string().max(10).optional(),
  timezone: Joi.string().max(50).optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  privacyLevel: Joi.string().valid('minimal', 'standard', 'full').optional(),
  dataSharingConsent: Joi.boolean().optional(),
});

/**
 * Get current user profile
 * GET /api/profile
 */
router.get('/', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const profile = await profileService.getUserProfile(req.user.userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: {
        code: 'PROFILE_FETCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update user profile
 * PUT /api/profile
 */
router.put('/', authenticateToken, requireParent, validate(profileUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate and sanitize input data
    const validation = profileService.validateProfileData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile data',
        errors: validation.errors
      });
    }

    const sanitizedData = profileService.sanitizeProfileData(req.body);
    const updatedProfile = await profileService.updateUserProfile(req.user.userId, sanitizedData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      
      if (error.message === 'Email is already in use') {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: {
        code: 'PROFILE_UPDATE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Upload user avatar
 * POST /api/profile/avatar
 */
router.post('/avatar', authenticateToken, requireParent, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await profileService.uploadAvatar(
      req.user.userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('File size too large')) {
        return res.status(413).json({
          success: false,
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: {
        code: 'AVATAR_UPLOAD_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Delete user avatar
 * DELETE /api/profile/avatar/:filename
 */
router.delete('/avatar/:filename', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { filename } = req.params;
    
    // Basic validation of filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    await profileService.deleteAvatar(req.user.userId, filename);

    res.json({
      success: true,
      message: 'Avatar deleted successfully'
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar',
      error: {
        code: 'AVATAR_DELETE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get user settings
 * GET /api/profile/settings
 */
router.get('/settings', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const settings = await profileService.getUserSettings(req.user.userId);

    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: {
        code: 'SETTINGS_FETCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update user settings
 * PUT /api/profile/settings
 */
router.put('/settings', authenticateToken, requireParent, validate(settingsUpdateSchema), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updatedSettings = await profileService.updateUserSettings(req.user.userId, req.body);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: {
        code: 'SETTINGS_UPDATE_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Export user profile data (GDPR compliance)
 * GET /api/profile/export
 */
router.get('/export', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exportData = await profileService.exportUserData(req.user.userId);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profile-export-${req.user.userId}-${Date.now()}.json"`);

    res.json({
      success: true,
      message: 'Profile data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Export profile error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to export profile data',
      error: {
        code: 'PROFILE_EXPORT_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Download profile data as file
 * GET /api/profile/download
 */
router.get('/download', authenticateToken, requireParent, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exportData = await profileService.exportUserData(req.user.userId);
    const jsonData = JSON.stringify(exportData, null, 2);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profile-data-${req.user.userId}-${Date.now()}.json"`);
    res.setHeader('Content-Length', Buffer.byteLength(jsonData));

    res.send(jsonData);
  } catch (error) {
    console.error('Download profile error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to download profile data',
      error: {
        code: 'PROFILE_DOWNLOAD_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

export default router;