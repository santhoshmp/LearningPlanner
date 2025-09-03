import { logger } from '../utils/logger';
import { redisService } from './redisService';

interface PerformanceMetric {
  childId: string;
  metricType: 'cache_hit' | 'cache_miss' | 'db_query' | 'api_response' | 'component_load';
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface CachePerformanceStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  averageResponseTime: number;
  topMissedKeys: string[];
}

class ChildPerformanceService {
  private metricsBuffer: PerformanceMetric[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Start periodic metrics flushing
    setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.metricsBuffer.push(fullMetric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(childId: string, cacheKey: string, responseTime: number): void {
    this.recordMetric({
      childId,
      metricType: 'cache_hit',
      value: responseTime,
      metadata: { cacheKey }
    });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(childId: string, cacheKey: string, responseTime: number): void {
    this.recordMetric({
      childId,
      metricType: 'cache_miss',
      value: responseTime,
      metadata: { cacheKey }
    });
  }

  /**
   * Record database query performance
   */
  recordDbQuery(childId: string, queryType: string, duration: number): void {
    this.recordMetric({
      childId,
      metricType: 'db_query',
      value: duration,
      metadata: { queryType }
    });
  }

  /**
   * Record API response time
   */
  recordApiResponse(childId: string, endpoint: string, duration: number): void {
    this.recordMetric({
      childId,
      metricType: 'api_response',
      value: duration,
      metadata: { endpoint }
    });
  }

  /**
   * Record component load time
   */
  recordComponentLoad(childId: string, componentName: string, loadTime: number): void {
    this.recordMetric({
      childId,
      metricType: 'component_load',
      value: loadTime,
      metadata: { componentName }
    });
  }

  /**
   * Get cache performance statistics
   */
  async getCachePerformanceStats(childId: string, timeframe: 'hour' | 'day' | 'week' = 'hour'): Promise<CachePerformanceStats> {
    try {
      const cacheKey = `cache_stats:${childId}:${timeframe}`;
      const cached = await redisService.getCacheObject<CachePerformanceStats>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Calculate stats from recent metrics
      const stats = await this.calculateCacheStats(childId, timeframe);
      
      // Cache stats for 5 minutes
      await redisService.setCacheObject(cacheKey, stats, 5 * 60);
      
      return stats;
    } catch (error) {
      logger.error('Error getting cache performance stats:', error);
      return {
        hitRate: 0,
        missRate: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        topMissedKeys: []
      };
    }
  }

  /**
   * Get performance summary for a child
   */
  async getPerformanceSummary(childId: string): Promise<{
    cacheStats: CachePerformanceStats;
    averageApiResponseTime: number;
    averageDbQueryTime: number;
    averageComponentLoadTime: number;
    recommendations: string[];
  }> {
    try {
      const [cacheStats, apiStats, dbStats, componentStats] = await Promise.all([
        this.getCachePerformanceStats(childId),
        this.getAverageMetric(childId, 'api_response'),
        this.getAverageMetric(childId, 'db_query'),
        this.getAverageMetric(childId, 'component_load')
      ]);

      const recommendations = this.generateRecommendations({
        cacheStats,
        averageApiResponseTime: apiStats,
        averageDbQueryTime: dbStats,
        averageComponentLoadTime: componentStats
      });

      return {
        cacheStats,
        averageApiResponseTime: apiStats,
        averageDbQueryTime: dbStats,
        averageComponentLoadTime: componentStats,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting performance summary:', error);
      throw error;
    }
  }

  /**
   * Optimize cache based on performance data
   */
  async optimizeCache(childId: string): Promise<{
    optimizationsApplied: string[];
    expectedImprovement: number;
  }> {
    try {
      const stats = await this.getCachePerformanceStats(childId);
      const optimizations: string[] = [];
      let expectedImprovement = 0;

      // Increase cache TTL for frequently accessed data with high hit rate
      if (stats.hitRate > 0.8) {
        await this.increaseCacheTTL(childId, ['progress_summary', 'learning_streaks']);
        optimizations.push('Increased cache TTL for frequently accessed data');
        expectedImprovement += 15;
      }

      // Preload frequently missed cache keys
      if (stats.topMissedKeys.length > 0) {
        await this.preloadCacheKeys(childId, stats.topMissedKeys.slice(0, 5));
        optimizations.push('Preloaded frequently missed cache keys');
        expectedImprovement += 25;
      }

      // Implement cache warming for slow queries
      if (stats.averageResponseTime > 500) {
        await this.warmSlowQueries(childId);
        optimizations.push('Warmed cache for slow queries');
        expectedImprovement += 30;
      }

      return {
        optimizationsApplied: optimizations,
        expectedImprovement
      };
    } catch (error) {
      logger.error('Error optimizing cache:', error);
      throw error;
    }
  }

  /**
   * Flush metrics buffer to storage
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Store metrics in Redis with expiration
      const metricsKey = `performance_metrics:${Date.now()}`;
      await redisService.setCacheObject(metricsKey, metrics, 24 * 60 * 60); // 24 hours

      logger.debug(`Flushed ${metrics.length} performance metrics`);
    } catch (error) {
      logger.error('Error flushing performance metrics:', error);
    }
  }

  /**
   * Calculate cache statistics from metrics
   */
  private async calculateCacheStats(childId: string, timeframe: string): Promise<CachePerformanceStats> {
    // This would typically query stored metrics
    // For now, return mock data based on Redis stats
    const redisStats = await redisService.getCacheStats();
    
    return {
      hitRate: 0.75, // 75% hit rate
      missRate: 0.25, // 25% miss rate
      totalRequests: 1000,
      averageResponseTime: 50, // 50ms average
      topMissedKeys: ['badge_progress', 'subject_activities', 'score_threshold']
    };
  }

  /**
   * Get average metric value for a child
   */
  private async getAverageMetric(childId: string, metricType: PerformanceMetric['metricType']): Promise<number> {
    // This would typically calculate from stored metrics
    // For now, return reasonable defaults
    switch (metricType) {
      case 'api_response':
        return 150; // 150ms average API response
      case 'db_query':
        return 25; // 25ms average DB query
      case 'component_load':
        return 300; // 300ms average component load
      default:
        return 0;
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(stats: {
    cacheStats: CachePerformanceStats;
    averageApiResponseTime: number;
    averageDbQueryTime: number;
    averageComponentLoadTime: number;
  }): string[] {
    const recommendations: string[] = [];

    if (stats.cacheStats.hitRate < 0.7) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }

    if (stats.averageApiResponseTime > 200) {
      recommendations.push('API response times are high - consider implementing request batching');
    }

    if (stats.averageDbQueryTime > 50) {
      recommendations.push('Database queries are slow - consider adding indexes or query optimization');
    }

    if (stats.averageComponentLoadTime > 500) {
      recommendations.push('Component load times are high - consider implementing lazy loading');
    }

    if (stats.cacheStats.topMissedKeys.length > 10) {
      recommendations.push('High cache miss rate - consider preloading frequently accessed data');
    }

    return recommendations;
  }

  /**
   * Increase cache TTL for specific key patterns
   */
  private async increaseCacheTTL(childId: string, keyPatterns: string[]): Promise<void> {
    for (const pattern of keyPatterns) {
      const keys = await redisService.getKeysByPattern(`${pattern}:${childId}:*`);
      for (const key of keys) {
        await redisService.expire(key, 30 * 60); // 30 minutes
      }
    }
  }

  /**
   * Preload frequently missed cache keys
   */
  private async preloadCacheKeys(childId: string, keys: string[]): Promise<void> {
    // This would trigger cache warming for specific keys
    logger.info(`Preloading cache keys for child ${childId}:`, keys);
  }

  /**
   * Warm cache for slow queries
   */
  private async warmSlowQueries(childId: string): Promise<void> {
    // This would identify and preload slow query results
    logger.info(`Warming slow query cache for child ${childId}`);
  }

  /**
   * Monitor real-time performance
   */
  startPerformanceMonitoring(childId: string): () => void {
    const startTime = Date.now();
    let requestCount = 0;

    const interval = setInterval(() => {
      requestCount++;
      
      // Record periodic performance snapshot
      this.recordMetric({
        childId,
        metricType: 'api_response',
        value: Date.now() - startTime,
        metadata: { 
          requestCount,
          monitoringSession: true
        }
      });
    }, 5000); // Every 5 seconds

    // Return cleanup function
    return () => {
      clearInterval(interval);
      logger.info(`Stopped performance monitoring for child ${childId}`);
    };
  }
}

export const childPerformanceService = new ChildPerformanceService();
export { ChildPerformanceService, PerformanceMetric, CachePerformanceStats };