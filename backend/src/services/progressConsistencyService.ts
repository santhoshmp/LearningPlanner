import { PrismaClient, ProgressStatus, StreakType } from '@prisma/client';
import { logger } from '../utils/logger';
import { ProgressValidationService, ProgressUpdatePayload } from '../utils/progressValidation';
import { childProgressService } from './childProgressService';

export interface ConsistencyCheckResult {
  dashboardConsistent: boolean;
  streaksConsistent: boolean;
  progressRecordsConsistent: boolean;
  studyPlanProgressConsistent: boolean;
  inconsistencies: Inconsistency[];
  corrections: Correction[];
}

export interface Inconsistency {
  type: 'dashboard' | 'streaks' | 'progress' | 'study_plan';
  description: string;
  expected: any;
  actual: any;
  severity: 'low' | 'medium' | 'high';
}

export interface Correction {
  type: string;
  description: string;
  action: string;
  data: any;
}

export interface TransactionalProgressUpdate {
  childId: string;
  payload: ProgressUpdatePayload;
  validateConsistency: boolean;
  autoCorrect: boolean;
}

/**
 * Service for handling progress updates with comprehensive consistency checks and transaction management
 */
export class ProgressConsistencyService {
  private prisma: PrismaClient;
  private validationService: ProgressValidationService;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
    this.validationService = new ProgressValidationService(this.prisma);
  }

  /**
   * Update progress with full validation and consistency checks in a transaction
   */
  async updateProgressWithConsistencyChecks(
    update: TransactionalProgressUpdate
  ): Promise<{
    success: boolean;
    progressRecord?: any;
    validationResult?: any;
    consistencyResult?: ConsistencyCheckResult;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // 1. Validate the progress update payload
      const validationResult = await this.validationService.validateProgressUpdate(
        update.childId,
        update.payload
      );

      if (!validationResult.isValid) {
        return {
          success: false,
          validationResult,
          errors: validationResult.errors.map(e => e.message)
        };
      }

      // 2. Perform the update in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update progress record
        const progressRecord = await this.updateProgressRecord(
          tx,
          update.childId,
          validationResult.sanitizedData
        );

        // Update learning streaks if activity completed
        if (update.payload.status === ProgressStatus.COMPLETED) {
          await this.updateLearningStreaksInTransaction(
            tx,
            update.childId,
            update.payload.activityId,
            update.payload.score || 0,
            update.payload.helpRequestsCount || 0
          );
        }

        // Update study plan progress
        await this.updateStudyPlanProgressInTransaction(
          tx,
          update.childId,
          update.payload.activityId
        );

        return progressRecord;
      });

      // 3. Perform consistency checks if requested
      let consistencyResult: ConsistencyCheckResult | undefined;
      if (update.validateConsistency) {
        consistencyResult = await this.performConsistencyChecks(update.childId);
        
        // Auto-correct inconsistencies if requested
        if (update.autoCorrect && consistencyResult.inconsistencies.length > 0) {
          await this.correctInconsistencies(update.childId, consistencyResult.corrections);
        }
      }

      return {
        success: true,
        progressRecord: result,
        validationResult,
        consistencyResult,
        errors: []
      };

    } catch (error) {
      logger.error('Progress update with consistency checks failed:', error);
      errors.push('Failed to update progress with consistency checks');
      
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Update progress record within a transaction
   */
  private async updateProgressRecord(
    tx: any,
    childId: string,
    payload: ProgressUpdatePayload
  ): Promise<any> {
    // Get existing progress record
    const existingProgress = await tx.progressRecord.findUnique({
      where: {
        childId_activityId: {
          childId,
          activityId: payload.activityId
        }
      }
    });

    // Prepare update data
    const updateData: any = {
      timeSpent: existingProgress 
        ? existingProgress.timeSpent + payload.timeSpent
        : payload.timeSpent,
      updatedAt: new Date()
    };

    // Update session data if provided
    if (payload.sessionData) {
      const existingSessionData = existingProgress?.sessionData as any || {};
      updateData.sessionData = {
        ...existingSessionData,
        ...payload.sessionData,
        lastUpdate: new Date().toISOString()
      };
    }

    // Update other fields if provided
    if (payload.score !== undefined) {
      updateData.score = payload.score;
    }

    if (payload.status) {
      updateData.status = payload.status;
      
      // Set completion timestamp if completed
      if (payload.status === ProgressStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    if (payload.helpRequestsCount !== undefined) {
      updateData.helpRequestsCount = payload.helpRequestsCount;
    }

    if (payload.pauseCount !== undefined) {
      updateData.pauseCount = existingProgress 
        ? existingProgress.pauseCount + payload.pauseCount
        : payload.pauseCount;
    }

    if (payload.resumeCount !== undefined) {
      updateData.resumeCount = existingProgress 
        ? existingProgress.resumeCount + payload.resumeCount
        : payload.resumeCount;
    }

    // Increment attempts if this is a new attempt
    if (!existingProgress || payload.status === ProgressStatus.IN_PROGRESS) {
      updateData.attempts = existingProgress ? existingProgress.attempts + 1 : 1;
    }

    // Update or create progress record
    return await tx.progressRecord.upsert({
      where: {
        childId_activityId: {
          childId,
          activityId: payload.activityId
        }
      },
      update: updateData,
      create: {
        childId,
        activityId: payload.activityId,
        status: payload.status || ProgressStatus.IN_PROGRESS,
        score: payload.score || 0,
        timeSpent: payload.timeSpent,
        attempts: 1,
        sessionData: payload.sessionData ? JSON.parse(JSON.stringify(payload.sessionData)) : {},
        helpRequestsCount: payload.helpRequestsCount || 0,
        pauseCount: payload.pauseCount || 0,
        resumeCount: payload.resumeCount || 0
      }
    });
  }

  /**
   * Update learning streaks within a transaction
   */
  private async updateLearningStreaksInTransaction(
    tx: any,
    childId: string,
    activityId: string,
    score: number,
    helpRequestsCount: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get activity subject for streak calculation
    const activity = await tx.studyActivity.findUnique({
      where: { id: activityId },
      include: { plan: true }
    });

    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    // Update daily streak
    await this.updateStreakInTransaction(tx, childId, StreakType.DAILY, today);

    // Update weekly streak
    const weekStart = this.getWeekStart(today);
    await this.updateStreakInTransaction(tx, childId, StreakType.WEEKLY, weekStart);

    // Update activity completion streak
    await this.updateStreakInTransaction(tx, childId, StreakType.ACTIVITY_COMPLETION, today);

    // Update perfect score streak if applicable
    if (score >= 100) {
      await this.updateStreakInTransaction(tx, childId, StreakType.PERFECT_SCORE, today);
    } else {
      await this.conditionallyResetStreakInTransaction(tx, childId, StreakType.PERFECT_SCORE);
    }

    // Update help-free streak if no help was requested
    if (helpRequestsCount === 0) {
      await this.updateStreakInTransaction(tx, childId, StreakType.HELP_FREE, today);
    } else {
      await this.conditionallyResetStreakInTransaction(tx, childId, StreakType.HELP_FREE);
    }
  }

  /**
   * Update a specific streak type within a transaction
   */
  private async updateStreakInTransaction(
    tx: any,
    childId: string,
    streakType: StreakType,
    activityDate: Date
  ): Promise<void> {
    const existingStreak = await tx.learningStreak.findUnique({
      where: {
        childId_streakType: {
          childId,
          streakType
        }
      }
    });

    if (!existingStreak) {
      // Create new streak
      await tx.learningStreak.create({
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
    let shouldIncrement = false;

    if (lastActivityDate) {
      const timeDiff = activityDate.getTime() - lastActivityDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      if (streakType === StreakType.DAILY) {
        shouldContinueStreak = daysDiff >= 0 && daysDiff <= 1;
        shouldIncrement = daysDiff === 1;
      } else if (streakType === StreakType.WEEKLY) {
        const lastWeekStart = this.getWeekStart(lastActivityDate);
        const currentWeekStart = this.getWeekStart(activityDate);
        const weeksDiff = Math.floor((currentWeekStart.getTime() - lastWeekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        shouldContinueStreak = weeksDiff >= 0 && weeksDiff <= 1;
        shouldIncrement = weeksDiff === 1;
      } else if (streakType === StreakType.ACTIVITY_COMPLETION) {
        shouldContinueStreak = true;
        shouldIncrement = true;
      } else if (streakType === StreakType.PERFECT_SCORE || streakType === StreakType.HELP_FREE) {
        shouldContinueStreak = daysDiff >= 0;
        shouldIncrement = true;
      }
    } else {
      shouldContinueStreak = true;
      shouldIncrement = true;
    }

    if (shouldContinueStreak) {
      const newCount = shouldIncrement ? existingStreak.currentCount + 1 : existingStreak.currentCount;
      const newLongestCount = Math.max(existingStreak.longestCount, newCount);

      await tx.learningStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentCount: newCount,
          longestCount: newLongestCount,
          lastActivityDate: activityDate,
          isActive: true
        }
      });
    } else {
      // Reset streak and start new one
      await tx.learningStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentCount: 1,
          lastActivityDate: activityDate,
          streakStartDate: activityDate,
          isActive: true
        }
      });
    }
  }

  /**
   * Conditionally reset a streak within a transaction
   */
  private async conditionallyResetStreakInTransaction(
    tx: any,
    childId: string,
    streakType: StreakType
  ): Promise<void> {
    const existingStreak = await tx.learningStreak.findUnique({
      where: {
        childId_streakType: {
          childId,
          streakType
        }
      }
    });

    if (existingStreak && existingStreak.isActive && existingStreak.currentCount > 0) {
      await tx.learningStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentCount: 0,
          isActive: false
        }
      });
    }
  }

  /**
   * Update study plan progress within a transaction
   */
  private async updateStudyPlanProgressInTransaction(
    tx: any,
    childId: string,
    activityId: string
  ): Promise<void> {
    // Get the study plan for this activity
    const activity = await tx.studyActivity.findUnique({
      where: { id: activityId },
      include: {
        plan: {
          include: {
            activities: {
              include: {
                progressRecords: {
                  where: { childId }
                }
              }
            }
          }
        }
      }
    });

    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const studyPlan = activity.plan;
    
    // Calculate progress statistics
    const totalActivities = studyPlan.activities.length;
    const completedActivities = studyPlan.activities.filter(act => 
      act.progressRecords.some(record => record.status === ProgressStatus.COMPLETED)
    ).length;
    
    const progressPercentage = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    // Update study plan status based on progress
    let newStatus = studyPlan.status;
    if (progressPercentage === 100 && studyPlan.status !== 'COMPLETED') {
      newStatus = 'COMPLETED';
    } else if (progressPercentage > 0 && studyPlan.status === 'DRAFT') {
      newStatus = 'ACTIVE';
    }

    // Update study plan if status changed
    if (newStatus !== studyPlan.status) {
      await tx.studyPlan.update({
        where: { id: studyPlan.id },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Perform comprehensive consistency checks across all data
   */
  async performConsistencyChecks(childId: string): Promise<ConsistencyCheckResult> {
    const inconsistencies: Inconsistency[] = [];
    const corrections: Correction[] = [];

    try {
      // 1. Check progress records consistency
      await this.checkProgressRecordsConsistency(childId, inconsistencies, corrections);

      // 2. Check learning streaks consistency
      await this.checkLearningStreaksConsistency(childId, inconsistencies, corrections);

      // 3. Check study plan progress consistency
      await this.checkStudyPlanProgressConsistency(childId, inconsistencies, corrections);

      // 4. Check dashboard data consistency
      await this.checkDashboardConsistency(childId, inconsistencies, corrections);

      return {
        dashboardConsistent: !inconsistencies.some(i => i.type === 'dashboard'),
        streaksConsistent: !inconsistencies.some(i => i.type === 'streaks'),
        progressRecordsConsistent: !inconsistencies.some(i => i.type === 'progress'),
        studyPlanProgressConsistent: !inconsistencies.some(i => i.type === 'study_plan'),
        inconsistencies,
        corrections
      };

    } catch (error) {
      logger.error('Consistency check error:', error);
      inconsistencies.push({
        type: 'progress',
        description: 'Failed to perform consistency checks',
        expected: 'successful check',
        actual: 'error occurred',
        severity: 'high'
      });

      return {
        dashboardConsistent: false,
        streaksConsistent: false,
        progressRecordsConsistent: false,
        studyPlanProgressConsistent: false,
        inconsistencies,
        corrections
      };
    }
  }

  /**
   * Check progress records for internal consistency
   */
  private async checkProgressRecordsConsistency(
    childId: string,
    inconsistencies: Inconsistency[],
    corrections: Correction[]
  ): Promise<void> {
    const progressRecords = await this.prisma.progressRecord.findMany({
      where: { childId },
      include: {
        activity: {
          include: { plan: true }
        }
      }
    });

    for (const record of progressRecords) {
      // Check for negative values
      if (record.timeSpent < 0) {
        inconsistencies.push({
          type: 'progress',
          description: `Negative time spent in progress record ${record.id}`,
          expected: 'positive time spent',
          actual: record.timeSpent,
          severity: 'high'
        });

        corrections.push({
          type: 'progress_record_fix',
          description: 'Fix negative time spent',
          action: 'set_time_spent_to_zero',
          data: { recordId: record.id, currentValue: record.timeSpent }
        });
      }

      // Check for invalid scores
      if (record.score < 0 || record.score > 100) {
        inconsistencies.push({
          type: 'progress',
          description: `Invalid score in progress record ${record.id}`,
          expected: 'score between 0 and 100',
          actual: record.score,
          severity: 'medium'
        });

        corrections.push({
          type: 'progress_record_fix',
          description: 'Fix invalid score',
          action: 'clamp_score',
          data: { recordId: record.id, currentValue: record.score }
        });
      }

      // Check for completed status without completion date
      if (record.status === ProgressStatus.COMPLETED && !record.completedAt) {
        inconsistencies.push({
          type: 'progress',
          description: `Completed progress record ${record.id} missing completion date`,
          expected: 'completion date present',
          actual: 'null completion date',
          severity: 'medium'
        });

        corrections.push({
          type: 'progress_record_fix',
          description: 'Set completion date',
          action: 'set_completion_date',
          data: { recordId: record.id, updatedAt: record.updatedAt }
        });
      }
    }
  }

  /**
   * Check learning streaks for consistency
   */
  private async checkLearningStreaksConsistency(
    childId: string,
    inconsistencies: Inconsistency[],
    corrections: Correction[]
  ): Promise<void> {
    const streaks = await this.prisma.learningStreak.findMany({
      where: { childId }
    });

    const progressRecords = await this.prisma.progressRecord.findMany({
      where: { 
        childId,
        status: ProgressStatus.COMPLETED
      },
      orderBy: { completedAt: 'desc' }
    });

    for (const streak of streaks) {
      // Check for negative streak counts
      if (streak.currentCount < 0 || streak.longestCount < 0) {
        inconsistencies.push({
          type: 'streaks',
          description: `Negative streak count for ${streak.streakType}`,
          expected: 'non-negative counts',
          actual: `current: ${streak.currentCount}, longest: ${streak.longestCount}`,
          severity: 'medium'
        });

        corrections.push({
          type: 'streak_fix',
          description: 'Fix negative streak counts',
          action: 'reset_negative_counts',
          data: { streakId: streak.id, streakType: streak.streakType }
        });
      }

      // Check if current count exceeds longest count
      if (streak.currentCount > streak.longestCount) {
        inconsistencies.push({
          type: 'streaks',
          description: `Current count exceeds longest count for ${streak.streakType}`,
          expected: 'current count <= longest count',
          actual: `current: ${streak.currentCount}, longest: ${streak.longestCount}`,
          severity: 'low'
        });

        corrections.push({
          type: 'streak_fix',
          description: 'Update longest count',
          action: 'update_longest_count',
          data: { streakId: streak.id, newLongestCount: streak.currentCount }
        });
      }

      // Verify daily streak against actual completion dates
      if (streak.streakType === StreakType.DAILY && progressRecords.length > 0) {
        const recentCompletions = this.getRecentDailyCompletions(progressRecords);
        const expectedDailyStreak = this.calculateExpectedDailyStreak(recentCompletions);
        
        if (Math.abs(streak.currentCount - expectedDailyStreak) > 1) {
          inconsistencies.push({
            type: 'streaks',
            description: `Daily streak count mismatch`,
            expected: expectedDailyStreak,
            actual: streak.currentCount,
            severity: 'medium'
          });

          corrections.push({
            type: 'streak_fix',
            description: 'Recalculate daily streak',
            action: 'recalculate_daily_streak',
            data: { streakId: streak.id, expectedCount: expectedDailyStreak }
          });
        }
      }
    }
  }

  /**
   * Check study plan progress consistency
   */
  private async checkStudyPlanProgressConsistency(
    childId: string,
    inconsistencies: Inconsistency[],
    corrections: Correction[]
  ): Promise<void> {
    const studyPlans = await this.prisma.studyPlan.findMany({
      where: { childId },
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

    for (const plan of studyPlans) {
      const totalActivities = plan.activities.length;
      const completedActivities = plan.activities.filter(activity =>
        activity.progressRecords.some(record => record.status === ProgressStatus.COMPLETED)
      ).length;

      const progressPercentage = totalActivities > 0 
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

      // Check if plan status matches progress
      if (progressPercentage === 100 && plan.status !== 'COMPLETED') {
        inconsistencies.push({
          type: 'study_plan',
          description: `Study plan ${plan.id} should be marked as completed`,
          expected: 'COMPLETED status',
          actual: plan.status,
          severity: 'medium'
        });

        corrections.push({
          type: 'study_plan_fix',
          description: 'Mark study plan as completed',
          action: 'update_plan_status',
          data: { planId: plan.id, newStatus: 'COMPLETED' }
        });
      }

      if (progressPercentage > 0 && plan.status === 'DRAFT') {
        inconsistencies.push({
          type: 'study_plan',
          description: `Study plan ${plan.id} with progress should be active`,
          expected: 'ACTIVE status',
          actual: plan.status,
          severity: 'low'
        });

        corrections.push({
          type: 'study_plan_fix',
          description: 'Mark study plan as active',
          action: 'update_plan_status',
          data: { planId: plan.id, newStatus: 'ACTIVE' }
        });
      }
    }
  }

  /**
   * Check dashboard data consistency
   */
  private async checkDashboardConsistency(
    childId: string,
    inconsistencies: Inconsistency[],
    corrections: Correction[]
  ): Promise<void> {
    // Generate fresh dashboard data
    const freshSummary = await childProgressService.generateProgressSummary(childId);
    
    // Compare with cached data if available
    // This is a simplified check - in a real implementation, you'd compare with cached dashboard data
    
    // Check for reasonable values
    if (freshSummary.averageScore < 0 || freshSummary.averageScore > 100) {
      inconsistencies.push({
        type: 'dashboard',
        description: 'Invalid average score in dashboard summary',
        expected: 'score between 0 and 100',
        actual: freshSummary.averageScore,
        severity: 'medium'
      });

      corrections.push({
        type: 'dashboard_fix',
        description: 'Recalculate dashboard summary',
        action: 'regenerate_summary',
        data: { childId }
      });
    }

    if (freshSummary.totalTimeSpent < 0) {
      inconsistencies.push({
        type: 'dashboard',
        description: 'Negative total time spent in dashboard summary',
        expected: 'non-negative time',
        actual: freshSummary.totalTimeSpent,
        severity: 'high'
      });

      corrections.push({
        type: 'dashboard_fix',
        description: 'Recalculate time spent',
        action: 'recalculate_time_spent',
        data: { childId }
      });
    }
  }

  /**
   * Apply corrections to fix inconsistencies
   */
  async correctInconsistencies(childId: string, corrections: Correction[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const correction of corrections) {
          await this.applyCorrection(tx, correction);
        }
      });

      logger.info(`Applied ${corrections.length} corrections for child ${childId}`);
    } catch (error) {
      logger.error('Failed to apply corrections:', error);
      throw error;
    }
  }

  /**
   * Apply a single correction
   */
  private async applyCorrection(tx: any, correction: Correction): Promise<void> {
    switch (correction.action) {
      case 'set_time_spent_to_zero':
        await tx.progressRecord.update({
          where: { id: correction.data.recordId },
          data: { timeSpent: 0 }
        });
        break;

      case 'clamp_score':
        const clampedScore = Math.max(0, Math.min(100, correction.data.currentValue));
        await tx.progressRecord.update({
          where: { id: correction.data.recordId },
          data: { score: clampedScore }
        });
        break;

      case 'set_completion_date':
        await tx.progressRecord.update({
          where: { id: correction.data.recordId },
          data: { completedAt: correction.data.updatedAt }
        });
        break;

      case 'reset_negative_counts':
        await tx.learningStreak.update({
          where: { id: correction.data.streakId },
          data: { 
            currentCount: Math.max(0, correction.data.currentCount || 0),
            longestCount: Math.max(0, correction.data.longestCount || 0)
          }
        });
        break;

      case 'update_longest_count':
        await tx.learningStreak.update({
          where: { id: correction.data.streakId },
          data: { longestCount: correction.data.newLongestCount }
        });
        break;

      case 'recalculate_daily_streak':
        await tx.learningStreak.update({
          where: { id: correction.data.streakId },
          data: { currentCount: correction.data.expectedCount }
        });
        break;

      case 'update_plan_status':
        await tx.studyPlan.update({
          where: { id: correction.data.planId },
          data: { status: correction.data.newStatus }
        });
        break;

      default:
        logger.warn(`Unknown correction action: ${correction.action}`);
    }
  }

  /**
   * Helper methods
   */
  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private getRecentDailyCompletions(progressRecords: any[]): Date[] {
    const completionDates = progressRecords
      .filter(record => record.completedAt)
      .map(record => {
        const date = new Date(record.completedAt);
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    // Remove duplicates (same day completions)
    const uniqueDates: Date[] = [];
    const seenDates = new Set<string>();
    
    for (const date of completionDates) {
      const dateStr = date.toISOString().split('T')[0];
      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr);
        uniqueDates.push(date);
      }
    }

    return uniqueDates;
  }

  private calculateExpectedDailyStreak(completionDates: Date[]): number {
    if (completionDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = today;

    for (const completionDate of completionDates) {
      const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0 || daysDiff === 1) {
        streak++;
        currentDate = new Date(completionDate);
      } else {
        break;
      }
    }

    return streak;
  }
}

// Export singleton instance
export const progressConsistencyService = new ProgressConsistencyService();