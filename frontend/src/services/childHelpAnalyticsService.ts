import api, { childHelpAnalyticsApi } from './api';
import { HelpRequest } from '../types/activity';

export interface ChildHelpAnalytics {
  totalHelpRequests: number;
  helpRequestsToday: number;
  helpRequestsThisWeek: number;
  frequentTopics: string[];
  averageResponseTime: number;
  mostHelpfulResponses: HelpRequest[];
  helpSeekingPattern: 'independent' | 'moderate' | 'frequent';
  parentNotificationThreshold: number;
  shouldNotifyParent: boolean;
}

export interface HelpRequestPattern {
  timeOfDay: string;
  subject: string;
  difficulty: number;
  questionType: 'concept' | 'procedure' | 'application' | 'general';
  wasResolved: boolean;
}

export interface ParentNotification {
  id: string;
  childId: string;
  type: 'frequent_help_requests' | 'struggling_with_topic' | 'help_pattern_change';
  message: string;
  helpRequestCount: number;
  timeframe: string;
  suggestions: string[];
  createdAt: string;
}

export const childHelpAnalyticsService = {
  /**
   * Track a help request for analytics
   */
  trackHelpRequest: async (
    childId: string,
    activityId: string,
    question: string,
    response: string,
    context: any
  ): Promise<void> => {
    try {
      await api.post('/analytics/track/help', {
        childId,
        activityId,
        question,
        response,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking help request:', error);
      // Don't throw error to avoid disrupting user experience
    }
  },

  /**
   * Get help analytics for a child
   */
  getChildHelpAnalytics: async (childId: string): Promise<ChildHelpAnalytics> => {
    try {
      return await childHelpAnalyticsApi.getHelpAnalytics(childId);
    } catch (error) {
      console.error('Error fetching child help analytics:', error);
      // Return default analytics if API fails
      return {
        totalHelpRequests: 0,
        helpRequestsToday: 0,
        helpRequestsThisWeek: 0,
        frequentTopics: [],
        averageResponseTime: 0,
        mostHelpfulResponses: [],
        helpSeekingPattern: 'independent',
        parentNotificationThreshold: 5,
        shouldNotifyParent: false
      };
    }
  },

  /**
   * Get help request patterns for insights
   */
  getHelpRequestPatterns: async (childId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<HelpRequestPattern[]> => {
    try {
      return await childHelpAnalyticsApi.getHelpPatterns(childId, timeframe);
    } catch (error) {
      console.error('Error fetching help request patterns:', error);
      return [];
    }
  },

  /**
   * Check if parent should be notified about help requests
   */
  checkParentNotificationNeeded: async (childId: string): Promise<ParentNotification | null> => {
    try {
      return await childHelpAnalyticsApi.checkParentNotification(childId);
    } catch (error) {
      console.error('Error checking parent notification:', error);
      return null;
    }
  },

  /**
   * Mark help request as resolved
   */
  markHelpRequestResolved: async (helpRequestId: string, wasHelpful: boolean): Promise<void> => {
    try {
      await childHelpAnalyticsApi.markHelpRequestResolved(helpRequestId, wasHelpful);
    } catch (error) {
      console.error('Error marking help request as resolved:', error);
    }
  },

  /**
   * Get help request suggestions based on child's history
   */
  getPersonalizedSuggestions: async (childId: string, subject: string): Promise<string[]> => {
    try {
      return await childHelpAnalyticsApi.getPersonalizedSuggestions(childId, subject);
    } catch (error) {
      console.error('Error fetching personalized suggestions:', error);
      return [];
    }
  },

  /**
   * Report inappropriate or unhelpful response
   */
  reportResponse: async (helpRequestId: string, reason: string, details?: string): Promise<void> => {
    try {
      await childHelpAnalyticsApi.reportResponse(helpRequestId, reason, details);
    } catch (error) {
      console.error('Error reporting response:', error);
      throw error;
    }
  }
};

export default childHelpAnalyticsService;