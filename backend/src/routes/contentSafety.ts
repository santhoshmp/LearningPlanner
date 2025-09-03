import express from 'express';
import { authenticateToken, requireParent } from '../middleware/auth';
import contentSafetyService from '../services/contentSafetyService';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Define schemas for validation
const contentSafetyCheckSchema = Joi.object({
  content: Joi.string().required(),
  childAge: Joi.number().integer().min(4).max(18).required()
});

const dateRangeQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

/**
 * @route POST /api/content-safety/check
 * @desc Check content for safety and age-appropriateness
 * @access Private (Parents only)
 */
router.post(
  '/check', 
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(contentSafetyCheckSchema)(req, res, next),
  async (req, res) => {
    try {
      const { content, childAge } = req.body;
      
      const safetyCheck = await contentSafetyService.checkContentSafety(content, childAge);
      
      return res.json({
        success: true,
        data: safetyCheck
      });
    } catch (error) {
      logger.error('Error checking content safety:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check content safety' 
      });
    }
  }
);

/**
 * @route GET /api/content-safety/flagged
 * @desc Get flagged conversations for review
 * @access Private (Parents only)
 */
router.get(
  '/flagged', 
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(dateRangeQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const flaggedConversations = await contentSafetyService.getFlaggedConversations(startDate, endDate);
      
      return res.json({
        success: true,
        data: flaggedConversations
      });
    } catch (error) {
      logger.error('Error getting flagged conversations:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve flagged conversations' 
      });
    }
  }
);

export default router;