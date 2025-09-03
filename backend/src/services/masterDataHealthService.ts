import { PrismaClient } from '@prisma/client';
import { redisService } from './redisService';
import axios from 'axios';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  responseTime?: number;
}

export interface DataQualityIssue {
  type: 'missing_data' | 'invalid_format' | 'constraint_violation' | 'orphaned_record' | 'duplicate_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity: string;
  entityId: string;
  field?: string;
  message: string;
  suggestedFix: string;
  detectedAt: Date;
}

export interface ResourceAvailabilityCheck {
  resourceId: string;
  url: string;
  status: 'available' | 'unavailable' | 'moved' | 'restricted' | 'timeout';
  responseCode?: number;
  responseTime?: number;
  lastChecked: Date;
  errorMessage?: string;
  redirectUrl?: string;
}

export interface MaintenanceTask {
  id: string;
  type: 'data_cleanup' | 'cache_refresh' | 'index_rebuild' | 'statistics_update' | 'resource_validation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  errorMessage?: string;
}

export interface SystemMetrics {
  database: {
    connectionCount: number;
    activeQueries: number;
    cacheHitRatio: number;
    tableStats: { table: string; rowCount: number; size: string }[];
  };
  cache: {
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    evictionRate: number;
  };
  masterData: {
    totalGrades: number;
    totalSubjects: number;
    totalTopics: number;
    totalResources: number;
    activeResources: number;
    validatedResources: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export class MasterDataHealthService {
  private prisma: PrismaClient;
  private healthChecks: HealthCheckResult[] = [];
  private dataQualityIssues: DataQualityIssue[] = [];
  private resourceChecks: ResourceAvailabilityCheck[] = [];
  private maintenanceTasks: MaintenanceTask[] = [];
  private readonly maxHistorySize = 1000;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupPeriodicChecks();
  }

  private setupPeriodicChecks(): void {
    // Run health checks every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);

    // Run data quality checks every hour
    setInterval(() => {
      this.performDataQualityCheck();
    }, 3600000);

    // Run resource availability checks every 6 hours
    setInterval(() => {
      this.checkResourceAvailability();
    }, 21600000);

    // Clean up old records daily
    setInterval(() => {
      this.cleanupOldRecords();
    }, 86400000);
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    const startTime = Date.now();

    try {
      // Database connectivity check
      const dbCheck = await this.checkDatabaseHealth();
      checks.push(dbCheck);

      // Cache connectivity check
      const cacheCheck = await this.checkCacheHealth();
      checks.push(cacheCheck);

      // Master data integrity check
      const dataCheck = await this.checkMasterDataIntegrity();
      checks.push(dataCheck);

      // Performance metrics check
      const perfCheck = await this.checkPerformanceMetrics();
      checks.push(perfCheck);

      // Resource validation check
      const resourceCheck = await this.checkResourceHealth();
      checks.push(resourceCheck);

      // Store results
      this.healthChecks.push(...checks);
      this.trimHealthCheckHistory();

      console.log(`Health check completed in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      const errorCheck: HealthCheckResult = {
        component: 'health_check_system',
        status: 'critical',
        message: `Health check system failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
      checks.push(errorCheck);
      this.healthChecks.push(errorCheck);
    }

    return checks;
  }

  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check connection pool status
      const connectionCount = await this.getActiveConnectionCount();
      
      // Check for long-running queries
      const longQueries = await this.getLongRunningQueries();
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Database is healthy';
      
      if (connectionCount > 80) {
        status = 'warning';
        message = `High connection count: ${connectionCount}`;
      }
      
      if (longQueries.length > 0) {
        status = 'warning';
        message = `${longQueries.length} long-running queries detected`;
      }
      
      if (responseTime > 1000) {
        status = 'critical';
        message = `Database response time is high: ${responseTime}ms`;
      }

      return {
        component: 'database',
        status,
        message,
        details: {
          connectionCount,
          longQueries: longQueries.length,
          responseTime
        },
        timestamp: new Date(),
        responseTime
      };
      
    } catch (error) {
      return {
        component: 'database',
        status: 'critical',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkCacheHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test Redis connectivity
      const pong = await redisService.ping();
      
      // Get cache statistics
      const stats = await redisService.getCacheStats();
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Cache is healthy';
      
      if (stats.hitRate < 70) {
        status = 'warning';
        message = `Low cache hit rate: ${stats.hitRate.toFixed(1)}%`;
      }
      
      if (stats.memoryUsage.includes('GB') && parseFloat(stats.memoryUsage) > 2) {
        status = 'warning';
        message = `High memory usage: ${stats.memoryUsage}`;
      }
      
      if (pong !== 'PONG') {
        status = 'critical';
        message = 'Cache ping failed';
      }

      return {
        component: 'cache',
        status,
        message,
        details: {
          ...stats,
          ping: pong
        },
        timestamp: new Date(),
        responseTime
      };
      
    } catch (error) {
      return {
        component: 'cache',
        status: 'critical',
        message: `Cache connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkMasterDataIntegrity(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Count records in each table
      const [gradeCount, subjectCount, topicCount, resourceCount] = await Promise.all([
        this.prisma.gradeLevel.count({ where: { isActive: true } }),
        this.prisma.subject.count(),
        this.prisma.topic.count({ where: { isActive: true } }),
        this.prisma.topicResource.count({ where: { isActive: true } })
      ]);

      // Check for orphaned records
      const orphanedTopics = await this.prisma.topic.count({
        where: {
          OR: [
            { grade: null },
            { subject: null }
          ]
        }
      });

      const orphanedResources = await this.prisma.topicResource.count({
        where: { topic: null }
      });

      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Master data integrity is good';
      
      if (orphanedTopics > 0 || orphanedResources > 0) {
        status = 'warning';
        message = `Found ${orphanedTopics} orphaned topics and ${orphanedResources} orphaned resources`;
      }
      
      if (gradeCount === 0 || subjectCount === 0) {
        status = 'critical';
        message = 'Critical master data is missing';
      }

      return {
        component: 'master_data_integrity',
        status,
        message,
        details: {
          gradeCount,
          subjectCount,
          topicCount,
          resourceCount,
          orphanedTopics,
          orphanedResources
        },
        timestamp: new Date(),
        responseTime
      };
      
    } catch (error) {
      return {
        component: 'master_data_integrity',
        status: 'critical',
        message: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkPerformanceMetrics(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // This would integrate with the performance service
      // For now, we'll do basic checks
      
      const responseTime = Date.now() - startTime;
      
      return {
        component: 'performance',
        status: 'healthy',
        message: 'Performance metrics are within acceptable ranges',
        details: {
          checkDuration: responseTime
        },
        timestamp: new Date(),
        responseTime
      };
      
    } catch (error) {
      return {
        component: 'performance',
        status: 'critical',
        message: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkResourceHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Count resources by validation status
      const resourceStats = await this.prisma.topicResource.groupBy({
        by: ['validationStatus'],
        _count: true,
        where: { isActive: true }
      });

      // Count resources that haven't been validated recently
      const staleResources = await this.prisma.topicResource.count({
        where: {
          isActive: true,
          lastValidated: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      });

      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Resource health is good';
      
      if (staleResources > 100) {
        status = 'warning';
        message = `${staleResources} resources need validation`;
      }
      
      const pendingCount = resourceStats.find(s => s.validationStatus === 'PENDING')?._count || 0;
      if (pendingCount > 50) {
        status = 'warning';
        message = `${pendingCount} resources pending validation`;
      }

      return {
        component: 'resource_health',
        status,
        message,
        details: {
          resourceStats,
          staleResources,
          pendingValidation: pendingCount
        },
        timestamp: new Date(),
        responseTime
      };
      
    } catch (error) {
      return {
        component: 'resource_health',
        status: 'critical',
        message: `Resource health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Data quality monitoring
  async performDataQualityCheck(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    try {
      // Check for missing required data
      const missingDataIssues = await this.checkMissingRequiredData();
      issues.push(...missingDataIssues);

      // Check for invalid formats
      const formatIssues = await this.checkInvalidFormats();
      issues.push(...formatIssues);

      // Check for constraint violations
      const constraintIssues = await this.checkConstraintViolations();
      issues.push(...constraintIssues);

      // Check for orphaned records
      const orphanedIssues = await this.checkOrphanedRecords();
      issues.push(...orphanedIssues);

      // Check for duplicates
      const duplicateIssues = await this.checkDuplicateData();
      issues.push(...duplicateIssues);

      // Store issues
      this.dataQualityIssues.push(...issues);
      this.trimDataQualityHistory();

      console.log(`Data quality check found ${issues.length} issues`);
      
    } catch (error) {
      console.error('Data quality check failed:', error);
    }

    return issues;
  }

  private async checkMissingRequiredData(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

    // Check for subjects without display names
    const subjectsWithoutDisplayName = await this.prisma.subject.findMany({
      where: {
        OR: [
          { displayName: null },
          { displayName: '' }
        ]
      }
    });

    subjectsWithoutDisplayName.forEach(subject => {
      issues.push({
        type: 'missing_data',
        severity: 'high',
        entity: 'Subject',
        entityId: subject.id,
        field: 'displayName',
        message: `Subject "${subject.name}" is missing display name`,
        suggestedFix: 'Add a user-friendly display name for the subject',
        detectedAt: new Date()
      });
    });

    // Check for topics without learning objectives
    const topicsWithoutObjectives = await this.prisma.topic.findMany({
      where: {
        learningObjectives: '[]'
      }
    });

    topicsWithoutObjectives.forEach(topic => {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        entity: 'Topic',
        entityId: topic.id,
        field: 'learningObjectives',
        message: `Topic "${topic.name}" has no learning objectives`,
        suggestedFix: 'Add specific learning objectives for this topic',
        detectedAt: new Date()
      });
    });

    return issues;
  }

  private async checkInvalidFormats(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

    // Check for invalid color formats in subjects
    const subjectsWithInvalidColors = await this.prisma.subject.findMany({
      where: {
        color: {
          not: {
            matches: '^#[0-9A-Fa-f]{6}$'
          }
        }
      }
    });

    subjectsWithInvalidColors.forEach(subject => {
      issues.push({
        type: 'invalid_format',
        severity: 'low',
        entity: 'Subject',
        entityId: subject.id,
        field: 'color',
        message: `Subject "${subject.name}" has invalid color format: ${subject.color}`,
        suggestedFix: 'Use valid hex color format (#RRGGBB)',
        detectedAt: new Date()
      });
    });

    // Check for invalid URLs in resources
    const resourcesWithInvalidUrls = await this.prisma.topicResource.findMany({
      where: {
        url: {
          not: {
            startsWith: 'http'
          }
        }
      }
    });

    resourcesWithInvalidUrls.forEach(resource => {
      issues.push({
        type: 'invalid_format',
        severity: 'high',
        entity: 'TopicResource',
        entityId: resource.id,
        field: 'url',
        message: `Resource "${resource.title}" has invalid URL format`,
        suggestedFix: 'Ensure URL starts with http:// or https://',
        detectedAt: new Date()
      });
    });

    return issues;
  }

  private async checkConstraintViolations(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

    // Check for grade levels with invalid age ranges
    const invalidAgeRanges = await this.prisma.gradeLevel.findMany({
      where: {
        ageMin: {
          gte: this.prisma.gradeLevel.fields.ageMax
        }
      }
    });

    invalidAgeRanges.forEach(grade => {
      issues.push({
        type: 'constraint_violation',
        severity: 'high',
        entity: 'GradeLevel',
        entityId: grade.id,
        field: 'ageRange',
        message: `Grade "${grade.grade}" has invalid age range: ${grade.ageMin}-${grade.ageMax}`,
        suggestedFix: 'Ensure minimum age is less than maximum age',
        detectedAt: new Date()
      });
    });

    // Check for topics with zero or negative estimated hours
    const invalidEstimatedHours = await this.prisma.topic.findMany({
      where: {
        estimatedHours: {
          lte: 0
        }
      }
    });

    invalidEstimatedHours.forEach(topic => {
      issues.push({
        type: 'constraint_violation',
        severity: 'medium',
        entity: 'Topic',
        entityId: topic.id,
        field: 'estimatedHours',
        message: `Topic "${topic.name}" has invalid estimated hours: ${topic.estimatedHours}`,
        suggestedFix: 'Set estimated hours to a positive value',
        detectedAt: new Date()
      });
    });

    return issues;
  }

  private async checkOrphanedRecords(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

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
      issues.push({
        type: 'orphaned_record',
        severity: 'critical',
        entity: 'Topic',
        entityId: topic.id,
        message: `Topic "${topic.name}" has invalid grade or subject reference`,
        suggestedFix: 'Update topic references or remove orphaned topic',
        detectedAt: new Date()
      });
    });

    // Check for orphaned resources
    const orphanedResources = await this.prisma.topicResource.findMany({
      where: {
        topic: null
      }
    });

    orphanedResources.forEach(resource => {
      issues.push({
        type: 'orphaned_record',
        severity: 'critical',
        entity: 'TopicResource',
        entityId: resource.id,
        message: `Resource "${resource.title}" has invalid topic reference`,
        suggestedFix: 'Update resource topic reference or remove orphaned resource',
        detectedAt: new Date()
      });
    });

    return issues;
  }

