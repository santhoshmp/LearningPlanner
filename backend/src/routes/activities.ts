import express from 'express';
import { authenticateToken, requireChild } from '../middleware/auth';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get activity progress for a child
 * GET /api/activities/:activityId/progress
 */
router.get('/:activityId/progress', authenticateToken, requireChild, async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user?.userId;

    if (!childId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Child authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get the activity and verify it exists
    const activity = await prisma.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          select: {
            childId: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: {
          code: 'ACTIVITY_NOT_FOUND',
          message: 'Activity not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the child has access to this activity
    if (activity.plan.childId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this activity',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get progress record for this activity and child
    const progressRecord = await prisma.progressRecord.findFirst({
      where: {
        activityId,
        childId
      }
    });

    res.json({
      progress: progressRecord || {
        activityId,
        childId,
        status: 'NOT_STARTED',
        score: null,
        timeSpent: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      message: 'Activity progress retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching activity progress:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch activity progress',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Start an activity (create or update progress record)
 * POST /api/activities/:activityId/start
 */
router.post('/:activityId/start', authenticateToken, requireChild, async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user?.userId;

    if (!childId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Child authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get the activity and verify it exists
    const activity = await prisma.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          select: {
            childId: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: {
          code: 'ACTIVITY_NOT_FOUND',
          message: 'Activity not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the child has access to this activity
    if (activity.plan.childId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this activity',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Check if progress record already exists
    let progressRecord = await prisma.progressRecord.findFirst({
      where: {
        activityId,
        childId
      }
    });

    if (progressRecord) {
      // Update existing record to IN_PROGRESS if not already completed
      if (progressRecord.status !== 'COMPLETED') {
        progressRecord = await prisma.progressRecord.update({
          where: { id: progressRecord.id },
          data: {
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          }
        });
      }
    } else {
      // Create new progress record
      progressRecord = await prisma.progressRecord.create({
        data: {
          activityId,
          childId,
          status: 'IN_PROGRESS',
          score: null,
          timeSpent: 0
        }
      });
    }

    res.json({
      progress: progressRecord,
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        content: JSON.parse(activity.content as string),
        estimatedDuration: activity.estimatedDuration,
        difficulty: activity.difficulty
      },
      message: 'Activity started successfully'
    });
  } catch (error) {
    logger.error('Error starting activity:', error);
    res.status(500).json({
      error: {
        code: 'START_FAILED',
        message: 'Failed to start activity',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update activity progress
 * PUT /api/activities/:activityId/progress
 */
router.put('/:activityId/progress', authenticateToken, requireChild, async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user?.userId;
    const { status, score, timeSpent } = req.body;

    if (!childId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Child authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get the activity and verify it exists
    const activity = await prisma.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          select: {
            childId: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: {
          code: 'ACTIVITY_NOT_FOUND',
          message: 'Activity not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the child has access to this activity
    if (activity.plan.childId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this activity',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Find existing progress record
    let progressRecord = await prisma.progressRecord.findFirst({
      where: {
        activityId,
        childId
      }
    });

    if (!progressRecord) {
      return res.status(404).json({
        error: {
          code: 'PROGRESS_NOT_FOUND',
          message: 'Progress record not found. Start the activity first.',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Update progress record
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (timeSpent !== undefined) updateData.timeSpent = timeSpent;
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    progressRecord = await prisma.progressRecord.update({
      where: { id: progressRecord.id },
      data: updateData
    });

    res.json({
      progress: progressRecord,
      message: 'Activity progress updated successfully'
    });
  } catch (error) {
    logger.error('Error updating activity progress:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update activity progress',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get activity details
 * GET /api/activities/:activityId
 */
router.get('/:activityId', authenticateToken, requireChild, async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user?.userId;

    if (!childId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Child authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get the activity and verify it exists
    const activity = await prisma.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          select: {
            childId: true,
            subject: true,
            difficulty: true
          }
        },
        progressRecords: {
          where: { childId }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: {
          code: 'ACTIVITY_NOT_FOUND',
          message: 'Activity not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the child has access to this activity
    if (activity.plan.childId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this activity',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    res.json({
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        content: JSON.parse(activity.content as string),
        estimatedDuration: activity.estimatedDuration,
        difficulty: activity.difficulty,
        prerequisites: JSON.parse(activity.prerequisites as string),
        completionCriteria: JSON.parse(activity.completionCriteria as string),
        plan: activity.plan,
        progress: activity.progressRecords[0] || null
      },
      message: 'Activity retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching activity:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch activity',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Submit activity completion
 * POST /api/activities/:activityId/submit
 */
router.post('/:activityId/submit', authenticateToken, requireChild, async (req, res) => {
  try {
    const { activityId } = req.params;
    const childId = req.user?.userId;
    const { activityId: submissionActivityId, answers, timeSpent, helpRequests } = req.body;

    if (!childId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Child authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Get the activity and verify it exists
    const activity = await prisma.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          select: {
            childId: true,
            subject: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: {
          code: 'ACTIVITY_NOT_FOUND',
          message: 'Activity not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Verify the child has access to this activity
    if (activity.plan.childId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this activity',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Find or create progress record
    let progressRecord = await prisma.progressRecord.findFirst({
      where: {
        activityId,
        childId
      }
    });

    if (!progressRecord) {
      // Create new progress record if it doesn't exist
      progressRecord = await prisma.progressRecord.create({
        data: {
          activityId,
          childId,
          status: 'COMPLETED',
          score: 100, // Default score for completion
          timeSpent: timeSpent ? Math.floor(timeSpent / 60) : activity.estimatedDuration, // Convert seconds to minutes
          completedAt: new Date()
        }
      });
    } else {
      // Update existing progress record to completed
      progressRecord = await prisma.progressRecord.update({
        where: { id: progressRecord.id },
        data: {
          status: 'COMPLETED',
          score: 100, // Default score for completion
          timeSpent: timeSpent ? Math.floor(timeSpent / 60) : (progressRecord.timeSpent || activity.estimatedDuration), // Convert seconds to minutes
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Calculate completion percentage and other metrics
    const totalActivitiesInPlan = await prisma.studyActivity.count({
      where: { planId: activity.planId }
    });

    const completedActivitiesInPlan = await prisma.progressRecord.count({
      where: {
        childId,
        status: 'COMPLETED',
        activity: {
          planId: activity.planId
        }
      }
    });

    const planCompletionPercentage = totalActivitiesInPlan > 0 
      ? Math.round((completedActivitiesInPlan / totalActivitiesInPlan) * 100)
      : 0;

    // Check if this completes the entire study plan
    const isPlanCompleted = completedActivitiesInPlan === totalActivitiesInPlan;

    // Update study plan status if completed
    if (isPlanCompleted) {
      await prisma.studyPlan.update({
        where: { id: activity.planId },
        data: { status: 'COMPLETED' }
      });
    }

    // Generate feedback based on completion
    const feedback = isPlanCompleted 
      ? `🎉 Congratulations! You've completed the entire ${activity.plan.subject} study plan!`
      : `Great job completing "${activity.title}"! You're ${planCompletionPercentage}% through your study plan.`;

    // Find next activity in the plan
    const nextActivity = await prisma.studyActivity.findFirst({
      where: {
        planId: activity.planId,
        progressRecords: {
          none: {
            childId,
            status: 'COMPLETED'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      score: progressRecord.score || 100,
      feedback,
      nextActivityId: nextActivity?.id,
      achievements: [], // TODO: Implement achievement system
      // Additional data for frontend use
      progress: progressRecord,
      activity: {
        id: activity.id,
        title: activity.title,
        subject: activity.plan.subject
      },
      planProgress: {
        completedActivities: completedActivitiesInPlan,
        totalActivities: totalActivitiesInPlan,
        completionPercentage: planCompletionPercentage,
        isPlanCompleted
      },
      message: 'Activity submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting activity:', error);
    res.status(500).json({
      error: {
        code: 'SUBMIT_FAILED',
        message: 'Failed to submit activity',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

export default router;