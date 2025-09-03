import { PrismaClient } from '@prisma/client';
import { redisService } from './redisService';

export interface PerformanceMetrics {
  operationType: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  cacheHit?: boolean;
  recordCount?: number;
  queryComplexity?: 'simple' | 'medium' | 'complex';
  errorMessage?: string;
}

export interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  recordCount: number;
  timestamp: Date;
  parameters?: any;
}

export interface PerformanceReport {
  timeframe: string;
  totalOperations: number;
  averageResponseTime: number;
  cacheHitRate: number;
  slowestOperations: PerformanceMetrics[];
  mostFrequentOperations: { operation: string; count: number; avgDuration: number }[];
  errorRate: number;
  recommendations: string[];
  generatedAt: Date;
}

export interface PerformanceAlert {
  type: 'slow_query' | 'high_error_rate' | 'low_cache_hit' | 'memory_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: any;
  timestamp: Date;
  resolved: boolean;
}

export class MasterDataPerformanceService {
  private prisma: PrismaClient;
  private metrics: PerformanceMetrics[] = [];
  private queryMetrics: DatabaseQueryMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetricsHistory = 10000;
  private readonly slowQueryThreshold = 1000; // ms
  private readonly highErrorRateThreshold = 0.05; // 5%
  private readonly lowCacheHitThreshold = 0.7; // 70%

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring(): void {
    // Set up Prisma query logging
    this.prisma.$on('query' as any, (e: any) => {
      this.recordQueryMetrics({
        query: e.query,
        duration: e.duration,
        recordCount: 0, // Prisma doesn't provide this directly
        timestamp: new Date(),
        parameters: e.params
      });
    });

    // Periodic cleanup of old metrics
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Every minute

    // Periodic performance analysis
    setInterval(() => {
      this.analyzePerformance();
    }, 300000); // Every 5 minutes
  }

