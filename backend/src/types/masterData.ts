import { 
  GradeLevel, 
  Subject, 
  Topic, 
  TopicResource, 
  GradeSubject,
  EducationalLevel,
  SubjectCategory,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationStatus
} from '@prisma/client';

// Core Master Data Types
export interface MasterDataGradeLevel extends GradeLevel {
  subjects?: GradeSubject[];
  topics?: Topic[];
}

export interface MasterDataSubject extends Subject {
  gradeSubjects?: GradeSubject[];
  topics?: Topic[];
}

export interface MasterDataTopic extends Topic {
  grade?: GradeLevel;
  subject?: Subject;
  resources?: TopicResource[];
}

export interface MasterDataResource extends TopicResource {
  topic?: Topic;
}

// Age Range Interface
export interface AgeRange {
  min: number;
  max: number;
  typical: number;
}

// Topic Hierarchy Interface
export interface TopicHierarchy {
  grade: string;
  subjects: SubjectHierarchy[];
}

export interface SubjectHierarchy {
  id: string;
  name: string;
  displayName: string;
  topics: TopicSummary[];
}

export interface TopicSummary {
  id: string;
  name: string;
  displayName: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  resourceCount: number;
}

// Resource Management Types
export interface YouTubeResourceMetadata {
  videoId: string;
  channelName: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  transcript?: string;
  closedCaptions: boolean;
}

export interface ReadingResourceMetadata {
  author?: string;
  publisher?: string;
  isbn?: string;
  readingLevel: string;
  wordCount?: number;
  language: string;
  format: 'pdf' | 'html' | 'epub' | 'external';
}

export interface ResourceValidationResult {
  isValid: boolean;
  status: ValidationStatus;
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
  alternativeResources?: string[];
}

// Validation Types
export interface ValidationError {
  type: 'missing_data' | 'invalid_reference' | 'constraint_violation' | 'format_error';
  entity: string;
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'data_quality' | 'performance' | 'consistency';
  entity: string;
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface ValidationSummary {
  totalEntities: number;
  validEntities: number;
  errorCount: number;
  warningCount: number;
  lastValidated: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

// Service Interfaces
export interface MasterDataFilters {
  grade?: string;
  subject?: string;
  difficulty?: DifficultyLevel;
  resourceType?: ResourceType;
  safetyRating?: SafetyRating;
  isActive?: boolean;
}

export interface ResourceFilters extends MasterDataFilters {
  minDuration?: number;
  maxDuration?: number;
  source?: string;
  tags?: string[];
}

// Seeding and Migration Types
export interface SeedDataConfig {
  includeGrades: string[];
  includeSubjects: string[];
  resourcesPerTopic: number;
  validateResources: boolean;
  clearExisting?: boolean;
}

export interface SeedResult {
  success: boolean;
  entitiesCreated: number;
  entitiesUpdated: number;
  errors: string[];
  warnings: string[];
  duration: number;
  summary: {
    grades: number;
    subjects: number;
    topics: number;
    resources: number;
  };
}

export interface BackupResult {
  success: boolean;
  filePath: string;
  fileSize: number;
  errors: string[];
  timestamp: Date;
}

export interface RestoreResult {
  success: boolean;
  entitiesRestored: number;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

export interface MigrationResult {
  success: boolean;
  entitiesCreated: number;
  entitiesUpdated: number;
  errors: string[];
  warnings: string[];
  duration: number;
}

// Cache Configuration
export interface CacheConfig {
  defaultTTL: number;
  gradeTTL: number;
  subjectTTL: number;
  topicTTL: number;
  resourceTTL: number;
}

// Master Data Update Types
export interface MasterDataUpdate {
  entity: 'grade' | 'subject' | 'topic' | 'resource';
  operation: 'create' | 'update' | 'delete';
  id?: string;
  data: any;
}

export interface SyncResult {
  success: boolean;
  updatedEntities: number;
  errors: SyncError[];
  warnings: SyncWarning[];
  timestamp: Date;
}

export interface SyncError {
  entity: string;
  operation: string;
  error: string;
}

export interface SyncWarning {
  entity: string;
  message: string;
  details?: string[];
}

// Resource Discovery Types
export interface ResourceRecommendation {
  resource: MasterDataResource;
  score: number;
  reasons: string[];
}

export interface ResourceMetadata {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  difficulty: DifficultyLevel;
  safetyRating: SafetyRating;
  tags: string[];
  source: string;
  lastValidated: Date;
  topic: {
    id: string;
    name: string;
    grade: string;
    subject: string;
  };
  analytics?: ResourceUsageAnalytics;
  videoMetadata?: VideoMetadata;
  readingMetadata?: ReadingMetadata;
}

export interface VideoMetadata {
  videoId: string;
  platform: string;
  hasClosedCaptions: boolean;
}

export interface ReadingMetadata {
  estimatedReadingTime: number;
  readingLevel: string;
}

export interface ResourceUsageAnalytics {
  resourceId: string;
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  averageDuration: number;
  uniqueUsers: number;
  lastUpdated: Date;
}

export interface LearningPattern {
  childId: string;
  resourceTypePreferences: Record<ResourceType, number>;
  difficultyPreferences: Record<DifficultyLevel, number>;
  subjectEngagement: Record<string, number>;
  timePatterns: any;
  lastUpdated: Date;
}

export interface UserPreferences {
  childId: string;
  preferredResourceTypes: ResourceType[];
  preferredDifficulty: DifficultyLevel;
  maxDuration: number;
  safetyLevel: SafetyRating;
  languages: string[];
  lastUpdated: Date;
}

// Export Prisma enums for convenience
export {
  EducationalLevel,
  SubjectCategory,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationStatus
};