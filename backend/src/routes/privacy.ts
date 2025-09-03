import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireParent } from '../middleware/auth';
import { privacyService } from '../services/privacyService';
import { logger, logSecurityEvent } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Define schemas for validation
const userIdParamSchema = Joi.object({
  userId: Joi.string().required()
});

const childIdParamSchema = Joi.object({
  childId: Joi.string().required()
});

const userPrivacySettingsSchema = Joi.object({
  settings: Joi.object({
    dataCollection: Joi.boolean().required(),
    contentLogging: Joi.boolean().required(),
    aiUsageTracking: Joi.boolean().required(),
    emailNotifications: Joi.boolean().required()
  }).required()
});

const childPrivacySettingsSchema = Joi.object({
  settings: Joi.object({
    contentFiltering: Joi.boolean().required(),
    conversationLogging: Joi.boolean().required(),
    aiInteractionEnabled: Joi.boolean().required()
  }).required()
});

/**
 * Route for getting user privacy settings
 * GET /api/privacy/settings/:userId
 * Requires authentication
 */
router.get(
  '/settings/:userId',
  authenticateToken,
  (req, res, next) => validateRequest(userIdParamSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify user is accessing their own settings
      if (userId !== req.user.userId) {
        logSecurityEvent('unauthorized_access_attempt', {
          userId: req.user.userId,
          targetUserId: userId,
          resource: 'privacy_settings',
          requestId: req.id
        });
        
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access these settings'
        });
      }
      
      const settings = await privacyService.getPrivacySettings(userId);
      
      res.status(200).json({
        success: true,
        settings
      });
    } catch (error) {
      logger.error('Error getting privacy settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get privacy settings'
      });
    }
  }
);

/**
 * Route for updating user privacy settings
 * PUT /api/privacy/settings/:userId
 * Requires authentication
 */
router.put(
  '/settings/:userId',
  authenticateToken,
  (req, res, next) => validateRequest(userIdParamSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(userPrivacySettingsSchema)(req, res, next),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { settings } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify user is updating their own settings
      if (userId !== req.user.userId) {
        logSecurityEvent('unauthorized_access_attempt', {
          userId: req.user.userId,
          targetUserId: userId,
          resource: 'privacy_settings',
          requestId: req.id
        });
        
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update these settings'
        });
      }
      
      await privacyService.updatePrivacySettings(userId, settings);
      
      res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update privacy settings'
      });
    }
  }
);

/**
 * Route for getting child privacy settings
 * GET /api/privacy/child-settings/:childId
 * Requires parent authentication
 */
router.get(
  '/child-settings/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(childIdParamSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const parentId = req.user.userId;
      
      // Child authorization would typically be handled by a middleware
      // For now, we'll assume the service handles this check
      
      const settings = await privacyService.getChildPrivacySettings(childId);
      
      res.status(200).json({
        success: true,
        settings
      });
    } catch (error: any) {
      logger.error('Error getting child privacy settings:', error);
      
      if (error.message === 'Child profile not found') {
        return res.status(404).json({
          success: false,
          message: 'Child profile not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to get child privacy settings'
      });
    }
  }
);

/**
 * Route for updating child privacy settings
 * PUT /api/privacy/child-settings/:childId
 * Requires parent authentication
 */
router.put(
  '/child-settings/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(childIdParamSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(childPrivacySettingsSchema)(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { settings } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const parentId = req.user.userId;
      
      await privacyService.updateChildPrivacySettings(childId, parentId, settings);
      
      res.status(200).json({
        success: true,
        message: 'Child privacy settings updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating child privacy settings:', error);
      
      if (error.message === 'Child profile not found or not authorized') {
        return res.status(403).json({
          success: false,
          message: 'Child profile not found or you are not authorized to update these settings'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update child privacy settings'
      });
    }
  }
);

/**
 * Route for requesting data export
 * POST /api/privacy/export/:userId
 * Requires authentication
 */
router.post(
  '/export/:userId',
  authenticateToken,
  (req, res, next) => validateRequest(userIdParamSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify user is accessing their own data
      if (userId !== req.user.userId) {
        logSecurityEvent('unauthorized_access_attempt', {
          userId: req.user.userId,
          targetUserId: userId,
          resource: 'data_export',
          requestId: req.id
        });
        
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to export this data'
        });
      }
      
      await privacyService.requestDataExport(userId);
      
      res.status(200).json({
        success: true,
        message: 'Data export request received. You will receive an email with your data shortly.'
      });
    } catch (error) {
      logger.error('Error requesting data export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request data export'
      });
    }
  }
);

/**
 * Route for deleting user account
 * DELETE /api/privacy/account/:userId
 * Requires authentication
 */
router.delete(
  '/account/:userId',
  authenticateToken,
  (req, res, next) => validateRequest(userIdParamSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify user is deleting their own account
      if (userId !== req.user.userId) {
        logSecurityEvent('unauthorized_access_attempt', {
          userId: req.user.userId,
          targetUserId: userId,
          resource: 'account_deletion',
          requestId: req.id
        });
        
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this account'
        });
      }
      
      await privacyService.deleteAccount(userId);
      
      res.status(200).json({
        success: true,
        message: 'Account deletion initiated. Your account and all associated data will be removed.'
      });
    } catch (error) {
      logger.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
);

/**
 * Route for getting data retention policy
 * GET /api/privacy/retention-policy
 * Public route
 */
router.get(
  '/retention-policy',
  async (req, res) => {
    try {
      const policy = await privacyService.getDataRetentionPolicy();
      
      res.status(200).json({
        success: true,
        policy
      });
    } catch (error) {
      logger.error('Error getting data retention policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get data retention policy'
      });
    }
  }
);

export default router;