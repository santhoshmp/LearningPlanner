import { redisService } from './redisService';
import { PrismaClient } from '@prisma/client';
import { 
  MasterDataGradeLevel,
  MasterDataSubject,
  MasterDataTopic,
  MasterDataResource,
  CacheConfig,
  CacheStats,
  CacheWarmupResult
} from '../types/masterData';

export interface MasterDataCacheConfig extends CacheConfig {
  enableCompression: boolean;
  compressionThreshold: number; // bytes
  enablePrefetching: boolean;
  prefetchPatterns: string[];
  enableMetrics: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  cacheSize: number;
  lastUpdated: Date;
}

export class MasterDataCacheService {
  private prisma: PrismaClient;
  private config: MasterDataCacheConfig;
  private metrics: Map<string, CacheMetrics>;
  private requestTimes: Map<string, number[]>;

  constructor(prisma: PrismaClient, config?: Partial<MasterDataCacheConfig>) {
    this.prisma = prisma;
    this.config = {
      defaultTTL: 3600,
      gradeTTL: 7200,
      subjectTTL: 3600,
      topicTTL: 1800,
      resourceTTL: 900,
      enableCompression: true,
      compressionThreshold: 1024,
      enablePrefetching: true,
      prefetchPatterns: ['grades:*', 'subjects:*', 'topics:popular:*'],
      enableMetrics: true,
      ...config
    };
    this.metrics = new Map();
    this.requestTimes = new Map();
  }

  // Enhanced caching with performance monitoring
  private getCacheKey(type: string, identifier?: string, filters?: any): string {
    let key = `masterdata:${type}`;
    if (identifier) key += `:${identifier}`;
    if (filters) {
      const filterHash = this.hashFilters(filters);
      key += `:${filterHash}`;
    }
    return key;
  }

