import express from 'express';
import Joi from 'joi';
import { authenticateToken, requireChild } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { childHelpAnalyticsService } from '../services/childHelpAnalyticsService';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const helpRequestTrackingSchema = Joi.object({
  childId: Joi.string().required(),
  activityId: Joi.string().required(),
  question: Joi.string().required(),
  response: Joi.string().required(),
  context: Joi.object().default({}),
  timestamp: Joi.string().isoDate().required()
});

const resolveHelpRequestSchema = Joi.object({
  wasHelpful: Joi.boolean().required(),
  resolvedAt: Joi.string().isoDate().required()
});

const reportResponseSchema = Joi.object({
  reason: Joi.string().required(),
  details: Joi.string().optional(),
  reportedAt: Joi.string().isoDate().required()
});

/**
 * Get help analytics for a child
 * GET /api/child/:childId/help-analytics
 * Requires child authentication
 */
router.get(
  '/:childId/help-analytics',
  authenticateToken,
  requireChild,
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Verify the authenticated child matches the requested child
      if (req.user?.childId !== childId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const analytics = await childHelpAnalyticsService.getChildHelpAnalytics(childId);
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching child help analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch help analytics'
      });
    }
  }
);

/**
 * Get help request patterns for a child
 * GET /api/child/:childId/help-patterns
 * Requires child authentication
 */
router.get(
  '/:childId/help-patterns',
  authenticateToken,
  requireChild,
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { timeframe } = req.query;
      
      // Verify the authenticated child matches the requested child
      if (req.user?.childId !== childId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const patterns = await childHelpAnalyticsService.getHelpRequestPatterns(
        childId, 
        timeframe as 'day' | 'week' | 'month'
      );
      
      res.status(200).json({
        success: true,
        patterns
      });
    } catch (error) {
      logger.error('Error fetching help request patterns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch help patterns'
      });
    }
  }
);

/**
 * Check if parent notification is needed
 * GET /api/child/:childId/help-notification-check
 * Requires child authentication
 */
router.get(
  '/:childId/help-notification-check',
  authenticateToken,
  requireChild,
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Verify the authenticated child matches the requested child
      if (req.user?.childId !== childId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const notification = await childHelpAnalyticsService.checkParentNotificationNeeded(childId);
      
      res.status(200).json({
        success: true,
        notification
      });
    } catch (error) {
      logger.error('Error checking parent notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check notification status'
      });
    }
  }
);

/**
 * Get personalized help suggestions
 * GET /api/child/:childId/help-suggestions
 * Requires child authentication
 */
router.get(
  '/:childId/help-suggestions',
  authenticateToken,
  requireChild,
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { subject } = req.query;
      
      // Verify the authenticated child matches the requested child
      if (req.user?.childId !== childId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const suggestions = await childHelpAnalyticsService.getPersonalizedSuggestions(
        childId, 
        subject as string
      );
      
      res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      logger.error('Error fetching personalized suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suggestions'
      });
    }
  }
);

/**
 * Mark help request as resolved
 * PATCH /api/help-requests/:helpRequestId/resolve
 * Requires child authentication
 */
router.patch(
  '/help-requests/:helpRequestId/resolve',
  authenticateToken,
  requireChild,
  validateRequest(resolveHelpRequestSchema),
  async (req, res) => {
    try {
      const { helpRequestId } = req.params;
      const { wasHelpful } = req.body;

      await childHelpAnalyticsService.markHelpRequestResolved(helpRequestId, wasHelpful);
      
      res.status(200).json({
        success: true,
        message: 'Help request marked as resolved'
      });
    } catch (error) {
      logger.error('Error marking help request as resolved:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark help request as resolved'
      });
    }
  }
);

/**
 * Report inappropriate or unhelpful response
 * POST /api/help-requests/:helpRequestId/report
 * Requires child authentication
 */
router.post(
  '/help-requests/:helpRequestId/report',
  authenticateToken,
  requireChild,
  validateRequest(reportResponseSchema),
  async (req, res) => {
    try {
      const { helpRequestId } = req.params;
      const { reason, details } = req.body;

      await childHelpAnalyticsService.reportResponse(helpRequestId, reason, details);
      
      res.status(200).json({
        success: true,
        message: 'Response reported successfully'
      });
    } catch (error) {
      logger.error('Error reporting response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report response'
      });
    }
  }
);

export default router;