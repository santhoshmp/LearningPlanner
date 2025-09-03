import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { contentService } from '../services/contentService';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route POST /api/content
 * @desc Create new study content
 * @access Private (Parent/Admin)
 */
router.post('/',
  authenticateToken,
  [
    body('activityId').isString().notEmpty().withMessage('Activity ID is required'),
    body('contentType').isIn(['video', 'article', 'interactive']).withMessage('Invalid content type'),
    body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
    body('contentUrl').optional().isURL().withMessage('Invalid content URL'),
    body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer'),
    body('difficultyLevel').optional().isInt({ min: 1, max: 10 }).withMessage('Difficulty level must be 1-10'),
    body('ageAppropriateMin').optional().isInt({ min: 3, max: 18 }).withMessage('Min age must be 3-18'),
    body('ageAppropriateMax').optional().isInt({ min: 3, max: 18 }).withMessage('Max age must be 3-18'),
    body('sourceAttribution').optional().isString().isLength({ max: 500 }).withMessage('Source attribution must be max 500 characters')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check if user has permission to create content for this activity
      // This would typically involve checking if the activity belongs to the user's child
      
      const content = await contentService.createContent(req.body);

      logger.info('Content created via API', {
        contentId: content.id,
        userId: req.user?.userId,
        activityId: req.body.activityId
      });

      res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: content
      });
    } catch (error) {
      logger.error('Error creating content via API', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.userId,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create content'
      });
    }
  }
);

/**
 * @route GET /api/content/:id
 * @desc Get content by ID
 * @access Private
 */
router.get('/:id',
  authenticateToken,
  [
    param('id').isString().notEmpty().withMessage('Content ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const content = await contentService.getContentById(req.params.id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error fetching content by ID via API', {
        error: error instanceof Error ? error.message : String(error),
        contentId: req.params.id,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch content'
      });
    }
  }
);

/**
 * @route GET /api/content
 * @desc Get content with filters and pagination
 * @access Private
 */
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('contentType').optional().isIn(['video', 'article', 'interactive']).withMessage('Invalid content type'),
    query('safetyRating').optional().isIn(['safe', 'review_needed', 'blocked']).withMessage('Invalid safety rating'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 10 }).withMessage('Difficulty level must be 1-10'),
    query('ageMin').optional().isInt({ min: 3, max: 18 }).withMessage('Min age must be 3-18'),
    query('ageMax').optional().isInt({ min: 3, max: 18 }).withMessage('Max age must be 3-18'),
    query('activityId').optional().isString().withMessage('Activity ID must be string')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.contentType) filters.contentType = req.query.contentType;
      if (req.query.safetyRating) filters.safetyRating = req.query.safetyRating;
      if (req.query.difficultyLevel) filters.difficultyLevel = parseInt(req.query.difficultyLevel as string);
      if (req.query.activityId) filters.activityId = req.query.activityId;
      
      if (req.query.ageMin || req.query.ageMax) {
        filters.ageRange = {
          min: parseInt(req.query.ageMin as string) || 3,
          max: parseInt(req.query.ageMax as string) || 18
        };
      }

      const result = await contentService.getContent(filters, page, limit);

      res.json({
        success: true,
        data: result.content,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      logger.error('Error fetching content via API', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.userId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch content'
      });
    }
  }
);

/**
 * @route PUT /api/content/:id
 * @desc Update content
 * @access Private (Parent/Admin)
 */
router.put('/:id',
  authenticateToken,
  [
    param('id').isString().notEmpty().withMessage('Content ID is required'),
    body('title').optional().isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
    body('contentUrl').optional().isURL().withMessage('Invalid content URL'),
    body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer'),
    body('difficultyLevel').optional().isInt({ min: 1, max: 10 }).withMessage('Difficulty level must be 1-10'),
    body('ageAppropriateMin').optional().isInt({ min: 3, max: 18 }).withMessage('Min age must be 3-18'),
    body('ageAppropriateMax').optional().isInt({ min: 3, max: 18 }).withMessage('Max age must be 3-18'),
    body('safetyRating').optional().isIn(['safe', 'review_needed', 'blocked']).withMessage('Invalid safety rating'),
    body('sourceAttribution').optional().isString().isLength({ max: 500 }).withMessage('Source attribution must be max 500 characters')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const content = await contentService.updateContent(req.params.id, req.body);

      logger.info('Content updated via API', {
        contentId: req.params.id,
        userId: req.user?.userId,
        updatedFields: Object.keys(req.body)
      });

      res.json({
        success: true,
        message: 'Content updated successfully',
        data: content
      });
    } catch (error) {
      logger.error('Error updating content via API', {
        error: error instanceof Error ? error.message : String(error),
        contentId: req.params.id,
        userId: req.user?.userId,
        body: req.body
      });

      if (error instanceof Error && error.message === 'Content not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update content'
      });
    }
  }
);