  private hashFilters(filters: any): string {
    return Buffer.from(JSON.stringify(filters)).toString('base64').slice(0, 8);
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      let data: T | null = null;
      
      // Try compressed version first if enabled
      if (this.config.enableCompression) {
        data = await redisService.getCacheObject<T>(`${key}:compressed`);
      }
      
      // Fall back to regular version
      if (!data) {
        data = await redisService.getCacheObject<T>(key);
      }

      const responseTime = Date.now() - startTime;
      this.recordCacheHit(key, responseTime, data !== null);
      
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordCacheHit(key, responseTime, false);
      console.warn(`Cache retrieval failed for key ${key}:`, error);
      return null;
    }
  }

  private async setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      
      // Use compression for large objects
      if (this.config.enableCompression && serialized.length > this.config.compressionThreshold) {
        await redisService.setCacheObject(`${key}:compressed`, data, ttl);
      } else {
        await redisService.setCacheObject(key, data, ttl);
      }
    } catch (error) {
      console.warn(`Cache storage failed for key ${key}:`, error);
    }
  }

  private recordCacheHit(key: string, responseTime: number, isHit: boolean): void {
    if (!this.config.enableMetrics) return;

    const keyType = key.split(':')[1] || 'unknown';
    
    if (!this.metrics.has(keyType)) {
      this.metrics.set(keyType, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        cacheSize: 0,
        lastUpdated: new Date()
      });
    }

    if (!this.requestTimes.has(keyType)) {
      this.requestTimes.set(keyType, []);
    }

    const metrics = this.metrics.get(keyType)!;
    const times = this.requestTimes.get(keyType)!;

    if (isHit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    metrics.totalRequests++;
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
    
    times.push(responseTime);
    if (times.length > 100) times.shift(); // Keep last 100 response times
    
    metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    metrics.lastUpdated = new Date();
  }

  // Optimized grade data caching
  async getCachedGrades(): Promise<MasterDataGradeLevel[]> {
    const key = this.getCacheKey('grades');
    
    let cached = await this.getCachedData<MasterDataGradeLevel[]>(key);
    if (cached) return cached;

    // Fetch with optimized query
    const grades = await this.prisma.gradeLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
                color: true,
                category: true,
                isCore: true
              }
            }
          },
          orderBy: { subject: { sortOrder: 'asc' } }
        }
      }
    });

    await this.setCachedData(key, grades, this.config.gradeTTL);
    return grades;
  }

  async getCachedGradeByAge(age: number): Promise<MasterDataGradeLevel | null> {
    const key = this.getCacheKey('grade-by-age', age.toString());
    
    let cached = await this.getCachedData<MasterDataGradeLevel>(key);
    if (cached) return cached;

    const grade = await this.prisma.gradeLevel.findFirst({
      where: {
        ageMin: { lte: age },
        ageMax: { gte: age },
        isActive: true
      },
      include: {
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
                color: true,
                category: true,
                isCore: true
              }
            }
          },
          orderBy: { subject: { sortOrder: 'asc' } }
        }
      }
    });

    if (grade) {
      await this.setCachedData(key, grade, this.config.gradeTTL);
    }
    
    return grade;
  }

  // Optimized subject data caching
  async getCachedSubjects(): Promise<MasterDataSubject[]> {
    const key = this.getCacheKey('subjects');
    
    let cached = await this.getCachedData<MasterDataSubject[]>(key);
    if (cached) return cached;

    const subjects = await this.prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        gradeSubjects: {
          include: {
            grade: {
              select: {
                id: true,
                grade: true,
                displayName: true,
                educationalLevel: true
              }
            }
          }
        },
        _count: {
          select: {
            topics: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    await this.setCachedData(key, subjects, this.config.subjectTTL);
    return subjects;
  }

  async getCachedSubjectsByGrade(grade: string): Promise<MasterDataSubject[]> {
    const key = this.getCacheKey('subjects-by-grade', grade);
    
    let cached = await this.getCachedData<MasterDataSubject[]>(key);
    if (cached) return cached;

    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                _count: {
                  select: {
                    topics: {
                      where: { 
                        isActive: true,
                        grade: { grade }
                      }
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

    const subjects = gradeLevel?.subjects.map(gs => gs.subject) || [];
    await this.setCachedData(key, subjects, this.config.subjectTTL);
    
    return subjects;
  }

  // Optimized topic data caching with pagination
  async getCachedTopicsBySubject(
    grade: string, 
    subjectId: string, 
    options?: { 
      limit?: number; 
      offset?: number; 
      difficulty?: string;
      includeResources?: boolean;
    }
  ): Promise<{ topics: MasterDataTopic[]; total: number }> {
    const key = this.getCacheKey('topics-by-subject', `${grade}:${subjectId}`, options);
    
    let cached = await this.getCachedData<{ topics: MasterDataTopic[]; total: number }>(key);
    if (cached) return cached;

    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade }
    });

    if (!gradeLevel) return { topics: [], total: 0 };

    const where: any = {
      gradeId: gradeLevel.id,
      subjectId,
      isActive: true
    };

    if (options?.difficulty) {
      where.difficulty = options.difficulty;
    }

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        take: options?.limit,
        skip: options?.offset,
        include: {
          grade: {
            select: {
              id: true,
              grade: true,
              displayName: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
              color: true
            }
          },
          resources: options?.includeResources ? {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: 5 // Limit resources per topic for performance
          } : false,
          _count: {
            select: {
              resources: {
                where: { isActive: true }
              }
            }
          }
        }
      }),
      this.prisma.topic.count({ where })
    ]);

    const result = { topics, total };
    await this.setCachedData(key, result, this.config.topicTTL);
    
    return result;
  }

  // Optimized resource caching with filtering
  async getCachedResourcesByTopic(
    topicId: string,
    filters?: {
      type?: string;
      safetyRating?: string;
      difficulty?: string;
      limit?: number;
    }
  ): Promise<MasterDataResource[]> {
    const key = this.getCacheKey('resources-by-topic', topicId, filters);
    
    let cached = await this.getCachedData<MasterDataResource[]>(key);
    if (cached) return cached;

    const where: any = {
      topicId,
      isActive: true,
      validationStatus: 'APPROVED'
    };

    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.safetyRating) where.safetyRating = filters.safetyRating;
      if (filters.difficulty) where.difficulty = filters.difficulty;
    }

    const resources = await this.prisma.topicResource.findMany({
      where,
      orderBy: [
        { safetyRating: 'desc' },
        { sortOrder: 'asc' }
      ],
      take: filters?.limit || 20,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            displayName: true,
            grade: {
              select: {
                grade: true,
                displayName: true
              }
            },
            subject: {
              select: {
                name: true,
                displayName: true,
                color: true
              }
            }
          }
        }
      }
    });

    await this.setCachedData(key, resources, this.config.resourceTTL);
    return resources;
  }

  // Cache warming strategies
  async warmupCache(): Promise<CacheWarmupResult> {
    const startTime = Date.now();
    const results: CacheWarmupResult = {
      success: true,
      warmedKeys: [],
      errors: [],
      duration: 0,
      timestamp: new Date()
    };

    try {
      // Warm up grades
      try {
        await this.getCachedGrades();
        results.warmedKeys.push('grades');
      } catch (error) {
        results.errors.push({ key: 'grades', error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Warm up subjects
      try {
        await this.getCachedSubjects();
        results.warmedKeys.push('subjects');
      } catch (error) {
        results.errors.push({ key: 'subjects', error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Warm up popular grade-subject combinations
      const popularGrades = ['K', '1', '2', '3', '4', '5'];
      const popularSubjects = await this.prisma.subject.findMany({
        where: { isCore: true },
        select: { id: true, name: true },
        take: 5
      });

      for (const grade of popularGrades) {
        try {
          await this.getCachedSubjectsByGrade(grade);
          results.warmedKeys.push(`subjects-by-grade:${grade}`);

          for (const subject of popularSubjects) {
            try {
              await this.getCachedTopicsBySubject(grade, subject.id, { limit: 10 });
              results.warmedKeys.push(`topics:${grade}:${subject.name}`);
            } catch (error) {
              results.errors.push({ 
                key: `topics:${grade}:${subject.name}`, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
            }
          }
        } catch (error) {
          results.errors.push({ 
            key: `subjects-by-grade:${grade}`, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      results.duration = Date.now() - startTime;
      
    } catch (error) {
      results.success = false;
      results.errors.push({ 
        key: 'warmup', 
        error: error instanceof Error ? error.message : 'Cache warmup failed' 
      });
    }

    return results;
  }

  // Cache invalidation strategies
  async invalidateByPattern(pattern: string): Promise<void> {
    await redisService.deletePattern(`masterdata:${pattern}`);
  }

  async invalidateGradeCache(grade?: string): Promise<void> {
    if (grade) {
      await this.invalidateByPattern(`*grade*${grade}*`);
      await this.invalidateByPattern(`*subjects-by-grade:${grade}*`);
      await this.invalidateByPattern(`*topics*${grade}*`);
    } else {
      await this.invalidateByPattern('*grade*');
    }
  }

  async invalidateSubjectCache(subjectId?: string): Promise<void> {
    if (subjectId) {
      await this.invalidateByPattern(`*subject*${subjectId}*`);
      await this.invalidateByPattern(`*topics*${subjectId}*`);
    } else {
      await this.invalidateByPattern('*subject*');
    }
  }

  async invalidateTopicCache(topicId?: string): Promise<void> {
    if (topicId) {
      await this.invalidateByPattern(`*topic*${topicId}*`);
      await this.invalidateByPattern(`*resources*${topicId}*`);
    } else {
      await this.invalidateByPattern('*topic*');
    }
  }

  async invalidateResourceCache(topicId?: string): Promise<void> {
    if (topicId) {
      await this.invalidateByPattern(`*resources*${topicId}*`);
    } else {
      await this.invalidateByPattern('*resources*');
    }
  }

  // Performance monitoring and metrics
  async getCacheMetrics(): Promise<Map<string, CacheMetrics>> {
    return new Map(this.metrics);
  }

  async getCacheStats(): Promise<CacheStats> {
    const redisStats = await redisService.getCacheStats();
    const totalHits = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.hits, 0);
    const totalMisses = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.misses, 0);
    const totalRequests = totalHits + totalMisses;

    return {
      totalKeys: redisStats.totalKeys,
      memoryUsage: redisStats.memoryUsage,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (totalMisses / totalRequests) * 100 : 0,
      totalRequests,
      averageResponseTime: this.calculateAverageResponseTime(),
      keysByType: this.getKeysByType(),
      lastUpdated: new Date()
    };
  }

  private calculateAverageResponseTime(): number {
    const allTimes = Array.from(this.requestTimes.values()).flat();
    return allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
  }

  private getKeysByType(): Record<string, number> {
    const keysByType: Record<string, number> = {};
    for (const [type, metrics] of this.metrics) {
      keysByType[type] = metrics.totalRequests;
    }
    return keysByType;
  }

  // Cache health check
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check Redis connectivity
      await redisService.ping();
    } catch (error) {
      issues.push('Redis connection failed');
      recommendations.push('Check Redis server status and connection settings');
    }

    // Check cache hit rates
    const stats = await this.getCacheStats();
    if (stats.hitRate < 70) {
      issues.push(`Low cache hit rate: ${stats.hitRate.toFixed(1)}%`);
      recommendations.push('Consider increasing cache TTL or warming up cache more frequently');
    }

    // Check memory usage
    if (stats.memoryUsage.includes('GB') && parseFloat(stats.memoryUsage) > 1) {
      issues.push('High memory usage detected');
      recommendations.push('Consider implementing cache eviction policies or reducing TTL');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Batch operations for performance
  async batchGetCachedData<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    try {
      const values = await redisService.mget(keys);
      
      for (let i = 0; i < keys.length; i++) {
        const value = values[i];
        if (value) {
          try {
            results.set(keys[i], JSON.parse(value));
          } catch (error) {
            results.set(keys[i], null);
          }
        } else {
          results.set(keys[i], null);
        }
      }
    } catch (error) {
      console.warn('Batch cache retrieval failed:', error);
      // Return empty results for all keys
      keys.forEach(key => results.set(key, null));
    }

    return results;
  }

  async batchSetCachedData<T>(data: Map<string, T>, ttl: number): Promise<void> {
    try {
      const keyValuePairs: Record<string, string> = {};
      
      for (const [key, value] of data) {
        keyValuePairs[key] = JSON.stringify(value);
      }

      await redisService.mset(keyValuePairs);

      // Set expiration for each key
      const expirePromises = Array.from(data.keys()).map(key => 
        redisService.expire(key, ttl)
      );
      
      await Promise.allSettled(expirePromises);
    } catch (error) {
      console.warn('Batch cache storage failed:', error);
    }
  }
}