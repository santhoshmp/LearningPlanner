/**
 * User Testing API Routes
 * Handles user acceptance testing feedback and analytics
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { userAcceptanceTestingService } from '../services/userAcceptanceTestingService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Submit user feedback from testing sessions
 */
router.post('/feedback', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userType').isIn(['parent', 'child']).withMessage('Invalid user type'),
  body('testingSession').notEmpty().withMessage('Testing session ID is required'),
  body('category').isIn(['usability', 'engagement', 'performance', 'badge_system', 'interface', 'safety'])
    .withMessage('Invalid feedback category'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').notEmpty().withMessage('Feedback text is required'),
  body('sessionDuration').isInt({ min: 0 }).withMessage('Session duration must be a positive integer'),
  body('completedTasks').isArray().withMessage('Completed tasks must be an array'),
  body('struggledTasks').isArray().withMessage('Struggled tasks must be an array'),
  body('suggestions').isArray().withMessage('Suggestions must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const feedbackData = {
      ...req.body,
      timestamp: new Date(),
    };

    const feedbackId = await userAcceptanceTestingService.storeFeedback(feedbackData);

    res.json({
      success: true,
      feedbackId,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
});

/**
 * Get usability metrics
 */
router.get('/metrics', [
  query('ageGroup').optional().isIn(['5-8', '9-12', '13-18']).withMessage('Invalid age group'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { ageGroup } = req.query;
    const metrics = await userAcceptanceTestingService.calculateUsabilityMetrics(ageGroup as string);

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    logger.error('Error fetching usability metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
    });
  }
});

/**
 * Get badge system effectiveness metrics
 */
router.get('/badge-metrics', async (req, res) => {
  try {
    const badgeMetrics = await userAcceptanceTestingService.analyzeBadgeSystem();

    res.json({
      success: true,
      ...badgeMetrics,
    });
  } catch (error) {
    logger.error('Error fetching badge metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badge metrics',
    });
  }
});

/**
 * Get performance optimization recommendations
 */
router.get('/performance-recommendations', async (req, res) => {
  try {
    const recommendations = await userAcceptanceTestingService.generatePerformanceRecommendations();

    res.json({
      success: true,
      ...recommendations,
    });
  } catch (error) {
    logger.error('Error fetching performance recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance recommendations',
    });
  }
});

/**
 * Submit A/B test results
 */
router.post('/ab-test', [
  body('testId').notEmpty().withMessage('Test ID is required'),
  body('variant').notEmpty().withMessage('Variant is required'),
  body('outcome').isIn(['success', 'failure']).withMessage('Invalid outcome'),
  body('metrics').isObject().withMessage('Metrics must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { testId, variant, outcome, metrics } = req.body;

    await userAcceptanceTestingService.storeABTestResult(testId, variant, outcome, metrics);

    res.json({
      success: true,
      message: 'A/B test result submitted successfully',
    });
  } catch (error) {
    logger.error('Error submitting A/B test result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit A/B test result',
    });
  }
});

/**
 * Get comprehensive system refinement recommendations
 */
router.get('/refinement-recommendations', async (req, res) => {
  try {
    const recommendations = await userAcceptanceTestingService.getSystemRefinementRecommendations();

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    logger.error('Error fetching refinement recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refinement recommendations',
    });
  }
});

/**
 * Get testing session analytics
 */
router.get('/session-analytics', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('userType').optional().isIn(['parent', 'child']).withMessage('Invalid user type'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // This would be implemented to provide session analytics
    const analytics = {
      totalSessions: 0,
      averageSessionDuration: 0,
      completionRates: {},
      userSatisfaction: 0,
      commonIssues: [],
      improvements: [],
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    logger.error('Error fetching session analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session analytics',
    });
  }
});

export default router;