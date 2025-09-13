import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { childProgressService } from '../services/childProgressService';
import { ChildBadgeService } from '../services/childBadgeService';
import { progressConsistencyService } from '../services/progressConsistencyService';
import { authService } from '../services/authService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { 
  dashboardLogging, 
  progressUpdateLogging, 
  monitorDatabaseOperation 
} from '../middleware/studyPlanLoggingMiddleware';
import Joi from 'joi';
import { securityMonitoring } from '../middleware/securityMonitoring';
import { 
  childErrorHandler, 
  asyncHandler, 
  sendChildError,
  childErrorHandlerMiddleware 
} from '../middleware/childErrorHandler';
import { 
  validateChild, 
  validateChildParams, 
  validateChildQuery,
  sanitizeChildInput,
  childRateLimit,
  childValidationSchemas 
} from '../utils/childValidation';

const router = express.Router();
const prisma = new PrismaClient();
const childBadgeService = new ChildBadgeService(prisma);

// Validation schemas using Joi to match existing pattern
const activityProgressSchema = Joi.object({
  activityId: Joi.string().required(), // Changed from uuid() to allow CUID format
  timeSpent: Joi.number().min(0).required(),
  score: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED').optional(),
  sessionData: Joi.object({
    startTime: Joi.string().isoDate().required(),
    endTime: Joi.string().isoDate().optional(),
    pausedDuration: Joi.number().min(0).default(0),
    focusEvents: Joi.array().items(Joi.object({
      type: Joi.string().valid('focus', 'blur').required(),
      timestamp: Joi.string().isoDate().required()
    })).default([]),
    difficultyAdjustments: Joi.array().items(Joi.object({
      fromDifficulty: Joi.number().required(),
      toDifficulty: Joi.number().required(),
      reason: Joi.string().required(),
      timestamp: Joi.string().isoDate().required()
    })).default([]),
    helpRequests: Joi.array().items(Joi.object({
      question: Joi.string().required(),
      timestamp: Joi.string().isoDate().required(),
      resolved: Joi.boolean().default(false),
      responseTime: Joi.number().optional()
    })).default([]),
    interactionEvents: Joi.array().items(Joi.object({
      type: Joi.string().valid('click', 'scroll', 'input', 'navigation').required(),
      element: Joi.string().optional(),
      timestamp: Joi.string().isoDate().required(),
      data: Joi.any().optional()
    })).default([])
  }).optional(),
  helpRequestsCount: Joi.number().min(0).optional(),
  pauseCount: Joi.number().min(0).optional(),
  resumeCount: Joi.number().min(0).optional()
});

const activityCompletionSchema = Joi.object({
  activityId: Joi.string().required(), // Changed from uuid() to allow CUID format
  score: Joi.number().min(0).max(100).required(),
  timeSpent: Joi.number().min(0).required(),
  sessionData: Joi.object({
    startTime: Joi.string().isoDate().required(),
    endTime: Joi.string().isoDate().required(),
    pausedDuration: Joi.number().min(0).default(0),
    focusEvents: Joi.array().items(Joi.object({
      type: Joi.string().valid('focus', 'blur').required(),
      timestamp: Joi.string().isoDate().required()
    })).default([]),
    difficultyAdjustments: Joi.array().items(Joi.object({
      fromDifficulty: Joi.number().required(),
      toDifficulty: Joi.number().required(),
      reason: Joi.string().required(),
      timestamp: Joi.string().isoDate().required()
    })).default([]),
    helpRequests: Joi.array().items(Joi.object({
      question: Joi.string().required(),
      timestamp: Joi.string().isoDate().required(),
      resolved: Joi.boolean().default(false),
      responseTime: Joi.number().optional()
    })).default([]),
    interactionEvents: Joi.array().items(Joi.object({
      type: Joi.string().valid('click', 'scroll', 'input', 'navigation').required(),
      element: Joi.string().optional(),
      timestamp: Joi.string().isoDate().required(),
      data: Joi.any().optional()
    })).default([])
  }).required()
});

const celebrationUpdateSchema = Joi.object({
  achievementId: Joi.string().uuid().required()
});

const activityUpdateSchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  page: Joi.string().required(),
  action: Joi.string().valid('page_view', 'user_activity', 'session_start', 'session_end').required(),
  data: Joi.any().optional()
});

