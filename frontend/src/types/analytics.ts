export interface ProgressRecord {
  id: string;
  childId: string;
  activityId: string;
  planId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_help';
  score: number;
  timeSpent: number;
  helpRequests: number;
  completedAt?: string;
}

export interface ProgressReport {
  childId: string;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  activitiesCompleted: number;
  totalActivities: number;
  activitiesInProgress: number;
  activitiesNotStarted: number;
  helpRequestsCount: number;
  streakDays: number;
  lastActivityDate?: string;
}

export interface PerformanceTrend {
  period: string;
  completionRate: number;
  averageScore: number;
  timeSpent: number;
}

export interface SubjectPerformance {
  subject: string;
  completionRate?: number;
  averageScore: number;
  timeSpent?: number;
  activitiesCompleted: number;
  totalActivities: number;
}

export interface ProgressAlert {
  id: string;
  childId: string;
  childName: string;
  type: 'inactivity' | 'low_performance' | 'achievement' | 'milestone';
  message: string;
  severity: 'info' | 'warning' | 'success';
  createdAt: string;
  read: boolean;
}

export interface TimeFrame {
  start: string;
  end: string;
}

export interface AnalyticsFilters {
  childId?: string;
  subject?: string;
  timeFrame: TimeFrame;
}

// Enhanced analytics types for the new dashboard
export interface DetailedMetrics {
  totalActivities: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  activitiesCompleted: number;
  activitiesInProgress: number;
  activitiesNotStarted: number;
  helpRequestsCount: number;
  lastActivityDate?: string;
  streakDays: number;
  averageSessionDuration: number;
  contentInteractions: number;
}

export interface LearningVelocity {
  activitiesPerWeek: number;
  averageCompletionTime: number;
  improvementRate: number;
  consistencyScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface EngagementPattern {
  preferredTimeOfDay: string;
  averageSessionLength: number;
  breakFrequency: number;
  contentTypePreference: {
    video: number;
    article: number;
    interactive: number;
  };
  difficultyPreference: number;
}

export interface MasteryIndicator {
  subject: string;
  masteryLevel: number; // 0-100
  confidenceScore: number;
  areasOfStrength: string[];
  areasForImprovement: string[];
  recommendedNextSteps: string[];
}

export interface LearningInsight {
  type: 'pattern' | 'recommendation' | 'achievement' | 'concern';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface DetailedProgressData {
  timeFrame: TimeFrame;
  detailedMetrics: DetailedMetrics;
  learningVelocity: LearningVelocity;
  engagementPatterns: EngagementPattern;
  masteryIndicators: MasteryIndicator[];
  totalDataPoints: number;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;
  dateRange: TimeFrame;
  sections: string[];
  childIds: string[];
}