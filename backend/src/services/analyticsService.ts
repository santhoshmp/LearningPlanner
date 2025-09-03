import { PrismaClient, ProgressStatus, DifficultyLevel, ResourceType } from '@prisma/client';
import { TimeFrame, DetailedProgressTracking, DetailedMetrics, LearningVelocity, EngagementPatterns, MasteryIndicator } from '../types/analytics';
import { logger } from '../utils/logger';
import { MasterDataService } from './masterDataService';

const prisma = new PrismaClient();
const masterDataService = new MasterDataService(prisma);

// Define interfaces for analytics data
interface ProgressRecord {
  id: string;
  childId: string;
  activityId: string;
  status: ProgressStatus;
  score: number | null;
  timeSpent: number;
  attempts: number;
  completedAt: Date | null;
  updatedAt: Date | null;
  activity: {
    id: string;
    difficulty: number;
    plan: {
      subject: string;
    };
  };
  helpRequests: any[];
}

interface SubjectInsight {
  subject: string;
  averageScore: number;
  averageTime: number;
  averageDifficulty: number;
  helpRequestRate: number;
  activities: number;
  isStrength: boolean;
  isWeakness: boolean;
}

interface WeeklyData {
  week: string;
  activities: number;
  averageScore: number;
  averageTime: number;
}

interface DifficultyRecord {
  difficulty: number;
  score: number;
  completedAt: Date | null;
}

interface DifficultyInsightType {
  subject: string;
  difficultyProgression: string;
  scoreCorrelation: number;
  correlationInterpretation: string;
  readyForHigherDifficulty: boolean;
  needsLowerDifficulty: boolean;
}

interface AlertType {
  id: string;
  childId: string;
  childName: string;
  type: string;
  message: string;
  severity: string;
  createdAt: string;
  read: boolean;
}

interface PatternInsightType {
  type: 'learning_style' | 'difficulty' | 'timing' | 'support' | 'retention';
  message: string;
  recommendation: string;
  confidence: number;
}

interface LearningRiskType {
  type: 'declining_performance' | 'excessive_help_seeking' | 'inactivity_risk';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

class AnalyticsService {
  /**
   * Track activity completion and update analytics
   */
  async trackActivityCompletion(
    childId: string,
    activityId: string,
    score: number,
    timeSpent: number
  ) {
    try {
      // Verify activity exists
      const activity = await prisma.studyActivity.findUnique({
        where: { id: activityId },
        include: { plan: true }
      });

      if (!activity) {
        throw new Error(`Activity not found: ${activityId}`);
      }

      // Update or create progress record
      const progressRecord = await prisma.progressRecord.upsert({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        },
        update: {
          status: ProgressStatus.COMPLETED,
          score,
          timeSpent,
          attempts: {
            increment: 1
          },
          completedAt: new Date()
        },
        create: {
          childId,
          activityId,
          status: ProgressStatus.COMPLETED,
          score,
          timeSpent,
          attempts: 1,
          completedAt: new Date()
        }
      });

      logger.info(`Activity completed: ${activityId} by child: ${childId} with score: ${score}`);

      return progressRecord;
    } catch (error) {
      logger.error('Error tracking activity completion:', error);
      throw error;
    }
  }

