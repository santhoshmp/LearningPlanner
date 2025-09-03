import { PrismaClient, ProgressStatus, StreakType, ChildProfile, ProgressRecord, LearningStreak } from '@prisma/client';
import { logger } from '../utils/logger';
import { TimeFrame } from '../types/analytics';
import { redisService } from './redisService';

export interface ActivityProgressUpdate {
  activityId: string;
  timeSpent: number;
  score?: number;
  status?: ProgressStatus;
  sessionData?: ActivitySessionData;
  helpRequestsCount?: number;
  pauseCount?: number;
  resumeCount?: number;
}

export interface ActivitySessionData {
  startTime: Date;
  endTime?: Date;
  pausedDuration: number; // total time paused in seconds
  focusEvents: FocusEvent[];
  difficultyAdjustments: DifficultyAdjustment[];
  helpRequests: HelpRequest[];
  interactionEvents: InteractionEvent[];
}

export interface FocusEvent {
  type: 'focus' | 'blur';
  timestamp: Date;
}

export interface DifficultyAdjustment {
  fromDifficulty: number;
  toDifficulty: number;
  reason: string;
  timestamp: Date;
}

export interface HelpRequest {
  question: string;
  timestamp: Date;
  resolved: boolean;
  responseTime?: number; // seconds
}

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  element?: string;
  timestamp: Date;
  data?: any;
}

export interface ChildProgressSummary {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalTimeSpent: number; // in seconds
  averageScore: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastActivityDate: Date | null;
  weeklyGoalProgress: number; // percentage
  monthlyGoalProgress: number; // percentage
  subjectProgress: SubjectProgressSummary[];
}

export interface SubjectProgressSummary {
  subjectId: string;
  subjectName: string;
  completedActivities: number;
  totalActivities: number;
  averageScore: number;
  timeSpent: number;
  proficiencyLevel: ProficiencyLevel;
  lastActivity: Date | null;
}

export interface StreakMilestone {
  count: number;
  achievedAt: Date;
  badgeAwarded?: string;
}

