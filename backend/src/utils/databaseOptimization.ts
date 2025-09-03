import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Use the global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

const getPrisma = () => globalThis.__prisma || new PrismaClient();

/**
 * Database optimization utilities
 */
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  private constructor() {}

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Execute optimized query with caching and performance tracking
   */
  async executeOptimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      cache?: boolean;
      cacheTTL?: number; // seconds
      timeout?: number; // milliseconds
      retries?: number;
    } = {}
  ): Promise<T> {
    const { cache = false, cacheTTL = 300, timeout = 30000, retries = 3 } = options;
    const startTime = Date.now();

    try {
      // Check cache first
      if (cache) {
        const cached = this.getCachedQuery<T>(queryKey);
        if (cached) {
          this.updateQueryStats(queryKey, Date.now() - startTime);
          return cached;
        }
      }

      // Execute query with timeout and retries
      const result = await this.executeWithRetry(queryFn, retries, timeout);

      // Cache result if enabled
      if (cache) {
        this.setCachedQuery(queryKey, result, cacheTTL);
      }

      // Update performance stats
      this.updateQueryStats(queryKey, Date.now() - startTime);

      return result;
    } catch (error) {
      logger.error(`Query execution failed for key: ${queryKey}`, error);
      throw error;
    }
  }

  /**
   * Get cached query result
   */
  private getCachedQuery<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Set cached query result
   */
  private setCachedQuery<T>(key: string, result: T, ttl: number): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Execute query with retry logic
   */
  private async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          )
        ]);
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Update query performance statistics
   */
  private updateQueryStats(queryKey: string, executionTime: number): void {
    const stats = this.queryStats.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(queryKey, stats);
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const stats: Record<string, any> = {};
    this.queryStats.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  /**
   * Clear query cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  /**
   * Optimized analytics queries
   */
  async getOptimizedAnalytics(childId: string, timeframe: string): Promise<any> {
    const queryKey = `analytics:${childId}:${timeframe}`;
    
    return this.executeOptimizedQuery(
      queryKey,
      async () => {
        const prisma = getPrisma();
        
        // Use optimized query with proper indexing
        const [progress, activities, timeSpent] = await Promise.all([
          prisma.studyProgress.findMany({
            where: {
              childId,
              createdAt: this.getTimeframeFilter(timeframe)
            },
            select: {
              id: true,
              status: true,
              score: true,
              timeSpent: true,
              createdAt: true,
              activity: {
                select: {
                  id: true,
                  title: true,
                  subject: true,
                  difficulty: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          
          prisma.studyActivity.count({
            where: {
              studyPlan: {
                childId
              },
              createdAt: this.getTimeframeFilter(timeframe)
            }
          }),
          
          prisma.studyProgress.aggregate({
            where: {
              childId,
              createdAt: this.getTimeframeFilter(timeframe)
            },
            _sum: {
              timeSpent: true
            },
            _avg: {
              score: true
            }
          })
        ]);

        return {
          progress,
          totalActivities: activities,
          totalTimeSpent: timeSpent._sum.timeSpent || 0,
          averageScore: timeSpent._avg.score || 0
        };
      },
      { cache: true, cacheTTL: 300 } // Cache for 5 minutes
    );
  }

  /**
   * Optimized content queries with pagination
   */
  async getOptimizedContent(
    filters: any,
    pagination: { offset: number; limit: number }
  ): Promise<{ data: any[]; total: number }> {
    const queryKey = `content:${JSON.stringify(filters)}:${pagination.offset}:${pagination.limit}`;
    
    return this.executeOptimizedQuery(
      queryKey,
      async () => {
        const prisma = getPrisma();
        
        const where = this.buildContentWhereClause(filters);
        
        const [data, total] = await Promise.all([
          prisma.studyContent.findMany({
            where,
            select: {
              id: true,
              title: true,
              description: true,
              contentType: true,
              thumbnailUrl: true,
              duration: true,
              difficultyLevel: true,
              safetyRating: true,
              createdAt: true
            },
            skip: pagination.offset,
            take: pagination.limit,
            orderBy: { createdAt: 'desc' }
          }),
          
          prisma.studyContent.count({ where })
        ]);

        return { data, total };
      },
      { cache: true, cacheTTL: 600 } // Cache for 10 minutes
    );
  }

  /**
   * Batch operations for better performance
   */
  async batchUpdateProgress(updates: Array<{
    id: string;
    status?: string;
    score?: number;
    timeSpent?: number;
  }>): Promise<void> {
    const prisma = getPrisma();
    
    // Use transaction for batch updates
    await prisma.$transaction(
      updates.map(update => 
        prisma.studyProgress.update({
          where: { id: update.id },
          data: {
            ...(update.status && { status: update.status }),
            ...(update.score !== undefined && { score: update.score }),
            ...(update.timeSpent !== undefined && { timeSpent: update.timeSpent }),
            updatedAt: new Date()
          }
        })
      )
    );
  }

  /**
   * Optimized user settings retrieval
   */
  async getOptimizedUserSettings(userId: string): Promise<any> {
    const queryKey = `user_settings:${userId}`;
    
    return this.executeOptimizedQuery(
      queryKey,
      async () => {
        const prisma = getPrisma();
        
        return prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            settings: true,
            socialAuthProviders: {
              select: {
                id: true,
                provider: true,
                providerEmail: true,
                createdAt: true
              }
            }
          }
        });
      },
      { cache: true, cacheTTL: 1800 } // Cache for 30 minutes
    );
  }

  /**
   * Database connection optimization
   */
  async optimizeConnections(): Promise<void> {
    const prisma = getPrisma();
    
    // Configure connection pool
    await prisma.$executeRaw`SET statement_timeout = '30s'`;
    await prisma.$executeRaw`SET lock_timeout = '10s'`;
    await prisma.$executeRaw`SET idle_in_transaction_session_timeout = '60s'`;
  }

  /**
   * Index optimization suggestions
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{ query: string; avgTime: number; count: number }>;
    suggestions: string[];
  }> {
    const slowQueries: Array<{ query: string; avgTime: number; count: number }> = [];
    const suggestions: string[] = [];

    // Analyze query statistics
    this.queryStats.forEach((stats, query) => {
      if (stats.avgTime > 1000) { // Queries taking more than 1 second
        slowQueries.push({
          query,
          avgTime: stats.avgTime,
          count: stats.count
        });
      }
    });

    // Generate optimization suggestions
    if (slowQueries.length > 0) {
      suggestions.push('Consider adding database indexes for frequently queried columns');
      suggestions.push('Review query complexity and consider breaking down complex queries');
      suggestions.push('Implement query result caching for expensive operations');
    }

    return { slowQueries, suggestions };
  }

  /**
   * Helper methods
   */
  private getTimeframeFilter(timeframe: string): any {
    const now = new Date();
    const filters: Record<string, any> = {
      '7d': { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      '30d': { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      '90d': { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      '1y': { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
    };

    return filters[timeframe] || filters['30d'];
  }

  private buildContentWhereClause(filters: any): any {
    const where: any = {};

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters.difficultyLevel) {
      where.difficultyLevel = filters.difficultyLevel;
    }

    if (filters.safetyRating) {
      where.safetyRating = filters.safetyRating;
    }

    if (filters.ageRange) {
      where.AND = [
        { ageAppropriateMin: { lte: filters.ageRange.max } },
        { ageAppropriateMax: { gte: filters.ageRange.min } }
      ];
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return where;
  }
}

/**
 * Database indexing recommendations
 */
export const DATABASE_INDEXES = {
  // Frequently queried columns that should have indexes
  RECOMMENDED_INDEXES: [
    'users(email)',
    'child_profiles(parent_id)',
    'child_profiles(username)',
    'study_plans(child_id)',
    'study_activities(study_plan_id)',
    'study_progress(child_id)',
    'study_progress(activity_id)',
    'study_progress(created_at)',
    'study_content(activity_id)',
    'study_content(content_type)',
    'study_content(safety_rating)',
    'content_interactions(child_id)',
    'content_interactions(content_id)',
    'security_logs(user_id)',
    'security_logs(event_type)',
    'security_logs(timestamp)',
    'social_auth_providers(user_id)',
    'social_auth_providers(provider, provider_user_id)',
    'user_settings(user_id)',
    'child_settings(child_id)'
  ],

  // Composite indexes for complex queries
  COMPOSITE_INDEXES: [
    'study_progress(child_id, created_at)',
    'study_content(content_type, safety_rating)',
    'security_logs(user_id, event_type, timestamp)',
    'content_interactions(child_id, interaction_type)'
  ]
};

/**
 * Query optimization hints
 */
export const QUERY_OPTIMIZATION_HINTS = {
  // Use LIMIT for large result sets
  USE_LIMIT: 'Always use LIMIT clause for potentially large result sets',
  
  // Use proper WHERE clauses
  USE_WHERE: 'Use WHERE clauses to filter data at the database level',
  
  // Avoid N+1 queries
  AVOID_N_PLUS_1: 'Use include/select to avoid N+1 query problems',
  
  // Use transactions for related operations
  USE_TRANSACTIONS: 'Use transactions for operations that must succeed or fail together',
  
  // Cache expensive queries
  CACHE_EXPENSIVE: 'Cache results of expensive queries that don\'t change frequently'
};

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance();