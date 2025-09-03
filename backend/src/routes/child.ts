import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { childProgressService } from '../services/childProgressService';
import { ChildBadgeService } from '../services/childBadgeService';
import { authService } from '../services/authService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { securityMonitoring } from '../middleware/securityMonitoring';

const router = express.Router();
const prisma = new PrismaClient();
const childBadgeService = new ChildBadgeService(prisma);

// Validation schemas using Joi to match existing pattern
const activityProgressSchema = Joi.object({
  activityId: Joi.string().uuid().required(),
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
  activityId: Joi.string().uuid().required(),
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

// Middleware to ensure child authentication
const requireChildAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'CHILD') {
    return res.status(401).json({
      error: {
        code: 'CHILD_AUTH_REQUIRED',
        message: 'Child authentication is required',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
  next();
};

// ===== CHILD DASHBOARD API =====

/**
 * GET /api/child/:childId/dashboard
 * Get child dashboard data with progress summary
 */
router.get('/:childId/dashboard', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child dashboard',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get real-time progress data
    const realtimeProgress = await childProgressService.getRealtimeProgress(childId);
    
    // Get badge progress
    const badgeProgress = await childBadgeService.getBadgeProgress(childId);
    
    // Get next badges to earn
    const nextBadges = await childBadgeService.getNextBadges(childId, 3);
    
    // Get recent achievements (last 5)
    const recentAchievements = await prisma.achievement.findMany({
      where: { childId },
      orderBy: { earnedAt: 'desc' },
      take: 5
    });

    // Get active study plans
    const activeStudyPlans = await prisma.studyPlan.findMany({
      where: {
        childId,
        status: 'ACTIVE'
      },
      include: {
        activities: {
          include: {
            progressRecords: {
              where: { childId }
            }
          }
        }
      }
    });

    // Calculate study plan progress
    const studyPlansWithProgress = activeStudyPlans.map(plan => {
      const totalActivities = plan.activities.length;
      const completedActivities = plan.activities.filter(activity => 
        activity.progressRecords.some(record => record.status === 'COMPLETED')
      ).length;
      
      return {
        ...plan,
        totalActivities,
        completedActivities,
        progressPercentage: totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0
      };
    });

    const dashboardData = {
      child: {
        id: childId,
        // Add child profile data if needed
      },
      progressSummary: realtimeProgress.todaysSummary,
      activeActivities: realtimeProgress.activeActivities,
      currentStreaks: realtimeProgress.currentStreaks,
      studyPlans: studyPlansWithProgress,
      badges: {
        recent: recentAchievements,
        progress: badgeProgress,
        nextToEarn: nextBadges
      },
      dailyGoals: {
        activitiesTarget: 5,
        activitiesCompleted: realtimeProgress.todaysSummary.completedActivities,
        timeTarget: 1800, // 30 minutes in seconds
        timeSpent: realtimeProgress.todaysSummary.totalTimeSpent
      }
    };

    res.json({
      message: 'Dashboard data retrieved successfully',
      dashboard: dashboardData
    });

  } catch (error) {
    logger.error('Error getting child dashboard:', error);
    res.status(500).json({
      error: {
        code: 'DASHBOARD_FETCH_FAILED',
        message: 'Failed to retrieve dashboard data. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// ===== PROGRESS TRACKING API =====

/**
 * POST /api/child/activity/:activityId/progress
 * Update activity progress in real-time
 */
router.post('/activity/:activityId/progress', authenticateToken, requireChildAuth, validate(activityProgressSchema), async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user!.userId;
    
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

    const updatedProgress = await childProgressService.updateActivityProgress(childId, {
      activityId,
      ...progressUpdate
    });

    res.json({
      message: 'Progress updated successfully',
      progress: updatedProgress
    });

  } catch (error) {
    logger.error('Error updating activity progress:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Child not found')) {
        return res.status(404).json({
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child profile not found',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message.includes('Activity not found')) {
        return res.status(404).json({
          error: {
            code: 'ACTIVITY_NOT_FOUND',
            message: 'Activity not found',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'PROGRESS_UPDATE_FAILED',
        message: 'Failed to update progress. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * POST /api/child/activity/:activityId/complete
 * Mark activity as complete with validation
 */
router.post('/activity/:activityId/complete', authenticateToken, requireChildAuth, validate(activityCompletionSchema), async (req, res) => {
  try {
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

    // Validate completion
    const validation = await childProgressService.validateActivityCompletion(
      childId,
      activityId,
      score,
      timeSpent,
      processedSessionData
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          code: 'COMPLETION_VALIDATION_FAILED',
          message: 'Activity completion validation failed',
          details: validation.validationErrors,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Update progress with completion
    const completedProgress = await childProgressService.updateActivityProgress(childId, {
      activityId,
      timeSpent,
      score: validation.adjustedScore,
      status: 'COMPLETED',
      sessionData: processedSessionData
    });

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

    res.json({
      message: 'Activity completed successfully',
      progress: completedProgress,
      validation: {
        originalScore: score,
        adjustedScore: validation.adjustedScore,
        bonusPoints: validation.bonusPoints,
        penalties: validation.penalties
      },
      badges: {
        earned: newBadges.map(result => result.badge),
        count: newBadges.length
      }
    });

  } catch (error) {
    logger.error('Error completing activity:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Child not found')) {
        return res.status(404).json({
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child profile not found',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      if (error.message.includes('Activity not found')) {
        return res.status(404).json({
          error: {
            code: 'ACTIVITY_NOT_FOUND',
            message: 'Activity not found',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'COMPLETION_FAILED',
        message: 'Failed to complete activity. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * GET /api/child/:childId/progress
 * Get detailed progress information with filtering
 */
router.get('/:childId/progress', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child progress',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

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
      message: 'Progress history retrieved successfully',
      ...progressHistory
    });

  } catch (error) {
    logger.error('Error getting progress history:', error);
    res.status(500).json({
      error: {
        code: 'PROGRESS_FETCH_FAILED',
        message: 'Failed to retrieve progress history. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * GET /api/child/:childId/streaks
 * Get learning streak information
 */
router.get('/:childId/streaks', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child streaks',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const streaks = await childProgressService.getLearningStreaks(childId);

    res.json({
      message: 'Learning streaks retrieved successfully',
      streaks
    });

  } catch (error) {
    logger.error('Error getting learning streaks:', error);
    res.status(500).json({
      error: {
        code: 'STREAKS_FETCH_FAILED',
        message: 'Failed to retrieve learning streaks. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// ===== BADGE AND ACHIEVEMENT API =====

/**
 * GET /api/child/:childId/badges
 * Get all earned badges for a child
 */
router.get('/:childId/badges', authenticateToken, requireChildAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the authenticated child matches the requested child
    if (req.user!.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this child badges',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

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
      message: 'Badges retrieved successfully',
      badges: badgesWithMetadata,
      count: badges.length
    });

  } catch (error) {
    logger.error('Error getting badges:', error);
    res.status(500).json({
      error: {
        code: 'BADGES_FETCH_FAILED',
        message: 'Failed to retrieve badges. Please try again.',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

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

export default router;