/**
 * @route DELETE /api/content/:id
 * @desc Delete content
 * @access Private (Parent/Admin)
 */
router.delete('/:id',
  authenticateToken,
  [
    param('id').isString().notEmpty().withMessage('Content ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      await contentService.deleteContent(req.params.id);

      logger.info('Content deleted via API', {
        contentId: req.params.id,
        userId: req.user?.userId
      });

      res.json({
        success: true,
        message: 'Content deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting content via API', {
        error: error instanceof Error ? error.message : String(error),
        contentId: req.params.id,
        userId: req.user?.userId
      });

      if (error instanceof Error && error.message === 'Content not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete content'
      });
    }
  }
);

/**
 * @route POST /api/content/:id/interact
 * @desc Track content interaction
 * @access Private
 */
router.post('/:id/interact',
  authenticateToken,
  [
    param('id').isString().notEmpty().withMessage('Content ID is required'),
    body('childId').isString().notEmpty().withMessage('Child ID is required'),
    body('interactionType').isIn(['view', 'complete', 'like', 'bookmark']).withMessage('Invalid interaction type'),
    body('progressPercentage').optional().isInt({ min: 0, max: 100 }).withMessage('Progress percentage must be 0-100'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const interactionData = {
        childId: req.body.childId,
        contentId: req.params.id,
        interactionType: req.body.interactionType,
        progressPercentage: req.body.progressPercentage,
        timeSpent: req.body.timeSpent
      };

      const interaction = await contentService.trackInteraction(interactionData);

      res.json({
        success: true,
        message: 'Interaction tracked successfully',
        data: interaction
      });
    } catch (error) {
      logger.error('Error tracking content interaction via API', {
        error: error instanceof Error ? error.message : String(error),
        contentId: req.params.id,
        userId: req.user?.userId,
        body: req.body
      });

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to track interaction'
      });
    }
  }
);

/**
 * @route GET /api/content/child/:childId/interactions
 * @desc Get content interactions for a child
 * @access Private
 */
router.get('/child/:childId/interactions',
  authenticateToken,
  [
    param('childId').isString().notEmpty().withMessage('Child ID is required'),
    query('contentType').optional().isIn(['video', 'article', 'interactive']).withMessage('Invalid content type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const contentType = req.query.contentType as string;

      const interactions = await contentService.getChildInteractions(
        req.params.childId,
        contentType,
        limit
      );

      res.json({
        success: true,
        data: interactions
      });
    } catch (error) {
      logger.error('Error fetching child interactions via API', {
        error: error instanceof Error ? error.message : String(error),
        childId: req.params.childId,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch interactions'
      });
    }
  }
);

/**
 * @route GET /api/content/analytics
 * @desc Get content analytics
 * @access Private (Parent/Admin)
 */
router.get('/analytics/overview',
  authenticateToken,
  [
    query('activityId').optional().isString().withMessage('Activity ID must be string'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const activityId = req.query.activityId as string;
      let dateRange;

      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      const analytics = await contentService.getContentAnalytics(activityId, dateRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching content analytics via API', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.userId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  }
);

/**
 * @route GET /api/content/child/:childId/recommendations
 * @desc Get content recommendations for a child
 * @access Private
 */
router.get('/child/:childId/recommendations',
  authenticateToken,
  [
    param('childId').isString().notEmpty().withMessage('Child ID is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const recommendations = await contentService.getContentRecommendations(
        req.params.childId,
        limit
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Error fetching content recommendations via API', {
        error: error instanceof Error ? error.message : String(error),
        childId: req.params.childId,
        userId: req.user?.userId
      });

      if (error instanceof Error && error.message === 'Child profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendations'
      });
    }
  }
);

/**
 * @route PUT /api/content/bulk/safety-rating
 * @desc Bulk update content safety ratings
 * @access Private (Admin only)
 */
router.put('/bulk/safety-rating',
  authenticateToken,
  [
    body('contentIds').isArray({ min: 1 }).withMessage('Content IDs array is required'),
    body('contentIds.*').isString().notEmpty().withMessage('Each content ID must be a non-empty string'),
    body('safetyRating').isIn(['safe', 'review_needed', 'blocked']).withMessage('Invalid safety rating')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      // TODO: Add admin role check
      // if (req.user?.role !== 'ADMIN') {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Admin access required'
      //   });
      // }

      const updatedCount = await contentService.bulkUpdateSafetyRatings(
        req.body.contentIds,
        req.body.safetyRating
      );

      logger.info('Bulk safety rating update via API', {
        updatedCount,
        safetyRating: req.body.safetyRating,
        userId: req.user?.userId
      });

      res.json({
        success: true,
        message: `Updated ${updatedCount} content items`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating safety ratings via API', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.userId,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update safety ratings'
      });
    }
  }
);

export default router;