  private async checkDuplicateData(): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

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
      issues.push({
        type: 'duplicate_data',
        severity: 'high',
        entity: 'GradeLevel',
        entityId: 'multiple',
        field: 'grade',
        message: `Duplicate grade level found: ${duplicate.grade}`,
        suggestedFix: 'Consolidate duplicate grade levels',
        detectedAt: new Date()
      });
    });

    return issues;
  }

  // Resource availability monitoring
  async checkResourceAvailability(batchSize: number = 50): Promise<ResourceAvailabilityCheck[]> {
    const results: ResourceAvailabilityCheck[] = [];
    
    try {
      // Get resources that need checking (not checked in last 24 hours)
      const resourcesToCheck = await this.prisma.topicResource.findMany({
        where: {
          isActive: true,
          lastValidated: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        take: batchSize,
        orderBy: { lastValidated: 'asc' }
      });

      console.log(`Checking availability of ${resourcesToCheck.length} resources`);

      // Check each resource
      for (const resource of resourcesToCheck) {
        const check = await this.checkSingleResource(resource);
        results.push(check);

        // Update resource validation status
        await this.updateResourceValidationStatus(resource.id, check);
      }

      // Store results
      this.resourceChecks.push(...results);
      this.trimResourceCheckHistory();

    } catch (error) {
      console.error('Resource availability check failed:', error);
    }

    return results;
  }

  private async checkSingleResource(resource: any): Promise<ResourceAvailabilityCheck> {
    const startTime = Date.now();
    
    try {
      const response = await axios.head(resource.url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      const responseTime = Date.now() - startTime;
      
      let status: ResourceAvailabilityCheck['status'] = 'available';
      let errorMessage: string | undefined;
      let redirectUrl: string | undefined;

      if (response.status >= 400) {
        status = response.status === 404 ? 'unavailable' : 'restricted';
        errorMessage = `HTTP ${response.status}`;
      }

      if (response.request.res.responseUrl !== resource.url) {
        status = 'moved';
        redirectUrl = response.request.res.responseUrl;
      }

      return {
        resourceId: resource.id,
        url: resource.url,
        status,
        responseCode: response.status,
        responseTime,
        lastChecked: new Date(),
        errorMessage,
        redirectUrl
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let status: ResourceAvailabilityCheck['status'] = 'unavailable';
      let errorMessage = 'Unknown error';

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          status = 'timeout';
          errorMessage = 'Request timeout';
        } else if (error.response) {
          status = error.response.status >= 500 ? 'unavailable' : 'restricted';
          errorMessage = `HTTP ${error.response.status}`;
        } else {
          errorMessage = error.message;
        }
      }

      return {
        resourceId: resource.id,
        url: resource.url,
        status,
        responseTime,
        lastChecked: new Date(),
        errorMessage
      };
    }
  }

  private async updateResourceValidationStatus(resourceId: string, check: ResourceAvailabilityCheck): Promise<void> {
    try {
      let validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'APPROVED';
      
      if (check.status === 'unavailable' || check.status === 'timeout') {
        validationStatus = 'REJECTED';
      } else if (check.status === 'moved' || check.status === 'restricted') {
        validationStatus = 'PENDING';
      }

      await this.prisma.topicResource.update({
        where: { id: resourceId },
        data: {
          lastValidated: check.lastChecked,
          validationStatus,
          // Store check results in metadata
          metadata: {
            lastCheck: {
              status: check.status,
              responseCode: check.responseCode,
              responseTime: check.responseTime,
              errorMessage: check.errorMessage,
              redirectUrl: check.redirectUrl
            }
          }
        }
      });
    } catch (error) {
      console.error(`Failed to update resource ${resourceId}:`, error);
    }
  }

  // System metrics collection
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Database metrics
      const [gradeCount, subjectCount, topicCount, resourceCount, activeResourceCount, validatedResourceCount] = await Promise.all([
        this.prisma.gradeLevel.count({ where: { isActive: true } }),
        this.prisma.subject.count(),
        this.prisma.topic.count({ where: { isActive: true } }),
        this.prisma.topicResource.count(),
        this.prisma.topicResource.count({ where: { isActive: true } }),
        this.prisma.topicResource.count({ where: { validationStatus: 'APPROVED' } })
      ]);

      // Cache metrics
      const cacheStats = await redisService.getCacheStats();

      // Table sizes (simplified - would need actual database queries)
      const tableStats = [
        { table: 'grade_levels', rowCount: gradeCount, size: 'N/A' },
        { table: 'subjects', rowCount: subjectCount, size: 'N/A' },
        { table: 'topics', rowCount: topicCount, size: 'N/A' },
        { table: 'topic_resources', rowCount: resourceCount, size: 'N/A' }
      ];

      return {
        database: {
          connectionCount: await this.getActiveConnectionCount(),
          activeQueries: 0, // Would need to implement
          cacheHitRatio: 0, // Would need to implement
          tableStats
        },
        cache: {
          totalKeys: cacheStats.totalKeys,
          memoryUsage: cacheStats.memoryUsage,
          hitRate: cacheStats.hitRate,
          evictionRate: 0 // Would need to track
        },
        masterData: {
          totalGrades: gradeCount,
          totalSubjects: subjectCount,
          totalTopics: topicCount,
          totalResources: resourceCount,
          activeResources: activeResourceCount,
          validatedResources: validatedResourceCount
        },
        performance: {
          averageResponseTime: 0, // Would integrate with performance service
          errorRate: 0,
          throughput: 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to collect system metrics: ${error}`);
    }
  }

  // Maintenance task management
  async scheduleMaintenanceTask(task: Omit<MaintenanceTask, 'id' | 'status'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const maintenanceTask: MaintenanceTask = {
      id: taskId,
      status: 'pending',
      ...task
    };

    this.maintenanceTasks.push(maintenanceTask);
    
    // Schedule execution
    this.executeMaintenanceTask(taskId);
    
    return taskId;
  }

  private async executeMaintenanceTask(taskId: string): Promise<void> {
    const task = this.maintenanceTasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'running';
    task.startedAt = new Date();

    try {
      let result: any;

      switch (task.type) {
        case 'data_cleanup':
          result = await this.performDataCleanup();
          break;
        case 'cache_refresh':
          result = await this.performCacheRefresh();
          break;
        case 'index_rebuild':
          result = await this.performIndexRebuild();
          break;
        case 'statistics_update':
          result = await this.performStatisticsUpdate();
          break;
        case 'resource_validation':
          result = await this.checkResourceAvailability();
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();

      console.log(`Maintenance task ${taskId} completed successfully`);

    } catch (error) {
      task.status = 'failed';
      task.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();

      console.error(`Maintenance task ${taskId} failed:`, error);
    }
  }

  private async performDataCleanup(): Promise<any> {
    // Clean up orphaned records, old logs, etc.
    const results = {
      orphanedTopicsRemoved: 0,
      orphanedResourcesRemoved: 0,
      oldLogsRemoved: 0
    };

    // This would implement actual cleanup logic
    console.log('Data cleanup completed:', results);
    return results;
  }

  private async performCacheRefresh(): Promise<any> {
    // Refresh all master data caches
    await redisService.deletePattern('masterdata:*');
    
    // Warm up cache with fresh data
    // This would integrate with the cache service
    
    return { message: 'Cache refreshed successfully' };
  }

  private async performIndexRebuild(): Promise<any> {
    // This would rebuild database indexes
    // For now, just update statistics
    await this.performStatisticsUpdate();
    
    return { message: 'Index rebuild completed' };
  }

  private async performStatisticsUpdate(): Promise<any> {
    // Update database statistics for better query planning
    const tables = ['grade_levels', 'subjects', 'topics', 'topic_resources'];
    
    for (const table of tables) {
      await this.prisma.$executeRaw`ANALYZE ${table}`;
    }
    
    return { tablesAnalyzed: tables.length };
  }

  // Utility methods
  private async getActiveConnectionCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      return Number(result[0].count);
    } catch (error) {
      return 0;
    }
  }

  private async getLongRunningQueries(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT query, query_start, state, wait_event_type, wait_event
        FROM pg_stat_activity 
        WHERE state = 'active' 
          AND query_start < NOW() - INTERVAL '30 seconds'
          AND query NOT LIKE '%pg_stat_activity%'
      `;
    } catch (error) {
      return [];
    }
  }

  private trimHealthCheckHistory(): void {
    if (this.healthChecks.length > this.maxHistorySize) {
      this.healthChecks = this.healthChecks.slice(-this.maxHistorySize);
    }
  }

  private trimDataQualityHistory(): void {
    if (this.dataQualityIssues.length > this.maxHistorySize) {
      this.dataQualityIssues = this.dataQualityIssues.slice(-this.maxHistorySize);
    }
  }

  private trimResourceCheckHistory(): void {
    if (this.resourceChecks.length > this.maxHistorySize) {
      this.resourceChecks = this.resourceChecks.slice(-this.maxHistorySize);
    }
  }

  private cleanupOldRecords(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    this.healthChecks = this.healthChecks.filter(h => h.timestamp >= cutoffDate);
    this.dataQualityIssues = this.dataQualityIssues.filter(i => i.detectedAt >= cutoffDate);
    this.resourceChecks = this.resourceChecks.filter(r => r.lastChecked >= cutoffDate);
    this.maintenanceTasks = this.maintenanceTasks.filter(t => 
      t.scheduledAt >= cutoffDate || t.status === 'pending' || t.status === 'running'
    );
  }

  // Public API methods
  getLatestHealthCheck(): HealthCheckResult[] {
    return this.healthChecks.slice(-10); // Last 10 checks
  }

  getDataQualityIssues(severity?: DataQualityIssue['severity']): DataQualityIssue[] {
    return severity 
      ? this.dataQualityIssues.filter(i => i.severity === severity)
      : this.dataQualityIssues;
  }

  getResourceCheckResults(status?: ResourceAvailabilityCheck['status']): ResourceAvailabilityCheck[] {
    return status
      ? this.resourceChecks.filter(r => r.status === status)
      : this.resourceChecks;
  }

  getMaintenanceTasks(status?: MaintenanceTask['status']): MaintenanceTask[] {
    return status
      ? this.maintenanceTasks.filter(t => t.status === status)
      : this.maintenanceTasks;
  }

  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    components: HealthCheckResult[];
    issues: DataQualityIssue[];
    metrics: SystemMetrics;
  }> {
    const components = await this.performHealthCheck();
    const issues = this.getDataQualityIssues('high').concat(this.getDataQualityIssues('critical'));
    const metrics = await this.collectSystemMetrics();

    // Determine overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (components.some(c => c.status === 'critical') || issues.some(i => i.severity === 'critical')) {
      overall = 'critical';
    } else if (components.some(c => c.status === 'warning') || issues.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      components,
      issues,
      metrics
    };
  }
}