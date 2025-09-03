import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { geminiService } from '../services/geminiService';
import { contentSafetyService } from '../services/contentSafetyService';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const generateStudyPlanSchema = Joi.object({
  childId: Joi.string().required(),
  subject: Joi.string().min(1).max(100).required(),
  gradeLevel: Joi.string().min(1).max(20).required(),
  duration: Joi.number().min(5).max(180).required(), // 5 minutes to 3 hours
  objectives: Joi.array().items(Joi.string()).min(1).max(10).required(),
  learningStyle: Joi.object({
    visual: Joi.number().min(0).max(1).required(),
    auditory: Joi.number().min(0).max(1).required(),
    kinesthetic: Joi.number().min(0).max(1).required(),
    readingWriting: Joi.number().min(0).max(1).required()
  }).required(),
  contentPreferences: Joi.object({
    preferredMediaTypes: Joi.array().items(Joi.string().valid('video', 'article', 'interactive')).optional(),
    avoidTopics: Joi.array().items(Joi.string()).optional(),
    favoriteTopics: Joi.array().items(Joi.string()).optional(),
    maxSessionDuration: Joi.number().optional()
  }).optional()
});

const contentRecommendationSchema = Joi.object({
  childId: Joi.string().required(),
  subject: Joi.string().min(1).max(100).required(),
  topic: Joi.string().min(1).max(200).required(),
  contentTypes: Joi.array().items(Joi.string().valid('video', 'article', 'interactive')).optional()
});

const approveContentSchema = Joi.object({
  approvalRequestId: Joi.string().required(),
  approved: Joi.boolean().required(),
  parentNotes: Joi.string().optional()
});

const trackContentInteractionSchema = Joi.object({
  contentId: Joi.string().required(),
  interactionType: Joi.string().valid('view', 'complete', 'like', 'bookmark').required(),
  progressPercentage: Joi.number().min(0).max(100).optional(),
  timeSpent: Joi.number().min(0).optional() // seconds
});

/**
 * POST /api/gemini/generate-study-plan
 * Generate AI-powered study plan using Gemini Pro
 */
