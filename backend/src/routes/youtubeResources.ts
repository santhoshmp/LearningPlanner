import express from 'express';
import { PrismaClient } from '@prisma/client';
import { YouTubeResourceService } from '../services/youtubeResourceService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();
const youtubeService = new YouTubeResourceService(prisma);

// Validation schemas
const createYouTubeResourceSchema = z.object({
  topicId: z.string().cuid(),
  videoId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  channelName: z.string().min(1).max(100),
  duration: z.number().positive(),
  thumbnailUrl: z.string().url(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY']).optional(),
  ageAppropriate: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const getVideosByTopicSchema = z.object({
  topicId: z.string().cuid(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY']).optional(),
  maxDuration: z.number().positive().optional(),
  safetyRating: z.enum(['SAFE', 'REVIEW_NEEDED', 'RESTRICTED', 'BLOCKED']).optional(),
  limit: z.number().positive().max(50).optional()
});

const discoverVideosSchema = z.object({
  topicId: z.string().cuid(),
  gradeLevel: z.string().min(1),
  subjectName: z.string().min(1)
});

const getRecommendationsSchema = z.object({
  topicId: z.string().cuid(),
  childAge: z.number().min(3).max(18),
  learningStyle: z.string().optional()
});

/**
 * POST /api/youtube-resources
 * Create a new YouTube video resource
 */
router.post('/', 
  authenticateToken,
  validateRequest(createYouTubeResourceSchema),
  async (req, res) => {
    try {
      const { 
        topicId, 
        videoId, 
        title, 
        description, 
        channelName, 
        duration, 
        thumbnailUrl,
        difficulty,
        ageAppropriate,
        tags 
      } = req.body;

      const videoData = {
        videoId,
        title,
        description,
        channelName,
        publishedAt: new Date().toISOString(),
        duration,
        thumbnailUrl,
        tags: tags || [],
        categoryId: '27', // Education category
        closedCaptions: false // Would be determined by API call
      };

      const resource = await youtubeService.createYouTubeResource(
        topicId,
        videoData,
        difficulty,
        ageAppropriate
      );

      res.status(201).json({
        success: true,
        data: resource,
        message: 'YouTube resource created successfully'
      });
    } catch (error) {
      console.error('Error creating YouTube resource:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create YouTube resource',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/youtube-resources/topic/:topicId
 * Get YouTube videos for a specific topic
 */
router.get('/topic/:topicId',
  authenticateToken,
  async (req, res) => {
    try {
      const { topicId } = req.params;
      const { difficulty, maxDuration, safetyRating, limit } = req.query;

      const filters: any = {};
      if (difficulty) filters.difficulty = difficulty;
      if (maxDuration) filters.maxDuration = parseInt(maxDuration as string);
      if (safetyRating) filters.safetyRating = safetyRating;
      if (limit) filters.limit = parseInt(limit as string);

      const videos = await youtubeService.getYouTubeVideosByTopic(topicId, filters);

      res.json({
        success: true,
        data: videos,
        count: videos.length
      });
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch YouTube videos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/youtube-resources/discover
 * Discover new YouTube videos for a topic
 */
router.post('/discover',
  authenticateToken,
  validateRequest(discoverVideosSchema),
  async (req, res) => {
    try {
      const { topicId, gradeLevel, subjectName } = req.body;

      const recommendations = await youtubeService.discoverVideosForTopic(
        topicId,
        gradeLevel,
        subjectName
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: `Found ${recommendations.length} video recommendations`
      });
    } catch (error) {
      console.error('Error discovering YouTube videos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to discover YouTube videos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/youtube-resources/recommendations
 * Get personalized video recommendations
 */
router.post('/recommendations',
  authenticateToken,
  validateRequest(getRecommendationsSchema),
  async (req, res) => {
    try {
      const { topicId, childAge, learningStyle } = req.body;

      const recommendations = await youtubeService.getVideoRecommendations(
        topicId,
        childAge,
        learningStyle
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: 'Personalized video recommendations generated'
      });
    } catch (error) {
      console.error('Error getting video recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get video recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/youtube-resources/:resourceId/validate
 * Validate a specific YouTube resource
 */
router.post('/:resourceId/validate',
  authenticateToken,
  async (req, res) => {
    try {
      const { resourceId } = req.params;

      const validation = await youtubeService.validateYouTubeResource(resourceId);

      res.json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Resource is valid' : 'Resource validation failed'
      });
    } catch (error) {
      console.error('Error validating YouTube resource:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate YouTube resource',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/youtube-resources/validate-all
 * Bulk validate all YouTube resources
 */
router.post('/validate-all',
  authenticateToken,
  async (req, res) => {
    try {
      const results = await youtubeService.validateAllYouTubeResources();

      res.json({
        success: true,
        data: results,
        message: `Validated ${results.total} resources: ${results.validated} valid, ${results.broken} broken`
      });
    } catch (error) {
      console.error('Error bulk validating YouTube resources:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate YouTube resources',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/youtube-resources/stats
 * Get YouTube resource statistics
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await prisma.topicResource.groupBy({
        by: ['safetyRating', 'validationStatus'],
        where: {
          type: 'VIDEO',
          url: {
            contains: 'youtube.com'
          }
        },
        _count: {
          id: true
        }
      });

      const totalVideos = await prisma.topicResource.count({
        where: {
          type: 'VIDEO',
          url: {
            contains: 'youtube.com'
          }
        }
      });

      const activeVideos = await prisma.topicResource.count({
        where: {
          type: 'VIDEO',
          url: {
            contains: 'youtube.com'
          },
          isActive: true
        }
      });

      const safeVideos = await prisma.topicResource.count({
        where: {
          type: 'VIDEO',
          url: {
            contains: 'youtube.com'
          },
          safetyRating: 'SAFE'
        }
      });

      res.json({
        success: true,
        data: {
          total: totalVideos,
          active: activeVideos,
          safe: safeVideos,
          breakdown: stats,
          safetyPercentage: totalVideos > 0 ? Math.round((safeVideos / totalVideos) * 100) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching YouTube resource stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch YouTube resource statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;