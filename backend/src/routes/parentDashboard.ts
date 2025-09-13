import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

interface ChildProgressSummary {
  childId: string;
  childName: string;
  studyPlans: Array<{
    id: string;
    subject: string;
    status: string;
    totalActivities: number;
    completedActivities: number;
    progressPercentage: number;
    lastActivity: Date | null;
    timeSpent: number; // in seconds
  }>;
  overallProgress: {
    totalActivities: number;
    completedActivities: number;
    completionRate: number;
    totalTimeSpent: number;
    averageScore: number;
  };
  streaks: {
    currentDailyStreak: number;
    longestStreak: number;
    isActive: boolean;
  };
  recentActivity: Array<{
    activityTitle: string;
    subject: string;
    completedAt: Date;
    score: number | null;
    timeSpent: number;
  }>;
  badges: {
    total: number;
    recent: Array<{
      title: string;
      earnedAt: Date;
      type: string;
    }>;
  };
}

/**
 * GET /api/parent/dashboard
 * Get comprehensive parent dashboard data with real-time child progress
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.userId;
    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all children for this parent
    const children = await prisma.childProfile.findMany({
      where: { parentId },
      include: {
        studyPlans: {
          include: {
            activities: {
              include: {
                progressRecords: {
                  where: { childId: { in: [] } } // Will be filled dynamically
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        progressRecords: {
          include: {
            activity: {
              include: {
                plan: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        },
        learningStreaks: {
          where: { streakType: 'DAILY' }
        },
        achievements: {
          orderBy: { earnedAt: 'desc' },
          take: 5
        }
      }
    });

    const childProgressSummaries: ChildProgressSummary[] = [];

    for (const child of children) {
      // Get progress records for this child
      const progressRecords = await prisma.progressRecord.findMany({
        where: { childId: child.id },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Calculate study plan progress
      const studyPlansWithProgress = child.studyPlans.map(plan => {
        const planProgressRecords = progressRecords.filter(p => p.activity.planId === plan.id);
        const completedActivities = planProgressRecords.filter(p => p.status === 'COMPLETED').length;
        const totalActivities = plan.activities.length;
        const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
        
        // Get last activity date
        const lastActivityRecord = planProgressRecords
          .filter(p => p.completedAt)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
        
        // Calculate total time spent on this plan
        const timeSpent = planProgressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

        return {
          id: plan.id,
          subject: plan.subject,
          status: plan.status,
          totalActivities,
          completedActivities,
          progressPercentage,
          lastActivity: lastActivityRecord?.completedAt || null,
          timeSpent
        };
      });

      // Calculate overall progress
      const completedProgressRecords = progressRecords.filter(p => p.status === 'COMPLETED');
      const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      const averageScore = completedProgressRecords.length > 0
        ? completedProgressRecords.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgressRecords.length
        : 0;

      // Get recent activity (last 5 completed activities)
      const recentActivity = completedProgressRecords
        .filter(p => p.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 5)
        .map(p => ({
          activityTitle: p.activity.title,
          subject: p.activity.plan.subject,
          completedAt: p.completedAt!,
          score: p.score,
          timeSpent: p.timeSpent || 0
        }));

      // Get current streak
      const dailyStreak = child.learningStreaks.find(s => s.streakType === 'DAILY');

      const childSummary: ChildProgressSummary = {
        childId: child.id,
        childName: child.name,
        studyPlans: studyPlansWithProgress,
        overallProgress: {
          totalActivities: progressRecords.length,
          completedActivities: completedProgressRecords.length,
          completionRate: progressRecords.length > 0 
            ? Math.round((completedProgressRecords.length / progressRecords.length) * 100) 
            : 0,
          totalTimeSpent,
          averageScore: Math.round(averageScore)
        },
        streaks: {
          currentDailyStreak: dailyStreak?.currentCount || 0,
          longestStreak: dailyStreak?.longestCount || 0,
          isActive: dailyStreak?.isActive || false
        },
        recentActivity,
        badges: {
          total: child.achievements.length,
          recent: child.achievements.map(a => ({
            title: a.title,
            earnedAt: a.earnedAt,
            type: a.type
          }))
        }
      };

      childProgressSummaries.push(childSummary);
    }

    // Calculate aggregated data for all children
    const aggregatedData = {
      totalChildren: children.length,
      totalActivitiesCompleted: childProgressSummaries.reduce((sum, child) => 
        sum + child.overallProgress.completedActivities, 0),
      totalTimeSpent: childProgressSummaries.reduce((sum, child) => 
        sum + child.overallProgress.totalTimeSpent, 0),
      averageCompletionRate: childProgressSummaries.length > 0
        ? Math.round(childProgressSummaries.reduce((sum, child) => 
            sum + child.overallProgress.completionRate, 0) / childProgressSummaries.length)
        : 0,
      activeStreaks: childProgressSummaries.filter(child => child.streaks.isActive).length,
      totalBadgesEarned: childProgressSummaries.reduce((sum, child) => sum + child.badges.total, 0)
    };

    res.json({
      success: true,
      message: 'Parent dashboard data retrieved successfully',
      data: {
        children: childProgressSummaries,
        aggregated: aggregatedData,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    logger.error('Error getting parent dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to load parent dashboard data',
      message: 'Please try again later'
    });
  }
});

/**
 * GET /api/parent/dashboard/:childId
 * Get detailed progress data for a specific child
 */