export interface ProgressHistoryFilter {
  timeFrame?: TimeFrame;
  subjects?: string[];
  status?: ProgressStatus[];
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

export interface ActivityCompletionValidation {
  isValid: boolean;
  score: number;
  adjustedScore: number;
  completionCriteria: CompletionCriteria;
  validationErrors: string[];
  bonusPoints: number;
  penalties: number;
}

export interface CompletionCriteria {
  minimumScore: number;
  minimumTimeSpent: number; // seconds
  requiredInteractions: number;
  allowedHelpRequests: number;
  timeLimit?: number; // seconds
}

export type ProficiencyLevel = 'beginner' | 'developing' | 'proficient' | 'mastered';

class ChildProgressService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }
  /**
   * Update activity progress in real-time
   */
  async updateActivityProgress(
    childId: string,
    progressUpdate: ActivityProgressUpdate
  ): Promise<ProgressRecord> {
    try {
      logger.info(`Updating progress for child ${childId}, activity ${progressUpdate.activityId}`);

      // Verify child exists and is active
      const child = await this.prisma.childProfile.findUnique({
        where: { id: childId, isActive: true }
      });

      if (!child) {
        throw new Error(`Child not found or inactive: ${childId}`);
      }

      // Verify activity exists
      const activity = await this.prisma.studyActivity.findUnique({
        where: { id: progressUpdate.activityId },
        include: { plan: true }
      });

      if (!activity) {
        throw new Error(`Activity not found: ${progressUpdate.activityId}`);
      }

      // Get existing progress record or create new one
      const existingProgress = await this.prisma.progressRecord.findUnique({
        where: {
          childId_activityId: {
            childId,
            activityId: progressUpdate.activityId
          }
        }
      });

      // Prepare update data
      const updateData: any = {
        timeSpent: existingProgress 
          ? existingProgress.timeSpent + progressUpdate.timeSpent
          : progressUpdate.timeSpent,
        updatedAt: new Date()
      };

      // Update session data if provided
      if (progressUpdate.sessionData) {
        const existingSessionData = existingProgress?.sessionData as any || {};
        updateData.sessionData = {
          ...existingSessionData,
          ...progressUpdate.sessionData,
          lastUpdate: new Date().toISOString()
        };
      }

      // Update other fields if provided
      if (progressUpdate.score !== undefined) {
        updateData.score = progressUpdate.score;
      }

      if (progressUpdate.status) {
        updateData.status = progressUpdate.status;
        
        // Set completion timestamp if completed
        if (progressUpdate.status === ProgressStatus.COMPLETED) {
          updateData.completedAt = new Date();
        }
      }

      if (progressUpdate.helpRequestsCount !== undefined) {
        updateData.helpRequestsCount = progressUpdate.helpRequestsCount;
      }

      if (progressUpdate.pauseCount !== undefined) {
        updateData.pauseCount = existingProgress 
          ? existingProgress.pauseCount + progressUpdate.pauseCount
          : progressUpdate.pauseCount;
      }

      if (progressUpdate.resumeCount !== undefined) {
        updateData.resumeCount = existingProgress 
          ? existingProgress.resumeCount + progressUpdate.resumeCount
          : progressUpdate.resumeCount;
      }

      // Update or create progress record
      const progressRecord = await this.prisma.progressRecord.upsert({
        where: {
          childId_activityId: {
            childId,
            activityId: progressUpdate.activityId
          }
        },
        update: updateData,
        create: {
          childId,
          activityId: progressUpdate.activityId,
          status: progressUpdate.status || ProgressStatus.IN_PROGRESS,
          score: progressUpdate.score || 0,
          timeSpent: progressUpdate.timeSpent,
          attempts: 1,
          sessionData: progressUpdate.sessionData ? JSON.parse(JSON.stringify(progressUpdate.sessionData)) : {},
          helpRequestsCount: progressUpdate.helpRequestsCount || 0,
          pauseCount: progressUpdate.pauseCount || 0,
          resumeCount: progressUpdate.resumeCount || 0
        }
      });

      // Update learning streaks if activity was completed
      if (progressUpdate.status === ProgressStatus.COMPLETED) {
        await this.updateLearningStreaks(childId, activity.plan.subject, progressUpdate.score || 0);
      }

      // Invalidate cached progress data after update
      await this.invalidateProgressCache(childId);

      logger.info(`Progress updated successfully for child ${childId}, activity ${progressUpdate.activityId}`);
      return progressRecord;

    } catch (error) {
      logger.error('Error updating activity progress:', error);
      throw error;
    }
  }

  /**
   * Calculate and maintain learning streaks
   */
  async updateLearningStreaks(
    childId: string,
    subject: string,
    score: number
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update daily streak
      await this.updateStreakByType(childId, StreakType.DAILY, today);

      // Update weekly streak
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      await this.updateStreakByType(childId, StreakType.WEEKLY, weekStart);

      // Update activity completion streak
      await this.updateStreakByType(childId, StreakType.ACTIVITY_COMPLETION, today);

      // Update perfect score streak if applicable
      if (score >= 100) {
        await this.updateStreakByType(childId, StreakType.PERFECT_SCORE, today);
      } else {
        // Reset perfect score streak
        await this.resetStreak(childId, StreakType.PERFECT_SCORE);
      }

      logger.info(`Learning streaks updated for child ${childId}`);

    } catch (error) {
      logger.error('Error updating learning streaks:', error);
      throw error;
    }
  }

  /**
   * Update a specific streak type
   */
  private async updateStreakByType(
    childId: string,
    streakType: StreakType,
    activityDate: Date
  ): Promise<void> {
    try {
      const existingStreak = await this.prisma.learningStreak.findUnique({
        where: {
          childId_streakType: {
            childId,
            streakType
          }
        }
      });

      if (!existingStreak) {
        // Create new streak
        await this.prisma.learningStreak.create({
          data: {
            childId,
            streakType,
            currentCount: 1,
            longestCount: 1,
            lastActivityDate: activityDate,
            streakStartDate: activityDate,
            isActive: true
          }
        });
        return;
      }

      // Check if streak should continue or reset
      const lastActivityDate = existingStreak.lastActivityDate;
      let shouldContinueStreak = false;

      if (lastActivityDate) {
        const daysDiff = Math.floor((activityDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (streakType === StreakType.DAILY) {
          shouldContinueStreak = daysDiff === 1 || daysDiff === 0;
        } else if (streakType === StreakType.WEEKLY) {
          shouldContinueStreak = daysDiff <= 7;
        } else {
          shouldContinueStreak = daysDiff <= 1;
        }
      }

      if (shouldContinueStreak && lastActivityDate) {
        const daysDiff = Math.floor((activityDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only increment if it's a new day/period
        const shouldIncrement = daysDiff > 0;
        
        const newCount = shouldIncrement ? existingStreak.currentCount + 1 : existingStreak.currentCount;
        const newLongestCount = Math.max(existingStreak.longestCount, newCount);

        await this.prisma.learningStreak.update({
          where: { id: existingStreak.id },
          data: {
            currentCount: newCount,
            longestCount: newLongestCount,
            lastActivityDate: activityDate,
            isActive: true
          }
        });
      } else {
        // Reset streak
        await this.prisma.learningStreak.update({
          where: { id: existingStreak.id },
          data: {
            currentCount: 1,
            lastActivityDate: activityDate,
            streakStartDate: activityDate,
            isActive: true
          }
        });
      }

    } catch (error) {
      logger.error(`Error updating ${streakType} streak:`, error);
      throw error;
    }
  }

  /**
   * Reset a specific streak type
   */
  private async resetStreak(childId: string, streakType: StreakType): Promise<void> {
    try {
      await this.prisma.learningStreak.updateMany({
        where: {
          childId,
          streakType
        },
        data: {
          currentCount: 0,
          isActive: false
        }
      });
    } catch (error) {
      logger.error(`Error resetting ${streakType} streak:`, error);
      throw error;
    }
  }

  /**
   * Get progress history with time-based filtering
   */
  async getProgressHistory(
    childId: string,
    filter: ProgressHistoryFilter = {}
  ): Promise<{
    records: ProgressRecord[];
    totalCount: number;
    summary: ChildProgressSummary;
  }> {
    try {
      // Build where clause
      const whereClause: any = { childId };

      // Apply time frame filter
      if (filter.timeFrame) {
        whereClause.updatedAt = {
          gte: new Date(filter.timeFrame.start),
          lte: new Date(filter.timeFrame.end)
        };
      }

      // Apply status filter
      if (filter.status && filter.status.length > 0) {
        whereClause.status = { in: filter.status };
      }

      // Apply score filter
      if (filter.minScore !== undefined || filter.maxScore !== undefined) {
        whereClause.score = {};
        if (filter.minScore !== undefined) {
          whereClause.score.gte = filter.minScore;
        }
        if (filter.maxScore !== undefined) {
          whereClause.score.lte = filter.maxScore;
        }
      }

      // Apply subject filter through activity relation
      if (filter.subjects && filter.subjects.length > 0) {
        whereClause.activity = {
          plan: {
            subject: { in: filter.subjects }
          }
        };
      }

      // Get total count
      const totalCount = await this.prisma.progressRecord.count({ where: whereClause });

      // Get records with pagination
      const records = await this.prisma.progressRecord.findMany({
        where: whereClause,
        include: {
          activity: {
            include: {
              plan: true
            }
          },
          helpRequests: true
        },
        orderBy: { updatedAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0
      });

      // Generate summary
      const summary = await this.generateProgressSummary(childId, filter.timeFrame);

      return {
        records,
        totalCount,
        summary
      };

    } catch (error) {
      logger.error('Error getting progress history:', error);
      throw error;
    }
  }

  /**
   * Validate activity completion with enhanced scoring
   */
  async validateActivityCompletion(
    childId: string,
    activityId: string,
    submittedScore: number,
    timeSpent: number,
    sessionData: ActivitySessionData
  ): Promise<ActivityCompletionValidation> {
    try {
      // Get activity details
      const activity = await this.prisma.studyActivity.findUnique({
        where: { id: activityId },
        include: { plan: true }
      });

      if (!activity) {
        throw new Error(`Activity not found: ${activityId}`);
      }

      // Get completion criteria (from activity or default)
      const completionCriteria: CompletionCriteria = {
        minimumScore: 60, // Default minimum score
        minimumTimeSpent: Math.max(30, activity.estimatedDuration * 60 * 0.3), // At least 30% of estimated time
        requiredInteractions: 5, // Minimum interactions
        allowedHelpRequests: 3, // Maximum help requests before penalty
        timeLimit: activity.estimatedDuration * 60 * 3, // 3x estimated duration as limit
        ...(activity.completionCriteria as any || {})
      };

      const validationErrors: string[] = [];
      let adjustedScore = submittedScore;
      let bonusPoints = 0;
      let penalties = 0;

      // Validate minimum score
      if (submittedScore < completionCriteria.minimumScore) {
        validationErrors.push(`Score ${submittedScore} is below minimum required ${completionCriteria.minimumScore}`);
      }

      // Validate minimum time spent
      if (timeSpent < completionCriteria.minimumTimeSpent) {
        validationErrors.push(`Time spent ${timeSpent}s is below minimum required ${completionCriteria.minimumTimeSpent}s`);
        penalties += 5; // 5 point penalty for rushing
      }

      // Validate interaction count
      const interactionCount = sessionData.interactionEvents?.length || 0;
      if (interactionCount < completionCriteria.requiredInteractions) {
        validationErrors.push(`Interaction count ${interactionCount} is below required ${completionCriteria.requiredInteractions}`);
        penalties += 3; // 3 point penalty for low engagement
      }

      // Check help requests
      const helpRequestCount = sessionData.helpRequests?.length || 0;
      if (helpRequestCount > completionCriteria.allowedHelpRequests) {
        penalties += (helpRequestCount - completionCriteria.allowedHelpRequests) * 2; // 2 points per excess help request
      }

      // Check time limit
      if (completionCriteria.timeLimit && timeSpent > completionCriteria.timeLimit) {
        penalties += 5; // 5 point penalty for exceeding time limit
      }

      // Calculate bonus points
      
      // Perfect score bonus
      if (submittedScore === 100) {
        bonusPoints += 5;
      }

      // Efficiency bonus (completing in less than estimated time with good score)
      const estimatedTimeSeconds = activity.estimatedDuration * 60;
      if (timeSpent < estimatedTimeSeconds && submittedScore >= 80) {
        const efficiencyRatio = estimatedTimeSeconds / timeSpent;
        bonusPoints += Math.min(10, Math.floor(efficiencyRatio * 2)); // Up to 10 bonus points
      }

      // No help bonus
      if (helpRequestCount === 0 && submittedScore >= 70) {
        bonusPoints += 3;
      }

      // High engagement bonus
      if (interactionCount > completionCriteria.requiredInteractions * 2) {
        bonusPoints += 2;
      }

      // Apply adjustments
      adjustedScore = Math.max(0, Math.min(100, submittedScore + bonusPoints - penalties));

      const isValid = validationErrors.length === 0 && adjustedScore >= completionCriteria.minimumScore;

      return {
        isValid,
        score: submittedScore,
        adjustedScore,
        completionCriteria,
        validationErrors,
        bonusPoints,
        penalties
      };

    } catch (error) {
      logger.error('Error validating activity completion:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive progress summary
   */
  async generateProgressSummary(
    childId: string,
    timeFrame?: TimeFrame
  ): Promise<ChildProgressSummary> {
    try {
      // Check cache first for progress summary
      const cacheKey = `progress_summary:${childId}:${timeFrame ? `${timeFrame.start}_${timeFrame.end}` : 'all'}`;
      const cachedSummary = await redisService.getCacheObject<ChildProgressSummary>(cacheKey);
      
      if (cachedSummary) {
        logger.debug(`Returning cached progress summary for child ${childId}`);
        return cachedSummary;
      }
      // Build date filter
      const dateFilter: any = {};
      if (timeFrame) {
        dateFilter.updatedAt = {
          gte: new Date(timeFrame.start),
          lte: new Date(timeFrame.end)
        };
      }

      // Get all progress records
      const progressRecords = await this.prisma.progressRecord.findMany({
        where: {
          childId,
          ...dateFilter
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        }
      });

      // Calculate basic metrics
      const totalActivities = progressRecords.length;
      const completedActivities = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED).length;
      const inProgressActivities = progressRecords.filter(r => r.status === ProgressStatus.IN_PROGRESS).length;
      
      const totalTimeSpent = progressRecords.reduce((sum, record) => sum + record.timeSpent, 0);
      const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
      const averageScore = completedRecords.length > 0 
        ? completedRecords.reduce((sum, record) => sum + (record.score || 0), 0) / completedRecords.length
        : 0;

      // Get learning streaks
      const dailyStreak = await this.prisma.learningStreak.findUnique({
        where: {
          childId_streakType: {
            childId,
            streakType: StreakType.DAILY
          }
        }
      });

      const currentDailyStreak = dailyStreak?.currentCount || 0;
      const longestDailyStreak = dailyStreak?.longestCount || 0;

      // Get last activity date
      const lastActivityDate = progressRecords.length > 0
        ? progressRecords.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))[0].updatedAt
        : null;

      // Calculate weekly and monthly goal progress
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const weeklyActivities = progressRecords.filter(r => 
        r.updatedAt && r.updatedAt >= weekStart && r.status === ProgressStatus.COMPLETED
      ).length;

      const monthlyActivities = progressRecords.filter(r => 
        r.updatedAt && r.updatedAt >= monthStart && r.status === ProgressStatus.COMPLETED
      ).length;

      // Assume weekly goal of 10 activities and monthly goal of 40
      const weeklyGoalProgress = Math.min(100, (weeklyActivities / 10) * 100);
      const monthlyGoalProgress = Math.min(100, (monthlyActivities / 40) * 100);

      // Generate subject progress summaries
      const subjectProgress = await this.generateSubjectProgressSummaries(childId, progressRecords);

      const summary: ChildProgressSummary = {
        totalActivities,
        completedActivities,
        inProgressActivities,
        totalTimeSpent,
        averageScore,
        currentDailyStreak,
        longestDailyStreak,
        lastActivityDate,
        weeklyGoalProgress,
        monthlyGoalProgress,
        subjectProgress
      };

      // Cache the summary for 15 minutes
      await redisService.setCacheObject(cacheKey, summary, 15 * 60);

      return summary;

    } catch (error) {
      logger.error('Error generating progress summary:', error);
      throw error;
    }
  }

  /**
   * Generate subject-specific progress summaries
   */
  private async generateSubjectProgressSummaries(
    childId: string,
    progressRecords: any[]
  ): Promise<SubjectProgressSummary[]> {
    try {
      // Group records by subject
      const subjectGroups = new Map<string, any[]>();

      for (const record of progressRecords) {
        const subject = record.activity.plan.subject;
        if (!subjectGroups.has(subject)) {
          subjectGroups.set(subject, []);
        }
        subjectGroups.get(subject)!.push(record);
      }

      const subjectSummaries: SubjectProgressSummary[] = [];

      for (const [subject, records] of subjectGroups.entries()) {
        const completedRecords = records.filter(r => r.status === ProgressStatus.COMPLETED);
        const totalActivities = records.length;
        const completedActivities = completedRecords.length;
        
        const averageScore = completedRecords.length > 0
          ? completedRecords.reduce((sum, record) => sum + (record.score || 0), 0) / completedRecords.length
          : 0;

        const timeSpent = records.reduce((sum, record) => sum + record.timeSpent, 0);

        const lastActivity = records.length > 0
          ? records.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))[0].updatedAt
          : null;

        // Determine proficiency level based on completion rate and average score
        let proficiencyLevel: ProficiencyLevel = 'beginner';
        const completionRate = totalActivities > 0 ? completedActivities / totalActivities : 0;

        if (completionRate >= 0.8 && averageScore >= 90) {
          proficiencyLevel = 'mastered';
        } else if (completionRate >= 0.6 && averageScore >= 75) {
          proficiencyLevel = 'proficient';
        } else if (completionRate >= 0.3 && averageScore >= 60) {
          proficiencyLevel = 'developing';
        }

        subjectSummaries.push({
          subjectId: subject, // Using subject name as ID for now
          subjectName: subject,
          completedActivities,
          totalActivities,
          averageScore,
          timeSpent,
          proficiencyLevel,
          lastActivity
        });
      }

      return subjectSummaries.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    } catch (error) {
      logger.error('Error generating subject progress summaries:', error);
      throw error;
    }
  }

  /**
   * Get current learning streaks for a child
   */
  async getLearningStreaks(childId: string): Promise<LearningStreak[]> {
    try {
      // Check cache first
      const cacheKey = `learning_streaks:${childId}`;
      const cachedStreaks = await redisService.getCacheObject<LearningStreak[]>(cacheKey);
      
      if (cachedStreaks) {
        logger.debug(`Returning cached learning streaks for child ${childId}`);
        return cachedStreaks;
      }

      const streaks = await this.prisma.learningStreak.findMany({
        where: { childId },
        orderBy: { streakType: 'asc' }
      });

      // Cache for 5 minutes
      await redisService.setCacheObject(cacheKey, streaks, 5 * 60);

      return streaks;
    } catch (error) {
      logger.error('Error getting learning streaks:', error);
      throw error;
    }
  }

  /**
   * Get real-time progress updates for active session
   */
  async getRealtimeProgress(childId: string, sessionId?: string): Promise<{
    activeActivities: ProgressRecord[];
    currentStreaks: LearningStreak[];
    todaysSummary: any;
  }> {
    try {
      // Get active (in-progress) activities
      const activeActivities = await this.prisma.progressRecord.findMany({
        where: {
          childId,
          status: ProgressStatus.IN_PROGRESS
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Get current streaks
      const currentStreaks = await this.getLearningStreaks(childId);

      // Get today's summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todaysSummary = await this.generateProgressSummary(childId, {
        start: today.toISOString(),
        end: tomorrow.toISOString()
      });

      return {
        activeActivities,
        currentStreaks,
        todaysSummary
      };

    } catch (error) {
      logger.error('Error getting realtime progress:', error);
      throw error;
    }
  }

  /**
   * Invalidate all cached progress data for a child
   */
  private async invalidateProgressCache(childId: string): Promise<void> {
    try {
      // Invalidate progress summary cache
      await redisService.deletePattern(`progress_summary:${childId}:*`);
      
      // Invalidate learning streaks cache
      await redisService.del(`learning_streaks:${childId}`);
      
      // Invalidate realtime progress cache
      await redisService.del(`realtime_progress:${childId}`);
      
      logger.debug(`Invalidated progress cache for child ${childId}`);
    } catch (error) {
      logger.error('Error invalidating progress cache:', error);
    }
  }

  /**
   * Warm up cache for frequently accessed data
   */
  async warmProgressCache(childId: string): Promise<void> {
    try {
      // Pre-load progress summary
      await this.generateProgressSummary(childId);
      
      // Pre-load learning streaks
      await this.getLearningStreaks(childId);
      
      // Pre-load realtime progress
      await this.getRealtimeProgress(childId);
      
      logger.info(`Warmed progress cache for child ${childId}`);
    } catch (error) {
      logger.error('Error warming progress cache:', error);
    }
  }

  /**
   * Get cached dashboard data with fallback to database
   */
  async getCachedDashboardData(childId: string): Promise<{
    summary: ChildProgressSummary;
    streaks: LearningStreak[];
    realtimeProgress: any;
  }> {
    try {
      const [summary, streaks, realtimeProgress] = await Promise.all([
        this.generateProgressSummary(childId),
        this.getLearningStreaks(childId),
        this.getRealtimeProgress(childId)
      ]);

      return {
        summary,
        streaks,
        realtimeProgress
      };
    } catch (error) {
      logger.error('Error getting cached dashboard data:', error);
      throw error;
    }
  }
}

export { ChildProgressService };
export const childProgressService = new ChildProgressService();