const suspiciousActivitySchema = Joi.object({
  childId: Joi.string().uuid().required(),
  activityDetails: Joi.object().required(),
  timestamp: Joi.string().isoDate().required(),
  location: Joi.string().required()
});

// Enhanced middleware to ensure child authentication with child-friendly errors
const requireChildAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'CHILD') {
    return sendChildError(res, 'CHILD_AUTH_REQUIRED', 'Child authentication is required', {
      childId: req.user?.userId,
      url: req.originalUrl
    });
  }
  next();
};

// Middleware to verify child access to their own data
const verifyChildAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { childId } = req.params;
  
  if (!childId) {
    return sendChildError(res, 'VALIDATION_ERROR', 'Child ID is required', {
      url: req.originalUrl
    });
  }
  
  if (req.user!.userId !== childId) {
    return sendChildError(res, 'ACCESS_DENIED', 'Access denied to this child data', {
      childId: req.user?.userId,
      url: req.originalUrl
    });
  }
  
  next();
};

// ===== CHILD DASHBOARD API =====

/**
 * GET /api/child/:childId/dashboard
 * Get child dashboard data with complete progress summary
 */
router.get('/:childId/dashboard', 
  ...dashboardLogging('DASHBOARD_ACCESS'),
  authenticateToken, 
  requireChildAuth, 
  verifyChildAccess,
  sanitizeChildInput,
  childRateLimit(30, 60000), // 30 requests per minute
  validateChildParams({
    childId: childValidationSchemas.childId
  }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { childId } = req.params;

    // Get child profile data
    const childProfile = await monitorDatabaseOperation(
      'get_child_profile',
      'child_profiles',
      'SELECT',
      () => prisma.childProfile.findUnique({
        where: { id: childId },
        select: {
          id: true,
          name: true,
          age: true,
          gradeLevel: true,
          skillProfile: true
        }
      }),
      { childId }
    );

    if (!childProfile) {
      return sendChildError(res, 'CHILD_NOT_FOUND', 'Child profile not found', {
        childId,
        url: req.originalUrl
      });
    }

    // Get ALL study plans (not just ACTIVE) - as per requirements 1.2, 1.3
    const studyPlans = await monitorDatabaseOperation(
      'get_child_study_plans_with_progress',
      'study_plans',
      'SELECT',
      () => prisma.studyPlan.findMany({
        where: { childId },
        include: {
          activities: {
            include: {
              progressRecords: {
                where: { childId }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      { childId }
    );

    // Calculate detailed progress for each study plan
    const studyPlansWithProgress = studyPlans.map(plan => {
      const totalActivities = plan.activities.length;
      const completedActivities = plan.activities.filter(activity => 
        activity.progressRecords.some(record => record.status === 'COMPLETED')
      ).length;
      const inProgressActivities = plan.activities.filter(activity => 
        activity.progressRecords.some(record => record.status === 'IN_PROGRESS')
      ).length;
      
      // Calculate total time spent across all activities
      const totalTimeSpent = plan.activities.reduce((total, activity) => {
        const activityTimeSpent = activity.progressRecords.reduce((activityTotal, record) => {
          return activityTotal + (record.timeSpent || 0);
        }, 0);
        return total + activityTimeSpent;
      }, 0);

      // Calculate average score for completed activities
      const completedRecords = plan.activities.flatMap(activity => 
        activity.progressRecords.filter(record => record.status === 'COMPLETED')
      );
      const averageScore = completedRecords.length > 0 
        ? completedRecords.reduce((sum, record) => sum + (record.score || 0), 0) / completedRecords.length
        : 0;
      
      // Calculate progress percentage and round to 1 decimal place
      const progressPercentage = totalActivities > 0 
        ? Math.round((completedActivities / totalActivities) * 1000) / 10 
        : 0;
      
      return {
        ...plan,
        objectives: typeof plan.objectives === 'string' ? JSON.parse(plan.objectives) : plan.objectives,
        totalActivities,
        completedActivities,
        inProgressActivities,
        progressPercentage,
        totalTimeSpent, // in seconds
        averageScore: Math.round(averageScore * 10) / 10
      };
    });

    // Get basic progress data directly from database
    const allProgressRecords = await prisma.progressRecord.findMany({
      where: { childId },
      include: {
        activity: {
          include: {
            plan: {
              select: {
                subject: true
              }
            }
          }
        }
      }
    });

    // Calculate basic progress summary
    const totalActivities = allProgressRecords.length;
    const completedActivities = allProgressRecords.filter(r => r.status === 'COMPLETED').length;
    const inProgressActivities = allProgressRecords.filter(r => r.status === 'IN_PROGRESS').length;
    const totalTimeSpent = allProgressRecords.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const completedRecords = allProgressRecords.filter(r => r.status === 'COMPLETED');
    const averageScore = completedRecords.length > 0 
      ? completedRecords.reduce((sum, r) => sum + (r.score || 0), 0) / completedRecords.length 
      : 0;

    // Get current learning streaks
    const currentStreaks = await prisma.learningStreak.findMany({
      where: { childId }
    });
    
    // Get recent achievements
    const recentAchievements = await prisma.achievement.findMany({
      where: { childId },
      orderBy: { earnedAt: 'desc' },
      take: 5
    });

    // Get today's progress for daily goals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysProgressRecords = allProgressRecords.filter(r => 
      r.updatedAt >= today && r.updatedAt < tomorrow
    );
    const todaysCompletedActivities = todaysProgressRecords.filter(r => r.status === 'COMPLETED').length;
    const todaysTimeSpent = todaysProgressRecords.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

    // Format dashboard data for frontend consumption
    const dashboardData = {
      child: {
        id: childProfile.id,
        name: childProfile.name,
        age: childProfile.age,
        grade: childProfile.gradeLevel,
        skillProfile: childProfile.skillProfile
      },
      progressSummary: {
        totalActivities,
        completedActivities,
        inProgressActivities,
        totalTimeSpent,
        averageScore: Math.round(averageScore * 10) / 10,
        weeklyGoalProgress: 0, // Simplified for now
        monthlyGoalProgress: 0, // Simplified for now
        lastActivityDate: allProgressRecords.length > 0 
          ? allProgressRecords.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0].updatedAt
          : null,
        subjectProgress: [], // Simplified for now
        // Add streak summary for easy access
        currentDailyStreak: currentStreaks.find(s => s.streakType === 'DAILY')?.currentCount || 0,
        longestDailyStreak: currentStreaks.find(s => s.streakType === 'DAILY')?.longestCount || 0,
        activityCompletionStreak: currentStreaks.find(s => s.streakType === 'ACTIVITY_COMPLETION')?.currentCount || 0,
        perfectScoreStreak: currentStreaks.find(s => s.streakType === 'PERFECT_SCORE')?.currentCount || 0,
        helpFreeStreak: currentStreaks.find(s => s.streakType === 'HELP_FREE')?.currentCount || 0
      },
      studyPlans: studyPlansWithProgress,
      currentStreaks: currentStreaks.map(streak => ({
        id: streak.id,
        type: streak.streakType,
        currentCount: streak.currentCount,
        longestCount: streak.longestCount,
        lastActivityDate: streak.lastActivityDate,
        streakStartDate: streak.streakStartDate,
        isActive: streak.isActive
      })),
      badges: {
        recent: recentAchievements.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt,
          celebrationShown: achievement.celebrationShown
        })),
        progress: [], // Simplified for now
        nextToEarn: [] // Simplified for now
      },
      dailyGoals: {
        activitiesTarget: 5,
        activitiesCompleted: todaysCompletedActivities,
        activitiesProgress: Math.min(100, (todaysCompletedActivities / 5) * 100),
        timeTarget: 1800, // 30 minutes in seconds
        timeSpent: todaysTimeSpent,
        timeProgress: Math.min(100, (todaysTimeSpent / 1800) * 100),
        streakTarget: 7, // 7 day streak goal
        currentStreak: currentStreaks.find(s => s.streakType === 'DAILY')?.currentCount || 0,
        streakProgress: Math.min(100, ((currentStreaks.find(s => s.streakType === 'DAILY')?.currentCount || 0) / 7) * 100)
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      dashboard: dashboardData
    });
  })
);