router.get('/dashboard/:childId', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user?.userId;
    const { childId } = req.params;

    if (!parentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify child belongs to parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Get detailed child data
    const childWithDetails = await prisma.childProfile.findUnique({
      where: { id: childId },
      include: {
        studyPlans: {
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
        },
        progressRecords: {
          include: {
            activity: {
              include: {
                plan: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 20 // Last 20 activities
        },
        learningStreaks: true,
        achievements: {
          orderBy: { earnedAt: 'desc' }
        }
      }
    });

    if (!childWithDetails) {
      return res.status(404).json({ error: 'Child details not found' });
    }

    // Calculate detailed progress for each study plan
    const detailedStudyPlans = childWithDetails.studyPlans.map(plan => {
      const activities = plan.activities.map(activity => {
        const progressRecord = activity.progressRecords[0]; // Should only be one per child
        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          estimatedDuration: activity.estimatedDuration,
          status: progressRecord?.status || 'NOT_STARTED',
          score: progressRecord?.score || null,
          timeSpent: progressRecord?.timeSpent || 0,
          attempts: progressRecord?.attempts || 0,
          completedAt: progressRecord?.completedAt || null,
          lastUpdated: progressRecord?.updatedAt || null
        };
      });

      const completedActivities = activities.filter(a => a.status === 'COMPLETED').length;
      const inProgressActivities = activities.filter(a => a.status === 'IN_PROGRESS').length;
      const totalTimeSpent = activities.reduce((sum, a) => sum + a.timeSpent, 0);
      const averageScore = activities
        .filter(a => a.score !== null)
        .reduce((sum, a, _, arr) => sum + (a.score! / arr.length), 0);

      return {
        id: plan.id,
        subject: plan.subject,
        status: plan.status,
        createdAt: plan.createdAt,
        activities,
        summary: {
          totalActivities: activities.length,
          completedActivities,
          inProgressActivities,
          notStartedActivities: activities.length - completedActivities - inProgressActivities,
          progressPercentage: activities.length > 0 
            ? Math.round((completedActivities / activities.length) * 100) 
            : 0,
          totalTimeSpent,
          averageScore: Math.round(averageScore || 0)
        }
      };
    });

    res.json({
      success: true,
      message: 'Child dashboard data retrieved successfully',
      data: {
        child: {
          id: childWithDetails.id,
          name: childWithDetails.name,
          grade: childWithDetails.grade,
          createdAt: childWithDetails.createdAt
        },
        studyPlans: detailedStudyPlans,
        recentProgress: childWithDetails.progressRecords.map(p => ({
          activityId: p.activityId,
          activityTitle: p.activity.title,
          subject: p.activity.plan.subject,
          status: p.status,
          score: p.score,
          timeSpent: p.timeSpent,
          completedAt: p.completedAt,
          updatedAt: p.updatedAt
        })),
        streaks: childWithDetails.learningStreaks.map(s => ({
          type: s.streakType,
          currentCount: s.currentCount,
          longestCount: s.longestCount,
          isActive: s.isActive,
          lastUpdated: s.lastUpdated
        })),
        achievements: childWithDetails.achievements.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          earnedAt: a.earnedAt
        })),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    logger.error('Error getting child dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to load child dashboard data',
      message: 'Please try again later'
    });
  }
});

export default router;