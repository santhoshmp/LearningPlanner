import { PrismaClient, ProgressStatus, DifficultyLevel, ResourceType } from '@prisma/client';
import { 
  TimeFrame, 
  DetailedProgressTracking, 
  DetailedMetrics, 
  LearningVelocity, 
  EngagementPatterns, 
  MasteryIndicator,
  SubjectProgressDetail,
  TopicMasteryDetail,
  SkillVisualization,
  SubjectProficiency,
  VisualIndicator,
  ProficiencyLevel
} from '../types/analytics';
import { logger } from '../utils/logger';
import { MasterDataService } from './masterDataService';

export class EnhancedAnalyticsService {
  private prisma: PrismaClient;
  private masterDataService: MasterDataService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.masterDataService = new MasterDataService(prisma);
  }

  /**
   * Get comprehensive real progress tracking with master data integration
   */
  async getRealProgressTracking(childId: string, timeFrame?: TimeFrame): Promise<DetailedProgressTracking> {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get comprehensive progress data with master data relationships
      const progressRecords = await this.prisma.progressRecord.findMany({
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

      // Get content interactions with master data context
      const contentInteractions = await this.prisma.contentInteraction.findMany({
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

      // Get resource usage data
      const resourceUsage = await this.prisma.resourceUsage.findMany({
        where: {
          childId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          resource: {
            include: {
              topic: {
                include: {
                  subject: true,
                  grade: true
                }
              }
            }
          }
        }
      });

      // Calculate enhanced metrics with master data integration
      const detailedMetrics = await this.calculateDetailedMetricsWithMasterData(
        progressRecords, 
        contentInteractions, 
        resourceUsage
      );
      
      // Calculate learning velocity with subject-specific analysis
      const learningVelocity = await this.calculateSubjectSpecificLearningVelocity(progressRecords);
      
      // Calculate engagement patterns with master data insights
      const engagementPatterns = await this.calculateMasterDataEngagementPatterns(
        progressRecords, 
        contentInteractions, 
        resourceUsage
      );
      
      // Calculate mastery indicators by subject and topic
      const masteryIndicators = await this.calculateMasterDataMasteryIndicators(progressRecords);

      return {
        timeFrame: { start, end },
        detailedMetrics,
        learningVelocity,
        engagementPatterns,
        masteryIndicators,
        totalDataPoints: progressRecords.length + contentInteractions.length + resourceUsage.length
      };
    } catch (error) {
      logger.error('Error getting real progress tracking:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics dashboard data with real data integration
   */
  async getComprehensiveDashboardData(childId: string, timeFrame?: TimeFrame): Promise<{
    overview: DetailedProgressTracking;
    subjectBreakdown: SubjectProgressDetail[];
    topicMastery: TopicMasteryDetail[];
    skillVisualization: SkillVisualization;
    timeSeriesData: any[];
    comparativeAnalysis: any;
  }> {
    try {
      const [
        overview,
        subjectBreakdown,
        topicMastery,
        skillVisualization
      ] = await Promise.all([
        this.getRealProgressTracking(childId, timeFrame),
        this.getSubjectProgressBreakdown(childId, timeFrame),
        this.getTopicMasteryDetails(childId),
        this.getSkillProficiencyVisualization(childId)
      ]);

      // Generate time series data for charts
      const timeSeriesData = await this.generateTimeSeriesData(childId, timeFrame);
      
      // Generate comparative analysis
      const comparativeAnalysis = await this.generateComparativeAnalysis(childId, timeFrame);

      return {
        overview,
        subjectBreakdown,
        topicMastery,
        skillVisualization,
        timeSeriesData,
        comparativeAnalysis
      };
    } catch (error) {
      logger.error('Error getting comprehensive dashboard data:', error);
      throw error;
    }
  }

  /**
   * Generate time series data for interactive charts
   */
  async generateTimeSeriesData(childId: string, timeFrame?: TimeFrame): Promise<any[]> {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get daily progress records
      const progressRecords = await this.prisma.progressRecord.findMany({
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
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });

      // Group by day and calculate daily metrics
      const dailyData = new Map<string, any>();
      
      // Initialize all days in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyData.set(dateKey, {
          date: dateKey,
          dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          activitiesCompleted: 0,
          totalScore: 0,
          totalTime: 0,
          helpRequests: 0,
          subjects: new Set(),
          completionRate: 0,
          averageScore: 0,
          sessionTime: 0
        });
      }

      // Aggregate daily data
      progressRecords.forEach(record => {
        const dateKey = new Date(record.updatedAt || record.createdAt).toISOString().split('T')[0];
        const dayData = dailyData.get(dateKey);
        
        if (dayData) {
          if (record.status === 'COMPLETED') {
            dayData.activitiesCompleted++;
            dayData.totalScore += record.score || 0;
          }
          dayData.totalTime += record.timeSpent;
          // Get help requests count from related data
          const helpRequestsCount = record.helpRequests?.length || 0;
          dayData.helpRequests += helpRequestsCount;
          dayData.subjects.add(record.activity.plan.subject);
        }
      });

      // Calculate derived metrics
      const timeSeriesData = Array.from(dailyData.values()).map(day => {
        const completedCount = day.activitiesCompleted;
        return {
          ...day,
          completionRate: completedCount > 0 ? 100 : 0,
          averageScore: completedCount > 0 ? day.totalScore / completedCount : 0,
          sessionTime: day.totalTime,
          subjectCount: day.subjects.size,
          engagementScore: this.calculateDailyEngagementScore(day)
        };
      });

      return timeSeriesData;
    } catch (error) {
      logger.error('Error generating time series data:', error);
      throw error;
    }
  }

  /**
   * Generate comparative analysis data
   */
  async generateComparativeAnalysis(childId: string, timeFrame?: TimeFrame): Promise<any> {
    try {
      // Get child's grade level for peer comparison context
      const child = await this.prisma.childProfile.findUnique({
        where: { id: childId },
        select: { gradeLevel: true }
      });

      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      // Get current period data
      const currentData = await this.getRealProgressTracking(childId, timeFrame);
      
      // Get previous period for comparison
      const { start } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      
      const periodLength = new Date(timeFrame?.end || new Date()).getTime() - new Date(start).getTime();
      const previousStart = new Date(new Date(start).getTime() - periodLength);
      const previousEnd = new Date(start);
      
      const previousData = await this.getRealProgressTracking(childId, {
        start: previousStart.toISOString(),
        end: previousEnd.toISOString()
      });

      // Calculate period-over-period changes
      const comparison = {
        completionRate: {
          current: currentData.detailedMetrics.basic.completionRate,
          previous: previousData.detailedMetrics.basic.completionRate,
          change: currentData.detailedMetrics.basic.completionRate - previousData.detailedMetrics.basic.completionRate
        },
        averageScore: {
          current: currentData.detailedMetrics.performance.averageScore,
          previous: previousData.detailedMetrics.performance.averageScore,
          change: currentData.detailedMetrics.performance.averageScore - previousData.detailedMetrics.performance.averageScore
        },
        timeSpent: {
          current: currentData.detailedMetrics.basic.totalTimeSpent,
          previous: previousData.detailedMetrics.basic.totalTimeSpent,
          change: currentData.detailedMetrics.basic.totalTimeSpent - previousData.detailedMetrics.basic.totalTimeSpent
        },
        learningVelocity: {
          current: currentData.learningVelocity.velocity,
          previous: previousData.learningVelocity.velocity,
          change: currentData.learningVelocity.velocity - previousData.learningVelocity.velocity
        }
      };

      return {
        periodComparison: comparison,
        trends: {
          improving: Object.values(comparison).filter(metric => metric.change > 0).length,
          declining: Object.values(comparison).filter(metric => metric.change < 0).length,
          stable: Object.values(comparison).filter(metric => Math.abs(metric.change) < 0.01).length
        },
        recommendations: this.generateComparisonRecommendations(comparison)
      };
    } catch (error) {
      logger.error('Error generating comparative analysis:', error);
      throw error;
    }
  }

  /**
   * Generate subject-specific progress breakdown with master data integration
   */
  async getSubjectProgressBreakdown(childId: string, timeFrame?: TimeFrame): Promise<SubjectProgressDetail[]> {
    try {
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get all subjects from master data
      const allSubjects = await this.masterDataService.getAllSubjects();
      
      // Get progress records grouped by subject
      const progressRecords = await this.prisma.progressRecord.findMany({
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
          },
          helpRequests: true
        }
      });

      // Group progress by subject
      const subjectProgress = new Map<string, any[]>();
      progressRecords.forEach(record => {
        const subject = record.activity.plan.subject;
        if (!subjectProgress.has(subject)) {
          subjectProgress.set(subject, []);
        }
        subjectProgress.get(subject)!.push(record);
      });

      // Calculate detailed progress for each subject
      const subjectBreakdown: SubjectProgressDetail[] = [];

      for (const subject of allSubjects) {
        const subjectRecords = subjectProgress.get(subject.name) || [];
        const completedRecords = subjectRecords.filter(r => r.status === ProgressStatus.COMPLETED);
        
        // Get topics for this subject from master data
        const topics = await this.getTopicsForSubject(subject.id, childId);
        
        // Calculate metrics
        const totalTopics = topics.length;
        const topicsCompleted = this.calculateCompletedTopics(subjectRecords, topics);
        const overallProgress = totalTopics > 0 ? (topicsCompleted / totalTopics) * 100 : 0;
        
        const scores = completedRecords.map(r => r.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        const totalTimeSpent = subjectRecords.reduce((sum, r) => sum + r.timeSpent, 0);
        
        // Determine proficiency level
        const proficiencyLevel = this.calculateProficiencyLevel(averageScore, overallProgress);
        
        // Analyze strengths and improvement areas
        const { strengthAreas, improvementAreas } = await this.analyzeSubjectAreas(
          subject.id, 
          subjectRecords, 
          topics
        );
        
        // Get recommended next topics
        const nextRecommendedTopics = await this.getRecommendedNextTopics(
          subject.id, 
          childId, 
          topics, 
          subjectRecords
        );
        
        // Calculate mastery trend
        const masteryTrend = this.calculateMasteryTrend(completedRecords);

        subjectBreakdown.push({
          subjectId: subject.id,
          subjectName: subject.displayName,
          overallProgress,
          proficiencyLevel,
          topicsCompleted,
          totalTopics,
          averageScore,
          timeSpent: totalTimeSpent,
          strengthAreas,
          improvementAreas,
          nextRecommendedTopics,
          masteryTrend
        });
      }

      return subjectBreakdown.sort((a, b) => b.overallProgress - a.overallProgress);
    } catch (error) {
      logger.error('Error getting subject progress breakdown:', error);
      throw error;
    }
  }

  /**
   * Generate topic mastery details with master data integration
   */
  async getTopicMasteryDetails(childId: string, subjectId?: string): Promise<TopicMasteryDetail[]> {
    try {
      // Get topics from master data
      const topics = subjectId 
        ? await this.getTopicsForSubject(subjectId, childId)
        : await this.getAllTopicsForChild(childId);

      const topicMasteryDetails: TopicMasteryDetail[] = [];

      for (const topic of topics) {
        // Get progress records for this topic
        const topicRecords = await this.getTopicProgressRecords(childId, topic.id);
        
        if (topicRecords.length === 0) {
          // Topic not started
          topicMasteryDetails.push({
            topicId: topic.id,
            topicName: topic.displayName,
            subjectId: topic.subjectId,
            masteryLevel: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(0),
            status: { status: 'not_started' },
            difficultyProgression: [],
            resourcesUsed: []
          });
          continue;
        }

        // Calculate mastery metrics
        const completedRecords = topicRecords.filter(r => r.status === ProgressStatus.COMPLETED);
        const scores = completedRecords.map(r => r.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const totalTimeSpent = topicRecords.reduce((sum, r) => sum + r.timeSpent, 0);
        const lastActivity = new Date(Math.max(...topicRecords.map(r => new Date(r.updatedAt || r.createdAt).getTime())));

        // Calculate mastery level (0-100)
        const masteryLevel = this.calculateTopicMasteryLevel(topicRecords, averageScore);
        
        // Determine status
        const status = this.determineTopicStatus(topicRecords, masteryLevel);
        
        // Get difficulty progression
        const difficultyProgression = this.calculateDifficultyProgression(topicRecords);
        
        // Get resources used
        const resourcesUsed = await this.getTopicResourceUsage(childId, topic.id);

        topicMasteryDetails.push({
          topicId: topic.id,
          topicName: topic.displayName,
          subjectId: topic.subjectId,
          masteryLevel,
          attemptsCount: topicRecords.length,
          averageScore,
          timeSpent: totalTimeSpent,
          lastActivity,
          status: { status },
          difficultyProgression,
          resourcesUsed
        });
      }

      return topicMasteryDetails.sort((a, b) => b.masteryLevel - a.masteryLevel);
    } catch (error) {
      logger.error('Error getting topic mastery details:', error);
      throw error;
    }
  }

  /**
   * Generate skill proficiency visualization with master data integration
   */
  async getSkillProficiencyVisualization(childId: string): Promise<SkillVisualization> {
    try {
      // Get child's grade level for context
      const child = await this.prisma.childProfile.findUnique({
        where: { id: childId },
        select: { gradeLevel: true }
      });

      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      // Get all subjects for the child's grade
      const subjects = await this.masterDataService.getSubjectsByGrade(child.gradeLevel);
      
      // Calculate subject proficiencies
      const subjectProficiencies: SubjectProficiency[] = [];
      let totalProficiencyScore = 0;
      let subjectCount = 0;

      for (const subject of subjects) {
        const proficiency = await this.calculateSubjectProficiency(childId, subject.id);
        if (proficiency) {
          subjectProficiencies.push(proficiency);
          totalProficiencyScore += proficiency.proficiencyScore;
          subjectCount++;
        }
      }

      // Calculate overall proficiency level
      const overallScore = subjectCount > 0 ? totalProficiencyScore / subjectCount : 0;
      const overallLevel = this.calculateProficiencyLevel(overallScore, overallScore);

      // Generate radar chart data
      const radarChartData = this.generateRadarChartData(subjectProficiencies);
      
      // Get progress timeline
      const progressTimeline = await this.generateProgressTimeline(childId);
      
      // Get achievement badges
      const achievementBadges = await this.getAchievementBadges(childId);
      
      // Get next milestones
      const nextMilestones = await this.getNextMilestones(childId, subjectProficiencies);

      return {
        childId,
        overallLevel,
        subjectProficiencies,
        skillRadarChart: radarChartData,
        progressTimeline,
        achievementBadges,
        nextMilestones
      };
    } catch (error) {
      logger.error('Error getting skill proficiency visualization:', error);
      throw error;
    }
  }

  /**
   * Calculate subject proficiency with master data integration
   */
  private async calculateSubjectProficiency(childId: string, subjectId: string): Promise<SubjectProficiency | null> {
    try {
      // Get subject details from master data
      const subject = await this.masterDataService.getSubjectById(subjectId);
      if (!subject) return null;

      // Get child's grade level
      const child = await this.prisma.childProfile.findUnique({
        where: { id: childId },
        select: { gradeLevel: true }
      });
      if (!child) return null;

      // Get topics for this subject and grade
      const topics = await this.masterDataService.getTopicsBySubject(child.gradeLevel, subjectId);
      
      // Get progress records for this subject
      const progressRecords = await this.prisma.progressRecord.findMany({
        where: {
          childId,
          activity: {
            plan: {
              subject: subject.name
            }
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

      if (progressRecords.length === 0) {
        return {
          subjectId,
          subjectName: subject.displayName,
          proficiencyLevel: 'beginner',
          proficiencyScore: 0,
          visualIndicator: {
            type: 'progress-bar',
            value: 0,
            maxValue: 100,
            color: '#f44336'
          },
          topicBreakdown: topics.map(topic => ({
            topicId: topic.id,
            topicName: topic.displayName,
            masteryLevel: 0,
            status: 'not_started'
          })),
          trendDirection: 'stable',
          confidenceLevel: 0
        };
      }

      // Calculate metrics
      const completedRecords = progressRecords.filter(r => r.status === 'COMPLETED');
      const scores = completedRecords.map(r => r.score || 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      // Calculate topic breakdown
      const topicBreakdown = await Promise.all(topics.map(async (topic) => {
        const topicRecords = await this.getTopicProgressRecords(childId, topic.id);
        const topicScores = topicRecords.filter(r => r.status === 'COMPLETED').map(r => r.score || 0);
        const topicAverage = topicScores.length > 0 ? topicScores.reduce((a, b) => a + b, 0) / topicScores.length : 0;
        
        let status: 'not_started' | 'in_progress' | 'completed' | 'mastered' = 'not_started';
        if (topicRecords.length === 0) {
          status = 'not_started';
        } else if (topicAverage >= 90) {
          status = 'mastered';
        } else if (topicRecords.some(r => r.status === 'COMPLETED')) {
          status = 'completed';
        } else {
          status = 'in_progress';
        }

        return {
          topicId: topic.id,
          topicName: topic.displayName,
          masteryLevel: topicAverage,
          status
        };
      }));

      // Calculate proficiency score (weighted by topic completion and scores)
      const completedTopics = topicBreakdown.filter(t => t.status === 'completed' || t.status === 'mastered').length;
      const totalTopics = topics.length;
      const completionRate = totalTopics > 0 ? completedTopics / totalTopics : 0;
      
      const proficiencyScore = Math.min(100, (averageScore * 0.6) + (completionRate * 40));
      
      // Determine proficiency level
      const proficiencyLevel = this.calculateProficiencyLevel(averageScore, proficiencyScore);
      
      // Calculate trend direction
      const recentRecords = completedRecords.slice(-5);
      const olderRecords = completedRecords.slice(0, -5);
      const recentAverage = recentRecords.length > 0 ? recentRecords.reduce((sum, r) => sum + (r.score || 0), 0) / recentRecords.length : 0;
      const olderAverage = olderRecords.length > 0 ? olderRecords.reduce((sum, r) => sum + (r.score || 0), 0) / olderRecords.length : 0;
      
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (recentRecords.length >= 3 && olderRecords.length >= 3) {
        if (recentAverage > olderAverage + 5) {
          trendDirection = 'up';
        } else if (recentAverage < olderAverage - 5) {
          trendDirection = 'down';
        }
      }

      // Calculate confidence level based on data points and consistency
      const confidenceLevel = Math.min(1, (completedRecords.length / 10) * (1 - (this.calculateVariance(scores) / 1000)));

      return {
        subjectId,
        subjectName: subject.displayName,
        proficiencyLevel,
        proficiencyScore,
        visualIndicator: {
          type: 'progress-bar',
          value: proficiencyScore,
          maxValue: 100,
          color: this.getProficiencyColor(proficiencyLevel)
        },
        topicBreakdown,
        trendDirection,
        confidenceLevel
      };
    } catch (error) {
      logger.error(`Error calculating subject proficiency for ${subjectId}:`, error);
      return null;
    }
  }

  /**
   * Generate radar chart data for skill visualization
   */
  private generateRadarChartData(subjectProficiencies: SubjectProficiency[]): any[] {
    return subjectProficiencies.map(subject => ({
      subject: subject.subjectName,
      proficiency: subject.proficiencyScore,
      fullMark: 100
    }));
  }

  /**
   * Generate progress timeline data
   */
  private async generateProgressTimeline(childId: string): Promise<any[]> {
    try {
      const progressRecords = await this.prisma.progressRecord.findMany({
        where: {
          childId,
          status: 'COMPLETED'
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        },
        orderBy: {
          completedAt: 'asc'
        }
      });

      // Group by week and calculate metrics
      const weeklyData = new Map<string, any>();
      
      progressRecords.forEach(record => {
        if (!record.completedAt) return;
        
        const date = new Date(record.completedAt);
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            date: weekKey,
            overallProgress: 0,
            averageScore: 0,
            activitiesCompleted: 0,
            totalScore: 0
          });
        }
        
        const weekData = weeklyData.get(weekKey);
        weekData.activitiesCompleted++;
        weekData.totalScore += record.score || 0;
      });

      // Calculate derived metrics
      const timelineData = Array.from(weeklyData.values()).map(week => ({
        ...week,
        averageScore: week.activitiesCompleted > 0 ? week.totalScore / week.activitiesCompleted : 0,
        overallProgress: week.activitiesCompleted * 10 // Simple progress calculation
      }));

      return timelineData.slice(-12); // Last 12 weeks
    } catch (error) {
      logger.error('Error generating progress timeline:', error);
      return [];
    }
  }

  /**
   * Get achievement badges for child
   */
  private async getAchievementBadges(childId: string): Promise<any[]> {
    try {
      // This would typically come from an achievements table
      // For now, generate mock achievements based on progress
      const progressRecords = await this.prisma.progressRecord.findMany({
        where: {
          childId,
          status: 'COMPLETED'
        }
      });

      const achievements = [];
      
      // First completion achievement
      if (progressRecords.length >= 1) {
        achievements.push({
          id: 'first-completion',
          title: 'First Steps',
          description: 'Completed your first activity!',
          icon: 'star',
          color: '#4CAF50',
          earnedAt: progressRecords[0].completedAt || new Date(),
          category: 'completion',
          points: 10,
          rarity: 'common'
        });
      }

      // Streak achievements
      const streakDays = await this.calculateStreakDays(progressRecords);
      if (streakDays >= 7) {
        achievements.push({
          id: 'week-streak',
          title: 'Week Warrior',
          description: 'Maintained a 7-day learning streak!',
          icon: 'trending_up',
          color: '#FF9800',
          earnedAt: new Date(),
          category: 'streak',
          points: 50,
          rarity: 'rare'
        });
      }

      // High score achievement
      const highScores = progressRecords.filter(r => (r.score || 0) >= 95);
      if (highScores.length >= 5) {
        achievements.push({
          id: 'perfectionist',
          title: 'Perfectionist',
          description: 'Scored 95% or higher on 5 activities!',
          icon: 'star',
          color: '#9C27B0',
          earnedAt: new Date(),
          category: 'academic',
          points: 100,
          rarity: 'epic'
        });
      }

      return achievements;
    } catch (error) {
      logger.error('Error getting achievement badges:', error);
      return [];
    }
  }

  /**
   * Get next milestones for child
   */
  private async getNextMilestones(childId: string, subjectProficiencies: SubjectProficiency[]): Promise<any[]> {
    try {
      const milestones = [];

      // Subject mastery milestones
      for (const subject of subjectProficiencies) {
        if (subject.proficiencyLevel !== 'mastery') {
          const progress = subject.topicBreakdown.filter(t => t.status === 'mastered').length;
          const target = subject.topicBreakdown.length;
          
          milestones.push({
            id: `mastery-${subject.subjectId}`,
            title: `${subject.subjectName} Mastery`,
            description: `Master all topics in ${subject.subjectName}`,
            progress,
            target,
            estimatedCompletion: new Date(Date.now() + (target - progress) * 7 * 24 * 60 * 60 * 1000), // 1 week per topic
            category: 'academic',
            isCompleted: false
          });
        }
      }

      // Overall progress milestone
      const totalCompleted = subjectProficiencies.reduce((sum, s) => sum + s.topicBreakdown.filter(t => t.status === 'completed' || t.status === 'mastered').length, 0);
      const totalTopics = subjectProficiencies.reduce((sum, s) => sum + s.topicBreakdown.length, 0);
      
      if (totalCompleted < totalTopics) {
        milestones.push({
          id: 'overall-completion',
          title: 'Learning Champion',
          description: 'Complete 80% of all available topics',
          progress: totalCompleted,
          target: Math.floor(totalTopics * 0.8),
          estimatedCompletion: new Date(Date.now() + (totalTopics * 0.8 - totalCompleted) * 5 * 24 * 60 * 60 * 1000),
          category: 'completion',
          isCompleted: false
        });
      }

      return milestones.slice(0, 5); // Return top 5 milestones
    } catch (error) {
      logger.error('Error getting next milestones:', error);
      return [];
    }
  }

  /**
   * Get proficiency color based on level
   */
  private getProficiencyColor(level: ProficiencyLevel): string {
    switch (level) {
      case 'mastery': return '#4CAF50';
      case 'advanced': return '#2196F3';
      case 'intermediate': return '#FF9800';
      case 'beginner': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  /**
   * Calculate detailed metrics with master data integration
   */
  private async calculateDetailedMetricsWithMasterData(
    progressRecords: any[], 
    contentInteractions: any[], 
    resourceUsage: any[]
  ): Promise<DetailedMetrics> {
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
    
    // Basic metrics
    const totalActivities = progressRecords.length;
    const completedActivities = completedRecords.length;
    const completionRate = totalActivities > 0 ? completedActivities / totalActivities : 0;
    
    // Score metrics with subject weighting
    const scores = completedRecords.map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const scoreVariance = this.calculateVariance(scores);
    const scoreStandardDeviation = Math.sqrt(scoreVariance);
    
    // Time metrics
    const timesSpent = progressRecords.map(r => r.timeSpent);
    const totalTimeSpent = timesSpent.reduce((a, b) => a + b, 0);
    const averageTimePerActivity = timesSpent.length > 0 ? totalTimeSpent / timesSpent.length : 0;
    const timeEfficiency = averageScore > 0 && averageTimePerActivity > 0 ? averageScore / averageTimePerActivity : 0;
    
    // Content interaction metrics with master data context
    const totalInteractions = contentInteractions.length;
    const videoInteractions = contentInteractions.filter(i => i.content.contentType === 'video').length;
    const articleInteractions = contentInteractions.filter(i => i.content.contentType === 'article').length;
    const interactiveInteractions = contentInteractions.filter(i => i.content.contentType === 'interactive').length;
    
    // Resource usage metrics
    const uniqueResourcesUsed = new Set(resourceUsage.map(r => r.resourceId)).size;
    const resourceCompletions = resourceUsage.filter(r => r.action === 'complete').length;
    
    // Engagement depth with master data insights
    const completedInteractions = contentInteractions.filter(i => i.progressPercentage >= 90).length;
    const engagementDepth = totalInteractions > 0 ? completedInteractions / totalInteractions : 0;
    
    // Calculate streak days
    const streakDays = await this.calculateStreakDays(progressRecords);
    
    // Calculate average session duration
    const sessionDurations = this.calculateSessionDurations(progressRecords);
    const averageSessionDuration = sessionDurations.length > 0 ? 
      sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : 0;

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
        consistencyScore: Math.max(0, 1 - (scoreStandardDeviation / 100))
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
      },
      // Resource metrics would be added here when resource tracking is implemented
      streakDays,
      averageSessionDuration,
      lastActivityDate: progressRecords.length > 0 ? 
        new Date(Math.max(...progressRecords.map(r => new Date(r.updatedAt || r.createdAt).getTime()))) : undefined
    };
  }

  /**
   * Calculate subject-specific learning velocity
   */
  private async calculateSubjectSpecificLearningVelocity(progressRecords: any[]): Promise<LearningVelocity> {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED && r.completedAt)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    if (completedRecords.length < 3) {
      return {
        velocity: 0,
        efficiencyVelocity: 0,
        acceleration: 0,
        trend: 'stable'
      };
    }

    // Group by subject for subject-specific analysis
    const subjectVelocities = new Map<string, number>();
    const subjectGroups = this.groupBySubject(completedRecords);

    for (const [subject, records] of subjectGroups.entries()) {
      if (records.length >= 3) {
        const scores = records.map(r => r.score || 0);
        const timePoints = records.map((r, index) => index);
        const velocity = this.calculateLinearRegression(timePoints, scores).slope;
        subjectVelocities.set(subject, velocity);
      }
    }

    // Calculate overall velocity
    const scores = completedRecords.map(r => r.score || 0);
    const timePoints = completedRecords.map((r, index) => index);
    const overallVelocity = this.calculateLinearRegression(timePoints, scores).slope;

    // Calculate efficiency velocity (score improvement per unit time)
    const timeEfficiencies = completedRecords.map(r => (r.score || 0) / Math.max(r.timeSpent, 1));
    const efficiencyVelocity = this.calculateLinearRegression(timePoints, timeEfficiencies).slope;

    // Calculate acceleration (change in velocity over time)
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
      velocity: overallVelocity,
      efficiencyVelocity,
      acceleration,
      trend: overallVelocity > 0.1 ? 'improving' : overallVelocity < -0.1 ? 'declining' : 'stable'
    };
  }

  /**
   * Calculate engagement patterns with master data insights
   */
  private async calculateMasterDataEngagementPatterns(
    progressRecords: any[], 
    contentInteractions: any[], 
    resourceUsage: any[]
  ): Promise<EngagementPatterns> {
    // Time-of-day patterns
    const hourlyActivity = new Array(24).fill(0);
    [...progressRecords, ...contentInteractions, ...resourceUsage].forEach(record => {
      const timestamp = record.updatedAt || record.createdAt || record.timestamp;
      const hour = new Date(timestamp).getHours();
      hourlyActivity[hour]++;
    });
    
    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
    
    // Session length patterns with master data context
    const sessionLengths = progressRecords.map(r => r.timeSpent);
    const averageSessionLength = sessionLengths.length > 0 ? 
      sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0;
    
    // Consistency patterns
    const dailyActivity = this.groupByDay([...progressRecords, ...contentInteractions, ...resourceUsage]);
    const activeDays = Object.keys(dailyActivity).length;
    const totalDays = Math.ceil((Date.now() - new Date(Math.min(
      ...progressRecords.map(r => new Date(r.createdAt).getTime()),
      ...contentInteractions.map(i => new Date(i.createdAt).getTime()),
      ...resourceUsage.map(r => new Date(r.timestamp).getTime())
    )).getTime()) / (1000 * 60 * 60 * 24));
    
    const consistencyScore = totalDays > 0 ? activeDays / totalDays : 0;
    
    // Resource type preferences
    const resourceTypePreferences = this.calculateResourceTypePreferences(resourceUsage);
    
    // Subject engagement patterns
    const subjectEngagement = this.calculateSubjectEngagementPatterns(progressRecords);

    return {
      peakHours,
      averageSessionLength,
      consistencyScore,
      engagementFrequency: activeDays > 0 ? 
        (progressRecords.length + contentInteractions.length + resourceUsage.length) / activeDays : 0,
      preferredContentLength: this.calculatePreferredContentLength(contentInteractions),
      // Resource type preferences would be calculated when resource tracking is implemented
      subjectEngagement
    };
  }

  /**
   * Calculate mastery indicators with master data integration
   */
  private async calculateMasterDataMasteryIndicators(progressRecords: any[]): Promise<MasteryIndicator[]> {
    const subjectMastery = new Map();
    
    // Group progress records by subject
    progressRecords.forEach(record => {
      const subject = record.activity.plan.subject;
      if (!subjectMastery.has(subject)) {
        subjectMastery.set(subject, {
          attempts: 0,
          completions: 0,
          totalScore: 0,
          difficulties: [],
          timeSpent: 0
        });
      }
      
      const mastery = subjectMastery.get(subject);
      mastery.attempts++;
      mastery.timeSpent += record.timeSpent;
      
      if (record.status === ProgressStatus.COMPLETED) {
        mastery.completions++;
        mastery.totalScore += record.score || 0;
        mastery.difficulties.push(record.activity.difficulty);
      }
    });
    
    // Get subject details from master data
    const allSubjects = await this.masterDataService.getAllSubjects();
    const subjectMap = new Map(allSubjects.map(s => [s.name, s]));
    
    const masteryLevels: MasteryIndicator[] = [];
    
    for (const [subjectName, data] of subjectMastery.entries()) {
      const subject = subjectMap.get(subjectName);
      if (!subject) continue;
      
      const completionRate = data.attempts > 0 ? data.completions / data.attempts : 0;
      const averageScore = data.completions > 0 ? data.totalScore / data.completions : 0;
      const averageDifficulty = data.difficulties.length > 0 ? 
        data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length : 0;
      
      // Calculate mastery level (0-100) with weighted factors
      const masteryLevel = Math.min(100, 
        (completionRate * 30) + 
        (averageScore * 0.5) + 
        (averageDifficulty * 15) +
        (Math.min(data.attempts / 10, 1) * 5) // Bonus for practice
      );
      
      masteryLevels.push({
        subject: subject.displayName,
        masteryLevel,
        completionRate,
        averageScore,
        averageDifficulty,
        status: masteryLevel >= 80 ? 'mastered' : 
                masteryLevel >= 60 ? 'proficient' : 
                masteryLevel >= 40 ? 'developing' : 'beginner'
      });
    }
    
    return masteryLevels.sort((a, b) => b.masteryLevel - a.masteryLevel);
  }

  // Helper methods
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }

  private calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0 };
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
  }

  private groupBySubject(records: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    records.forEach(record => {
      const subject = record.activity.plan.subject;
      if (!groups.has(subject)) {
        groups.set(subject, []);
      }
      groups.get(subject)!.push(record);
    });
    return groups;
  }

  private groupByDay(records: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    records.forEach(record => {
      const timestamp = record.updatedAt || record.createdAt || record.timestamp;
      const day = new Date(timestamp).toISOString().split('T')[0];
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(record);
    });
    return groups;
  }

  private calculateProficiencyLevel(score: number, progress: number): ProficiencyLevel {
    const combined = (score + progress) / 2;
    if (combined >= 90) return 'mastered';
    if (combined >= 75) return 'proficient';
    if (combined >= 50) return 'developing';
    return 'beginner';
  }

  private async getTopicsForSubject(subjectId: string, childId: string): Promise<any[]> {
    // Get child's grade level
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { gradeLevel: true }
    });

    if (!child) return [];

    return await this.masterDataService.getTopicsBySubject(child.gradeLevel, subjectId);
  }

  private async getAllTopicsForChild(childId: string): Promise<any[]> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { gradeLevel: true }
    });

    if (!child) return [];

    const subjects = await this.masterDataService.getSubjectsByGrade(child.gradeLevel);
    const allTopics: any[] = [];

    for (const subject of subjects) {
      const topics = await this.masterDataService.getTopicsBySubject(child.gradeLevel, subject.id);
      allTopics.push(...topics);
    }

    return allTopics;
  }

  private calculateCompletedTopics(records: any[], topics: any[]): number {
    const completedActivities = records.filter(r => r.status === ProgressStatus.COMPLETED);
    // This is a simplified calculation - in reality, you'd map activities to topics
    return Math.min(completedActivities.length, topics.length);
  }

  private async analyzeSubjectAreas(subjectId: string, records: any[], topics: any[]): Promise<{
    strengthAreas: string[];
    improvementAreas: string[];
  }> {
    // Simplified analysis - in reality, you'd analyze performance by topic
    const completedRecords = records.filter(r => r.status === ProgressStatus.COMPLETED);
    const averageScore = completedRecords.length > 0 ? 
      completedRecords.reduce((sum, r) => sum + (r.score || 0), 0) / completedRecords.length : 0;

    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    // Analyze by difficulty level or topic type
    const difficultyPerformance = new Map<number, number[]>();
    completedRecords.forEach(record => {
      const difficulty = record.activity.difficulty;
      if (!difficultyPerformance.has(difficulty)) {
        difficultyPerformance.set(difficulty, []);
      }
      difficultyPerformance.get(difficulty)!.push(record.score || 0);
    });

    for (const [difficulty, scores] of difficultyPerformance.entries()) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore >= 80) {
        strengthAreas.push(`Level ${difficulty} concepts`);
      } else if (avgScore < 60) {
        improvementAreas.push(`Level ${difficulty} concepts`);
      }
    }

    return { strengthAreas, improvementAreas };
  }

  private async getRecommendedNextTopics(
    subjectId: string, 
    childId: string, 
    topics: any[], 
    records: any[]
  ): Promise<string[]> {
    // Simplified recommendation - in reality, you'd use prerequisite chains
    const completedTopics = new Set(records
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .map(r => r.activity.id) // This would need proper topic mapping
    );

    return topics
      .filter(topic => !completedTopics.has(topic.id))
      .slice(0, 3)
      .map(topic => topic.displayName);
  }

  private calculateMasteryTrend(records: any[]): 'improving' | 'stable' | 'declining' {
    if (records.length < 3) return 'stable';

    const recentScores = records
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .slice(-5)
      .map(r => r.score || 0);

    if (recentScores.length < 2) return 'stable';

    const trend = this.calculateLinearRegression(
      recentScores.map((_, i) => i),
      recentScores
    ).slope;

    return trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable';
  }

  private async getTopicProgressRecords(childId: string, topicId: string): Promise<any[]> {
    // This would need proper mapping between activities and topics
    // For now, return empty array as placeholder
    return [];
  }

  private calculateTopicMasteryLevel(records: any[], averageScore: number): number {
    const completionRate = records.filter(r => r.status === ProgressStatus.COMPLETED).length / records.length;
    return Math.min(100, (completionRate * 50) + (averageScore * 0.5));
  }

  private determineTopicStatus(records: any[], masteryLevel: number): 'not_started' | 'in_progress' | 'completed' | 'mastered' {
    if (records.length === 0) return 'not_started';
    if (masteryLevel >= 90) return 'mastered';
    if (masteryLevel >= 70) return 'completed';
    return 'in_progress';
  }

  private calculateDailyEngagementScore(dayData: any): number {
    // Calculate engagement score based on multiple factors
    const activityFactor = Math.min(dayData.activitiesCompleted / 3, 1) * 30; // Max 30 points for activities
    const timeFactor = Math.min(dayData.totalTime / 60, 1) * 25; // Max 25 points for time (60 min target)
    const subjectFactor = Math.min(dayData.subjectCount / 2, 1) * 20; // Max 20 points for subject diversity
    const helpFactor = Math.max(0, 1 - (dayData.helpRequests / 5)) * 25; // Max 25 points, reduced by help requests
    
    return Math.round(activityFactor + timeFactor + subjectFactor + helpFactor);
  }

  private generateComparisonRecommendations(comparison: any): string[] {
    const recommendations: string[] = [];
    
    if (comparison.completionRate.change < -0.1) {
      recommendations.push("Focus on completing more activities to improve completion rate");
    }
    
    if (comparison.averageScore.change < -5) {
      recommendations.push("Consider reviewing previous topics to strengthen understanding");
    }
    
    if (comparison.timeSpent.change < -30) {
      recommendations.push("Try to maintain consistent study time for better learning outcomes");
    }
    
    if (comparison.learningVelocity.change < -0.1) {
      recommendations.push("Break down complex topics into smaller, manageable chunks");
    }
    
    // Positive recommendations
    if (comparison.completionRate.change > 0.1) {
      recommendations.push("Great improvement in completion rate! Keep up the momentum");
    }
    
    if (comparison.averageScore.change > 5) {
      recommendations.push("Excellent score improvement! Consider tackling more challenging topics");
    }
    
    return recommendations;
  }

  /**
   * Get filtered analytics data based on subjects and topics
   */
  async getFilteredAnalyticsData(
    childId: string, 
    filters: {
      subjects?: string[];
      topics?: string[];
      timeFrame?: TimeFrame;
      difficultyLevels?: number[];
    }
  ): Promise<any> {
    try {
      const { subjects, topics, timeFrame, difficultyLevels } = filters;
      const { start, end } = timeFrame || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      // Build dynamic where clause
      const whereClause: any = {
        childId,
        updatedAt: {
          gte: new Date(start),
          lte: new Date(end)
        }
      };

      // Add subject filter
      if (subjects && subjects.length > 0) {
        whereClause.activity = {
          plan: {
            subject: {
              in: subjects
            }
          }
        };
      }

      // Add difficulty filter
      if (difficultyLevels && difficultyLevels.length > 0) {
        whereClause.activity = {
          ...whereClause.activity,
          difficulty: {
            in: difficultyLevels
          }
        };
      }

      const progressRecords = await this.prisma.progressRecord.findMany({
        where: whereClause,
        include: {
          activity: {
            include: {
              plan: true
            }
          }
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });

      // Calculate filtered metrics
      const filteredMetrics = await this.calculateDetailedMetricsWithMasterData(
        progressRecords, 
        [], // Content interactions would need similar filtering
        []  // Resource usage would need similar filtering
      );

      return {
        metrics: filteredMetrics,
        recordCount: progressRecords.length,
        dateRange: { start, end },
        appliedFilters: filters
      };
    } catch (error) {
      logger.error('Error getting filtered analytics data:', error);
      throw error;
    }
  }

  private calculateDifficultyProgression(records: any[]): any[] {
    return records
      .filter(r => r.status === ProgressStatus.COMPLETED)
      .map(r => ({
        difficulty: r.activity.difficulty,
        score: r.score || 0,
        completedAt: r.completedAt
      }))
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  }

  private async getTopicResourceUsage(childId: string, topicId: string): Promise<any[]> {
    return await this.prisma.resourceUsage.findMany({
      where: {
        childId,
        resource: {
          topicId
        }
      },
      include: {
        resource: true
      }
    });
  }

  private async calculateSubjectProficiency(childId: string, subjectId: string): Promise<SubjectProficiency | null> {
    // Get progress records for this subject
    const progressRecords = await this.prisma.progressRecord.findMany({
      where: {
        childId,
        activity: {
          plan: {
            subject: subjectId // This would need proper subject mapping
          }
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

    if (progressRecords.length === 0) return null;

    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);
    const scores = completedRecords.map(r => r.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const completionRate = progressRecords.length > 0 ? completedRecords.length / progressRecords.length : 0;

    const proficiencyScore = (averageScore + (completionRate * 100)) / 2;
    const proficiencyLevel = this.calculateProficiencyLevel(proficiencyScore, proficiencyScore);

    // Get subject details
    const subject = await this.masterDataService.getSubjectById(subjectId);
    if (!subject) return null;

    const visualIndicator: VisualIndicator = {
      type: 'circular-progress',
      value: proficiencyScore,
      maxValue: 100,
      color: this.getProficiencyColor(proficiencyLevel),
      icon: subject.icon
    };

    return {
      subjectId,
      subjectName: subject.displayName,
      proficiencyLevel,
      proficiencyScore,
      visualIndicator,
      topicBreakdown: [], // Would be populated with topic-level proficiency
      trendDirection: this.calculateMasteryTrend(completedRecords),
      confidenceLevel: Math.min(1, progressRecords.length / 10) // Higher confidence with more data
    };
  }

  private getProficiencyColor(level: ProficiencyLevel): string {
    switch (level) {
      case 'mastered': return '#4CAF50';
      case 'proficient': return '#2196F3';
      case 'developing': return '#FF9800';
      case 'beginner': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  private generateRadarChartData(subjectProficiencies: SubjectProficiency[]): any {
    return {
      labels: subjectProficiencies.map(sp => sp.subjectName),
      datasets: [{
        label: 'Proficiency Level',
        data: subjectProficiencies.map(sp => sp.proficiencyScore),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }]
    };
  }

  private async generateProgressTimeline(childId: string): Promise<any[]> {
    const progressRecords = await this.prisma.progressRecord.findMany({
      where: {
        childId,
        status: ProgressStatus.COMPLETED
      },
      include: {
        activity: {
          include: {
            plan: true
          }
        }
      },
      orderBy: {
        completedAt: 'asc'
      },
      take: 20 // Last 20 completed activities
    });

    return progressRecords.map(record => ({
      date: record.completedAt,
      subject: record.activity.plan.subject,
      score: record.score,
      activity: record.activity.title
    }));
  }

  private async getAchievementBadges(childId: string): Promise<any[]> {
    return await this.prisma.achievement.findMany({
      where: { childId },
      orderBy: { earnedAt: 'desc' },
      take: 10
    });
  }

  private async getNextMilestones(childId: string, subjectProficiencies: SubjectProficiency[]): Promise<any[]> {
    const milestones: any[] = [];

    for (const proficiency of subjectProficiencies) {
      if (proficiency.proficiencyScore < 100) {
        const nextLevel = this.getNextProficiencyLevel(proficiency.proficiencyLevel);
        if (nextLevel) {
          milestones.push({
            subject: proficiency.subjectName,
            currentLevel: proficiency.proficiencyLevel,
            nextLevel,
            progressNeeded: this.calculateProgressNeeded(proficiency.proficiencyScore, nextLevel),
            estimatedTimeToComplete: this.estimateTimeToMilestone(proficiency)
          });
        }
      }
    }

    return milestones.slice(0, 5); // Top 5 upcoming milestones
  }

  private getNextProficiencyLevel(currentLevel: ProficiencyLevel): ProficiencyLevel | null {
    switch (currentLevel) {
      case 'beginner': return 'developing';
      case 'developing': return 'proficient';
      case 'proficient': return 'mastered';
      case 'mastered': return null;
      default: return 'developing';
    }
  }

  private calculateProgressNeeded(currentScore: number, nextLevel: ProficiencyLevel): number {
    const thresholds = {
      'developing': 50,
      'proficient': 75,
      'mastered': 90
    };
    return Math.max(0, thresholds[nextLevel] - currentScore);
  }

  private estimateTimeToMilestone(proficiency: SubjectProficiency): string {
    // Simplified estimation based on current progress
    const progressNeeded = this.calculateProgressNeeded(
      proficiency.proficiencyScore, 
      this.getNextProficiencyLevel(proficiency.proficiencyLevel) || 'mastered'
    );
    
    const weeksEstimate = Math.ceil(progressNeeded / 10); // Rough estimate
    return `${weeksEstimate} week${weeksEstimate !== 1 ? 's' : ''}`;
  }

  private calculateStreakDays(progressRecords: any[]): number {
    const completedRecords = progressRecords
      .filter(r => r.status === ProgressStatus.COMPLETED && r.completedAt)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    if (completedRecords.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const record of completedRecords) {
      const recordDate = new Date(record.completedAt);
      recordDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  private calculateSessionDurations(progressRecords: any[]): number[] {
    // Group records by day to calculate session durations
    const dailyRecords = this.groupByDay(progressRecords);
    const sessionDurations: number[] = [];

    for (const dayRecords of Object.values(dailyRecords)) {
      const totalTime = dayRecords.reduce((sum, record) => sum + record.timeSpent, 0);
      if (totalTime > 0) {
        sessionDurations.push(totalTime);
      }
    }

    return sessionDurations;
  }

  private calculatePreferredContentLength(contentInteractions: any[]): 'short' | 'medium' | 'long' | 'unknown' {
    if (contentInteractions.length === 0) return 'unknown';

    const durations = contentInteractions
      .filter(i => i.content.duration)
      .map(i => i.content.duration);

    if (durations.length === 0) return 'unknown';

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    if (averageDuration < 300) return 'short'; // Less than 5 minutes
    if (averageDuration < 900) return 'medium'; // 5-15 minutes
    return 'long'; // More than 15 minutes
  }

  private calculateResourceTypePreferences(resourceUsage: any[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    
    resourceUsage.forEach(usage => {
      const resourceType = usage.resource?.type || 'unknown';
      preferences[resourceType] = (preferences[resourceType] || 0) + 1;
    });

    return preferences;
  }

  private calculateSubjectEngagementPatterns(progressRecords: any[]): Record<string, number> {
    const engagement: Record<string, number> = {};
    
    progressRecords.forEach(record => {
      const subject = record.activity.plan.subject;
      engagement[subject] = (engagement[subject] || 0) + record.timeSpent;
    });

    return engagement;
  }
}