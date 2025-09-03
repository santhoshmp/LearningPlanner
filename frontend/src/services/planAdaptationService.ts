import api from './api';

export interface AdaptationResult {
  adapted: boolean;
  adaptationType?: 'decrease_difficulty' | 'increase_difficulty' | 'increase_engagement';
  reason?: string;
  metrics?: any;
  recommendations?: any;
}

export interface ContentRecommendation {
  subject: string;
  activityType: string;
  title: string;
  description: string;
  reason: string;
}

export interface ContentRecommendations {
  focusAreaRecommendations: ContentRecommendation[];
  strengthBuildingRecommendations: ContentRecommendation[];
  learningStyleRecommendations: ContentRecommendation[];
}

class PlanAdaptationService {
  /**
   * Adapt plan based on performance
   */
  async adaptPlan(childId: string, planId: string): Promise<AdaptationResult> {
    try {
      const response = await api.post(`/plan-adaptation/adapt/${planId}`, { childId });
      return response.data;
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      throw error;
    }
  }

  /**
   * Get content recommendations for a child
   */
  async getContentRecommendations(childId: string): Promise<ContentRecommendations> {
    try {
      const response = await api.get(`/plan-adaptation/recommendations/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get content recommendations:', error);
      throw error;
    }
  }

  /**
   * Check if plan needs adaptation based on performance metrics
   * This is a client-side helper to determine if the UI should suggest adaptation
   */
  shouldSuggestAdaptation(metrics: any): { suggest: boolean; reason: string; type?: string } {
    // Minimum threshold for having enough data to make adaptation decisions
    const MIN_COMPLETED_ACTIVITIES = 3;
    
    // Check if we have enough data
    if (metrics.completedActivities < MIN_COMPLETED_ACTIVITIES) {
      return { 
        suggest: false, 
        reason: `Not enough completed activities (${metrics.completedActivities}/${MIN_COMPLETED_ACTIVITIES} required)` 
      };
    }
    
    // Check for consistently low scores (struggling)
    if (metrics.averageScore < 60 && metrics.lowScoreActivities >= 2) {
      return { 
        suggest: true, 
        type: 'decrease_difficulty',
        reason: 'Low average score indicates student may be struggling' 
      };
    }
    
    // Check for consistently high scores (too easy)
    if (metrics.averageScore > 85 && metrics.highScoreActivities >= 3) {
      return { 
        suggest: true, 
        type: 'increase_difficulty',
        reason: 'High average score indicates content may be too easy' 
      };
    }
    
    // Check for low engagement (high time between activities)
    if (metrics.completionRate < 30 && metrics.totalActivities > 5) {
      return { 
        suggest: true, 
        type: 'increase_engagement',
        reason: 'Low completion rate indicates possible engagement issues' 
      };
    }
    
    // No adaptation needed
    return { 
      suggest: false, 
      reason: 'Current difficulty level appears appropriate' 
    };
  }
}

export const planAdaptationService = new PlanAdaptationService();