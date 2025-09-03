import { PrismaClient } from '@prisma/client';
import { redisService } from './redisService';
import { MasterDataCacheService } from './masterDataCacheService';
import { MasterDataPerformanceService } from './masterDataPerformanceService';
import { 
  MasterDataGradeLevel,
  MasterDataSubject,
  MasterDataTopic,
  MasterDataResource,
  AgeRange,
  TopicHierarchy,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSummary,
  MasterDataFilters,
  ResourceFilters,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  CacheConfig,
  SyncResult,
  MasterDataUpdate
} from '../types/masterData';

export class MasterDataService {
  private prisma: PrismaClient;
  private cacheConfig: CacheConfig;
  private cacheService: MasterDataCacheService;
  private performanceService: MasterDataPerformanceService;

  constructor(prisma: PrismaClient, cacheConfig?: CacheConfig) {
    this.prisma = prisma;
    this.cacheConfig = {
      defaultTTL: 3600, // 1 hour
      gradeTTL: 7200,   // 2 hours
      subjectTTL: 3600, // 1 hour
      topicTTL: 1800,   // 30 minutes
      resourceTTL: 900, // 15 minutes
      ...cacheConfig
    };
    this.cacheService = new MasterDataCacheService(prisma, {
      ...this.cacheConfig,
      enableCompression: true,
      compressionThreshold: 1024,
      enablePrefetching: true,
      prefetchPatterns: ['grades:*', 'subjects:*', 'topics:popular:*'],
      enableMetrics: true
    });
    this.performanceService = new MasterDataPerformanceService(prisma);
  }

