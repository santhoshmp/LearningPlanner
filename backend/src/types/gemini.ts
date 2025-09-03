export interface GeminiStudyPlanRequest {
  childAge: number;
  gradeLevel: string;
  subject: string;
  learningStyle: LearningStyle | string;
  duration?: number; // minutes
  objectives?: string[];
  selectedTopics?: Array<{
    id: string;
    name: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
  }>;
  previousPerformance?: PerformanceData;
  contentPreferences?: ContentPreferences;
}

export interface GeminiStudyPlanResponse {
  planId: string;
  title: string;
  description: string;
  activities: GeminiActivity[];
  estimatedDuration: number;
  difficultyProgression: number[];
  contentRecommendations: ContentRecommendation[];
  learningObjectives: string[];
  prerequisites: string[];
}

export interface GeminiActivity {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'exercise';
  duration: number; // minutes
  difficulty: number; // 1-10
  objectives: string[];
  instructions: string;
  materials?: string[];
  assessmentCriteria?: string[];
}

export interface ContentRecommendation {
  type: 'video' | 'article' | 'interactive';
  title: string;
  description: string;
  url?: string;
  duration: number;
  ageAppropriate: boolean;
  safetyScore: number;
  source: string;
  tags: string[];
  difficulty: number;
}

export interface LearningStyle {
  visual: number; // 0-1
  auditory: number; // 0-1
  kinesthetic: number; // 0-1
  readingWriting: number; // 0-1
}

export interface PerformanceData {
  averageScore: number;
  completionRate: number;
  timeSpentMinutes: number;
  strugglingAreas: string[];
  strongAreas: string[];
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  subject: string;
  topic: string;
  score: number;
  timeSpent: number;
  difficulty: number;
  completedAt: Date;
}

export interface ContentPreferences {
  preferredMediaTypes: ('video' | 'article' | 'interactive')[];
  avoidTopics: string[];
  favoriteTopics: string[];
  maxSessionDuration: number;
}

export interface GeminiCacheEntry {
  key: string;
  response: GeminiStudyPlanResponse;
  createdAt: Date;
  expiresAt: Date;
  requestHash: string;
}

export interface ContentSafetyResult {
  isAppropriate: boolean;
  safetyScore: number; // 0-1
  flaggedContent: string[];
  ageAppropriate: boolean;
  parentalApprovalRequired: boolean;
  reasons: string[];
}

export interface GeminiServiceConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  cacheTtlHours: number;
}