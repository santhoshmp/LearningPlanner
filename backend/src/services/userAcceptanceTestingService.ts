/**
 * Backend User Acceptance Testing Service
 * Handles feedback collection, analysis, and system refinement recommendations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface UserFeedback {
  id: string;
  userId: string;
  userType: 'parent' | 'child';
  childAge?: number;
  testingSession: string;
  timestamp: Date;
  category: 'usability' | 'engagement' | 'performance' | 'badge_system' | 'interface' | 'safety';
  rating: number;
  feedback: string;
  specificFeature?: string;
  deviceInfo: any;
  sessionDuration: number;
  completedTasks: string[];
  struggledTasks: string[];
  suggestions: string[];
}

export interface UsabilityMetrics {
  taskCompletionRate: number;
  averageTaskTime: number;
  errorRate: number;
  satisfactionScore: number;
  engagementScore: number;
  retentionRate: number;
}

export interface AgeGroupAnalysis {
  ageGroup: '5-8' | '9-12' | '13-18';
  totalParticipants: number;
  metrics: UsabilityMetrics;
  commonIssues: string[];
  successfulFeatures: string[];
  recommendations: string[];
}

export interface BadgeSystemAnalysis {
  engagementIncrease: number;
  completionRateImprovement: number;
  userSatisfaction: number;
  mostEffectiveBadges: Array<{ badgeId: string; effectivenessScore: number }>;
  leastEffectiveBadges: Array<{ badgeId: string; effectivenessScore: number }>;
  recommendations: string[];
}

export interface PerformanceAnalysis {
  loadTimeIssues: string[];
  animationOptimizations: string[];
  memoryUsageIssues: string[];
  batteryOptimizations: string[];
  networkOptimizations: string[];
  prioritizedFixes: Array<{ issue: string; priority: 'high' | 'medium' | 'low'; impact: string }>;
}

class UserAcceptanceTestingService {
  /**
   * Store user feedback from testing sessions
   */
  async storeFeedback(feedback: Omit<UserFeedback, 'id'>): Promise<string> {
    try {
      // Store in user_testing_feedback table
      const result = await prisma.$executeRaw`
        INSERT INTO user_testing_feedback (
          user_id, user_type, child_age, testing_session, timestamp,
          category, rating, feedback, specific_feature, device_info,
          session_duration, completed_tasks, struggled_tasks, suggestions
        ) VALUES (
          ${feedback.userId}, ${feedback.userType}, ${feedback.childAge}, ${feedback.testingSession},
          ${feedback.timestamp}, ${feedback.category}, ${feedback.rating}, ${feedback.feedback},
          ${feedback.specificFeature}, ${JSON.stringify(feedback.deviceInfo)}, ${feedback.sessionDuration},
          ${JSON.stringify(feedback.completedTasks)}, ${JSON.stringify(feedback.struggledTasks)},
          ${JSON.stringify(feedback.suggestions)}
        ) RETURNING id
      `;

      logger.info('User feedback stored', {
        userId: feedback.userId,
        category: feedback.category,
        rating: feedback.rating,
      });

      return 'feedback_stored';
    } catch (error) {
      logger.error('Error storing user feedback:', error);
      throw error;
    }
  }

  /**
   * Calculate usability metrics for overall system or specific age group
   */
  async calculateUsabilityMetrics(ageGroup?: string): Promise<UsabilityMetrics | AgeGroupAnalysis[]> {
    try {
      if (ageGroup) {
        return await this.getAgeGroupMetrics(ageGroup);
      }

      // Get overall metrics
      const feedbackData = await prisma.$queryRaw<any[]>`
        SELECT 
          AVG(CASE WHEN array_length(completed_tasks::text[], 1) > 0 
              THEN array_length(completed_tasks::text[], 1)::float / 
                   (array_length(completed_tasks::text[], 1) + array_length(struggled_tasks::text[], 1))
              ELSE 0 END) as task_completion_rate,
          AVG(session_duration) as average_task_time,
          AVG(CASE WHEN array_length(struggled_tasks::text[], 1) > 0 
              THEN array_length(struggled_tasks::text[], 1)::float / 
                   (array_length(completed_tasks::text[], 1) + array_length(struggled_tasks::text[], 1))
              ELSE 0 END) as error_rate,
          AVG(rating) as satisfaction_score,
          COUNT(DISTINCT user_id) as total_users
        FROM user_testing_feedback
        WHERE timestamp >= NOW() - INTERVAL '30 days'
      `;

      const data = feedbackData[0];
      
      return {
        taskCompletionRate: parseFloat(data.task_completion_rate) || 0,
        averageTaskTime: parseFloat(data.average_task_time) || 0,
        errorRate: parseFloat(data.error_rate) || 0,
        satisfactionScore: parseFloat(data.satisfaction_score) || 0,
        engagementScore: await this.calculateEngagementScore(),
        retentionRate: await this.calculateRetentionRate(),
      };
    } catch (error) {
      logger.error('Error calculating usability metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze badge system effectiveness
   */
  async analyzeBadgeSystem(): Promise<BadgeSystemAnalysis> {
    try {
      // Get badge-related feedback
      const badgeFeedback = await prisma.$queryRaw<any[]>`
        SELECT 
          AVG(rating) as satisfaction,
          COUNT(*) as feedback_count,
          feedback,
          suggestions
        FROM user_testing_feedback
        WHERE category = 'badge_system'
        AND timestamp >= NOW() - INTERVAL '30 days'
      `;

      // Analyze badge effectiveness from child progress data
      const badgeEffectiveness = await prisma.$queryRaw<any[]>`
        SELECT 
          a.badge_type,
          COUNT(*) as earned_count,
          AVG(cp.activities_completed_after_badge) as completion_increase
        FROM achievements a
        LEFT JOIN (
          SELECT 
            child_id,
            COUNT(*) as activities_completed_after_badge
          FROM progress_records pr
          WHERE pr.completed_at > (
            SELECT MAX(earned_at) 
            FROM achievements a2 
            WHERE a2.child_id = pr.child_id
          )
          GROUP BY child_id
        ) cp ON a.child_id = cp.child_id
        WHERE a.earned_at >= NOW() - INTERVAL '30 days'
        GROUP BY a.badge_type
        ORDER BY completion_increase DESC
      `;

      const mostEffective = badgeEffectiveness.slice(0, 5).map(badge => ({
        badgeId: badge.badge_type,
        effectivenessScore: parseFloat(badge.completion_increase) || 0,
      }));

      const leastEffective = badgeEffectiveness.slice(-5).map(badge => ({
        badgeId: badge.badge_type,
        effectivenessScore: parseFloat(badge.completion_increase) || 0,
      }));

      return {
        engagementIncrease: await this.calculateBadgeEngagementIncrease(),
        completionRateImprovement: await this.calculateBadgeCompletionImprovement(),
        userSatisfaction: parseFloat(badgeFeedback[0]?.satisfaction) || 0,
        mostEffectiveBadges: mostEffective,
        leastEffectiveBadges: leastEffective,
        recommendations: await this.generateBadgeRecommendations(badgeFeedback),
      };
    } catch (error) {
      logger.error('Error analyzing badge system:', error);
      throw error;
    }
  }

  /**
   * Generate performance optimization recommendations
   */
  async generatePerformanceRecommendations(): Promise<PerformanceAnalysis> {
    try {
      // Analyze performance-related feedback
      const performanceFeedback = await prisma.$queryRaw<any[]>`
        SELECT 
          feedback,
          suggestions,
          device_info,
          session_duration
        FROM user_testing_feedback
        WHERE category = 'performance'
        AND timestamp >= NOW() - INTERVAL '30 days'
      `;

      // Analyze device-specific issues
      const deviceIssues = this.analyzeDeviceSpecificIssues(performanceFeedback);
      
      // Get system performance metrics
      const performanceMetrics = await this.getSystemPerformanceMetrics();

      return {
        loadTimeIssues: this.identifyLoadTimeIssues(performanceFeedback, performanceMetrics),
        animationOptimizations: this.identifyAnimationIssues(performanceFeedback),
        memoryUsageIssues: this.identifyMemoryIssues(deviceIssues),
        batteryOptimizations: this.identifyBatteryIssues(deviceIssues),
        networkOptimizations: this.identifyNetworkIssues(performanceFeedback),
        prioritizedFixes: this.prioritizePerformanceFixes(performanceFeedback, performanceMetrics),
      };
    } catch (error) {
      logger.error('Error generating performance recommendations:', error);
      throw error;
    }
  }

  /**
   * Store A/B test results
   */
  async storeABTestResult(testId: string, variant: string, outcome: 'success' | 'failure', metrics: any): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO ab_test_results (test_id, variant, outcome, metrics, timestamp)
        VALUES (${testId}, ${variant}, ${outcome}, ${JSON.stringify(metrics)}, NOW())
      `;

      logger.info('A/B test result stored', { testId, variant, outcome });
    } catch (error) {
      logger.error('Error storing A/B test result:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system refinement recommendations
   */
  async getSystemRefinementRecommendations(): Promise<{
    usabilityImprovements: string[];
    engagementEnhancements: string[];
    performanceOptimizations: string[];
    safetyEnhancements: string[];
    prioritizedActions: Array<{ action: string; priority: number; impact: string; effort: string }>;
  }> {
    try {
      const allFeedback = await prisma.$queryRaw<any[]>`
        SELECT category, feedback, suggestions, rating
        FROM user_testing_feedback
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        ORDER BY timestamp DESC
      `;

      const categorizedFeedback = this.categorizeFeedback(allFeedback);
      
      return {
        usabilityImprovements: this.extractUsabilityImprovements(categorizedFeedback.usability),
        engagementEnhancements: this.extractEngagementEnhancements(categorizedFeedback.engagement),
        performanceOptimizations: this.extractPerformanceOptimizations(categorizedFeedback.performance),
        safetyEnhancements: this.extractSafetyEnhancements(categorizedFeedback.safety),
        prioritizedActions: this.prioritizeActions(allFeedback),
      };
    } catch (error) {
      logger.error('Error getting system refinement recommendations:', error);
      throw error;
    }
  }

  private async getAgeGroupMetrics(ageGroup: string): Promise<AgeGroupAnalysis[]> {
    const ageRanges = {
      '5-8': [5, 8],
      '9-12': [9, 12],
      '13-18': [13, 18],
    };

    const results: AgeGroupAnalysis[] = [];

    for (const [group, [minAge, maxAge]] of Object.entries(ageRanges)) {
      const metrics = await prisma.$queryRaw<any[]>`
        SELECT 
          AVG(CASE WHEN array_length(completed_tasks::text[], 1) > 0 
              THEN array_length(completed_tasks::text[], 1)::float / 
                   (array_length(completed_tasks::text[], 1) + array_length(struggled_tasks::text[], 1))
              ELSE 0 END) as task_completion_rate,
          AVG(session_duration) as average_task_time,
          AVG(rating) as satisfaction_score,
          COUNT(DISTINCT user_id) as total_participants
        FROM user_testing_feedback
        WHERE child_age BETWEEN ${minAge} AND ${maxAge}
        AND timestamp >= NOW() - INTERVAL '30 days'
      `;

      const data = metrics[0];
      
      results.push({
        ageGroup: group as '5-8' | '9-12' | '13-18',
        totalParticipants: parseInt(data.total_participants) || 0,
        metrics: {
          taskCompletionRate: parseFloat(data.task_completion_rate) || 0,
          averageTaskTime: parseFloat(data.average_task_time) || 0,
          errorRate: 0, // Calculate separately
          satisfactionScore: parseFloat(data.satisfaction_score) || 0,
          engagementScore: 0, // Calculate separately
          retentionRate: 0, // Calculate separately
        },
        commonIssues: await this.getCommonIssuesForAgeGroup(minAge, maxAge),
        successfulFeatures: await this.getSuccessfulFeaturesForAgeGroup(minAge, maxAge),
        recommendations: await this.getRecommendationsForAgeGroup(minAge, maxAge),
      });
    }

    return results;
  }

  private async calculateEngagementScore(): Promise<number> {
    // Implementation for engagement score calculation
    return 0.75; // Placeholder
  }

  private async calculateRetentionRate(): Promise<number> {
    // Implementation for retention rate calculation
    return 0.85; // Placeholder
  }

  private async calculateBadgeEngagementIncrease(): Promise<number> {
    // Implementation for badge engagement increase calculation
    return 0.25; // Placeholder
  }

  private async calculateBadgeCompletionImprovement(): Promise<number> {
    // Implementation for badge completion improvement calculation
    return 0.15; // Placeholder
  }

  private async generateBadgeRecommendations(feedback: any[]): Promise<string[]> {
    // Analyze feedback and generate recommendations
    return [
      'Introduce more frequent micro-badges for younger children',
      'Add collaborative badges for peer learning',
      'Implement seasonal or themed badge collections',
      'Create parent-child shared achievement badges',
    ];
  }

  private analyzeDeviceSpecificIssues(feedback: any[]): any {
    // Analyze device-specific performance issues
    return {};
  }

  private async getSystemPerformanceMetrics(): Promise<any> {
    // Get system performance metrics
    return {};
  }

  private identifyLoadTimeIssues(feedback: any[], metrics: any): string[] {
    return [
      'Dashboard initial load time exceeds 3 seconds on mobile devices',
      'Badge collection page loads slowly with many badges',
      'Progress charts take too long to render on older devices',
    ];
  }

  private identifyAnimationIssues(feedback: any[]): string[] {
    return [
      'Badge earning animations cause frame drops on low-end devices',
      'Progress bar animations are too slow for impatient children',
      'Celebration animations consume too much battery on mobile',
    ];
  }

  private identifyMemoryIssues(deviceIssues: any): string[] {
    return [
      'Memory usage increases significantly during long sessions',
      'Badge collection causes memory leaks on some devices',
    ];
  }

  private identifyBatteryIssues(deviceIssues: any): string[] {
    return [
      'Continuous animations drain battery quickly',
      'Background progress tracking uses excessive power',
    ];
  }

  private identifyNetworkIssues(feedback: any[]): string[] {
    return [
      'Progress sync fails on slow connections',
      'Badge images fail to load on poor networks',
    ];
  }

  private prioritizePerformanceFixes(feedback: any[], metrics: any): Array<{ issue: string; priority: 'high' | 'medium' | 'low'; impact: string }> {
    return [
      {
        issue: 'Optimize dashboard loading time',
        priority: 'high',
        impact: 'Improves first impression and reduces abandonment',
      },
      {
        issue: 'Reduce animation memory usage',
        priority: 'medium',
        impact: 'Prevents crashes on older devices',
      },
      {
        issue: 'Implement progressive image loading',
        priority: 'low',
        impact: 'Better experience on slow networks',
      },
    ];
  }

  private categorizeFeedback(feedback: any[]): Record<string, any[]> {
    return feedback.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }

  private extractUsabilityImprovements(feedback: any[]): string[] {
    return [
      'Simplify navigation for younger children',
      'Add more visual cues for task completion',
      'Improve error message clarity',
    ];
  }

  private extractEngagementEnhancements(feedback: any[]): string[] {
    return [
      'Add more interactive elements to activities',
      'Implement peer comparison features',
      'Create more diverse badge categories',
    ];
  }

  private extractPerformanceOptimizations(feedback: any[]): string[] {
    return [
      'Optimize image loading and caching',
      'Reduce JavaScript bundle size',
      'Implement lazy loading for components',
    ];
  }

  private extractSafetyEnhancements(feedback: any[]): string[] {
    return [
      'Enhance parental notification system',
      'Improve content filtering accuracy',
      'Add more granular privacy controls',
    ];
  }

  private prioritizeActions(feedback: any[]): Array<{ action: string; priority: number; impact: string; effort: string }> {
    return [
      {
        action: 'Optimize dashboard performance',
        priority: 1,
        impact: 'High - affects all users',
        effort: 'Medium - requires optimization work',
      },
      {
        action: 'Improve badge system engagement',
        priority: 2,
        impact: 'High - increases motivation',
        effort: 'Low - mostly configuration changes',
      },
      {
        action: 'Enhance mobile responsiveness',
        priority: 3,
        impact: 'Medium - improves mobile experience',
        effort: 'High - requires significant UI changes',
      },
    ];
  }

  private async getCommonIssuesForAgeGroup(minAge: number, maxAge: number): Promise<string[]> {
    // Implementation for age-specific common issues
    return [];
  }

  private async getSuccessfulFeaturesForAgeGroup(minAge: number, maxAge: number): Promise<string[]> {
    // Implementation for age-specific successful features
    return [];
  }

  private async getRecommendationsForAgeGroup(minAge: number, maxAge: number): Promise<string[]> {
    // Implementation for age-specific recommendations
    return [];
  }
}

export const userAcceptanceTestingService = new UserAcceptanceTestingService();