  /**
   * Track activity progress (without completion)
   */
  async trackActivityProgress(
    childId: string,
    activityId: string,
    timeSpent: number
  ) {
    try {
      // Update or create progress record
      const progressRecord = await prisma.progressRecord.upsert({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        },
        update: {
          status: ProgressStatus.IN_PROGRESS,
          timeSpent: {
            increment: timeSpent
          },
        },
        create: {
          childId,
          activityId,
          status: ProgressStatus.IN_PROGRESS,
          timeSpent,
          score: 0,
          attempts: 0
        }
      });

      return progressRecord;
    } catch (error) {
      logger.error('Error tracking activity progress:', error);
      throw error;
    }
  }

  /**
   * Track help request for an activity
   */
  async trackHelpRequest(
    childId: string,
    activityId: string,
    question: string,
    context: any
  ) {
    try {
      // Check if there's a progress record
      const progressRecord = await prisma.progressRecord.findUnique({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        }
      });

      // Create help request
      const helpRequest = await prisma.helpRequest.create({
        data: {
          childId,
          activityId,
          question,
          context,
          isResolved: false
        }
      });

      // Update progress record status if it exists
      if (progressRecord) {
        await prisma.progressRecord.update({
          where: { id: progressRecord.id },
          data: { status: ProgressStatus.NEEDS_HELP }
        });
      }

      return helpRequest;
    } catch (error) {
      logger.error('Error tracking help request:', error);
      throw error;
    }
  }

  /**
   * Generate a progress report for a child within a timeframe
   */
  async generateProgressReport(childId: string, timeFrame?: TimeFrame) {
    try {
      const startDate = timeFrame ? new Date(timeFrame.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      const endDate = timeFrame ? new Date(timeFrame.end) : new Date();

      // Get all progress records for the child within the timeframe
      const progressRecords = await prisma.progressRecord.findMany({
        where: {
          childId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          activity: true,
          helpRequests: true
        }
      });

      // Calculate metrics
      const totalRecords = progressRecords.length;
      const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED).length;
      const inProgressRecords = progressRecords.filter(r => r.status === ProgressStatus.IN_PROGRESS).length;
      const notStartedRecords = progressRecords.filter(r => r.status === ProgressStatus.NOT_STARTED).length;

      const totalScore = progressRecords.reduce((sum, record) => sum + (record.score || 0), 0);
      const totalTimeSpent = progressRecords.reduce((sum, record) => sum + record.timeSpent, 0);
      const helpRequestsCount = progressRecords.reduce((sum, record) => sum + record.helpRequests.length, 0);

      // Get the date of the last activity
      const lastActivityDate = progressRecords.length > 0 ?
        progressRecords.sort((a, b) =>
          (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
        )[0].updatedAt : undefined;

      return {
        totalActivities: totalRecords,
        completionRate: totalRecords > 0 ? (completedRecords / totalRecords) : 0,
        averageScore: completedRecords > 0 ? (totalScore / completedRecords) : 0,
        totalTimeSpent: totalTimeSpent,
        activitiesCompleted: completedRecords,
        activitiesInProgress: inProgressRecords,
        activitiesNotStarted: notStartedRecords,
        helpRequestsCount,
        lastActivityDate: lastActivityDate
      };
    } catch (error) {
      logger.error('Error generating progress report:', error);
      throw error;
    }
  }

  /**
   * Detect learning patterns based on performance data
   */
  async detectLearningPatterns(childId: string) {
    try {
      // Get all completed progress records
      const progressRecords = await prisma.progressRecord.findMany({
        where: {
          childId,
          status: ProgressStatus.COMPLETED
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          },
          helpRequests: true
        },
        orderBy: {
          completedAt: 'asc'
        }
      });

      // Group by subject
      const subjectPerformance = new Map();

      for (const record of progressRecords) {
        const subject = record.activity.plan.subject;

        if (!subjectPerformance.has(subject)) {
          subjectPerformance.set(subject, {
            subject,
            activities: 0,
            totalScore: 0,
            totalTime: 0,
            helpRequests: 0,
            averageDifficulty: 0
          });
        }

        const perf = subjectPerformance.get(subject);
        perf.activities += 1;
        perf.totalScore += record.score || 0;
        perf.totalTime += record.timeSpent;
        perf.helpRequests += record.helpRequests.length;
        perf.averageDifficulty += record.activity.difficulty;
      }

      // Calculate insights for each subject
      const subjectInsights: SubjectInsight[] = [];

      for (const [subject, data] of subjectPerformance.entries()) {
        const averageScore = data.activities > 0 ? data.totalScore / data.activities : 0;
        const averageTime = data.activities > 0 ? data.totalTime / data.activities : 0;
        const averageDifficulty = data.activities > 0 ? data.averageDifficulty / data.activities : 0;
        const helpRequestRate = data.activities > 0 ? data.helpRequests / data.activities : 0;

        subjectInsights.push({
          subject,
          averageScore,
          averageTime,
          averageDifficulty,
          helpRequestRate,
          activities: data.activities,
          isStrength: averageScore > 80 && helpRequestRate < 0.5,
          isWeakness: averageScore < 60 || helpRequestRate > 1.5
        });
      }

      // Analyze time-based patterns
      const timeBasedPatterns = this.analyzeTimeBasedPatterns(progressRecords);

      // Analyze difficulty progression
      const difficultyProgression = this.analyzeDifficultyProgression(progressRecords);

      return {
        subjectInsights,
        timeBasedPatterns,
        difficultyProgression,
        recommendedFocus: this.determineRecommendedFocus(subjectInsights)
      };
    } catch (error) {
      logger.error('Error detecting learning patterns:', error);
      throw error;
    }
  }

  /**
   * Analyze time-based patterns in learning data
   */
  private analyzeTimeBasedPatterns(progressRecords: ProgressRecord[]) {
    // Group records by week
    const weeklyData = new Map();

    for (const record of progressRecords) {
      if (!record.completedAt) continue;

      // Get the week of the completion date
      const date = new Date(record.completedAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());

      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: weekKey,
          activities: 0,
          totalScore: 0,
          totalTime: 0
        });
      }

      const weekData = weeklyData.get(weekKey);
      weekData.activities += 1;
      weekData.totalScore += record.score || 0;
      weekData.totalTime += record.timeSpent;
    }

    // Convert to array and calculate averages
    const weeklyTrends = Array.from(weeklyData.values()).map(week => ({
      week: week.week,
      activities: week.activities,
      averageScore: week.activities > 0 ? week.totalScore / week.activities : 0,
      averageTime: week.activities > 0 ? week.totalTime / week.activities : 0
    }));

    // Sort by week
    weeklyTrends.sort((a, b) => a.week.localeCompare(b.week));

    // Detect progression trends
    const scoreProgression = this.detectProgression(weeklyTrends.map(w => w.averageScore));
    const timeProgression = this.detectProgression(weeklyTrends.map(w => w.averageTime));
    const activityProgression = this.detectProgression(weeklyTrends.map(w => w.activities));

    return {
      weeklyTrends,
      progressions: {
        score: scoreProgression,
        time: timeProgression,
        activity: activityProgression
      }
    };
  }

  /**
   * Analyze difficulty progression in learning data
   */
  private analyzeDifficultyProgression(progressRecords: ProgressRecord[]) {
    // Sort records by completion date
    const sortedRecords = [...progressRecords].sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0;
      const dateB = b.completedAt?.getTime() || 0;
      return dateA - dateB;
    });

    // Group by subject
    const subjectDifficulty = new Map();

    for (const record of sortedRecords) {
      const subject = record.activity.plan.subject;

      if (!subjectDifficulty.has(subject)) {
        subjectDifficulty.set(subject, []);
      }

      subjectDifficulty.get(subject).push({
        difficulty: record.activity.difficulty,
        score: record.score || 0,
        completedAt: record.completedAt
      });
    }

    // Analyze each subject
    const difficultyInsights: DifficultyInsightType[] = [];

    for (const [subject, records] of subjectDifficulty.entries()) {
      // Only analyze subjects with enough data points
      if (records.length < 3) continue;

      const difficulties = records.map(r => r.difficulty);
      const scores = records.map(r => r.score);

      const difficultyProgression = this.detectProgression(difficulties);
      const scoreWithDifficulty = this.analyzeScoreWithDifficulty(records);

      difficultyInsights.push({
        subject,
        difficultyProgression,
        scoreCorrelation: scoreWithDifficulty.correlation,
        correlationInterpretation: scoreWithDifficulty.interpretation,
        readyForHigherDifficulty: difficultyProgression === 'stable' &&
          scoreWithDifficulty.correlation > 0.7 &&
          scoreWithDifficulty.averageScore > 75,
        needsLowerDifficulty: difficultyProgression === 'increasing' &&
          scoreWithDifficulty.correlation < -0.5 &&
          scoreWithDifficulty.averageScore < 60
      });
    }

    return difficultyInsights;
  }

  /**
   * Analyze correlation between score and difficulty
   */
  private analyzeScoreWithDifficulty(records: DifficultyRecord[]) {
    const n = records.length;
    if (n < 3) {
      return {
        correlation: 0,
        averageScore: 0,
        interpretation: 'insufficient data'
      };
    }

    const difficulties = records.map((r: DifficultyRecord) => r.difficulty);
    const scores = records.map((r: DifficultyRecord) => r.score);

    // Calculate Pearson correlation coefficient
    const sumX = difficulties.reduce((a: number, b: number) => a + b, 0);
    const sumY = scores.reduce((a: number, b: number) => a + b, 0);
    const sumXY = difficulties.reduce((sum: number, x: number, i: number) => sum + x * scores[i], 0);
    const sumX2 = difficulties.reduce((sum: number, x: number) => sum + x * x, 0);
    const sumY2 = scores.reduce((sum: number, y: number) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const correlation = denominator === 0 ? 0 : numerator / denominator;
    const averageScore = sumY / n;

    return {
      correlation,
      averageScore,
      interpretation: this.interpretCorrelation(correlation)
    };
  }

  /**
   * Interpret correlation coefficient
   */
  private interpretCorrelation(correlation: number) {
    if (correlation > 0.7) return 'strong positive';
    if (correlation > 0.3) return 'moderate positive';
    if (correlation > -0.3) return 'weak or no correlation';
    if (correlation > -0.7) return 'moderate negative';
    return 'strong negative';
  }

  /**
   * Detect progression in a series of values
   */
  private detectProgression(values: number[]) {
    const n = values.length;
    if (n < 3) return 'insufficient data';

    // Calculate linear regression
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Determine trend based on slope
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Determine recommended focus areas based on subject insights
   */
  private determineRecommendedFocus(subjectInsights: SubjectInsight[]) {
    const weaknesses = subjectInsights.filter(s => s.isWeakness);
    const strengths = subjectInsights.filter(s => s.isStrength);

    return {
      focusAreas: weaknesses.map((w: SubjectInsight) => w.subject),
      strengths: strengths.map((s: SubjectInsight) => s.subject),
      recommendations: [
        ...weaknesses.map((w: SubjectInsight) => ({
          subject: w.subject,
          recommendation: `Focus on improving ${w.subject} skills with more practice`,
          reason: 'Performance below target'
        })),
        ...strengths.map((s: SubjectInsight) => ({
          subject: s.subject,
          recommendation: `Consider more advanced ${s.subject} material`,
          reason: 'Strong performance indicates readiness for more challenging material'
        }))
      ]
    };
  }

  /**
   * Track engagement metrics for a child
   */
  async trackEngagement(childId: string, data: {
    activityId?: string;
    sessionDuration: number;
    interactionCount: number;
    completedItems?: number;
    timestamp: Date;
  }) {
    try {
      // Store engagement data in a new table
      // For now, we'll just log it since we don't have an engagement table yet
      logger.info(`Engagement tracked for child ${childId}:`, data);

      // Update last activity timestamp
      await this.updateLastActivity(childId, data.timestamp);

      return true;
    } catch (error) {
      logger.error('Error tracking engagement:', error);
      throw error;
    }
  }

  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(childId: string, timestamp: Date) {
    // This would update a streak or last activity record
    // For now, we'll just log it
    logger.debug(`Updated last activity for child ${childId} to ${timestamp}`);
  }

  /**
   * Generate performance trend analysis
   */
  async generatePerformanceTrends(childId: string, timeFrame?: TimeFrame) {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Calculate the number of days in the timeframe
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine period type based on timeframe length
      let periodType: 'day' | 'week' | 'month';
      if (daysDiff <= 14) {
        periodType = 'day';
      } else if (daysDiff <= 90) {
        periodType = 'week';
      } else {
        periodType = 'month';
      }

      // Get all progress records within the timeframe
      const progressRecords = await prisma.progressRecord.findMany({
        where: {
          childId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          activity: true
        }
      });

      // Group records by period
      const periodData = new Map();

      for (const record of progressRecords) {
        const date = record.updatedAt;
        if (!date) continue;

        let periodKey: string;

        if (periodType === 'day') {
          periodKey = date.toISOString().split('T')[0];
        } else if (periodType === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
        } else {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodData.has(periodKey)) {
          periodData.set(periodKey, {
            period: periodKey,
            records: [],
            completedCount: 0,
            totalCount: 0,
            totalScore: 0,
            totalTime: 0
          });
        }

        const data = periodData.get(periodKey);
        data.records.push(record);
        data.totalCount += 1;

        if (record.status === ProgressStatus.COMPLETED) {
          data.completedCount += 1;
          data.totalScore += record.score || 0;
        }

        data.totalTime += record.timeSpent;
      }

      // Calculate metrics for each period
      const trends = Array.from(periodData.values()).map(data => ({
        period: data.period,
        completionRate: data.totalCount > 0 ? data.completedCount / data.totalCount : 0,
        averageScore: data.completedCount > 0 ? data.totalScore / data.completedCount : 0,
        timeSpent: data.totalTime
      }));

      // Sort by period
      trends.sort((a, b) => a.period.localeCompare(b.period));

      return trends;
    } catch (error) {
      logger.error('Error generating performance trends:', error);
      throw error;
    }
  }

  /**
   * Generate subject performance analysis
   */
  async generateSubjectPerformance(childId: string, timeFrame?: TimeFrame) {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get all progress records for the child within the timeframe
      const progressRecords = await prisma.progressRecord.findMany({
        where: {
          childId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        }
      });

      // Group records by subject
      const subjectData = new Map();

      for (const record of progressRecords) {
        const subject = record.activity.plan.subject;

        if (!subjectData.has(subject)) {
          subjectData.set(subject, {
            subject,
            records: [],
            completedCount: 0,
            totalCount: 0,
            totalScore: 0,
            totalTime: 0
          });
        }

        const data = subjectData.get(subject);
        data.records.push(record);
        data.totalCount += 1;

        if (record.status === ProgressStatus.COMPLETED) {
          data.completedCount += 1;
          data.totalScore += record.score || 0;
        }

        data.totalTime += record.timeSpent;
      }

      // Calculate metrics for each subject
      const subjectPerformance = Array.from(subjectData.values()).map(data => ({
        subject: data.subject,
        completionRate: data.totalCount > 0 ? data.completedCount / data.totalCount : 0,
        averageScore: data.completedCount > 0 ? data.totalScore / data.completedCount : 0,
        timeSpent: data.totalTime
      }));

      return subjectPerformance;
    } catch (error) {
      logger.error('Error generating subject performance:', error);
      throw error;
    }
  }

  /**
   * Generate alerts based on analytics data
   */
  async generateAlerts(childId: string) {
    try {
      // Get child profile
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: { id: true, name: true }
      });

      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const alerts: AlertType[] = [];

      // Check for inactivity
      const lastActivityDate = await this.getLastActivityDate(childId);
      const daysSinceActivity = lastActivityDate ?
        Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      if (daysSinceActivity === null || daysSinceActivity > 7) {
        alerts.push({
          id: `inactivity_${Date.now()}`,
          childId,
          childName: child.name,
          type: 'inactivity',
          message: `${child.name} hasn't engaged with any activities in ${daysSinceActivity || 'any'} days`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      // Check for low performance
      const recentPerformance = await this.getRecentPerformance(childId);

      if (recentPerformance && recentPerformance.averageScore < 60) {
        alerts.push({
          id: `low_performance_${Date.now()}`,
          childId,
          childName: child.name,
          type: 'low_performance',
          message: `${child.name} is struggling with recent activities (${Math.round(recentPerformance.averageScore)}%)`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      // Check for achievements
      const recentAchievements = await this.getRecentAchievements(childId);

      for (const achievement of recentAchievements) {
        alerts.push({
          id: `achievement_${achievement.id}`,
          childId,
          childName: child.name,
          type: 'achievement',
          message: `${child.name} earned the "${achievement.title}" achievement!`,
          severity: 'success',
          createdAt: new Date(achievement.earnedAt).toISOString(),
          read: false
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error generating alerts:', error);
      throw error;
    }
  }

  /**
   * Get the last activity date for a child
   */
  private async getLastActivityDate(childId: string) {
    const latestRecord = await prisma.progressRecord.findFirst({
      where: { childId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    return latestRecord?.updatedAt;
  }

  /**
   * Get recent achievements for a child
   */
  private async getRecentAchievements(childId: string) {
    // Get achievements from the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await prisma.achievement.findMany({
      where: {
        childId,
        earnedAt: { gte: threeDaysAgo }
      }
    });
  }

  /**
   * Get recent performance metrics for a child
   */
  private async getRecentPerformance(childId: string) {
    // Get data from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const records = await prisma.progressRecord.findMany({
      where: {
        childId,
        updatedAt: { gte: sevenDaysAgo }
      }
    });

    // If no records, return null
    if (records.length === 0) return null;

    const completedRecords = records.filter(r => r.status === ProgressStatus.COMPLETED);

    // If no completed records, return null
    if (completedRecords.length === 0) return null;

    const totalScore = completedRecords.reduce((sum, record) => sum + (record.score || 0), 0);

    return {
      activitiesCompleted: completedRecords.length,
      averageScore: completedRecords.length > 0 ? totalScore / completedRecords.length : 0,
    };
  }

  /**
   * Enhanced detailed progress tracking with advanced metrics
   */
  async getDetailedProgressTracking(childId: string, timeFrame?: TimeFrame) {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get comprehensive progress data
      const progressRecords = await prisma.progressRecord.findMany({
        where: {
          childId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          activity: {
            include: {
              plan: true,
              studyContent: true
            }
          },
          helpRequests: true
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });

      // Get content interactions
      const contentInteractions = await prisma.contentInteraction.findMany({
        where: {
          childId,
          createdAt: {
            gte: startDate,
            lte: endDate
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

      // Calculate detailed metrics
      const detailedMetrics = this.calculateDetailedMetrics(progressRecords, contentInteractions);
      
      // Calculate learning velocity
      const learningVelocity = this.calculateLearningVelocity(progressRecords);
      
      // Calculate engagement patterns
      const engagementPatterns = this.calculateEngagementPatterns(progressRecords, contentInteractions);
      
      // Calculate mastery indicators
      const masteryIndicators = this.calculateMasteryIndicators(progressRecords);

      return {
        timeFrame: { start, end },
        detailedMetrics,
        learningVelocity,
        engagementPatterns,
        masteryIndicators,
        totalDataPoints: progressRecords.length + contentInteractions.length
      };
    } catch (error) {
      logger.error('Error getting detailed progress tracking:', error);
      throw error;
    }
  }

  /**
   * Advanced learning pattern recognition using machine learning algorithms
   */
  async recognizeLearningPatterns(childId: string) {
    try {
      // Get comprehensive learning data
      const progressRecords = await prisma.progressRecord.findMany({
        where: { childId },
        include: {
          activity: {
            include: {
              plan: true,
              studyContent: true
            }
          },
          helpRequests: true
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });

      const contentInteractions = await prisma.contentInteraction.findMany({
        where: { childId },
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

      // Apply pattern recognition algorithms
      const learningStylePattern = this.detectLearningStylePattern(progressRecords, contentInteractions);
      const difficultyAdaptationPattern = this.detectDifficultyAdaptationPattern(progressRecords);
      const timeBasedLearningPattern = this.detectTimeBasedLearningPattern(progressRecords);
      const contentPreferencePattern = this.detectContentPreferencePattern(contentInteractions);
      const helpSeekingPattern = this.detectHelpSeekingPattern(progressRecords);
      const retentionPattern = this.detectRetentionPattern(progressRecords);

      // Generate pattern-based insights
      const insights = this.generatePatternInsights({
        learningStylePattern,
        difficultyAdaptationPattern,
        timeBasedLearningPattern,
        contentPreferencePattern,
        helpSeekingPattern,
        retentionPattern
      });

      return {
        patterns: {
          learningStyle: learningStylePattern,
          difficultyAdaptation: difficultyAdaptationPattern,
          timeBasedLearning: timeBasedLearningPattern,
          contentPreference: contentPreferencePattern,
          helpSeeking: helpSeekingPattern,
          retention: retentionPattern
        },
        insights,
        confidence: this.calculatePatternConfidence(progressRecords.length, contentInteractions.length),
        lastAnalyzed: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error recognizing learning patterns:', error);
      throw error;
    }
  }

  /**
   * Performance prediction and insights generation using predictive analytics
   */
  async generatePerformancePredictions(childId: string) {
    try {
      // Get historical performance data
      const progressRecords = await prisma.progressRecord.findMany({
        where: { childId },
        include: {
          activity: {
            include: {
              plan: true
            }
          },
          helpRequests: true
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });

      if (progressRecords.length < 10) {
        return {
          predictions: null,
          insights: ['Insufficient data for reliable predictions. Complete more activities to enable predictions.'],
          confidence: 0,
          message: 'Need at least 10 completed activities for predictions'
        };
      }

      // Generate performance predictions
      const scorePredicition = this.predictFutureScores(progressRecords);
      const completionTimePredicition = this.predictCompletionTimes(progressRecords);
      const difficultyReadiness = this.predictDifficultyReadiness(progressRecords);
      const subjectMastery = this.predictSubjectMastery(progressRecords);
      const riskAssessment = this.assessLearningRisks(progressRecords);

      // Generate actionable insights
      const insights = this.generatePredictiveInsights({
        scorePredicition,
        completionTimePredicition,
        difficultyReadiness,
        subjectMastery,
        riskAssessment
      });

      return {
        predictions: {
          scores: scorePredicition,
          completionTimes: completionTimePredicition,
          difficultyReadiness,
          subjectMastery,
          riskAssessment
        },
        insights,
        confidence: this.calculatePredictionConfidence(progressRecords),
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Valid for 1 week
      };
    } catch (error) {
      logger.error('Error generating performance predictions:', error);
      throw error;
    }
  }

  /**
   * Calculate detailed metrics from progress and interaction data
   */
  private calculateDetailedMetrics(progressRecords: any[], contentInteractions: any[]) {
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
    
    // Basic metrics
    const totalActivities = progressRecords.length;
    const completedActivities = completedRecords.length;
    const completionRate = totalActivities > 0 ? completedActivities / totalActivities : 0;
    
    // Score metrics
    const scores = completedRecords.map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const scoreVariance = this.calculateVariance(scores);
    const scoreStandardDeviation = Math.sqrt(scoreVariance);
    
    // Time metrics
    const timesSpent = progressRecords.map(r => r.timeSpent);
    const totalTimeSpent = timesSpent.reduce((a, b) => a + b, 0);
    const averageTimePerActivity = timesSpent.length > 0 ? totalTimeSpent / timesSpent.length : 0;
    const timeEfficiency = averageScore > 0 ? averageScore / averageTimePerActivity : 0;
    
    // Content interaction metrics
    const totalInteractions = contentInteractions.length;
    const videoInteractions = contentInteractions.filter(i => i.content.contentType === 'video').length;
    const articleInteractions = contentInteractions.filter(i => i.content.contentType === 'article').length;
    const interactiveInteractions = contentInteractions.filter(i => i.content.contentType === 'interactive').length;
    
    // Engagement depth
    const completedInteractions = contentInteractions.filter(i => i.progressPercentage >= 90).length;
    const engagementDepth = totalInteractions > 0 ? completedInteractions / totalInteractions : 0;
    
    return {
      basic: {
        totalActivities,
        completedActivities,
        completionRate,
        totalTimeSpent,
        averageTimePerActivity
      },
      performance: {
        averageScore,
        scoreVariance,
        scoreStandardDeviation,
        timeEfficiency,
        consistencyScore: 1 - (scoreStandardDeviation / 100) // Higher is more consistent
      },
      engagement: {
        totalInteractions,
        contentTypeDistribution: {
          video: videoInteractions,
          article: articleInteractions,
          interactive: interactiveInteractions
        },
        engagementDepth,
        averageProgressPercentage: totalInteractions > 0 ? 
          contentInteractions.reduce((sum, i) => sum + i.progressPercentage, 0) / totalInteractions : 0
      }
    };
  }

  /**
   * Calculate learning velocity (rate of improvement over time)
   */
  private calculateLearningVelocity(progressRecords: any[]) {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED && r.completedAt)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    if (completedRecords.length < 3) {
      return {
        velocity: 0,
        trend: 'insufficient_data',
        acceleration: 0
      };
    }

    // Calculate score velocity (improvement rate)
    const scores = completedRecords.map(r => r.score || 0);
    const timePoints = completedRecords.map((r, index) => index);
    
    const scoreVelocity = this.calculateLinearRegression(timePoints, scores).slope;
    
    // Calculate time efficiency velocity
    const timeEfficiencies = completedRecords.map(r => (r.score || 0) / Math.max(r.timeSpent, 1));
    const efficiencyVelocity = this.calculateLinearRegression(timePoints, timeEfficiencies).slope;
    
    // Calculate acceleration (second derivative)
    const midPoint = Math.floor(completedRecords.length / 2);
    const firstHalfVelocity = this.calculateLinearRegression(
      timePoints.slice(0, midPoint),
      scores.slice(0, midPoint)
    ).slope;
    const secondHalfVelocity = this.calculateLinearRegression(
      timePoints.slice(midPoint),
      scores.slice(midPoint)
    ).slope;
    
    const acceleration = secondHalfVelocity - firstHalfVelocity;
    
    return {
      velocity: scoreVelocity,
      efficiencyVelocity,
      acceleration,
      trend: scoreVelocity > 0.1 ? 'improving' : scoreVelocity < -0.1 ? 'declining' : 'stable'
    };
  }

  /**
   * Calculate engagement patterns
   */
  private calculateEngagementPatterns(progressRecords: any[], contentInteractions: any[]) {
    // Time-of-day patterns
    const hourlyActivity = new Array(24).fill(0);
    [...progressRecords, ...contentInteractions].forEach(record => {
      const hour = new Date(record.updatedAt || record.createdAt).getHours();
      hourlyActivity[hour]++;
    });
    
    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
    
    // Session length patterns
    const sessionLengths = progressRecords.map(r => r.timeSpent);
    const averageSessionLength = sessionLengths.length > 0 ? 
      sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0;
    
    // Consistency patterns
    const dailyActivity = this.groupByDay([...progressRecords, ...contentInteractions]);
    const activeDays = Object.keys(dailyActivity).length;
    const totalDays = Math.ceil((Date.now() - new Date(Math.min(
      ...progressRecords.map(r => new Date(r.createdAt).getTime()),
      ...contentInteractions.map(i => new Date(i.createdAt).getTime())
    )).getTime()) / (1000 * 60 * 60 * 24));
    
    const consistencyScore = totalDays > 0 ? activeDays / totalDays : 0;
    
    return {
      peakHours,
      averageSessionLength,
      consistencyScore,
      engagementFrequency: activeDays > 0 ? (progressRecords.length + contentInteractions.length) / activeDays : 0,
      preferredContentLength: this.calculatePreferredContentLength(contentInteractions)
    };
  }

  /**
   * Calculate mastery indicators
   */
  private calculateMasteryIndicators(progressRecords: any[]) {
    const subjectMastery = new Map();
    
    progressRecords.forEach(record => {
      const subject = record.activity.plan.subject;
      if (!subjectMastery.has(subject)) {
        subjectMastery.set(subject, {
          attempts: 0,
          completions: 0,
          totalScore: 0,
          difficulties: []
        });
      }
      
      const mastery = subjectMastery.get(subject);
      mastery.attempts++;
      
      if (record.status === ProgressStatus.COMPLETED) {
        mastery.completions++;
        mastery.totalScore += record.score || 0;
        mastery.difficulties.push(record.activity.difficulty);
      }
    });
    
    const masteryLevels = Array.from(subjectMastery.entries()).map(([subject, data]) => {
      const completionRate = data.attempts > 0 ? data.completions / data.attempts : 0;
      const averageScore = data.completions > 0 ? data.totalScore / data.completions : 0;
      const averageDifficulty = data.difficulties.length > 0 ? 
        data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length : 0;
      
      // Calculate mastery level (0-100)
      const masteryLevel = Math.min(100, (completionRate * 40) + (averageScore * 0.4) + (averageDifficulty * 10));
      
      return {
        subject,
        masteryLevel,
        completionRate,
        averageScore,
        averageDifficulty,
        status: masteryLevel >= 80 ? 'mastered' : masteryLevel >= 60 ? 'proficient' : masteryLevel >= 40 ? 'developing' : 'beginner'
      };
    });
    
    return masteryLevels;
  }

  /**
   * Detect learning style patterns
   */
  private detectLearningStylePattern(progressRecords: any[], contentInteractions: any[]) {
    const contentTypePerformance = new Map();
    
    // Analyze performance by content type
    contentInteractions.forEach(interaction => {
      const contentType = interaction.content.contentType;
      if (!contentTypePerformance.has(contentType)) {
        contentTypePerformance.set(contentType, {
          interactions: 0,
          totalProgress: 0,
          completions: 0
        });
      }
      
      const perf = contentTypePerformance.get(contentType);
      perf.interactions++;
      perf.totalProgress += interaction.progressPercentage;
      if (interaction.progressPercentage >= 90) perf.completions++;
    });
    
    // Calculate preferences
    const preferences = Array.from(contentTypePerformance.entries()).map(([type, data]) => ({
      contentType: type,
      engagementRate: data.interactions > 0 ? data.completions / data.interactions : 0,
      averageProgress: data.interactions > 0 ? data.totalProgress / data.interactions : 0,
      totalInteractions: data.interactions
    })).sort((a, b) => b.engagementRate - a.engagementRate);
    
    // Determine dominant learning style
    const dominantStyle = preferences.length > 0 ? preferences[0].contentType : 'mixed';
    
    return {
      dominantStyle,
      preferences,
      confidence: this.calculateStyleConfidence(preferences)
    };
  }

  /**
   * Detect difficulty adaptation patterns
   */
  private detectDifficultyAdaptationPattern(progressRecords: any[]) {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    
    if (completedRecords.length < 5) {
      return {
        adaptationRate: 0,
        optimalDifficulty: 1,
        pattern: 'insufficient_data'
      };
    }
    
    // Analyze difficulty vs performance correlation
    const difficulties = completedRecords.map(r => r.activity.difficulty);
    const scores = completedRecords.map(r => r.score || 0);
    
    const correlation = this.calculateCorrelation(difficulties, scores);
    
    // Find optimal difficulty range
    const difficultyPerformance = new Map();
    completedRecords.forEach(record => {
      const diff = record.activity.difficulty;
      if (!difficultyPerformance.has(diff)) {
        difficultyPerformance.set(diff, { scores: [], count: 0 });
      }
      difficultyPerformance.get(diff).scores.push(record.score || 0);
      difficultyPerformance.get(diff).count++;
    });
    
    let optimalDifficulty = 1;
    let bestScore = 0;
    
    for (const [difficulty, data] of difficultyPerformance.entries()) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (avgScore > bestScore && data.count >= 2) {
        bestScore = avgScore;
        optimalDifficulty = difficulty;
      }
    }
    
    return {
      adaptationRate: Math.abs(correlation),
      optimalDifficulty,
      pattern: correlation > 0.3 ? 'positive_adaptation' : correlation < -0.3 ? 'difficulty_sensitive' : 'stable',
      difficultyRange: {
        min: Math.min(...difficulties),
        max: Math.max(...difficulties),
        current: difficulties[difficulties.length - 1]
      }
    };
  }

  /**
   * Detect time-based learning patterns
   */
  private detectTimeBasedLearningPattern(progressRecords: any[]) {
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED && r.completedAt);
    
    if (completedRecords.length < 5) {
      return {
        optimalTimeOfDay: null,
        sessionLengthPreference: 'unknown',
        weeklyPattern: 'insufficient_data'
      };
    }
    
    // Analyze performance by time of day
    const hourlyPerformance = new Map();
    completedRecords.forEach(record => {
      const hour = new Date(record.completedAt).getHours();
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, { scores: [], count: 0 });
      }
      hourlyPerformance.get(hour).scores.push(record.score || 0);
      hourlyPerformance.get(hour).count++;
    });
    
    let optimalHour = 12;
    let bestHourlyScore = 0;
    
    for (const [hour, data] of hourlyPerformance.entries()) {
      if (data.count >= 2) {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        if (avgScore > bestHourlyScore) {
          bestHourlyScore = avgScore;
          optimalHour = hour;
        }
      }
    }
    
    // Analyze session length preferences
    const sessionLengths = completedRecords.map(r => r.timeSpent);
    const avgSessionLength = sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length;
    
    const sessionLengthPreference = avgSessionLength < 15 ? 'short' : 
                                   avgSessionLength < 45 ? 'medium' : 'long';
    
    return {
      optimalTimeOfDay: optimalHour,
      sessionLengthPreference,
      averageSessionLength: avgSessionLength,
      weeklyPattern: this.analyzeWeeklyPattern(completedRecords)
    };
  }

  /**
   * Detect content preference patterns
   */
  private detectContentPreferencePattern(contentInteractions: any[]) {
    if (contentInteractions.length < 5) {
      return {
        preferredTypes: [],
        engagementByType: {},
        pattern: 'insufficient_data'
      };
    }
    
    const typeEngagement = new Map();
    
    contentInteractions.forEach(interaction => {
      const type = interaction.content.contentType;
      if (!typeEngagement.has(type)) {
        typeEngagement.set(type, {
          interactions: 0,
          totalTime: 0,
          completions: 0,
          totalProgress: 0
        });
      }
      
      const engagement = typeEngagement.get(type);
      engagement.interactions++;
      engagement.totalTime += interaction.timeSpent;
      engagement.totalProgress += interaction.progressPercentage;
      if (interaction.progressPercentage >= 90) engagement.completions++;
    });
    
    const engagementByType = {};
    const preferredTypes: string[] = [];
    
    for (const [type, data] of typeEngagement.entries()) {
      const completionRate = data.interactions > 0 ? data.completions / data.interactions : 0;
      const avgProgress = data.interactions > 0 ? data.totalProgress / data.interactions : 0;
      const avgTime = data.interactions > 0 ? data.totalTime / data.interactions : 0;
      
      engagementByType[type] = {
        completionRate,
        averageProgress: avgProgress,
        averageTimeSpent: avgTime,
        totalInteractions: data.interactions
      };
      
      if (completionRate > 0.7 && data.interactions >= 3) {
        preferredTypes.push(type);
      }
    }
    
    return {
      preferredTypes,
      engagementByType,
      pattern: preferredTypes.length > 0 ? 'clear_preferences' : 'exploring'
    };
  }

  /**
   * Detect help-seeking patterns
   */
  private detectHelpSeekingPattern(progressRecords: any[]) {
    const recordsWithHelp = progressRecords.filter(r => r.helpRequests.length > 0);
    
    if (recordsWithHelp.length < 3) {
      return {
        helpSeekingRate: 0,
        pattern: 'insufficient_data',
        triggers: []
      };
    }
    
    const helpSeekingRate = recordsWithHelp.length / progressRecords.length;
    
    // Analyze help-seeking triggers
    const triggers = new Map();
    recordsWithHelp.forEach(record => {
      const difficulty = record.activity.difficulty;
      const subject = record.activity.plan.subject;
      
      if (!triggers.has(difficulty)) triggers.set(difficulty, 0);
      triggers.set(difficulty, triggers.get(difficulty) + 1);
    });
    
    const commonTriggers = Array.from(triggers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger, count]) => ({ trigger: `difficulty_${trigger}`, frequency: count }));
    
    return {
      helpSeekingRate,
      pattern: helpSeekingRate > 0.3 ? 'frequent_help_seeker' : 
               helpSeekingRate > 0.1 ? 'moderate_help_seeker' : 'independent_learner',
      triggers: commonTriggers,
      averageHelpRequestsPerActivity: recordsWithHelp.length > 0 ? 
        recordsWithHelp.reduce((sum, r) => sum + r.helpRequests.length, 0) / recordsWithHelp.length : 0
    };
  }

  /**
   * Detect retention patterns
   */
  private detectRetentionPattern(progressRecords: any[]) {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    
    if (completedRecords.length < 10) {
      return {
        retentionScore: 0,
        pattern: 'insufficient_data',
        forgettingCurve: null
      };
    }
    
    // Analyze score trends over time to detect retention
    const scores = completedRecords.map(r => r.score || 0);
    const timePoints = completedRecords.map((r, index) => index);
    
    // Calculate moving averages to smooth out noise
    const windowSize = Math.min(5, Math.floor(scores.length / 3));
    const movingAverages: number[] = [];
    
    for (let i = windowSize - 1; i < scores.length; i++) {
      const window = scores.slice(i - windowSize + 1, i + 1);
      movingAverages.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    
    // Calculate retention score based on score stability
    const scoreVariance = this.calculateVariance(movingAverages);
    const retentionScore = Math.max(0, 100 - scoreVariance); // Lower variance = better retention
    
    return {
      retentionScore,
      pattern: retentionScore > 80 ? 'excellent_retention' : 
               retentionScore > 60 ? 'good_retention' : 
               retentionScore > 40 ? 'moderate_retention' : 'needs_reinforcement',
      scoreStability: 100 - scoreVariance,
      trendDirection: this.calculateLinearRegression(timePoints.slice(-windowSize), scores.slice(-windowSize)).slope
    };
  }

  /**
   * Generate insights from detected patterns
   */
  private generatePatternInsights(patterns: any) {
    const insights: PatternInsightType[] = [];
    
    // Learning style insights
    if (patterns.learningStylePattern.dominantStyle !== 'mixed') {
      insights.push({
        type: 'learning_style',
        message: `Shows strong preference for ${patterns.learningStylePattern.dominantStyle} content`,
        recommendation: `Focus on ${patterns.learningStylePattern.dominantStyle}-based learning materials`,
        confidence: patterns.learningStylePattern.confidence
      });
    }
    
    // Difficulty adaptation insights
    if (patterns.difficultyAdaptationPattern.pattern === 'difficulty_sensitive') {
      insights.push({
        type: 'difficulty',
        message: 'Performance decreases significantly with higher difficulty',
        recommendation: 'Gradually increase difficulty with more support and practice',
        confidence: 0.8
      });
    }
    
    // Time-based insights
    if (patterns.timeBasedLearningPattern.optimalTimeOfDay) {
      const hour = patterns.timeBasedLearningPattern.optimalTimeOfDay;
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      insights.push({
        type: 'timing',
        message: `Performs best during ${timeOfDay} hours (around ${hour}:00)`,
        recommendation: `Schedule challenging activities during ${timeOfDay} for optimal performance`,
        confidence: 0.7
      });
    }
    
    // Help-seeking insights
    if (patterns.helpSeekingPattern.pattern === 'frequent_help_seeker') {
      insights.push({
        type: 'support',
        message: 'Frequently seeks help, indicating need for additional support',
        recommendation: 'Provide more scaffolding and step-by-step guidance',
        confidence: 0.8
      });
    }
    
    // Retention insights
    if (patterns.retentionPattern.pattern === 'needs_reinforcement') {
      insights.push({
        type: 'retention',
        message: 'Shows signs of knowledge decay over time',
        recommendation: 'Implement spaced repetition and regular review sessions',
        confidence: 0.7
      });
    }
    
    return insights;
  }

  /**
   * Predict future scores based on historical data
   */
  private predictFutureScores(progressRecords: any[]) {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    
    if (completedRecords.length < 5) {
      return { prediction: null, confidence: 0 };
    }
    
    const scores = completedRecords.map(r => r.score || 0);
    const timePoints = completedRecords.map((r, index) => index);
    
    const regression = this.calculateLinearRegression(timePoints, scores);
    const nextScore = regression.slope * completedRecords.length + regression.intercept;
    
    // Calculate prediction confidence based on R-squared
    const rSquared = this.calculateRSquared(timePoints, scores, regression);
    
    return {
      prediction: Math.max(0, Math.min(100, nextScore)),
      trend: regression.slope > 0.1 ? 'improving' : regression.slope < -0.1 ? 'declining' : 'stable',
      confidence: rSquared,
      expectedRange: {
        min: Math.max(0, nextScore - 10),
        max: Math.min(100, nextScore + 10)
      }
    };
  }

  /**
   * Predict completion times for future activities
   */
  private predictCompletionTimes(progressRecords: any[]) {
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
    
    if (completedRecords.length < 5) {
      return { prediction: null, confidence: 0 };
    }
    
    // Group by difficulty level
    const timesByDifficulty = new Map();
    completedRecords.forEach(record => {
      const difficulty = record.activity.difficulty;
      if (!timesByDifficulty.has(difficulty)) {
        timesByDifficulty.set(difficulty, []);
      }
      timesByDifficulty.get(difficulty).push(record.timeSpent);
    });
    
    // Calculate average times by difficulty
    const predictions = {};
    for (const [difficulty, times] of timesByDifficulty.entries()) {
      if (times.length >= 2) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = this.calculateVariance(times);
        predictions[difficulty] = {
          expectedTime: avgTime,
          range: {
            min: Math.max(1, avgTime - Math.sqrt(variance)),
            max: avgTime + Math.sqrt(variance)
          },
          confidence: Math.min(1, times.length / 5) // Higher confidence with more data
        };
      }
    }
    
    return predictions;
  }

  /**
   * Predict readiness for higher difficulty levels
   */
  private predictDifficultyReadiness(progressRecords: any[]) {
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
    
    if (completedRecords.length < 5) {
      return { ready: false, confidence: 0, recommendation: 'Need more data' };
    }
    
    // Get recent performance (last 5 activities)
    const recentRecords = completedRecords.slice(-5);
    const recentScores = recentRecords.map(r => r.score || 0);
    const recentDifficulties = recentRecords.map(r => r.activity.difficulty);
    
    const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const maxRecentDifficulty = Math.max(...recentDifficulties);
    const scoreConsistency = 1 - (this.calculateVariance(recentScores) / 100);
    
    // Readiness criteria
    const ready = avgRecentScore >= 75 && scoreConsistency >= 0.7;
    const confidence = (avgRecentScore / 100) * scoreConsistency;
    
    return {
      ready,
      confidence,
      currentMaxDifficulty: maxRecentDifficulty,
      recommendedNextDifficulty: ready ? maxRecentDifficulty + 1 : maxRecentDifficulty,
      recommendation: ready ? 
        'Ready for more challenging content' : 
        'Continue practicing at current difficulty level'
    };
  }

  /**
   * Predict subject mastery progression
   */
  private predictSubjectMastery(progressRecords: any[]) {
    const subjectProgress = new Map();
    
    progressRecords.forEach(record => {
      const subject = record.activity.plan.subject;
      if (!subjectProgress.has(subject)) {
        subjectProgress.set(subject, []);
      }
      if (record.status === ProgressStatus.COMPLETED) {
        subjectProgress.get(subject).push({
          score: record.score || 0,
          difficulty: record.activity.difficulty,
          completedAt: record.completedAt
        });
      }
    });
    
    const predictions = {};
    
    for (const [subject, records] of subjectProgress.entries()) {
      if (records.length >= 3) {
        const sortedRecords = records.sort((a, b) => 
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
        
        const scores = sortedRecords.map(r => r.score);
        const timePoints = sortedRecords.map((r, index) => index);
        
        const regression = this.calculateLinearRegression(timePoints, scores);
        const currentMastery = scores[scores.length - 1];
        const projectedMastery = regression.slope * (scores.length + 5) + regression.intercept;
        
        predictions[subject] = {
          currentMastery,
          projectedMastery: Math.max(0, Math.min(100, projectedMastery)),
          trend: regression.slope > 0.5 ? 'rapid_improvement' : 
                 regression.slope > 0.1 ? 'steady_improvement' : 
                 regression.slope < -0.1 ? 'declining' : 'stable',
          timeToMastery: regression.slope > 0 ? Math.max(0, (85 - currentMastery) / regression.slope) : null,
          confidence: this.calculateRSquared(timePoints, scores, regression)
        };
      }
    }
    
    return predictions;
  }

  /**
   * Assess learning risks and potential issues
   */
  private assessLearningRisks(progressRecords: any[]) {
    const risks: LearningRiskType[] = [];
    
    // Check for declining performance
    const recentRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .slice(-10);
    
    if (recentRecords.length >= 5) {
      const scores = recentRecords.map(r => r.score || 0);
      const timePoints = recentRecords.map((r, index) => index);
      const regression = this.calculateLinearRegression(timePoints, scores);
      
      if (regression.slope < -1) {
        risks.push({
          type: 'declining_performance',
          severity: 'high',
          message: 'Performance has been declining in recent activities',
          recommendation: 'Review learning approach and provide additional support'
        });
      }
    }
    
    // Check for excessive help-seeking
    const helpRequestRate = progressRecords.filter(r => r.helpRequests.length > 0).length / progressRecords.length;
    if (helpRequestRate > 0.5) {
      risks.push({
        type: 'excessive_help_seeking',
        severity: 'medium',
        message: 'Frequently needs help, may indicate content is too challenging',
        recommendation: 'Consider reducing difficulty or providing more scaffolding'
      });
    }
    
    // Check for inactivity risk
    const lastActivity = progressRecords[progressRecords.length - 1];
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivity.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastActivity > 7) {
        risks.push({
          type: 'inactivity_risk',
          severity: daysSinceLastActivity > 14 ? 'high' : 'medium',
          message: `No activity for ${daysSinceLastActivity} days`,
          recommendation: 'Engage with motivational content or easier activities to rebuild momentum'
        });
      }
    }
    
    return risks;
  }

  /**
   * Generate actionable insights from predictions
   */
  private generatePredictiveInsights(predictions: any) {
    const insights: string[] = [];
    
    // Score prediction insights
    if (predictions.scorePredicition.trend === 'improving') {
      insights.push('Performance is trending upward - consider introducing more challenging content');
    } else if (predictions.scorePredicition.trend === 'declining') {
      insights.push('Performance is declining - review recent activities and provide additional support');
    }
    
    // Difficulty readiness insights
    if (predictions.difficultyReadiness.ready) {
      insights.push(`Ready for difficulty level ${predictions.difficultyReadiness.recommendedNextDifficulty}`);
    } else {
      insights.push('Continue practicing at current difficulty level to build confidence');
    }
    
    // Subject mastery insights
    for (const [subject, mastery] of Object.entries(predictions.subjectMastery)) {
      const m = mastery as any;
      if (m.trend === 'rapid_improvement') {
        insights.push(`${subject}: Showing rapid improvement - excellent progress!`);
      } else if (m.timeToMastery && m.timeToMastery < 10) {
        insights.push(`${subject}: Close to mastery - ${Math.ceil(m.timeToMastery)} more activities needed`);
      }
    }
    
    // Risk-based insights
    predictions.riskAssessment.forEach((risk: any) => {
      insights.push(`⚠️ ${risk.message} - ${risk.recommendation}`);
    });
    
    return insights;
  }

  // Helper methods for statistical calculations
  private calculateVariance(values: number[]) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }

  private calculateLinearRegression(x: number[], y: number[]) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private calculateCorrelation(x: number[], y: number[]) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateRSquared(x: number[], y: number[], regression: { slope: number; intercept: number }) {
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = regression.slope * x[i] + regression.intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    return totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  }

  private calculatePatternConfidence(progressCount: number, interactionCount: number) {
    const totalData = progressCount + interactionCount;
    return Math.min(1, totalData / 50); // Full confidence with 50+ data points
  }

  private calculateStyleConfidence(preferences: any[]) {
    if (preferences.length === 0) return 0;
    const topPreference = preferences[0];
    const totalInteractions = preferences.reduce((sum, p) => sum + p.totalInteractions, 0);
    return Math.min(1, (topPreference.engagementRate * topPreference.totalInteractions) / totalInteractions);
  }

  private calculatePredictionConfidence(progressRecords: any[]) {
    const completedCount = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED).length;
    return Math.min(1, completedCount / 20); // Full confidence with 20+ completed activities
  }

  private groupByDay(records: any[]) {
    const grouped: { [key: string]: any[] } = {};
    records.forEach(record => {
      const date = new Date(record.updatedAt || record.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(record);
    });
    return grouped;
  }

  private calculatePreferredContentLength(contentInteractions: any[]) {
    if (contentInteractions.length === 0) return 'unknown';
    
    const completedInteractions = contentInteractions.filter(i => i.progressPercentage >= 90);
    if (completedInteractions.length === 0) return 'unknown';
    
    const durations = completedInteractions
      .map(i => i.content.duration)
      .filter(d => d && d > 0);
    
    if (durations.length === 0) return 'unknown';
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return avgDuration < 300 ? 'short' : avgDuration < 900 ? 'medium' : 'long'; // 5min, 15min thresholds
  }

  private analyzeWeeklyPattern(completedRecords: any[]) {
    const dayOfWeekCounts = new Array(7).fill(0);
    
    completedRecords.forEach(record => {
      const dayOfWeek = new Date(record.completedAt).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    });
    
    const maxCount = Math.max(...dayOfWeekCounts);
    const maxDay = dayOfWeekCounts.indexOf(maxCount);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      mostActiveDay: dayNames[maxDay],
      distribution: dayOfWeekCounts,
      pattern: maxCount > completedRecords.length * 0.3 ? 'concentrated' : 'distributed'
    };
  }
}

export default new AnalyticsService();