  // Record performance metrics
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for performance issues
    this.checkForAlerts(fullMetrics);
  }

  private recordQueryMetrics(queryMetrics: DatabaseQueryMetrics): void {
    this.queryMetrics.push(queryMetrics);

    // Keep only recent query metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }

    // Check for slow queries
    if (queryMetrics.duration > this.slowQueryThreshold) {
      this.createAlert({
        type: 'slow_query',
        severity: queryMetrics.duration > 5000 ? 'critical' : 'high',
        message: `Slow query detected: ${queryMetrics.duration}ms`,
        metrics: queryMetrics,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  private checkForAlerts(metrics: PerformanceMetrics): void {
    // Check for slow operations
    if (metrics.duration > this.slowQueryThreshold) {
      this.createAlert({
        type: 'slow_query',
        severity: metrics.duration > 5000 ? 'critical' : 'high',
        message: `Slow ${metrics.operationType} operation: ${metrics.duration}ms`,
        metrics,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check cache hit rate periodically
    const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes
    const cacheMetrics = recentMetrics.filter(m => m.cacheHit !== undefined);
    
    if (cacheMetrics.length > 10) {
      const cacheHitRate = cacheMetrics.filter(m => m.cacheHit).length / cacheMetrics.length;
      
      if (cacheHitRate < this.lowCacheHitThreshold) {
        this.createAlert({
          type: 'low_cache_hit',
          severity: cacheHitRate < 0.5 ? 'high' : 'medium',
          message: `Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
          metrics: { cacheHitRate, sampleSize: cacheMetrics.length },
          timestamp: new Date(),
          resolved: false
        });
      }
    }

    // Check error rate
    const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
    if (recentMetrics.length > 10 && errorRate > this.highErrorRateThreshold) {
      this.createAlert({
        type: 'high_error_rate',
        severity: errorRate > 0.1 ? 'critical' : 'high',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        metrics: { errorRate, sampleSize: recentMetrics.length },
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  private createAlert(alert: PerformanceAlert): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && 
      !a.resolved && 
      Date.now() - a.timestamp.getTime() < 300000 // Within last 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      console.warn(`Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // Store alert in Redis for external monitoring
      this.storeAlertInRedis(alert);
    }
  }

  private async storeAlertInRedis(alert: PerformanceAlert): Promise<void> {
    try {
      const key = `performance:alert:${Date.now()}`;
      await redisService.setCacheObject(key, alert, 86400); // 24 hours
    } catch (error) {
      console.error('Failed to store performance alert in Redis:', error);
    }
  }

  // Performance analysis and reporting
  generatePerformanceReport(timeframeMs: number = 3600000): PerformanceReport {
    const cutoffTime = new Date(Date.now() - timeframeMs);
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    if (relevantMetrics.length === 0) {
      return {
        timeframe: `${timeframeMs / 60000} minutes`,
        totalOperations: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        slowestOperations: [],
        mostFrequentOperations: [],
        errorRate: 0,
        recommendations: ['No data available for the specified timeframe'],
        generatedAt: new Date()
      };
    }

    // Calculate basic metrics
    const totalOperations = relevantMetrics.length;
    const averageResponseTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const errorRate = relevantMetrics.filter(m => !m.success).length / totalOperations;

    // Calculate cache hit rate
    const cacheMetrics = relevantMetrics.filter(m => m.cacheHit !== undefined);
    const cacheHitRate = cacheMetrics.length > 0 
      ? cacheMetrics.filter(m => m.cacheHit).length / cacheMetrics.length 
      : 0;

    // Find slowest operations
    const slowestOperations = relevantMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Find most frequent operations
    const operationCounts = new Map<string, { count: number; totalDuration: number }>();
    relevantMetrics.forEach(m => {
      const existing = operationCounts.get(m.operationType) || { count: 0, totalDuration: 0 };
      operationCounts.set(m.operationType, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + m.duration
      });
    });

    const mostFrequentOperations = Array.from(operationCounts.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averageResponseTime,
      cacheHitRate,
      errorRate,
      slowestOperations,
      mostFrequentOperations
    });

    return {
      timeframe: `${timeframeMs / 60000} minutes`,
      totalOperations,
      averageResponseTime,
      cacheHitRate,
      slowestOperations,
      mostFrequentOperations,
      errorRate,
      recommendations,
      generatedAt: new Date()
    };
  }

  private generateRecommendations(data: {
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    slowestOperations: PerformanceMetrics[];
    mostFrequentOperations: { operation: string; count: number; avgDuration: number }[];
  }): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (data.averageResponseTime > 500) {
      recommendations.push('Average response time is high. Consider optimizing database queries or increasing cache TTL.');
    }

    // Cache hit rate recommendations
    if (data.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is low. Consider warming up cache more frequently or increasing cache TTL.');
    }

    // Error rate recommendations
    if (data.errorRate > 0.05) {
      recommendations.push('Error rate is high. Review error logs and implement better error handling.');
    }

    // Slow operations recommendations
    const slowOperations = data.slowestOperations.filter(op => op.duration > 1000);
    if (slowOperations.length > 0) {
      const operationTypes = [...new Set(slowOperations.map(op => op.operationType))];
      recommendations.push(`Slow operations detected: ${operationTypes.join(', ')}. Consider adding database indexes or optimizing queries.`);
    }

    // Frequent operations recommendations
    const heavyOperations = data.mostFrequentOperations.filter(op => op.avgDuration > 200);
    if (heavyOperations.length > 0) {
      recommendations.push(`Frequently used operations with high duration: ${heavyOperations.map(op => op.operation).join(', ')}. Consider caching these operations.`);
    }

    // Database-specific recommendations
    const complexQueries = data.slowestOperations.filter(op => op.queryComplexity === 'complex');
    if (complexQueries.length > 0) {
      recommendations.push('Complex queries detected. Consider breaking them down or adding appropriate indexes.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No specific recommendations at this time.');
    }

    return recommendations;
  }

  // Database optimization utilities
  async analyzeQueryPerformance(): Promise<{
    slowQueries: DatabaseQueryMetrics[];
    frequentQueries: { query: string; count: number; avgDuration: number }[];
    recommendations: string[];
  }> {
    const recentQueries = this.queryMetrics.filter(q => 
      Date.now() - q.timestamp.getTime() < 3600000 // Last hour
    );

    // Find slow queries
    const slowQueries = recentQueries
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);

    // Find frequent queries
    const queryFrequency = new Map<string, { count: number; totalDuration: number }>();
    recentQueries.forEach(q => {
      const normalizedQuery = this.normalizeQuery(q.query);
      const existing = queryFrequency.get(normalizedQuery) || { count: 0, totalDuration: 0 };
      queryFrequency.set(normalizedQuery, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + q.duration
      });
    });

    const frequentQueries = Array.from(queryFrequency.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate query-specific recommendations
    const recommendations: string[] = [];
    
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} slow queries detected. Consider adding indexes or optimizing query structure.`);
    }

    const heavyFrequentQueries = frequentQueries.filter(q => q.avgDuration > 100);
    if (heavyFrequentQueries.length > 0) {
      recommendations.push('Frequently executed queries with high duration detected. Consider caching results or optimizing queries.');
    }

    return {
      slowQueries,
      frequentQueries,
      recommendations
    };
  }

  private normalizeQuery(query: string): string {
    // Remove parameter values and normalize whitespace for grouping similar queries
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  // Index optimization suggestions
  async suggestIndexOptimizations(): Promise<{
    missingIndexes: { table: string; columns: string[]; reason: string }[];
    unusedIndexes: { table: string; index: string; reason: string }[];
    recommendations: string[];
  }> {
    const suggestions = {
      missingIndexes: [] as { table: string; columns: string[]; reason: string }[],
      unusedIndexes: [] as { table: string; index: string; reason: string }[],
      recommendations: [] as string[]
    };

    // Analyze slow queries for missing indexes
    const slowQueries = this.queryMetrics.filter(q => q.duration > this.slowQueryThreshold);
    
    // Common patterns that suggest missing indexes
    const indexSuggestions = [
      {
        pattern: /WHERE.*grade.*=/i,
        table: 'topics',
        columns: ['gradeId'],
        reason: 'Frequent filtering by grade'
      },
      {
        pattern: /WHERE.*subject.*=/i,
        table: 'topics',
        columns: ['subjectId'],
        reason: 'Frequent filtering by subject'
      },
      {
        pattern: /WHERE.*difficulty.*=/i,
        table: 'topics',
        columns: ['difficulty'],
        reason: 'Frequent filtering by difficulty'
      },
      {
        pattern: /WHERE.*type.*=/i,
        table: 'topic_resources',
        columns: ['type'],
        reason: 'Frequent filtering by resource type'
      },
      {
        pattern: /WHERE.*safetyRating.*=/i,
        table: 'topic_resources',
        columns: ['safetyRating'],
        reason: 'Frequent filtering by safety rating'
      },
      {
        pattern: /ORDER BY.*sortOrder/i,
        table: 'multiple',
        columns: ['sortOrder'],
        reason: 'Frequent ordering by sortOrder'
      }
    ];

    slowQueries.forEach(query => {
      indexSuggestions.forEach(suggestion => {
        if (suggestion.pattern.test(query.query)) {
          const existing = suggestions.missingIndexes.find(
            idx => idx.table === suggestion.table && 
            JSON.stringify(idx.columns) === JSON.stringify(suggestion.columns)
          );
          
          if (!existing) {
            suggestions.missingIndexes.push({
              table: suggestion.table,
              columns: suggestion.columns,
              reason: suggestion.reason
            });
          }
        }
      });
    });

    // Generate recommendations
    if (suggestions.missingIndexes.length > 0) {
      suggestions.recommendations.push('Consider adding the suggested indexes to improve query performance.');
    }

    suggestions.recommendations.push('Regularly monitor query performance and adjust indexes as needed.');
    suggestions.recommendations.push('Use EXPLAIN ANALYZE to understand query execution plans.');

    return suggestions;
  }

  // Memory and resource monitoring
  async getResourceUsage(): Promise<{
    memoryUsage: {
      total: string;
      used: string;
      available: string;
      percentage: number;
    };
    cacheUsage: {
      keys: number;
      memory: string;
      hitRate: number;
    };
    databaseConnections: {
      active: number;
      idle: number;
      total: number;
    };
    recommendations: string[];
  }> {
    const cacheStats = await redisService.getCacheStats();
    
    // Get database connection info (this would need to be implemented based on your connection pool)
    const dbConnections = {
      active: 0, // Would need to get from Prisma connection pool
      idle: 0,
      total: 0
    };

    const recommendations: string[] = [];

    // Memory recommendations
    if (cacheStats.memoryUsage.includes('GB') && parseFloat(cacheStats.memoryUsage) > 1) {
      recommendations.push('High cache memory usage detected. Consider implementing cache eviction policies.');
    }

    // Cache recommendations
    if (cacheStats.hitRate < 70) {
      recommendations.push('Low cache hit rate. Consider warming up cache or increasing TTL.');
    }

    return {
      memoryUsage: {
        total: 'N/A', // Would need system monitoring
        used: 'N/A',
        available: 'N/A',
        percentage: 0
      },
      cacheUsage: {
        keys: cacheStats.totalKeys,
        memory: cacheStats.memoryUsage,
        hitRate: cacheStats.hitRate
      },
      databaseConnections: dbConnections,
      recommendations
    };
  }

  // Utility methods
  private getRecentMetrics(timeframeMs: number): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - timeframeMs);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 86400000); // 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp >= cutoffTime);
    
    // Resolve old alerts
    this.alerts.forEach(alert => {
      if (Date.now() - alert.timestamp.getTime() > 3600000) { // 1 hour
        alert.resolved = true;
      }
    });
  }

  private analyzePerformance(): void {
    const report = this.generatePerformanceReport(300000); // Last 5 minutes
    
    // Log performance summary
    console.log(`Performance Summary: ${report.totalOperations} ops, ` +
                `${report.averageResponseTime.toFixed(2)}ms avg, ` +
                `${(report.cacheHitRate * 100).toFixed(1)}% cache hit rate`);

    // Check for critical issues
    if (report.errorRate > 0.1) {
      console.error(`Critical: High error rate detected: ${(report.errorRate * 100).toFixed(1)}%`);
    }

    if (report.averageResponseTime > 2000) {
      console.warn(`Warning: High average response time: ${report.averageResponseTime.toFixed(2)}ms`);
    }
  }

  // Public API methods
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  resolveAlert(alertIndex: number): void {
    if (this.alerts[alertIndex]) {
      this.alerts[alertIndex].resolved = true;
    }
  }

  getMetricsSummary(): {
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const recentMetrics = this.getRecentMetrics(3600000); // Last hour
    
    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0
      };
    }

    const cacheMetrics = recentMetrics.filter(m => m.cacheHit !== undefined);
    
    return {
      totalOperations: recentMetrics.length,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      errorRate: recentMetrics.filter(m => !m.success).length / recentMetrics.length,
      cacheHitRate: cacheMetrics.length > 0 
        ? cacheMetrics.filter(m => m.cacheHit).length / cacheMetrics.length 
        : 0
    };
  }
}