// ===== PROGRESS TRACKING API =====

/**
 * POST /api/child/activity/:activityId/progress
 * Update activity progress in real-time
 */
router.post('/activity/:activityId/progress', 
  ...progressUpdateLogging('PROGRESS_UPDATE'),
  authenticateToken, 
  requireChildAuth,
  sanitizeChildInput,
  childRateLimit(60, 60000), // 60 requests per minute
  validateChildParams({
    activityId: Joi.string().required().messages({
      'string.empty': 'Activity ID is required',
      'any.required': 'Which activity are you working on?'
    })
  }),
  validateChild(childValidationSchemas.activityProgress),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { activityId } = req.params;
    const childId = req.user!.userId;
    
    try {
      // Convert string dates to Date objects in sessionData if provided
      const progressUpdate = { ...req.body };
      if (progressUpdate.sessionData) {
        progressUpdate.sessionData = {
          ...progressUpdate.sessionData,
          startTime: new Date(progressUpdate.sessionData.startTime),
          endTime: progressUpdate.sessionData.endTime ? new Date(progressUpdate.sessionData.endTime) : undefined,
          focusEvents: progressUpdate.sessionData.focusEvents?.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          })) || [],
          difficultyAdjustments: progressUpdate.sessionData.difficultyAdjustments?.map((adj: any) => ({
            ...adj,
            timestamp: new Date(adj.timestamp)
          })) || [],
          helpRequests: progressUpdate.sessionData.helpRequests?.map((req: any) => ({
            ...req,
            timestamp: new Date(req.timestamp)
          })) || [],
          interactionEvents: progressUpdate.sessionData.interactionEvents?.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          })) || []
        };
      }

      // Use enhanced progress update with validation and consistency checks
      const result = await progressConsistencyService.updateProgressWithConsistencyChecks({
        childId,
        payload: {
          activityId,
          ...progressUpdate
        },
        validateConsistency: true, // Enable consistency checks for progress updates
        autoCorrect: false // Don't auto-correct during regular updates
      });

      if (!result.success) {
        logger.warn('Progress update validation failed', {
          childId,
          activityId,
          errors: result.errors
        });

        return sendChildError(res, 'VALIDATION_ERROR', 
          `Please check: ${result.errors.join(', ')}`, {
          childId,
          activityId,
          validationErrors: result.errors
        });
      }

      // Log any consistency issues found (but don't fail the request)
      if (result.consistencyResult && result.consistencyResult.inconsistencies.length > 0) {
        logger.warn('Progress consistency issues detected', {
          childId,
          activityId,
          inconsistencies: result.consistencyResult.inconsistencies
        });
      }

      res.json({
        success: true,
        message: 'Progress updated successfully! 🎉',
        progress: result.progressRecord,
        validation: {
          passed: result.validationResult?.isValid || false,
          warnings: result.validationResult?.warnings || []
        },
        consistency: {
          checked: !!result.consistencyResult,
          issues: result.consistencyResult?.inconsistencies.length || 0
        }
      });

    } catch (error) {
      logger.error('Progress update error:', error);
      return sendChildError(res, 'UPDATE_FAILED', 
        'Something went wrong updating your progress. Please try again!', {
        childId,
        activityId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * POST /api/child/activity/:activityId/complete
 * Mark activity as complete with validation
 */
router.post('/activity/:activityId/complete', 
  ...progressUpdateLogging('ACTIVITY_COMPLETION'),
  authenticateToken, 
  requireChildAuth,
  sanitizeChildInput,
  childRateLimit(30, 60000), // 30 completions per minute
  validateChildParams({
    activityId: Joi.string().required().messages({
      'string.empty': 'Activity ID is required',
      'any.required': 'Which activity did you complete?'
    })
  }),
  validateChild(childValidationSchemas.activityCompletion),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { activityId } = req.params;
    const childId = req.user!.userId;
    const { score, timeSpent, sessionData } = req.body;

    // Convert string dates to Date objects in sessionData
    const processedSessionData = {
      ...sessionData,
      startTime: new Date(sessionData.startTime),
      endTime: new Date(sessionData.endTime),
      focusEvents: sessionData.focusEvents?.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      })) || [],
      difficultyAdjustments: sessionData.difficultyAdjustments?.map((adj: any) => ({
        ...adj,
        timestamp: new Date(adj.timestamp)
      })) || [],
      helpRequests: sessionData.helpRequests?.map((req: any) => ({
        ...req,
        timestamp: new Date(req.timestamp)
      })) || [],
      interactionEvents: sessionData.interactionEvents?.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      })) || []
    };

    try {
      // Use enhanced progress update with validation and consistency checks for completion
      const result = await progressConsistencyService.updateProgressWithConsistencyChecks({
        childId,
        payload: {
          activityId,
          timeSpent,
          score,
          status: 'COMPLETED',
          sessionData: processedSessionData
        },
        validateConsistency: true, // Enable full consistency checks for completions
        autoCorrect: true // Auto-correct minor inconsistencies for completions
      });

      if (!result.success) {
        logger.warn('Activity completion validation failed', {
          childId,
          activityId,
          errors: result.errors
        });

        return sendChildError(res, 'COMPLETION_VALIDATION_FAILED', 
          `Let's make sure everything is complete: ${result.errors.join(', ')}`, {
          childId,
          activityId,
          validationErrors: result.errors
        });
      }

      const completedProgress = result.progressRecord;

      // Check for new badges
      const currentSession = await prisma.childLoginSession.findFirst({
        where: {
          childId,
          logoutTime: null
        },
        orderBy: { loginTime: 'desc' }
      });

      const badgeResults = await childBadgeService.checkBadgeEligibility(childId, currentSession?.id);
      const newBadges = badgeResults.filter(result => result.success);

      // Log any consistency issues found (but don't fail the request)
      if (result.consistencyResult && result.consistencyResult.inconsistencies.length > 0) {
        logger.warn('Activity completion consistency issues detected', {
          childId,
          activityId,
          inconsistencies: result.consistencyResult.inconsistencies,
          corrected: result.consistencyResult.corrections?.length || 0
        });
      }

      res.json({
        success: true,
        message: 'Activity completed successfully! 🎉',
        progress: completedProgress,
        validation: {
          passed: result.validationResult?.isValid || false,
          warnings: result.validationResult?.warnings || [],
          consistencyChecks: result.consistencyResult?.inconsistencies.length || 0
        },
        consistency: {
          checked: !!result.consistencyResult,
          issues: result.consistencyResult?.inconsistencies.length || 0,
          corrected: result.consistencyResult?.corrections?.length || 0
        },
        badges: {
          earned: newBadges.map(result => result.badge),
          count: newBadges.length
        }
      });

    } catch (error) {
      logger.error('Activity completion error:', error);
      return sendChildError(res, 'COMPLETION_FAILED', 
        'Something went wrong completing your activity. Please try again!', {
        childId,
        activityId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * GET /api/child/:childId/progress
 * Get detailed progress information with filtering
 */
router.get('/:childId/progress', 
  authenticateToken, 
  requireChildAuth, 
  verifyChildAccess,
  sanitizeChildInput,
  childRateLimit(20, 60000), // 20 requests per minute
  validateChildParams({
    childId: childValidationSchemas.childId
  }),
  validateChildQuery(childValidationSchemas.progressQuery),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { childId } = req.params;

    // Parse query parameters for filtering
    const {
      timeFrame,
      subjects,
      status,
      minScore,
      maxScore,
      limit = '50',
      offset = '0'
    } = req.query;

    const filter: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (timeFrame) {
      const [start, end] = (timeFrame as string).split(',');
      filter.timeFrame = { start, end };
    }

    if (subjects) {
      filter.subjects = (subjects as string).split(',');
    }

    if (status) {
      filter.status = (status as string).split(',');
    }

    if (minScore) {
      filter.minScore = parseInt(minScore as string);
    }

    if (maxScore) {
      filter.maxScore = parseInt(maxScore as string);
    }

    const progressHistory = await childProgressService.getProgressHistory(childId, filter);

    res.json({
      success: true,
      message: 'Progress history retrieved successfully',
      ...progressHistory
    });
  })
);

/**
 * GET /api/child/:childId/streaks
 * Get learning streak information
 */
router.get('/:childId/streaks', 
  authenticateToken, 
  requireChildAuth, 
  verifyChildAccess,
  sanitizeChildInput,
  childRateLimit(15, 60000), // 15 requests per minute
  validateChildParams({
    childId: childValidationSchemas.childId
  }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { childId } = req.params;

    const streaks = await childProgressService.getLearningStreaks(childId);

    res.json({
      success: true,
      message: 'Learning streaks retrieved successfully! 🔥',
      streaks
    });
  })
);

