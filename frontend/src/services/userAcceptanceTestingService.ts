/**
 * User Acceptance Testing Service
 * Handles feedback collection, usability testing, and system refinement
 */

export interface UserFeedback {
  id: string;
  userId: string;
  userType: 'parent' | 'child';
  childAge?: number;
  testingSession: string;
  timestamp: Date;
  category: 'usability' | 'engagement' | 'performance' | 'badge_system' | 'interface' | 'safety';
  rating: number; // 1-5 scale
  feedback: string;
  specificFeature?: string;
  deviceInfo: DeviceInfo;
  sessionDuration: number;
  completedTasks: string[];
  struggledTasks: string[];
  suggestions: string[];
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenSize: string;
  isMobile: boolean;
  isTablet: boolean;
  touchCapable: boolean;
}

export interface UsabilityMetrics {
  taskCompletionRate: number;
  averageTaskTime: number;
  errorRate: number;
  satisfactionScore: number;
  engagementScore: number;
  retentionRate: number;
}

export interface AgeGroupMetrics {
  ageGroup: '5-8' | '9-12' | '13-18';
  totalParticipants: number;
  metrics: UsabilityMetrics;
  commonIssues: string[];
  successfulFeatures: string[];
  recommendations: string[];
}

class UserAcceptanceTestingService {
  private readonly API_BASE = '/api/user-testing';

  /**
   * Submit user feedback from testing sessions
   */
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: new Date(),
          deviceInfo: this.getDeviceInfo(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Store locally for retry
      this.storeOfflineFeedback(feedback);
    }
  }

  /**
   * Start a usability testing session
   */
  async startTestingSession(userType: 'parent' | 'child', childAge?: number): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData = {
      sessionId,
      userType,
      childAge,
      startTime: new Date(),
      deviceInfo: this.getDeviceInfo(),
      tasks: this.getTestingTasks(userType, childAge),
    };

    // Store session data locally
    localStorage.setItem('uat_session', JSON.stringify(sessionData));
    
    // Track session start
    this.trackEvent('testing_session_started', {
      sessionId,
      userType,
      childAge,
    });

    return sessionId;
  }

  /**
   * End testing session and collect final metrics
   */
  async endTestingSession(sessionId: string, completedTasks: string[], feedback: string): Promise<void> {
    const sessionData = JSON.parse(localStorage.getItem('uat_session') || '{}');
    
    if (sessionData.sessionId !== sessionId) {
      throw new Error('Invalid session');
    }

    const endTime = new Date();
    const sessionDuration = endTime.getTime() - new Date(sessionData.startTime).getTime();

    const finalFeedback: Omit<UserFeedback, 'id' | 'timestamp'> = {
      userId: sessionData.userId || 'anonymous',
      userType: sessionData.userType,
      childAge: sessionData.childAge,
      testingSession: sessionId,
      category: 'usability',
      rating: 0, // Will be set by user
      feedback,
      sessionDuration,
      completedTasks,
      struggledTasks: sessionData.tasks.filter((task: string) => !completedTasks.includes(task)),
      suggestions: [],
      deviceInfo: sessionData.deviceInfo,
    };

    await this.submitFeedback(finalFeedback);
    
    // Clean up session data
    localStorage.removeItem('uat_session');
  }

  /**
   * Track specific user interactions during testing
   */
  trackInteraction(action: string, element: string, duration?: number): void {
    const sessionData = JSON.parse(localStorage.getItem('uat_session') || '{}');
    
    if (!sessionData.sessionId) return;

    const interaction = {
      sessionId: sessionData.sessionId,
      timestamp: new Date(),
      action,
      element,
      duration,
      deviceInfo: this.getDeviceInfo(),
    };

    // Store interaction locally
    const interactions = JSON.parse(localStorage.getItem('uat_interactions') || '[]');
    interactions.push(interaction);
    localStorage.setItem('uat_interactions', JSON.stringify(interactions));
  }

  /**
   * Get usability metrics for analysis
   */
  async getUsabilityMetrics(ageGroup?: string): Promise<UsabilityMetrics | AgeGroupMetrics[]> {
    try {
      const url = ageGroup 
        ? `${this.API_BASE}/metrics?ageGroup=${ageGroup}`
        : `${this.API_BASE}/metrics`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching usability metrics:', error);
      throw error;
    }
  }

  /**
   * Get badge system effectiveness metrics
   */
  async getBadgeSystemMetrics(): Promise<{
    engagementIncrease: number;
    completionRateImprovement: number;
    userSatisfaction: number;
    mostEffectiveBadges: string[];
    leastEffectiveBadges: string[];
    recommendations: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/badge-metrics`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge metrics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching badge metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance optimization recommendations
   */
  async getPerformanceRecommendations(): Promise<{
    loadTimeIssues: string[];
    animationOptimizations: string[];
    memoryUsageIssues: string[];
    batteryOptimizations: string[];
    networkOptimizations: string[];
    prioritizedFixes: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/performance-recommendations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance recommendations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching performance recommendations:', error);
      throw error;
    }
  }

  /**
   * Submit A/B test results for interface variations
   */
  async submitABTestResult(testId: string, variant: string, outcome: 'success' | 'failure', metrics: any): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/ab-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          variant,
          outcome,
          metrics,
          timestamp: new Date(),
          deviceInfo: this.getDeviceInfo(),
        }),
      });
    } catch (error) {
      console.error('Error submitting A/B test result:', error);
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${screen.width}x${screen.height}`,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  }

  private getTestingTasks(userType: 'parent' | 'child', childAge?: number): string[] {
    if (userType === 'parent') {
      return [
        'create_child_profile',
        'set_up_study_plan',
        'monitor_child_progress',
        'review_safety_settings',
        'check_analytics_dashboard',
        'manage_parental_controls',
      ];
    }

    // Child tasks based on age group
    if (childAge && childAge <= 8) {
      return [
        'login_with_pin',
        'view_dashboard',
        'start_activity',
        'complete_simple_task',
        'view_badges',
        'ask_for_help',
      ];
    } else if (childAge && childAge <= 12) {
      return [
        'login_with_credentials',
        'navigate_dashboard',
        'complete_study_activity',
        'track_progress',
        'earn_badge',
        'view_learning_streak',
        'use_help_system',
      ];
    } else {
      return [
        'independent_login',
        'manage_study_plans',
        'complete_complex_activities',
        'analyze_progress',
        'customize_settings',
        'use_advanced_features',
      ];
    }
  }

  private storeOfflineFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
    const offlineFeedback = JSON.parse(localStorage.getItem('offline_feedback') || '[]');
    offlineFeedback.push({
      ...feedback,
      id: `offline_${Date.now()}`,
      timestamp: new Date(),
    });
    localStorage.setItem('offline_feedback', JSON.stringify(offlineFeedback));
  }

  private trackEvent(eventName: string, data: any): void {
    // Integration with existing analytics service
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
  }
}

export const userAcceptanceTestingService = new UserAcceptanceTestingService();