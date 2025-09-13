import { logger, auditLogger, securityLogger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudyPlanAccessLog {
  childId: string;
  planId?: string;
  accessType: 'LIST_ALL' | 'GET_SPECIFIC' | 'GET_DASHBOARD';
  success: boolean;
  responseTime: number;
  errorCode?: string;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}

export interface ProgressUpdateLog {
  childId: string;
  activityId: string;
  planId?: string;
  updateType: 'PROGRESS' | 'COMPLETION';
  previousStatus?: string;
  newStatus?: string;
  timeSpent: number;
  score?: number;
  success: boolean;
  responseTime: number;
  errorCode?: string;
  errorMessage?: string;
  sessionData?: any;
  validationErrors?: string[];
}

export interface DashboardAccessLog {
  childId: string;
  success: boolean;
  responseTime: number;
  dataPoints: {
    studyPlansCount: number;
    progressRecordsCount: number;
    streaksCount: number;
    badgesCount: number;
  };
  errorCode?: string;
  errorMessage?: string;
  cacheHit?: boolean;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

class ChildStudyPlanMonitoringService {
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastCleanup: Date = new Date();

  /**
   * Log study plan access attempts
   */
  async logStudyPlanAccess(logData: StudyPlanAccessLog): Promise<void> {
    try {
      // Log to application logger
      logger.info('Study plan access', {
        component: 'child-study-plan',
        operation: 'access',
        childId: logData.childId,
        planId: logData.planId,
        accessType: logData.accessType,
        success: logData.success,
        responseTime: logData.responseTime,
        errorCode: logData.errorCode,
        errorMessage: logData.errorMessage,
        userAgent: logData.userAgent,
        ipAddress: logData.ipAddress,
        sessionId: logData.sessionId,
        timestamp: new Date().toISOString()
      });

      // Log security events for failed access attempts
      if (!logData.success) {
        securityLogger.warn('Failed study plan access', {
          childId: logData.childId,
          planId: logData.planId,
          accessType: logData.accessType,
          errorCode: logData.errorCode,
          errorMessage: logData.errorMessage,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          timestamp: new Date().toISOString()
        });

        // Track error counts
        const errorKey = `${logData.accessType}_${logData.errorCode}`;
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
      }

      // Store in database for analytics
      await this.storeAccessLog(logData);

    } catch (error) {
      logger.error('Failed to log study plan access', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logData
      });
    }
  }

  /**
   * Log progress update operations
   */
  async logProgressUpdate(logData: ProgressUpdateLog): Promise<void> {
    try {
      // Log to application logger
      logger.info('Progress update', {
        component: 'child-study-plan',
        operation: 'progress-update',
        childId: logData.childId,
        activityId: logData.activityId,
        planId: logData.planId,
        updateType: logData.updateType,
        previousStatus: logData.previousStatus,
        newStatus: logData.newStatus,
        timeSpent: logData.timeSpent,
        score: logData.score,
        success: logData.success,
        responseTime: logData.responseTime,
        errorCode: logData.errorCode,
        errorMessage: logData.errorMessage,
        validationErrors: logData.validationErrors,
        timestamp: new Date().toISOString()
      });

      // Audit log for completed activities (sensitive operation)
      if (logData.updateType === 'COMPLETION' && logData.success) {
        auditLogger.info('Activity completion', {
          operation: 'COMPLETE_ACTIVITY',
          userId: logData.childId,
          targetResource: `activity:${logData.activityId}`,
          details: {
            planId: logData.planId,
            score: logData.score,
            timeSpent: logData.timeSpent,
            previousStatus: logData.previousStatus,
            newStatus: logData.newStatus
          },
          success: true,
          timestamp: new Date().toISOString()
        });
      }

      // Log validation errors as warnings
      if (logData.validationErrors && logData.validationErrors.length > 0) {
        logger.warn('Progress update validation errors', {
          childId: logData.childId,
          activityId: logData.activityId,
          validationErrors: logData.validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      // Store in database for analytics
      await this.storeProgressUpdateLog(logData);

    } catch (error) {
      logger.error('Failed to log progress update', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logData
      });
    }
  }

  /**
   * Log dashboard access operations
   */
  async logDashboardAccess(logData: DashboardAccessLog): Promise<void> {
    try {
      // Log to application logger
      logger.info('Dashboard access', {
        component: 'child-study-plan',
        operation: 'dashboard-access',
        childId: logData.childId,
        success: logData.success,
        responseTime: logData.responseTime,
        dataPoints: logData.dataPoints,
        errorCode: logData.errorCode,
        errorMessage: logData.errorMessage,
        cacheHit: logData.cacheHit,
        timestamp: new Date().toISOString()
      });

      // Log slow dashboard loads as warnings
      if (logData.responseTime > 2000) { // 2 seconds
        logger.warn('Slow dashboard load', {
          childId: logData.childId,
          responseTime: logData.responseTime,
          dataPoints: logData.dataPoints,
          cacheHit: logData.cacheHit,
          timestamp: new Date().toISOString()
        });
      }

      // Store in database for analytics
      await this.storeDashboardAccessLog(logData);

    } catch (error) {
      logger.error('Failed to log dashboard access', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logData
      });
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(metrics: PerformanceMetrics): void {
    try {
      // Log to application logger
      logger.info('Performance metrics', {
        component: 'child-study-plan',
        operation: metrics.operation,
        duration: metrics.duration,
        queryCount: metrics.queryCount,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        timestamp: new Date().toISOString()
      });

      // Store metrics in memory for aggregation
      const operationMetrics = this.performanceMetrics.get(metrics.operation) || [];
      operationMetrics.push(metrics);
      
      // Keep only last 100 metrics per operation
      if (operationMetrics.length > 100) {
        operationMetrics.shift();
      }
      
      this.performanceMetrics.set(metrics.operation, operationMetrics);

      // Log slow operations as warnings
      if (metrics.duration > 1000) { // 1 second
        logger.warn('Slow operation detected', {
          operation: metrics.operation,
          duration: metrics.duration,
          queryCount: metrics.queryCount,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      logger.error('Failed to log performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics
      });
    }
  }

  /**
   * Get performance summary for monitoring dashboard
   */
  getPerformanceSummary(): any {
    const summary: any = {};
    
    for (const [operation, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length === 0) continue;
      
      const durations = metrics.map(m => m.duration);
      const queryCount = metrics.reduce((sum, m) => sum + m.queryCount, 0);
      const cacheHits = metrics.reduce((sum, m) => sum + m.cacheHits, 0);
      const cacheMisses = metrics.reduce((sum, m) => sum + m.cacheMisses, 0);
      
      summary[operation] = {
        count: metrics.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        totalQueries: queryCount,
        cacheHitRate: cacheHits / (cacheHits + cacheMisses) * 100,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return summary;
  }

  /**
   * Get error summary for monitoring
   */
  getErrorSummary(): any {
    const summary: any = {};
    
    for (const [errorKey, count] of this.errorCounts.entries()) {
      summary[errorKey] = {
        count,
        lastOccurrence: new Date().toISOString()
      };
    }
    
    return summary;
  }

  /**
   * Store access log in database
   */
  private async storeAccessLog(logData: StudyPlanAccessLog): Promise<void> {
    try {
      await prisma.studyPlanAccessLog.create({
        data: {
          childId: logData.childId,
          planId: logData.planId,
          accessType: logData.accessType,
          success: logData.success,
          responseTime: logData.responseTime,
          errorCode: logData.errorCode,
          errorMessage: logData.errorMessage,
          userAgent: logData.userAgent,
          ipAddress: logData.ipAddress,
          sessionId: logData.sessionId,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main operation
      logger.error('Failed to store access log in database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Store progress update log in database
   */
  private async storeProgressUpdateLog(logData: ProgressUpdateLog): Promise<void> {
    try {
      await prisma.progressUpdateLog.create({
        data: {
          childId: logData.childId,
          activityId: logData.activityId,
          planId: logData.planId,
          updateType: logData.updateType,
          previousStatus: logData.previousStatus,
          newStatus: logData.newStatus,
          timeSpent: logData.timeSpent,
          score: logData.score,
          success: logData.success,
          responseTime: logData.responseTime,
          errorCode: logData.errorCode,
          errorMessage: logData.errorMessage,
          sessionData: logData.sessionData ? JSON.stringify(logData.sessionData) : null,
          validationErrors: logData.validationErrors ? JSON.stringify(logData.validationErrors) : null,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main operation
      logger.error('Failed to store progress update log in database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Store dashboard access log in database
   */
  private async storeDashboardAccessLog(logData: DashboardAccessLog): Promise<void> {
    try {
      await prisma.dashboardAccessLog.create({
        data: {
          childId: logData.childId,
          success: logData.success,
          responseTime: logData.responseTime,
          studyPlansCount: logData.dataPoints.studyPlansCount,
          progressRecordsCount: logData.dataPoints.progressRecordsCount,
          streaksCount: logData.dataPoints.streaksCount,
          badgesCount: logData.dataPoints.badgesCount,
          errorCode: logData.errorCode,
          errorMessage: logData.errorMessage,
          cacheHit: logData.cacheHit,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main operation
      logger.error('Failed to store dashboard access log in database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
 