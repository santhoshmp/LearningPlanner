import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken, requireParent, requireChild } from '../middleware/auth';
import { claudeService } from '../services/claudeService';
import { logger } from '../utils/logger';
import { logSecurityEvent } from '../middleware/auth';
import { suspiciousActivityDetection } from '../middleware/securityMonitoring';
import Joi from 'joi';

const router = express.Router();

// Define schemas for Claude routes
const helpRequestSchema = Joi.object({
  question: Joi.string().required(),
  activityId: Joi.string().required(),
  childAge: Joi.number().integer().min(5).max(18).required(),
  activityContext: Joi.object({
    title: Joi.string().required(),
    subject: Joi.string().required()
  }).required()
});

const generatePlanSchema = Joi.object({
  subject: Joi.string().required(),
  difficulty: Joi.string().required(),
  childAge: Joi.number().integer().min(5).max(18).required(),
  learningStyle: Joi.string().required(),
  objectives: Joi.array().optional(),
  duration: Joi.number().integer().min(1).optional()
});

const generateActivitySchema = Joi.object({
  planId: Joi.string().required(),
  subject: Joi.string().required(),
  title: Joi.string().required(),
  difficulty: Joi.number().integer().min(1).max(5).required(),
  childAge: Joi.number().integer().min(5).max(18).required(),
  learningStyle: Joi.string().required(),
  objectives: Joi.array().required(),
  previousActivities: Joi.array().optional()
});

/**
 * Route for requesting help from Claude AI
 * POST /api/claude/help
 * Requires child authentication
 */
router.post(
  '/help',
  authenticateToken,
  requireChild,
  suspiciousActivityDetection,
  (req, res, next) => validateRequest(helpRequestSchema)(req, res, next),
  async (req, res) => {
    try {
      const { question, activityId, childAge, activityContext } = req.body;
      const childId = req.user?.userId;

      if (!childId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Log the help request attempt
      logSecurityEvent('child_help_request', {
        childId,
        activityId,
        requestId: req.id,
        question: question.substring(0, 100) // Truncate for logging
      });

      const helpRequest = await claudeService.requestHelp({
        question,
        activityId,
        childId,
        childAge,
        activityContext
      });

      res.status(200).json({
        success: true,
        helpRequest
      });
    } catch (error: any) {
      logger.error('Error in Claude help request:', error);
      
      // Check for rate limiting errors
      if (error.message === 'Rate limit exceeded. Please try again later.') {
        return res.status(429).json({
          success: false,
          message: 'You\'ve asked too many questions too quickly. Please wait a moment before trying again.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to get help from Claude'
      });
    }
  }
);

/**
 * Route for parents to view their child's help requests
 * GET /api/claude/help-requests/:childId
 * Requires parent authentication
 */
router.get(
  '/help-requests/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const parentId = req.user?.userId;
      
      if (!parentId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify that the child belongs to the parent
      // This would typically be handled by a middleware or service
      // For now, we'll assume the authorization is handled elsewhere
      
      const helpRequests = await claudeService.getHelpRequestsByChild(childId);
      
      res.status(200).json({
        success: true,
        helpRequests
      });
    } catch (error) {
      logger.error('Error fetching help requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch help requests'
      });
    }
  }
);

/**
 * Route for parents to view help requests for a specific activity
 * GET /api/claude/activity-help-requests/:activityId
 * Requires parent authentication
 */
router.get(
  '/activity-help-requests/:activityId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.activityIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { activityId } = req.params;
      
      const helpRequests = await claudeService.getHelpRequestsByActivity(activityId);
      
      res.status(200).json({
        success: true,
        helpRequests
      });
    } catch (error) {
      logger.error('Error fetching help requests by activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch help requests'
      });
    }
  }
);

/**
 * Route for generating a study plan with Claude AI
 * POST /api/claude/generate-plan
 * Requires parent authentication
 */
router.post(
  '/generate-plan',
  authenticateToken,
  requireParent,
  suspiciousActivityDetection,
  (req, res, next) => validateRequest(generatePlanSchema)(req, res, next),
  async (req, res) => {
    try {
      const { subject, difficulty, childAge, learningStyle, objectives, duration } = req.body;
      const parentId = req.user?.userId;

      if (!parentId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Log the plan generation attempt
      logSecurityEvent('parent_plan_generation', {
        parentId,
        subject,
        childAge,
        requestId: req.id
      });

      const planResult = await claudeService.generateStudyPlan({
        subject,
        difficulty,
        childAge,
        learningStyle,
        objectives,
        duration
      });

      res.status(200).json({
        success: true,
        plan: planResult.content,
        usage: planResult.usage
      });
    } catch (error: any) {
      logger.error('Error generating study plan with Claude:', error);
      
      // Check for rate limiting errors
      if (error.message === 'Rate limit exceeded. Please try again later.') {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please try again in a few minutes.'
        });
      }
      
      // Check for content safety errors
      if (error.message.includes('flagged as inappropriate')) {
        return res.status(400).json({
          success: false,
          message: 'The generated content was flagged by our safety system. Please try again with different parameters.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate study plan'
      });
    }
  }
);

/**
 * Route for generating a study activity with Claude AI
 * POST /api/claude/generate-activity
 * Requires parent authentication
 */
router.post(
  '/generate-activity',
  authenticateToken,
  requireParent,
  suspiciousActivityDetection,
  (req, res, next) => validateRequest(generateActivitySchema)(req, res, next),
  async (req, res) => {
    try {
      const { 
        planId, 
        subject, 
        title, 
        difficulty, 
        childAge, 
        learningStyle, 
        objectives,
        previousActivities 
      } = req.body;
      
      const parentId = req.user?.userId;

      if (!parentId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Log the activity generation attempt
      logSecurityEvent('parent_activity_generation', {
        parentId,
        planId,
        subject,
        title,
        childAge,
        requestId: req.id
      });

      const activityResult = await claudeService.generateActivity({
        planId,
        subject,
        title,
        difficulty,
        childAge,
        learningStyle,
        objectives,
        previousActivities
      });

      res.status(200).json({
        success: true,
        activity: activityResult.content,
        usage: activityResult.usage
      });
    } catch (error: any) {
      logger.error('Error generating activity with Claude:', error);
      
      // Check for rate limiting errors
      if (error.message === 'Rate limit exceeded. Please try again later.') {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please try again in a few minutes.'
        });
      }
      
      // Check for content safety errors
      if (error.message.includes('flagged as inappropriate')) {
        return res.status(400).json({
          success: false,
          message: 'The generated content was flagged by our safety system. Please try again with different parameters.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate activity'
      });
    }
  }
);

export default router;