// ===== BADGE AND ACHIEVEMENT API =====

/**
 * GET /api/child/:childId/badges
 * Get all earned badges for a child
 */
router.get('/:childId/badges', 
  authenticateToken, 
  requireChildAuth, 
  verifyChildAccess,
  sanitizeChildInput,
  childRateLimit(10, 60000), // 10 requests per minute
  validateChildParams({
    childId: childValidationSchemas.childId
  }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { childId } = req.params;

    const badges = await prisma.achievement.findMany({
      where: {
        childId,
        type: { in: ['BADGE', 'MILESTONE'] }
      },
      orderBy: { earnedAt: 'desc' }
    });

    // Get badge definitions for additional metadata
    const badgesWithMetadata = badges.map(badge => {
      const definition = childBadgeService.getBadgeDefinition(
        badge.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      );
      
      return {
        ...badge,
        category: definition?.category || 'completion',
        rarity: definition?.rarity || 'common',
        celebrationConfig: definition?.celebrationConfig
      };
    });

    res.json({
      success: true,
      message: 'Badges retrieved successfully! 🏆',
      badges: badgesWithMetadata,
      count: badges.length
    });
  })
);

/**
 * GET /api/child/:childId/badges/progress
 * Get progress toward next badges
 */
router.get('/:childId/badges/progress', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child badge progress',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const badgeProgress = await childBadgeService.getBadgeProgress(childId);
    const nextBadges = await childBadgeService.getNextBadges(childId, 5);

    res.json({
      message: 'Badge progress retrieved successfully',
      progress: badgeProgress,
      nextToEarn: nextBadges
    });

  } catch (error) {
    logger.error('Error getting badge progress:', error);
    res.status(500).json({
      error: {
        code: 'BADGE_PROGRESS_FETCH_FAILED',
        message: 'Failed to retrieve badge progress. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/:childId/badges/celebrate
 * Mark celebration as shown for an achievement
 */
router.post('/:childId/badges/celebrate', authenticateToken, requireChildAuth, validate(celebrationUpdateSchema), async (req, res) => {
  try {
    const { childId } = req.params;
    const { achievementId } = req.body;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child achievements',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the achievement belongs to the child
    const achievement = await prisma.achievement.findFirst({
      where: {
        id: achievementId,
        childId
      }
    });

    if (!achievement) {
      return res.status(404).json({
        error: {
          code: 'ACHIEVEMENT_NOT_FOUND',
          message: 'Achievement not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    await childBadgeService.markCelebrationShown(achievementId);

    res.json({
      message: 'Celebration marked as shown successfully'
    });

  } catch (error) {
    logger.error('Error marking celebration as shown:', error);
    res.status(500).json({
      error: {
        code: 'CELEBRATION_UPDATE_FAILED',
        message: 'Failed to update celebration status. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * GET /api/child/:childId/achievements
 * Get achievement history with filtering
 */
router.get('/:childId/achievements', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child achievements',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const {
      type,
      limit = '20',
      offset = '0',
      celebrationShown
    } = req.query;

    const whereClause: any = { childId };

    if (type) {
      whereClause.type = type;
    }

    if (celebrationShown !== undefined) {
      whereClause.celebrationShown = celebrationShown === 'true';
    }

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      orderBy: { earnedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const totalCount = await prisma.achievement.count({ where: whereClause });

    res.json({
      message: 'Achievement history retrieved successfully',
      achievements,
      totalCount,
      hasMore: parseInt(offset as string) + achievements.length < totalCount
    });

  } catch (error) {
    logger.error('Error getting achievement history:', error);
    res.status(500).json({
      error: {
        code: 'ACHIEVEMENTS_FETCH_FAILED',
        message: 'Failed to retrieve achievement history. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// ===== SESSION MANAGEMENT API =====

/**
 * GET /api/child/auth/session
 * Get current session information and validate session
 */
router.get('/auth/session', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const childId = req.user!.userId;

    // Get current active session
    const currentSession = await prisma.childLoginSession.findFirst({
      where: {
        childId,
        logoutTime: null
      },
      orderBy: { loginTime: 'desc' }
    });

    if (!currentSession) {
      return res.status(401).json({
        error: {
          code: 'NO_ACTIVE_SESSION',
          message: 'No active session found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Check session duration (20 minutes max)
    const sessionDurationMs = Date.now() - currentSession.loginTime.getTime();
    const sessionDurationMinutes = sessionDurationMs / (1000 * 60);
    const maxSessionMinutes = 20;

    if (sessionDurationMinutes > maxSessionMinutes) {
      // Session expired, mark as logged out
      await prisma.childLoginSession.update({
        where: { id: currentSession.id },
        data: {
          logoutTime: new Date(),
          sessionDuration: Math.floor(sessionDurationMs / 1000)
        }
      });

      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Check for suspicious activity patterns
    const suspiciousActivity = await checkSuspiciousActivity(childId, currentSession.id);

    res.json({
      sessionId: currentSession.id,
      loginTime: currentSession.loginTime,
      lastActivity: currentSession.loginTime, // This would be updated with actual last activity
      deviceInfo: currentSession.deviceInfo,
      sessionDurationMinutes: Math.floor(sessionDurationMinutes),
      maxSessionMinutes,
      timeRemainingMinutes: Math.max(0, maxSessionMinutes - sessionDurationMinutes),
      suspiciousActivity: suspiciousActivity.detected ? suspiciousActivity : null
    });

  } catch (error) {
    logger.error('Error validating session:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_VALIDATION_FAILED',
        message: 'Failed to validate session',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/auth/activity
 * Update last activity timestamp and log user activity
 */
router.post('/auth/activity', authenticateToken, requireChildAuth, validate(activityUpdateSchema), async (req, res) => {
  try {
    const childId = req.user!.userId;
    const { timestamp, page, action, data } = req.body;

    // Get current active session
    const currentSession = await prisma.childLoginSession.findFirst({
      where: {
        childId,
        logoutTime: null
      },
      orderBy: { loginTime: 'desc' }
    });

    if (!currentSession) {
      return res.status(401).json({
        error: {
          code: 'NO_ACTIVE_SESSION',
          message: 'No active session found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Log the activity in security monitoring
    await securityMonitoring.logChildActivity({
      childId,
      sessionId: currentSession.id,
      activity: action,
      page,
      timestamp: new Date(timestamp),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      additionalData: data
    });

    // Update session with activity count if it's a significant activity
    if (action === 'user_activity') {
      // This could be enhanced to track more detailed activity metrics
      await prisma.childLoginSession.update({
        where: { id: currentSession.id },
        data: {
          // Could add lastActivityTime field to schema
        }
      });
    }

    res.json({
      message: 'Activity logged successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error logging activity:', error);
    res.status(500).json({
      error: {
        code: 'ACTIVITY_LOG_FAILED',
        message: 'Failed to log activity',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/auth/extend-session
 * Extend the current session (reset session timer)
 */
router.post('/auth/extend-session', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const childId = req.user!.userId;

    // Get current active session
    const currentSession = await prisma.childLoginSession.findFirst({
      where: {
        childId,
        logoutTime: null
      },
      orderBy: { loginTime: 'desc' }
    });

    if (!currentSession) {
      return res.status(401).json({
        error: {
          code: 'NO_ACTIVE_SESSION',
          message: 'No active session found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Check if session can be extended (not too many extensions)
    const sessionDurationMs = Date.now() - currentSession.loginTime.getTime();
    const sessionDurationHours = sessionDurationMs / (1000 * 60 * 60);

    if (sessionDurationHours > 2) {
      // Don't allow sessions longer than 2 hours total
      return res.status(400).json({
        error: {
          code: 'SESSION_TOO_LONG',
          message: 'Session has been active too long. Please take a break and log in again.',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Create a new session (effectively extending by creating fresh session)
    const newSession = await prisma.childLoginSession.create({
      data: {
        childId,
        loginTime: new Date(),
        deviceInfo: currentSession.deviceInfo,
        ipAddress: req.ip,
        activitiesCompleted: currentSession.activitiesCompleted,
        badgesEarned: currentSession.badgesEarned
      }
    });

    // Mark old session as ended
    await prisma.childLoginSession.update({
      where: { id: currentSession.id },
      data: {
        logoutTime: new Date(),
        sessionDuration: Math.floor(sessionDurationMs / 1000)
      }
    });

    // Log session extension
    await securityMonitoring.logChildActivity({
      childId,
      sessionId: newSession.id,
      activity: 'session_extended',
      page: req.get('Referer') || '/dashboard',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      additionalData: {
        previousSessionId: currentSession.id,
        previousSessionDuration: Math.floor(sessionDurationMs / 1000)
      }
    });

    res.json({
      message: 'Session extended successfully',
      newSessionId: newSession.id,
      loginTime: newSession.loginTime
    });

  } catch (error) {
    logger.error('Error extending session:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_EXTEND_FAILED',
        message: 'Failed to extend session',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/auth/session-end
 * End the current session (logout)
 */
router.post('/auth/session-end', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const childId = req.user!.userId;
    const { sessionId } = req.body;

    // Get current active session
    const currentSession = await prisma.childLoginSession.findFirst({
      where: {
        childId,
        logoutTime: null,
        ...(sessionId && { id: sessionId })
      },
      orderBy: { loginTime: 'desc' }
    });

    if (currentSession) {
      const sessionDurationMs = Date.now() - currentSession.loginTime.getTime();
      
      await prisma.childLoginSession.update({
        where: { id: currentSession.id },
        data: {
          logoutTime: new Date(),
          sessionDuration: Math.floor(sessionDurationMs / 1000)
        }
      });

      // Log session end
      await securityMonitoring.logChildActivity({
        childId,
        sessionId: currentSession.id,
        activity: 'session_end',
        page: req.get('Referer') || '/dashboard',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        additionalData: {
          sessionDuration: Math.floor(sessionDurationMs / 1000),
          activitiesCompleted: currentSession.activitiesCompleted,
          badgesEarned: currentSession.badgesEarned
        }
      });
    }

    res.json({
      message: 'Session ended successfully'
    });

  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_END_FAILED',
        message: 'Failed to end session',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/security/suspicious-activity
 * Report suspicious activity for parental notification
 */
router.post('/security/suspicious-activity', validate(suspiciousActivitySchema), async (req, res) => {
  try {
    const { childId, activityDetails, timestamp, location } = req.body;

    // Log suspicious activity
    await securityMonitoring.logSuspiciousActivity({
      childId,
      activityType: 'suspicious_behavior',
      details: activityDetails,
      timestamp: new Date(timestamp),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      location,
      severity: 'medium'
    });

    // Get child profile for parent notification
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId },
      include: {
        user: {
          include: {
            parent: true
          }
        }
      }
    });

    if (childProfile?.user?.parent) {
      // Send notification to parent (this would integrate with existing notification system)
      await notifyParentOfSuspiciousActivity(childProfile.user.parent.id, {
        childId,
        childName: childProfile.name,
        activityDetails,
        timestamp: new Date(timestamp),
        location
      });
    }

    res.json({
      message: 'Suspicious activity reported successfully'
    });

  } catch (error) {
    logger.error('Error reporting suspicious activity:', error);
    res.status(500).json({
      error: {
        code: 'SUSPICIOUS_ACTIVITY_REPORT_FAILED',
        message: 'Failed to report suspicious activity',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Helper function to check for suspicious activity patterns
async function checkSuspiciousActivity(childId: string, sessionId: string) {
  return await securityMonitoring.detectSuspiciousPatterns(childId, sessionId);
}

// Helper function to notify parents of suspicious activity
async function notifyParentOfSuspiciousActivity(parentId: string, details: any) {
  try {
    // This would integrate with the existing email service
    // For now, we'll just log it
    logger.warn('Suspicious activity detected for child', {
      parentId,
      childId: details.childId,
      childName: details.childName,
      activityDetails: details.activityDetails,
      timestamp: details.timestamp,
      location: details.location
    });

    // In a real implementation, this would send an email or push notification
    // await emailService.sendSuspiciousActivityAlert(parentId, details);
    
  } catch (error) {
    logger.error('Error notifying parent of suspicious activity:', error);
  }
}

// Apply child error handling middleware to all routes
router.use(childErrorHandler);

export default router;