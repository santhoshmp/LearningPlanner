import { 
  ProgressReport, 
  PerformanceTrend, 
  SubjectPerformance, 
  ProgressAlert,
  TimeFrame,
  AnalyticsFilters,
  DetailedProgressData,
  LearningInsight,
  ExportOptions
} from '../types/analytics';
import api from './api';

class AnalyticsService {
  /**
   * Track activity completion
   */
  async trackActivityCompletion(
    childId: string,
    activityId: string,
    score: number,
    timeSpent: number
  ) {
    try {
      const response = await api.post('/analytics/track/completion', {
        childId,
        activityId,
        score,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track activity completion:', error);
      throw error;
    }
  }

  /**
   * Track activity progress (when not yet completed)
   */
  async trackActivityProgress(
    childId: string,
    activityId: string,
    timeSpent: number
  ) {
    try {
      const response = await api.post('/analytics/track/progress', {
        childId,
        activityId,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track activity progress:', error);
      throw error;
    }
  }

  /**
   * Track help request
   */
  async trackHelpRequest(
    childId: string,
    activityId: string,
    question: string,
    context: any
  ) {
    try {
      const response = await api.post('/analytics/track/help', {
        childId,
        activityId,
        question,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track help request:', error);
      throw error;
    }
  }

  /**
   * Track engagement metrics
   */
  async trackEngagement(
    childId: string,
    data: {
      activityId?: string;
      sessionDuration: number;
      interactionCount: number;
      completedItems: number;
    }
  ) {
    try {
      const response = await api.post('/analytics/track/engagement', {
        childId,
        ...data,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to track engagement:', error);
      throw error;
    }
  }

  /**
   * Get progress report for a child
   */
  async getProgressReport(childId: string, timeFrame: TimeFrame): Promise<ProgressReport> {
    try {
      console.log('Fetching progress report for child:', childId, 'timeFrame:', timeFrame);
      const response = await api.get(`/analytics/progress/${childId}`, {
        params: {
          start: timeFrame.start,
          end: timeFrame.end
        }
      });
      console.log('Progress report response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch progress report:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Get learning patterns for a child
   */
  async getLearningPatterns(childId: string) {
    try {
      const response = await api.get(`/analytics/patterns/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning patterns:', error);
      throw error;
    }
  }

  /**
   * Get performance trends for a child
   */
  async getPerformanceTrends(childId: string, timeFrame: TimeFrame): Promise<PerformanceTrend[]> {
    try {
      const response = await api.get(`/analytics/trends/${childId}`, {
        params: {
          start: timeFrame.start,
          end: timeFrame.end
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance trends:', error);
      throw error;
    }
  }

  /**
   * Get subject performance for a child
   */
  async getSubjectPerformance(childId: string, timeFrame: TimeFrame): Promise<SubjectPerformance[]> {
    try {
      const response = await api.get(`/analytics/subjects/${childId}`, {
        params: {
          start: timeFrame.start,
          end: timeFrame.end
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subject performance:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a child
   */
  async getAlerts(childId: string): Promise<ProgressAlert[]> {
    try {
      const response = await api.get(`/analytics/alerts/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  /**
   * Get default time frame (last 30 days)
   */
  getDefaultTimeFrame(): TimeFrame {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  /**
   * Format time frame for display
   */
  formatTimeFrame(timeFrame: TimeFrame): string {
    const start = new Date(timeFrame.start);
    const end = new Date(timeFrame.end);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (start.getFullYear() !== end.getFullYear()) {
      options.year = 'numeric';
    }
    
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    
    return `${startStr} - ${endStr}`;
  }

  /**
   * Get detailed progress tracking with enhanced metrics
   */
  async getDetailedProgressTracking(childId: string, timeFrame: TimeFrame): Promise<DetailedProgressData> {
    try {
      const response = await api.get(`/analytics/detailed-progress/${childId}`, {
        params: {
          start: timeFrame.start,
          end: timeFrame.end
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch detailed progress tracking:', error);
      throw error;
    }
  }

  /**
   * Get learning insights with AI-generated recommendations
   */
  async getLearningInsights(childId: string): Promise<LearningInsight[]> {
    try {
      const response = await api.get(`/analytics/insights/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning insights:', error);
      throw error;
    }
  }

  /**
   * Export analytics data in specified format
   */
  async exportAnalyticsData(options: ExportOptions): Promise<Blob> {
    try {
      const response = await api.post('/analytics/export', options, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(childId: string, options: {
    timeFrame: TimeFrame;
    includeInsights: boolean;
    includeRecommendations: boolean;
  }): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
  }> {
    try {
      const response = await api.post(`/analytics/generate-report/${childId}`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Schedule recurring report
   */
  async scheduleReport(childId: string, options: {
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'pdf' | 'csv';
    email: string;
    sections: string[];
  }): Promise<{ scheduleId: string }> {
    try {
      const response = await api.post(`/analytics/schedule-report/${childId}`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to schedule report:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data with real data integration
   */
  async getComprehensiveDashboardData(childId: string, timeFrame?: TimeFrame): Promise<any> {
    try {
      const params = timeFrame ? {
        start: timeFrame.start,
        end: timeFrame.end
      } : {};

      const response = await api.get(`/analytics/comprehensive-dashboard/${childId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch comprehensive dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get filtered analytics data with advanced filtering
   */
  async getFilteredAnalyticsData(childId: string, filters: {
    subjects?: string[];
    topics?: string[];
    timeFrame?: TimeFrame;
    difficultyLevels?: number[];
  }): Promise<any> {
    try {
      const response = await api.post(`/analytics/filtered-data/${childId}`, filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch filtered analytics data:', error);
      throw error;
    }
  }

  /**
   * Get time series data for interactive charts
   */
  async getTimeSeriesData(childId: string, timeFrame?: TimeFrame): Promise<any[]> {
    try {
      const params = timeFrame ? {
        start: timeFrame.start,
        end: timeFrame.end
      } : {};

      const response = await api.get(`/analytics/time-series/${childId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch time series data:', error);
      throw error;
    }
  }

  /**
   * Get subject progress breakdown with master data integration
   */
  async getSubjectProgressBreakdown(childId: string, timeFrame?: TimeFrame): Promise<any[]> {
    try {
      const params = timeFrame ? {
        start: timeFrame.start,
        end: timeFrame.end
      } : {};

      const response = await api.get(`/analytics/subject-breakdown/${childId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subject progress breakdown:', error);
      throw error;
    }
  }

  /**
   * Get skill proficiency visualization data
   */
  async getSkillVisualizationData(childId: string): Promise<any> {
    try {
      const response = await api.get(`/analytics/skill-visualization/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skill visualization data:', error);
      throw error;
    }
  }

  /**
   * Get skill proficiency visualization with master data integration
   */
  async getSkillProficiencyVisualization(childId: string): Promise<any> {
    try {
      const response = await api.get(`/analytics/skill-proficiency/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skill proficiency visualization:', error);
      throw error;
    }
  }

  /**
   * Get topic mastery details
   */
  async getTopicMasteryDetails(childId: string, subjectId?: string): Promise<any[]> {
    try {
      const params = subjectId ? { subjectId } : {};
      const response = await api.get(`/analytics/topic-mastery/${childId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topic mastery details:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();

// Enhanced analytics service with additional methods for skill proficiency
export const enhancedAnalyticsService = analyticsService;