router.post('/generate-study-plan', 
  authenticateToken,
  validateRequest(generateStudyPlanSchema),
  async (req, res) => {
    try {
      const { childId, subject, gradeLevel, duration, objectives, learningStyle, contentPreferences } = req.body;
      const userId = req.user?.userId;

      // Verify child belongs to authenticated user
      const child = await prisma.childProfile.findFirst({
        where: {
          id: childId,
          parentId: userId
        },
        include: {
          settings: true
        }
      });

      if (!child) {
        return res.status(404).json({
          error: 'Child profile not found or access denied'
        });
      }

      // Get child's previous performance data
      const recentProgress = await prisma.progressRecord.findMany({
        where: {
          childId: childId
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10
      });

      // Build performance data
      const previousPerformance = recentProgress.length > 0 ? {
        averageScore: recentProgress.reduce((sum, record) => sum + (record.score || 0), 0) / recentProgress.length,
        completionRate: (recentProgress.filter(r => r.status === 'COMPLETED').length / recentProgress.length) * 100,
        timeSpentMinutes: recentProgress.reduce((sum, record) => sum + record.timeSpent, 0),
        strugglingAreas: recentProgress
          .filter(r => (r.score || 0) < 70)
          .map(r => r.activity.plan.subject)
          .filter((subject, index, arr) => arr.indexOf(subject) === index),
        strongAreas: recentProgress
          .filter(r => (r.score || 0) >= 85)
          .map(r => r.activity.plan.subject)
          .filter((subject, index, arr) => arr.indexOf(subject) === index),
        recentActivities: recentProgress.map(r => ({
          subject: r.activity.plan.subject,
          topic: r.activity.title,
          score: r.score || 0,
          timeSpent: r.timeSpent,
          difficulty: r.activity.difficulty,
          completedAt: r.updatedAt
        }))
      } : undefined;

      // Generate study plan with Gemini
      const studyPlanRequest = {
        childAge: child.age,
        gradeLevel,
        subject,
        learningStyle,
        duration,
        objectives,
        previousPerformance,
        contentPreferences
      };

      const geminiResponse = await geminiService.generateStudyPlan(studyPlanRequest);

      // Create study plan in database
      const studyPlan = await prisma.studyPlan.create({
        data: {
          childId,
          subject,
          difficulty: 'MEDIUM', // Default, could be determined from Gemini response
          objectives: objectives,
          status: 'DRAFT',
          estimatedDuration: geminiResponse.estimatedDuration
        }
      });

      // Create activities and content
      const activities: any[] = [];
      for (let i = 0; i < geminiResponse.activities.length; i++) {
        const geminiActivity = geminiResponse.activities[i];
        
        const activity = await prisma.studyActivity.create({
          data: {
            planId: studyPlan.id,
            title: geminiActivity.title,
            description: geminiActivity.description,
            content: {
              type: geminiActivity.type,
              instructions: geminiActivity.instructions,
              materials: geminiActivity.materials || [],
              assessmentCriteria: geminiActivity.assessmentCriteria || []
            },
            estimatedDuration: geminiActivity.duration,
            difficulty: geminiActivity.difficulty,
            prerequisites: geminiActivity.objectives,
            orderIndex: i
          }
        });

        activities.push(activity);
      }

      // Process content recommendations and check safety
      const contentRecommendations: any[] = [];
      for (const recommendation of geminiResponse.contentRecommendations) {
        // Validate content safety
        const safetyResult = await contentSafetyService.checkContentSafety(
          recommendation.description,
          child.age
        );

        // Create content entry
        const content = await prisma.studyContent.create({
          data: {
            activityId: activities[0]?.id || '', // Associate with first activity for now
            contentType: recommendation.type,
            title: recommendation.title,
            description: recommendation.description,
            contentUrl: recommendation.url,
            duration: recommendation.duration * 60, // Convert to seconds
            difficultyLevel: recommendation.difficulty,
            ageAppropriateMin: Math.max(1, child.age - 2),
            ageAppropriateMax: Math.min(18, child.age + 2),
            safetyRating: safetyResult.isAppropriate ? 'safe' : 'review_needed',
            sourceAttribution: recommendation.source
          }
        });

        contentRecommendations.push({
          ...recommendation,
          id: content.id,
          safetyResult
        });

        // Create parental approval request if needed
        if (!safetyResult.isAppropriate || !safetyResult.ageAppropriate) {
          await prisma.parentalApprovalRequest.create({
            data: {
              childId,
              studyPlanId: studyPlan.id,
              contentType: 'CONTENT_RECOMMENDATION',
              contentData: JSON.stringify(recommendation),
              safetyResults: JSON.stringify(safetyResult),
              status: 'PENDING'
            }
          });
        }
      }

      // Log AI usage
      await prisma.aiUsage.create({
        data: {
          requestType: 'gemini_study_plan_generation',
          inputTokens: 0, // Gemini doesn't provide token counts
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0.01, // Rough estimate
          userId: userId || '',
          childId,
          success: true
        }
      });

      logger.info('AI study plan generated successfully', {
        userId,
        childId,
        studyPlanId: studyPlan.id,
        subject,
        activitiesCount: activities.length,
        contentRecommendationsCount: contentRecommendations.length
      });

      res.json({
        studyPlan: {
          id: studyPlan.id,
          ...geminiResponse,
          activities: activities.map(activity => ({
            id: activity.id,
            ...geminiResponse.activities.find(ga => ga.title === activity.title)
          }))
        },
        contentRecommendations,
        requiresParentalApproval: contentRecommendations.some(c => !c.safetyResult.isAppropriate || !c.safetyResult.ageAppropriate)
      });

    } catch (error) {
      logger.error('Error generating AI study plan', {
        error: (error as Error).message,
        userId: req.user?.userId,
        childId: req.body.childId
      });

      // Log failed AI usage
      await prisma.aiUsage.create({
        data: {
          requestType: 'gemini_study_plan_generation',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
          userId: req.user?.userId || '',
          childId: req.body.childId,
          success: false
        }
      }).catch(() => {}); // Ignore logging errors

      res.status(500).json({
        error: 'Failed to generate study plan',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/gemini/content-recommendations
 * Generate content recommendations for a specific topic
 */
router.post('/content-recommendations',
  authenticateToken,
  validateRequest(contentRecommendationSchema),
  async (req, res) => {
    try {
      const { childId, subject, topic, contentTypes } = req.body;
      const userId = req.user?.userId;

      // Verify child belongs to authenticated user
      const child = await prisma.childProfile.findFirst({
        where: {
          id: childId,
          parentId: userId
        }
      });

      if (!child) {
        return res.status(404).json({
          error: 'Child profile not found or access denied'
        });
      }

      // Generate content recommendations
      const recommendations = await geminiService.generateContentRecommendations(
        subject,
        topic,
        child.age,
        contentTypes || ['video', 'article']
      );

      // Validate each recommendation for safety
      const validatedRecommendations: any[] = [];
      for (const recommendation of recommendations) {
        const safetyResult = await contentSafetyService.checkContentSafety(
          recommendation.description,
          child.age
        );

        validatedRecommendations.push({
          ...recommendation,
          safetyResult
        });
      }

      // Log AI usage
      await prisma.aiUsage.create({
        data: {
          requestType: 'gemini_content_recommendations',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0.005,
          userId: userId || '',
          childId,
          success: true
        }
      });

      logger.info('Content recommendations generated', {
        userId,
        childId,
        subject,
        topic,
        recommendationsCount: validatedRecommendations.length
      });

      res.json({
        recommendations: validatedRecommendations,
        subject,
        topic,
        childAge: child.age
      });

    } catch (error) {
      logger.error('Error generating content recommendations', {
        error: (error as Error).message,
        userId: req.user?.userId,
        childId: req.body.childId
      });

      res.status(500).json({
        error: 'Failed to generate content recommendations',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/gemini/parental-approval-requests
 * Get pending parental approval requests
 */
router.get('/parental-approval-requests',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { status = 'PENDING' } = req.query;

      const approvalRequests = await prisma.parentalApprovalRequest.findMany({
        where: {
          child: {
            parentId: userId
          },
          status: status as any
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              age: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      const formattedRequests = approvalRequests.map(request => ({
        id: request.id,
        child: request.child,
        contentType: request.contentType,
        contentData: JSON.parse(request.contentData),
        safetyResults: JSON.parse(request.safetyResults),
        requestedAt: request.requestedAt,
        status: request.status,
        parentNotes: request.parentNotes
      }));

      res.json({
        approvalRequests: formattedRequests,
        total: formattedRequests.length
      });

    } catch (error) {
      logger.error('Error fetching parental approval requests', {
        error: (error as Error).message,
        userId: req.user?.userId
      });

      res.status(500).json({
        error: 'Failed to fetch approval requests'
      });
    }
  }
);

/**
 * POST /api/gemini/approve-content
 * Approve or reject content for a child
 */
router.post('/approve-content',
  authenticateToken,
  validateRequest(approveContentSchema),
  async (req, res) => {
    try {
      const { approvalRequestId, approved, parentNotes } = req.body;
      const userId = req.user?.userId;

      // Find and verify approval request
      const approvalRequest = await prisma.parentalApprovalRequest.findFirst({
        where: {
          id: approvalRequestId,
          child: {
            parentId: userId
          },
          status: 'PENDING'
        },
        include: {
          child: true
        }
      });

      if (!approvalRequest) {
        return res.status(404).json({
          error: 'Approval request not found or already processed'
        });
      }

      // Update approval request
      const updatedRequest = await prisma.parentalApprovalRequest.update({
        where: {
          id: approvalRequestId
        },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          processedAt: new Date(),
          parentNotes
        }
      });

      // If approved, update content safety rating
      if (approved && approvalRequest.contentType === 'CONTENT_RECOMMENDATION') {
        const contentData = JSON.parse(approvalRequest.contentData);
        
        // Find and update related study content
        await prisma.studyContent.updateMany({
          where: {
            title: contentData.title,
            description: contentData.description
          },
          data: {
            safetyRating: 'safe'
          }
        });
      }

      logger.info('Content approval processed', {
        userId,
        approvalRequestId,
        approved,
        childId: approvalRequest.childId
      });

      res.json({
        success: true,
        approvalRequest: {
          id: updatedRequest.id,
          status: updatedRequest.status,
          processedAt: updatedRequest.processedAt,
          parentNotes: updatedRequest.parentNotes
        }
      });

    } catch (error) {
      logger.error('Error processing content approval', {
        error: (error as Error).message,
        userId: req.user?.userId,
        approvalRequestId: req.body.approvalRequestId
      });

      res.status(500).json({
        error: 'Failed to process content approval'
      });
    }
  }
);

/**
 * POST /api/gemini/track-interaction
 * Track child's interaction with AI-generated content
 */
router.post('/track-interaction',
  authenticateToken,
  validateRequest(trackContentInteractionSchema),
  async (req, res) => {
    try {
      const { contentId, interactionType, progressPercentage = 0, timeSpent = 0 } = req.body;
      const childId = req.user?.userId; // Assuming this is a child user

      // Verify content exists
      const content = await prisma.studyContent.findUnique({
        where: {
          id: contentId
        }
      });

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Create or update content interaction
      const interaction = await prisma.contentInteraction.upsert({
        where: {
          childId_contentId_interactionType: {
            childId: childId || '',
            contentId,
            interactionType
          }
        },
        update: {
          progressPercentage,
          timeSpent
        },
        create: {
          childId: childId || '',
          contentId,
          interactionType,
          progressPercentage,
          timeSpent
        }
      });

      logger.info('Content interaction tracked', {
        childId,
        contentId,
        interactionType,
        progressPercentage,
        timeSpent
      });

      res.json({
        success: true,
        interaction: {
          id: interaction.id,
          interactionType: interaction.interactionType,
          progressPercentage: interaction.progressPercentage,
          timeSpent: interaction.timeSpent,
          createdAt: interaction.createdAt
        }
      });

    } catch (error) {
      logger.error('Error tracking content interaction', {
        error: (error as Error).message,
        childId: req.user?.userId,
        contentId: req.body.contentId
      });

      res.status(500).json({
        error: 'Failed to track content interaction'
      });
    }
  }
);

/**
 * GET /api/gemini/analytics/:childId
 * Get AI-generated content analytics for a child
 */
router.get('/analytics/:childId',
  authenticateToken,
  async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = req.user?.userId;
      const { timeframe = '30d' } = req.query;

      // Verify child belongs to authenticated user
      const child = await prisma.childProfile.findFirst({
        where: {
          id: childId,
          parentId: userId
        }
      });

      if (!child) {
        return res.status(404).json({
          error: 'Child profile not found or access denied'
        });
      }

      // Calculate date range
      const now = new Date();
      const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get content interactions
      const interactions = await prisma.contentInteraction.findMany({
        where: {
          childId,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          content: {
            include: {
              activity: {
                include: {
                  plan: true
                }
              }
            }
          }
        }
      });

      // Get AI usage statistics
      const aiUsage = await prisma.aiUsage.findMany({
        where: {
          childId,
          timestamp: {
            gte: startDate
          }
        }
      });

      // Calculate analytics
      const totalInteractions = interactions.length;
      const totalTimeSpent = interactions.reduce((sum, i) => sum + i.timeSpent, 0);
      const completedContent = interactions.filter(i => i.interactionType === 'complete').length;
      const averageProgress = interactions.length > 0 
        ? interactions.reduce((sum, i) => sum + i.progressPercentage, 0) / interactions.length 
        : 0;

      const contentTypeBreakdown = interactions.reduce((acc, interaction) => {
        const type = interaction.content.contentType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const subjectBreakdown = interactions.reduce((acc, interaction) => {
        const subject = interaction.content.activity.plan.subject;
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const aiGenerationStats = {
        totalRequests: aiUsage.length,
        successfulRequests: aiUsage.filter(u => u.success).length,
        totalCost: aiUsage.reduce((sum, u) => sum + Number(u.estimatedCost), 0)
      };

      res.json({
        analytics: {
          totalInteractions,
          totalTimeSpent,
          completedContent,
          averageProgress: Math.round(averageProgress),
          contentTypeBreakdown,
          subjectBreakdown,
          aiGenerationStats
        },
        timeframe,
        childId,
        generatedAt: new Date()
      });

    } catch (error) {
      logger.error('Error fetching AI content analytics', {
        error: (error as Error).message,
        userId: req.user?.userId,
        childId: req.params.childId
      });

      res.status(500).json({
        error: 'Failed to fetch analytics'
      });
    }
  }
);

/**
 * GET /api/gemini/health
 * Check Gemini service health
 */
router.get('/health',
  authenticateToken,
  async (req, res) => {
    try {
      const healthStatus = await geminiService.getHealthStatus();
      
      res.json({
        service: 'gemini',
        ...healthStatus,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error checking Gemini service health', {
        error: (error as Error).message
      });

      res.status(500).json({
        service: 'gemini',
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date()
      });
    }
  }
);

export default router;