import express from 'express';
import { body, param } from 'express-validator';
import planAdaptationService from '../services/planAdaptationService';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireParent } from '../middleware/auth';
import logger from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Define schemas for validation
const adaptPlanSchema = Joi.object({
  childId: Joi.string().required()
});

const planIdParamSchema = Joi.object({
  planId: Joi.string().required()
});

const childIdParamSchema = Joi.object({
  childId: Joi.string().required()
});

/**
 * Adapt plan based on performance
 * POST /api/plan-adaptation/adapt/:planId
 */
router.post(
  '/adapt/:planId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(planIdParamSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(adaptPlanSchema)(req, res, next),
  async (req, res) => {
    try {
      const { planId } = req.params;
      const { childId } = req.body;
      
      const result = await planAdaptationService.adaptPlanBasedOnPerformance(childId, planId);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error adapting plan:', error);
      res.status(500).json({ error: 'Failed to adapt plan' });
    }
  }
);

/**
 * Check all plans for adaptation
 * POST /api/plan-adaptation/check-all
 * Admin only endpoint
 */
router.post(
  '/check-all',
  authenticateToken,
  requireParent, // In a real app, this would be restricted to admin users
  async (req, res) => {
    try {
      const result = await planAdaptationService.checkAllPlansForAdaptation();
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error checking plans for adaptation:', error);
      res.status(500).json({ error: 'Failed to check plans for adaptation' });
    }
  }
);

/**
 * Get content recommendations for a child
 * GET /api/plan-adaptation/recommendations/:childId
 */
router.get(
  '/recommendations/:childId',
  authenticateToken,
  (req, res, next) => validateRequest(childIdParamSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Authorization check - parents can view any child's data, children can only view their own
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'PARENT') {
        // In a real app, verify this child belongs to the parent
      } else if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const recommendations = await planAdaptationService.createContentRecommendations(childId);
      
      res.status(200).json(recommendations);
    } catch (error) {
      logger.error('Error creating content recommendations:', error);
      res.status(500).json({ error: 'Failed to create content recommendations' });
    }
  }
);

export default router;