  // Caching utilities
  private getCacheKey(type: string, identifier?: string): string {
    return identifier ? `masterdata:${type}:${identifier}` : `masterdata:${type}:all`;
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      return await redisService.getCacheObject<T>(key);
    } catch (error) {
      console.warn(`Cache retrieval failed for key ${key}:`, error);
      return null;
    }
  }

  private async setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await redisService.setCacheObject(key, data, ttl);
    } catch (error) {
      console.warn(`Cache storage failed for key ${key}:`, error);
    }
  }

  private async invalidateCache(pattern: string): Promise<void> {
    try {
      await redisService.deletePattern(pattern);
    } catch (error) {
      console.warn(`Cache invalidation failed for pattern ${pattern}:`, error);
    }
  }

  // Grade Management
  async getAllGrades(): Promise<MasterDataGradeLevel[]> {
    const startTime = Date.now();
    
    try {
      const grades = await this.cacheService.getCachedGrades();
      
      this.performanceService.recordMetrics({
        operationType: 'getAllGrades',
        duration: Date.now() - startTime,
        success: true,
        cacheHit: true,
        recordCount: grades.length,
        queryComplexity: 'medium'
      });
      
      return grades;
    } catch (error) {
      this.performanceService.recordMetrics({
        operationType: 'getAllGrades',
        duration: Date.now() - startTime,
        success: false,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getGradeByAge(age: number): Promise<MasterDataGradeLevel | null> {
    const startTime = Date.now();
    
    try {
      const grade = await this.cacheService.getCachedGradeByAge(age);
      
      this.performanceService.recordMetrics({
        operationType: 'getGradeByAge',
        duration: Date.now() - startTime,
        success: true,
        cacheHit: true,
        recordCount: grade ? 1 : 0,
        queryComplexity: 'simple'
      });
      
      return grade;
    } catch (error) {
      this.performanceService.recordMetrics({
        operationType: 'getGradeByAge',
        duration: Date.now() - startTime,
        success: false,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getAgeRangeByGrade(grade: string): Promise<AgeRange | null> {
    const cacheKey = this.getCacheKey('age-range', grade);
    
    // Try cache first
    const cached = await this.getCachedData<AgeRange>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade },
      select: { ageMin: true, ageMax: true, ageTypical: true }
    });

    if (!gradeLevel) return null;

    const ageRange: AgeRange = {
      min: gradeLevel.ageMin,
      max: gradeLevel.ageMax,
      typical: gradeLevel.ageTypical
    };

    // Cache the result
    await this.setCachedData(cacheKey, ageRange, this.cacheConfig.gradeTTL);
    
    return ageRange;
  }

  // Subject Management
  async getSubjectsByGrade(grade: string): Promise<MasterDataSubject[]> {
    const startTime = Date.now();
    
    try {
      const subjects = await this.cacheService.getCachedSubjectsByGrade(grade);
      
      this.performanceService.recordMetrics({
        operationType: 'getSubjectsByGrade',
        duration: Date.now() - startTime,
        success: true,
        cacheHit: true,
        recordCount: subjects.length,
        queryComplexity: 'medium'
      });
      
      return subjects;
    } catch (error) {
      this.performanceService.recordMetrics({
        operationType: 'getSubjectsByGrade',
        duration: Date.now() - startTime,
        success: false,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getAllSubjects(): Promise<MasterDataSubject[]> {
    const startTime = Date.now();
    
    try {
      const subjects = await this.cacheService.getCachedSubjects();
      
      this.performanceService.recordMetrics({
        operationType: 'getAllSubjects',
        duration: Date.now() - startTime,
        success: true,
        cacheHit: true,
        recordCount: subjects.length,
        queryComplexity: 'medium'
      });
      
      return subjects;
    } catch (error) {
      this.performanceService.recordMetrics({
        operationType: 'getAllSubjects',
        duration: Date.now() - startTime,
        success: false,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getSubjectById(subjectId: string): Promise<MasterDataSubject | null> {
    const cacheKey = this.getCacheKey('subject', subjectId);
    
    // Try cache first
    const cached = await this.getCachedData<MasterDataSubject>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        gradeSubjects: {
          include: {
            grade: true
          }
        },
        topics: true
      }
    });

    // Cache the result
    if (subject) {
      await this.setCachedData(cacheKey, subject, this.cacheConfig.subjectTTL);
    }
    
    return subject;
  }

  // Topic Management
  async getTopicsBySubject(grade: string, subjectId: string): Promise<MasterDataTopic[]> {
    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade }
    });

    if (!gradeLevel) return [];

    return await this.prisma.topic.findMany({
      where: {
        gradeId: gradeLevel.id,
        subjectId,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        grade: true,
        subject: true,
        resources: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async getTopicHierarchy(grade: string): Promise<TopicHierarchy | null> {
    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                topics: {
                  where: { gradeId: { equals: this.prisma.gradeLevel.findUnique({ where: { grade } }).then(g => g?.id) } },
                  include: {
                    resources: {
                      where: { isActive: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { subject: { sortOrder: 'asc' } }
        }
      }
    });

    if (!gradeLevel) return null;

    return {
      grade,
      subjects: gradeLevel.subjects.map(gs => ({
        id: gs.subject.id,
        name: gs.subject.name,
        displayName: gs.subject.displayName,
        topics: gs.subject.topics.map(topic => ({
          id: topic.id,
          name: topic.name,
          displayName: topic.displayName,
          difficulty: topic.difficulty,
          estimatedHours: topic.estimatedHours,
          resourceCount: topic.resources.length
        }))
      }))
    };
  }

  async getTopicById(topicId: string): Promise<MasterDataTopic | null> {
    return await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        grade: true,
        subject: true,
        resources: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  // Resource Management
  async getResourcesByTopic(topicId: string, filters?: ResourceFilters): Promise<MasterDataResource[]> {
    const where: any = {
      topicId,
      isActive: true
    };

    if (filters) {
      if (filters.resourceType) where.type = filters.resourceType;
      if (filters.safetyRating) where.safetyRating = filters.safetyRating;
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.minDuration) where.duration = { gte: filters.minDuration };
      if (filters.maxDuration) {
        where.duration = { ...where.duration, lte: filters.maxDuration };
      }
      if (filters.source) where.source = { contains: filters.source, mode: 'insensitive' };
    }

    return await this.prisma.topicResource.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        topic: {
          include: {
            grade: true,
            subject: true
          }
        }
      }
    });
  }

  async getYouTubeVideosByTopic(topicId: string, grade: string): Promise<MasterDataResource[]> {
    return await this.getResourcesByTopic(topicId, {
      resourceType: ResourceType.VIDEO,
      safetyRating: SafetyRating.SAFE
    });
  }

  async getReadingMaterialsByTopic(topicId: string, grade: string): Promise<MasterDataResource[]> {
    return await this.getResourcesByTopic(topicId, {
      resourceType: ResourceType.ARTICLE,
      safetyRating: SafetyRating.SAFE
    });
  }

  // Validation and Integrity
  async validateMasterData(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate grade levels
    const grades = await this.prisma.gradeLevel.findMany();
    const gradeValidation = await this.validateGradeLevels(grades);
    errors.push(...gradeValidation.errors);
    warnings.push(...gradeValidation.warnings);

    // Validate subjects
    const subjects = await this.prisma.subject.findMany();
    const subjectValidation = await this.validateSubjects(subjects);
    errors.push(...subjectValidation.errors);
    warnings.push(...subjectValidation.warnings);

    // Validate topics
    const topics = await this.prisma.topic.findMany();
    const topicValidation = await this.validateTopics(topics);
    errors.push(...topicValidation.errors);
    warnings.push(...topicValidation.warnings);

    // Validate resources
    const resources = await this.prisma.topicResource.findMany();
    const resourceValidation = await this.validateResources(resources);
    errors.push(...resourceValidation.errors);
    warnings.push(...resourceValidation.warnings);

    const totalEntities = grades.length + subjects.length + topics.length + resources.length;
    const errorCount = errors.length;
    const warningCount = warnings.length;
    const validEntities = totalEntities - errorCount;

    const summary: ValidationSummary = {
      totalEntities,
      validEntities,
      errorCount,
      warningCount,
      lastValidated: new Date()
    };

    return {
      isValid: errorCount === 0,
      errors,
      warnings,
      summary
    };
  }

  private async validateGradeLevels(grades: any[]): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const grade of grades) {
      // Check age range consistency
      if (grade.ageMin >= grade.ageMax) {
        errors.push({
          type: 'constraint_violation',
          entity: 'GradeLevel',
          field: 'ageRange',
          message: `Grade ${grade.grade}: minimum age (${grade.ageMin}) must be less than maximum age (${grade.ageMax})`,
          severity: 'high',
          suggestedFix: 'Adjust age range values'
        });
      }

      // Check typical age is within range
      if (grade.ageTypical < grade.ageMin || grade.ageTypical > grade.ageMax) {
        warnings.push({
          type: 'data_quality',
          entity: 'GradeLevel',
          field: 'ageTypical',
          message: `Grade ${grade.grade}: typical age (${grade.ageTypical}) is outside the age range`,
          impact: 'medium',
          recommendation: 'Adjust typical age to be within the age range'
        });
      }
    }

    return { errors, warnings };
  }

  private async validateSubjects(subjects: any[]): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const subject of subjects) {
      // Check required fields
      if (!subject.displayName || subject.displayName.trim() === '') {
        errors.push({
          type: 'missing_data',
          entity: 'Subject',
          field: 'displayName',
          message: `Subject ${subject.name}: displayName is required`,
          severity: 'high',
          suggestedFix: 'Add a display name for the subject'
        });
      }

      // Check color format
      if (subject.color && !/^#[0-9A-Fa-f]{6}$/.test(subject.color)) {
        warnings.push({
          type: 'format_error',
          entity: 'Subject',
          field: 'color',
          message: `Subject ${subject.name}: color should be a valid hex color code`,
          impact: 'low',
          recommendation: 'Use format #RRGGBB for color values'
        });
      }
    }

    return { errors, warnings };
  }

  private async validateTopics(topics: any[]): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const topic of topics) {
      // Check estimated hours
      if (topic.estimatedHours <= 0) {
        warnings.push({
          type: 'data_quality',
          entity: 'Topic',
          field: 'estimatedHours',
          message: `Topic ${topic.name}: estimated hours should be greater than 0`,
          impact: 'medium',
          recommendation: 'Set a realistic estimated duration'
        });
      }

      // Check prerequisites format
      try {
        const prerequisites = JSON.parse(topic.prerequisites);
        if (!Array.isArray(prerequisites)) {
          errors.push({
            type: 'format_error',
            entity: 'Topic',
            field: 'prerequisites',
            message: `Topic ${topic.name}: prerequisites must be an array`,
            severity: 'medium',
            suggestedFix: 'Format prerequisites as JSON array'
          });
        }
      } catch (e) {
        errors.push({
          type: 'format_error',
          entity: 'Topic',
          field: 'prerequisites',
          message: `Topic ${topic.name}: prerequisites contains invalid JSON`,
          severity: 'medium',
          suggestedFix: 'Fix JSON format in prerequisites field'
        });
      }
    }

    return { errors, warnings };
  }

  private async validateResources(resources: any[]): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const resource of resources) {
      // Check URL format
      try {
        new URL(resource.url);
      } catch (e) {
        errors.push({
          type: 'format_error',
          entity: 'TopicResource',
          field: 'url',
          message: `Resource ${resource.title}: invalid URL format`,
          severity: 'high',
          suggestedFix: 'Provide a valid URL'
        });
      }

      // Check duration for videos
      if (resource.type === ResourceType.VIDEO && (!resource.duration || resource.duration <= 0)) {
        warnings.push({
          type: 'data_quality',
          entity: 'TopicResource',
          field: 'duration',
          message: `Video resource ${resource.title}: duration should be specified`,
          impact: 'medium',
          recommendation: 'Add video duration in minutes'
        });
      }
    }

    return { errors, warnings };
  }

  async updateResourceAvailability(): Promise<any[]> {
    // This would implement URL checking logic
    // For now, return empty array as placeholder
    return [];
  }

  // Master Data Update and Synchronization Utilities
  async updateMasterData(updates: MasterDataUpdate[]): Promise<SyncResult> {
    const results: SyncResult = {
      success: true,
      updatedEntities: 0,
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const update of updates) {
          try {
            await this.processUpdate(tx, update);
            results.updatedEntities++;
          } catch (error) {
            results.errors.push({
              entity: update.entity,
              operation: update.operation,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      });

      // Invalidate relevant caches after successful updates
      await this.invalidateAllCaches();

    } catch (error) {
      results.success = false;
      results.errors.push({
        entity: 'transaction',
        operation: 'bulk_update',
        error: error instanceof Error ? error.message : 'Transaction failed'
      });
    }

    return results;
  }

  private async processUpdate(tx: any, update: MasterDataUpdate): Promise<void> {
    switch (update.entity) {
      case 'grade':
        await this.updateGradeLevel(tx, update);
        break;
      case 'subject':
        await this.updateSubject(tx, update);
        break;
      case 'topic':
        await this.updateTopic(tx, update);
        break;
      case 'resource':
        await this.updateResource(tx, update);
        break;
      default:
        throw new Error(`Unknown entity type: ${update.entity}`);
    }
  }

  private async updateGradeLevel(tx: any, update: MasterDataUpdate): Promise<void> {
    switch (update.operation) {
      case 'create':
        await tx.gradeLevel.create({ data: update.data });
        break;
      case 'update':
        await tx.gradeLevel.update({
          where: { id: update.id },
          data: update.data
        });
        break;
      case 'delete':
        await tx.gradeLevel.update({
          where: { id: update.id },
          data: { isActive: false }
        });
        break;
    }
  }

  private async updateSubject(tx: any, update: MasterDataUpdate): Promise<void> {
    switch (update.operation) {
      case 'create':
        await tx.subject.create({ data: update.data });
        break;
      case 'update':
        await tx.subject.update({
          where: { id: update.id },
          data: update.data
        });
        break;
      case 'delete':
        await tx.subject.delete({ where: { id: update.id } });
        break;
    }
  }

  private async updateTopic(tx: any, update: MasterDataUpdate): Promise<void> {
    switch (update.operation) {
      case 'create':
        await tx.topic.create({ data: update.data });
        break;
      case 'update':
        await tx.topic.update({
          where: { id: update.id },
          data: update.data
        });
        break;
      case 'delete':
        await tx.topic.update({
          where: { id: update.id },
          data: { isActive: false }
        });
        break;
    }
  }

  private async updateResource(tx: any, update: MasterDataUpdate): Promise<void> {
    switch (update.operation) {
      case 'create':
        await tx.topicResource.create({ data: update.data });
        break;
      case 'update':
        await tx.topicResource.update({
          where: { id: update.id },
          data: update.data
        });
        break;
      case 'delete':
        await tx.topicResource.update({
          where: { id: update.id },
          data: { isActive: false }
        });
        break;
    }
  }

  async synchronizeMasterData(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      updatedEntities: 0,
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    try {
      // Validate data integrity
      const validation = await this.validateMasterData();
      if (!validation.isValid) {
        result.warnings.push({
          entity: 'validation',
          message: `Found ${validation.errors.length} validation errors`,
          details: validation.errors.map(e => e.message)
        });
      }

      // Update resource availability
      await this.updateResourceAvailability();

      // Refresh all caches
      await this.invalidateAllCaches();
      await this.warmupCaches();

      result.updatedEntities = await this.getTotalEntityCount();

    } catch (error) {
      result.success = false;
      result.errors.push({
        entity: 'synchronization',
        operation: 'sync',
        error: error instanceof Error ? error.message : 'Synchronization failed'
      });
    }

    return result;
  }

  private async getTotalEntityCount(): Promise<number> {
    const [grades, subjects, topics, resources] = await Promise.all([
      this.prisma.gradeLevel.count({ where: { isActive: true } }),
      this.prisma.subject.count(),
      this.prisma.topic.count({ where: { isActive: true } }),
      this.prisma.topicResource.count({ where: { isActive: true } })
    ]);

    return grades + subjects + topics + resources;
  }

  async invalidateAllCaches(): Promise<void> {
    await this.invalidateCache('masterdata:*');
  }

  async warmupCaches(): Promise<void> {
    try {
      // Warm up frequently accessed data
      await Promise.allSettled([
        this.getAllGrades(),
        this.getAllSubjects(),
        // Add more cache warming as needed
      ]);
    } catch (error) {
      console.warn('Cache warmup failed:', error);
    }
  }

  // Data validation service for master data integrity checking
  async performIntegrityCheck(): Promise<ValidationResult> {
    const validation = await this.validateMasterData();
    
    // Additional integrity checks
    await this.checkReferentialIntegrity(validation);
    await this.checkDataConsistency(validation);
    
    return validation;
  }

  private async checkReferentialIntegrity(validation: ValidationResult): Promise<void> {
    // Check for orphaned topics
    const orphanedTopics = await this.prisma.topic.findMany({
      where: {
        OR: [
          { grade: null },
          { subject: null }
        ]
      }
    });

    orphanedTopics.forEach(topic => {
      validation.errors.push({
        type: 'invalid_reference',
        entity: 'Topic',
        field: 'references',
        message: `Topic ${topic.name} has invalid grade or subject reference`,
        severity: 'high',
        suggestedFix: 'Update topic references or remove orphaned topics'
      });
    });

    // Check for orphaned resources
    const orphanedResources = await this.prisma.topicResource.findMany({
      where: { topic: null }
    });

    orphanedResources.forEach(resource => {
      validation.errors.push({
        type: 'invalid_reference',
        entity: 'TopicResource',
        field: 'topicId',
        message: `Resource ${resource.title} has invalid topic reference`,
        severity: 'high',
        suggestedFix: 'Update resource topic reference or remove orphaned resources'
      });
    });
  }

  private async checkDataConsistency(validation: ValidationResult): Promise<void> {
    // Check for duplicate grade levels
    const duplicateGrades = await this.prisma.gradeLevel.groupBy({
      by: ['grade'],
      having: {
        grade: {
          _count: {
            gt: 1
          }
        }
      }
    });

    duplicateGrades.forEach(duplicate => {
      validation.warnings.push({
        type: 'data_quality',
        entity: 'GradeLevel',
        field: 'grade',
        message: `Duplicate grade level found: ${duplicate.grade}`,
        impact: 'medium',
        recommendation: 'Consolidate duplicate grade levels'
      });
    });

    // Check for subjects without topics
    const subjectsWithoutTopics = await this.prisma.subject.findMany({
      where: {
        topics: {
          none: {}
        }
      }
    });

    subjectsWithoutTopics.forEach(subject => {
      validation.warnings.push({
        type: 'data_quality',
        entity: 'Subject',
        field: 'topics',
        message: `Subject ${subject.name} has no associated topics`,
        impact: 'medium',
        recommendation: 'Add topics to subject or mark as inactive'
      });
    });
  }

  // Cache management utilities
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    missRate: number;
  }> {
    return await this.cacheService.getCacheStats();
  }

  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cacheService.invalidateByPattern(pattern);
    } else {
      await this.invalidateAllCaches();
    }
  }

  // Performance monitoring methods
  async getPerformanceReport(timeframeMs: number = 3600000): Promise<any> {
    return await this.performanceService.generatePerformanceReport(timeframeMs);
  }

  async getPerformanceMetrics(): Promise<any> {
    return await this.performanceService.getMetricsSummary();
  }

  async getActiveAlerts(): Promise<any[]> {
    return await this.performanceService.getActiveAlerts();
  }

  async analyzeQueryPerformance(): Promise<any> {
    return await this.performanceService.analyzeQueryPerformance();
  }

  async getResourceUsage(): Promise<any> {
    return await this.performanceService.getResourceUsage();
  }

  // Cache warming and optimization
  async warmupCache(): Promise<any> {
    return await this.cacheService.warmupCache();
  }

  async performCacheHealthCheck(): Promise<any> {
    return await this.cacheService.healthCheck();
  }

  // Enhanced cache invalidation
  async invalidateGradeCache(grade?: string): Promise<void> {
    await this.cacheService.invalidateGradeCache(grade);
  }

  async invalidateSubjectCache(subjectId?: string): Promise<void> {
    await this.cacheService.invalidateSubjectCache(subjectId);
  }

  async invalidateTopicCache(topicId?: string): Promise<void> {
    await this.cacheService.invalidateTopicCache(topicId);
  }

  async invalidateResourceCache(topicId?: string): Promise<void> {
    await this.cacheService.invalidateResourceCache(topicId);
  }
}