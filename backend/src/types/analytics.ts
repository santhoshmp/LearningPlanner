export interface TimeFrame {
  start: string;
  end: string;
}

export interface ProgressReport {
  childId: string;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  activitiesCompleted: number;
  activitiesInProgress: number;
  activitiesNotStarted: number;
  helpRequestsCount: number;
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
  completionRate: number;
  averageScore: number;
  timeSpent: number;
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

export interface LearningInsight {
  subjectInsights: SubjectInsight[];
  timeBasedPatterns: TimeBasedPattern;
  difficultyProgression: DifficultyInsight[];
  recommendedFocus: RecommendedFocus;
}

export interface SubjectInsight {
  subject: string;
  averageScore: number;
  averageTime: number;
  averageDifficulty: number;
  helpRequestRate: number;
  activities: number;
  isStrength: boolean;
  isWeakness: boolean;
}

export interface TimeBasedPattern {
  weeklyTrends: WeeklyTrend[];
  trends: {
    score: string;
    time: string;
    activity: string;
  };
}

export interface WeeklyTrend {
  week: string;
  activities: number;
  averageScore: number;
  averageTime: number;
}

export interface DifficultyInsight {
  subject: string;
  difficultyProgression: string;
  scoreWithDifficulty: {
    correlation: number;
    averageScore: number;
    interpretation: string;
  };
  readyForHigherDifficulty: boolean;
  needsLowerDifficulty: boolean;
}

export interface RecommendedFocus {
  focusAreas: string[];
  strengths: string[];
  recommendations: {
    subject: string;
    recommendation: string;
    reason: string;
  }[];
}

export interface EngagementMetrics {
  activityId?: string;
  sessionDuration: number;
  interactionCount: number;
  completedItems: number;
  timestamp: Date;
}

// Enhanced Analytics Types
export interface DetailedProgressTracking {
  timeFrame: TimeFrame;
  detailedMetrics: DetailedMetrics;
  learningVelocity: LearningVelocity;
  engagementPatterns: EngagementPatterns;
  masteryIndicators: MasteryIndicator[];
  totalDataPoints: number;
}

export interface DetailedMetrics {
  basic: {
    totalActivities: number;
    completedActivities: number;
    completionRate: number;
    totalTimeSpent: number;
    averageTimePerActivity: number;
  };
  performance: {
    averageScore: number;
    scoreVariance: number;
    scoreStandardDeviation: number;
    timeEfficiency: number;
    consistencyScore: number;
  };
  engagement: {
    totalInteractions: number;
    contentTypeDistribution: {
      video: number;
      article: number;
      interactive: number;
    };
    engagementDepth: number;
    averageProgressPercentage: number;
  };
}

export interface LearningVelocity {
  velocity: number;
  efficiencyVelocity: number;
  acceleration: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface EngagementPatterns {
  peakHours: number[];
  averageSessionLength: number;
  consistencyScore: number;
  engagementFrequency: number;
  preferredContentLength: 'short' | 'medium' | 'long' | 'unknown';
}

export interface MasteryIndicator {
  subject: string;
  masteryLevel: number;
  completionRate: number;
  averageScore: number;
  averageDifficulty: number;
  status: 'mastered' | 'proficient' | 'developing' | 'beginner';
}

export interface LearningPatternRecognition {
  patterns: {
    learningStyle: LearningStylePattern;
    difficultyAdaptation: DifficultyAdaptationPattern;
    timeBasedLearning: TimeBasedLearningPattern;
    contentPreference: ContentPreferencePattern;
    helpSeeking: HelpSeekingPattern;
    retention: RetentionPattern;
  };
  insights: PatternInsight[];
  confidence: number;
  lastAnalyzed: string;
}

export interface LearningStylePattern {
  dominantStyle: string;
  preferences: {
    contentType: string;
    engagementRate: number;
    averageProgress: number;
    totalInteractions: number;
  }[];
  confidence: number;
}

export interface DifficultyAdaptationPattern {
  adaptationRate: number;
  optimalDifficulty: number;
  pattern: 'positive_adaptation' | 'difficulty_sensitive' | 'stable' | 'insufficient_data';
  difficultyRange: {
    min: number;
    max: number;
    current: number;
  };
}

export interface TimeBasedLearningPattern {
  optimalTimeOfDay: number | null;
  sessionLengthPreference: 'short' | 'medium' | 'long' | 'unknown';
  averageSessionLength: number;
  weeklyPattern: {
    mostActiveDay: string;
    distribution: number[];
    pattern: 'concentrated' | 'distributed';
  } | string;
}

export interface ContentPreferencePattern {
  preferredTypes: string[];
  engagementByType: {
    [contentType: string]: {
      completionRate: number;
      averageProgress: number;
      averageTimeSpent: number;
      totalInteractions: number;
    };
  };
  pattern: 'clear_preferences' | 'exploring' | 'insufficient_data';
}

export interface HelpSeekingPattern {
  helpSeekingRate: number;
  pattern: 'frequent_help_seeker' | 'moderate_help_seeker' | 'independent_learner' | 'insufficient_data';
  triggers: {
    trigger: string;
    frequency: number;
  }[];
  averageHelpRequestsPerActivity: number;
}

export interface RetentionPattern {
  retentionScore: number;
  pattern: 'excellent_retention' | 'good_retention' | 'moderate_retention' | 'needs_reinforcement' | 'insufficient_data';
  scoreStability: number;
  trendDirection: number;
}

export interface PatternInsight {
  type: 'learning_style' | 'difficulty' | 'timing' | 'support' | 'retention';
  message: string;
  recommendation: string;
  confidence: number;
}

export interface PerformancePredictions {
  predictions: {
    scores: ScorePrediction;
    completionTimes: { [difficulty: string]: CompletionTimePrediction };
    difficultyReadiness: DifficultyReadiness;
    subjectMastery: { [subject: string]: SubjectMasteryPrediction };
    riskAssessment: LearningRisk[];
  } | null;
  insights: string[];
  confidence: number;
  generatedAt: string;
  validUntil: string;
  message?: string;
}

export interface ScorePrediction {
  prediction: number | null;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  expectedRange: {
    min: number;
    max: number;
  };
}

export interface CompletionTimePrediction {
  expectedTime: number;
  range: {
    min: number;
    max: number;
  };
  confidence: number;
}

export interface DifficultyReadiness {
  ready: boolean;
  confidence: number;
  currentMaxDifficulty: number;
  recommendedNextDifficulty: number;
  recommendation: string;
}

export interface SubjectMasteryPrediction {
  currentMastery: number;
  projectedMastery: number;
  trend: 'rapid_improvement' | 'steady_improvement' | 'declining' | 'stable';
  timeToMastery: number | null;
  confidence: number;
}

export interface LearningRisk {
  type: 'declining_performance' | 'excessive_help_seeking' | 'inactivity_risk';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

// Enhanced Analytics Types for Real Data Integration
export interface SubjectProgressDetail {
  subjectId: string;
  subjectName: string;
  overallProgress: number;
  proficiencyLevel: ProficiencyLevel;
  topicsCompleted: number;
  totalTopics: number;
  averageScore: number;
  timeSpent: number;
  strengthAreas: string[];
  improvementAreas: string[];
  nextRecommendedTopics: string[];
  masteryTrend: 'improving' | 'stable' | 'declining';
}

export interface TopicMasteryDetail {
  topicId: string;
  topicName: string;
  subjectId: string;
  masteryLevel: number;
  attemptsCount: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: Date;
  status: TopicStatus;
  difficultyProgression: DifficultyProgression[];
  resourcesUsed: ResourceUsage[];
}

export interface TopicStatus {
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
}

export interface DifficultyProgression {
  difficulty: number;
  score: number;
  completedAt: Date;
}

export interface ResourceUsage {
  resourceId: string;
  resourceType: string;
  timeSpent: number;
  completionRate: number;
  lastAccessed: Date;
}

export interface SkillVisualization {
  childId: string;
  overallLevel: ProficiencyLevel;
  subjectProficiencies: SubjectProficiency[];
  skillRadarChart: RadarChartData;
  progressTimeline: TimelineData[];
  achievementBadges: Achievement[];
  nextMilestones: Milestone[];
}

export interface SubjectProficiency {
  subjectId: string;
  subjectName: string;
  proficiencyLevel: ProficiencyLevel;
  proficiencyScore: number;
  visualIndicator: VisualIndicator;
  topicBreakdown: TopicProficiency[];
  trendDirection: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
}

export interface TopicProficiency {
  topicId: string;
  topicName: string;
  proficiencyScore: number;
  masteryLevel: number;
}

export interface VisualIndicator {
  type: 'progress-bar' | 'circular-progress' | 'star-rating' | 'level-badge';
  value: number;
  maxValue: number;
  color: string;
  icon?: string;
  animation?: AnimationConfig;
}

export interface AnimationConfig {
  type: 'pulse' | 'bounce' | 'fade' | 'slide';
  duration: number;
  delay?: number;
}

export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

export interface TimelineData {
  date: Date;
  subject: string;
  score: number;
  activity: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  points: number;
}

export interface Milestone {
  subject: string;
  currentLevel: ProficiencyLevel;
  nextLevel: ProficiencyLevel;
  progressNeeded: number;
  estimatedTimeToComplete: string;
}

export type ProficiencyLevel = 'beginner' | 'developing' | 'proficient' | 'mastered';