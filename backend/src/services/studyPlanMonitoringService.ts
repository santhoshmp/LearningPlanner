import { logger, auditLogger, securityLogger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudyPlanAccessLog {
  childId: string;
  planId?: string;
  action: 'LIST_PLANS' | 'GET_PLAN' | 'ACCESS_DENIED' | 'PLAN_NOT_FOUND';
  success: boolean;
  responseTime: number;
  userAgent?: string;
  ipAddress?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface ProgressUpdateLog {
  childId: string;
  activityId: string;
  planId?: string;
  action: 'PROGRESS_UPDATE' | 'ACTIVITY_COMPLETE' | 'VALIDATION_FAILED';
  success: boolean;
  responseTime: number;
  previousStatus?: string;
  newStatus?: string;
  scoreChange?: number;
  timeSpent?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface DashboardAccessLog {
  childId: string;
  action: 'DASHBOARD_ACCESS' | 'DASHBOARD_ERROR';
  success: boolean;
  responseTime: number;
  dataSize?: number;
  cacheHit?: boolean;
  studyPlansCount?: number;
  progressRecordsCount?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface DatabasePerformanceLog {
  operation: string;
  table: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  executionTime: number;
  recordsAffected?: number;
  queryComplexity?: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  indexesUsed?: string[];
  slowQuery?: boolean;
  metadata?: any;
}

class StudyPlanMonitoringService {
  /**
   * Log study plan access attempts with detailed information
   */
  async logStudyPlanAccess(logData: StudyPlanAccessLog): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'study-plan-access',
        level: logData.success ? 'info' : 'warn',
        ...logData
      };

      // Log to appropriate logger based on success/failure
      if (logData.success) {
        auditLogger.info('Study plan access', logEntry);
      } else {
        securityLogger.warn('Study plan access failed', logEntry);
      }

      // Store in database for analytics
      await this.storeAccessLog(logEntry);

      // Check for suspicious patterns
      await this.checkSuspiciousAccessPatterns(logData.childId, logData.action);

    } catch (error) {
      logger.error('Failed to log study plan access', { error, logData });
    }
  }

  /**
   * Log progress update operations with success/failure status
   */
  async logProgressUpdate(logData: ProgressUpdateLog): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'progress-update',
        level: logData.success ? 'info' : 'error',
        ...logData
      };

      // Log to audit logger for all progress updates
      auditLogger.info('Progress update operation', logEntry);

      // Log errors to main logger
      if (!logData.success) {
        logger.error('Progress update failed', logEntry);
      }

      // Store in database for analytics
      await this.storeProgressLog(logEntry);

      // Update progress metrics
      await this.updateProgressMetrics(logData);

    } catch (error) {
      logger.error('Failed to log progress update', { error, logData });
    }
  }

  /**
   * Log dashboard API calls with performance metrics
   */
  async logDashboardAccess(logData: DashboardAccessLog): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'dashboard-access',
        level: logData.success ? 'info' : 'error',
        ...logData
      };

      // Log performance metrics
      if (logData.responseTime > 2000) {
        logger.warn('Slow dashboard response', logEntry);
      } else {
        logger.info('Dashboard access', logEntry);
      }

      // Store in database for performance monitoring
      await this.storeDashboardLog(logEntry);

      // Update performance metrics
      await this.updateDashboardMetrics(logData);

    } catch (error) {
      logger.error('Failed to log dashboard access', { error, logData });
    }
  }

  /**
   * Log database query performance for monitoring
   */
  async logDatabasePerformance(logData: DatabasePerformanceLog): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'database-performance',
        level: logData.slowQuery ? 'warn' : 'debug',
        ...logData
      };

      // Log slow queries as warnings
      if (logData.slowQuery || logData.executionTime > 1000) {
        logger.warn('Slow database query detected', logEntry);
      } else {
        logger.debug('Database query performance', logEntry);
      }

      // Store performance data for analysis
      await this.storePerformanceLog(logEntry);

    } catch (error) {
      logger.error('Failed to log database performance', { error, logData });
    }
  }

  /**
   * Get monitoring statistics for a specific child
   */
  async getChildMonitoringStats(childId: string, timeFrame: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    try {
      const timeAgo = this.getTimeAgo(timeFrame);

      const [accessLogs, progressLogs, dashboardLogs] = await Promise.all([
        this.getAccessLogsForChild(childId, timeAgo),
        this.getProgressLogsForChild(childId, timeAgo),
        this.getDashboardLogsForChild(childId, timeAgo)
      ]);

      return {
        childId,
        timeFrame,
        period: { from: timeAgo, to: new Date() },
        studyPlanAccess: {
          totalAttempts: accessLogs.length,
          successfulAttempts: accessLogs.filter(log => log.success).length,
          failedAttempts: accessLogs.filter(log => !log.success).length,
          averageResponseTime: this.calculateAverageResponseTime(accessLogs),
          mostAccessedPlans: this.getMostAccessedPlans(accessLogs)
        },
        progressUpdates: {
          totalUpdates: progressLogs.length,
          successfulUpdates: progressLogs.filter(log => log.success).length,
          failedUpdates: progressLogs.filter(log => !log.success).length,
          averageResponseTime: this.calculateAverageResponseTime(progressLogs),
          activitiesWorkedOn: this.getUniqueActivities(progressLogs).length,
          totalTimeSpent: this.calculateTotalTimeSpent(progressLogs)
        },
        dashboardAccess: {
          totalAccesses: dashboardLogs.length,
          successfulAccesses: dashboardLogs.filter(log => log.success).length,
          failedAccesses: dashboardLogs.filter(log => !log.success).length,
          averageResponseTime: this.calculateAverageResponseTime(dashboardLogs),
          averageDataSize: this.calculateAverageDataSize(dashboardLogs),
          cacheHitRate: this.calculateCacheHitRate(dashboardLogs)
        }
      };
    } catch (error) {
      logger.error('Failed to get child monitoring stats', { error, childId, timeFrame });
      throw error;
    }
  }

  /**
   * Get system-wide monitoring statistics
   */
  async getSystemMonitoringStats(timeFrame: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    try {
      const timeAgo = this.getTimeAgo(timeFrame);

      const [performanceLogs, errorCounts, slowQueries] = await Promise.all([
        this.getPerformanceLogsForPeriod(timeAgo),
        this.getErrorCountsForPeriod(timeAgo),
        this.getSlowQueriesForPeriod(timeAgo)
      ]);

      return {
        timeFrame,
        period: { from: timeAgo, to: new Date() },
        database: {
          totalQueries: performanceLogs.length,
          averageExecutionTime: this.calculateAverageExecutionTime(performanceLogs),
          slowQueries: slowQueries.length,
          slowQueryThreshold: 1000, // ms
          queryTypeDistribution: this.getQueryTypeDistribution(performanceLogs),
          tableAccessFrequency: this.getTableAccessFrequency(performanceLogs)
        },
        errors: {
          totalErrors: errorCounts.total,
          studyPlanErrors: errorCounts.studyPlan,
          progressUpdateErrors: errorCounts.progressUpdate,
          dashboardErrors: errorCounts.dashboard,
          databaseErrors: errorCounts.database
        },
        performance: {
          averageStudyPlanResponseTime: this.calculateAverageResponseTimeByService('study-plan-access', timeAgo),
          averageProgressUpdateResponseTime: this.calculateAverageResponseTimeByService('progress-update', timeAgo),
          averageDashboardResponseTime: this.calculateAverageResponseTimeByService('dashboard-access', timeAgo)
        }
      };
    } catch (error) {
      logger.error('Failed to get system monitoring stats', { error, timeFrame });
      throw error;
    }
  }

  // Private helper methods

  private async storeAccessLog(logEntry: any): Promise<void> {
    try {
      await prisma.monitoringLog.create({
        data: {
          service: logEntry.service,
          level: logEntry.level,
          message: `Study plan access: ${logEntry.action}`,
          metadata: JSON.stringify(logEntry),
          childId: logEntry.childId,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store access log in database', { error, logEntry });
    }
  }

  private async storeProgressLog(logEntry: any): Promise<void> {
    try {
      await prisma.monitoringLog.create({
        data: {
          service: logEntry.service,
          level: logEntry.level,
          message: `Progress update: ${logEntry.action}`,
          metadata: JSON.stringify(logEntry),
          childId: logEntry.childId,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store progress log in database', { error, logEntry });
    }
  }

  private async storeDashboardLog(logEntry: any): Promise<void> {
    try {
      await prisma.monitoringLog.create({
        data: {
          service: logEntry.service,
          level: logEntry.level,
          message: `Dashboard access: ${logEntry.action}`,
          metadata: JSON.stringify(logEntry),
          childId: logEntry.childId,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store dashboard log in database', { error, logEntry });
    }
  }

  private async storePerformanceLog(logEntry: any): Promise<void> {
    try {
      await prisma.performanceMetric.create({
        data: {
          metricName: `db_${logEntry.operation}_${logEntry.table}`,
          metricValue: logEntry.executionTime,
          metadata: JSON.stringify(logEntry),
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store performance log in database', { error, logEntry });
    }
  }

  private async checkSuspiciousAccessPatterns(childId: string, action: string): Promise<void> {
    try {
      const recentAttempts = await this.getRecentAccessAttempts(childId, 5); // Last 5 minutes
      
      if (recentAttempts.length > 20) {
        securityLogger.warn('Suspicious access pattern detected', {
          childId,
          action,
          attemptCount: recentAttempts.length,
          timeWindow: '5 minutes'
        });
      }
    } catch (error) {
      logger.error('Failed to check suspicious access patterns', { error, childId, action });
    }
  }

  private async updateProgressMetrics(logData: ProgressUpdateLog): Promise<void> {
    try {
      const metricName = `progress_update_${logData.success ? 'success' : 'failure'}`;
      await prisma.performanceMetric.create({
        data: {
          metricName,
          metricValue: logData.responseTime,
          metadata: JSON.stringify({
            childId: logData.childId,
            activityId: logData.activityId,
            action: logData.action
          }),
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update progress metrics', { error, logData });
    }
  }

  private async updateDashboardMetrics(logData: DashboardAccessLog): Promise<void> {
    try {
      const metricName = `dashboard_${logData.success ? 'success' : 'failure'}`;
      await prisma.performanceMetric.create({
        data: {
          metricName,
          metricValue: logData.responseTime,
          metadata: JSON.stringify({
            childId: logData.childId,
            dataSize: logData.dataSize,
            cacheHit: logData.cacheHit
          }),
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update dashboard metrics', { error, logData });
    }
  }

  private getTimeAgo(timeFrame: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeFrame) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private async getAccessLogsForChild(childId: string, since: Date): Promise<any[]> {
    try {
      const logs = await prisma.monitoringLog.findMany({
        where: {
          childId,
          service: 'study-plan-access',
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'desc' }
      });

      return logs.map(log => ({
        ...JSON.parse(log.metadata as string),
        timestamp: log.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get access logs for child', { error, childId });
      return [];
    }
  }

  private async getProgressLogsForChild(childId: string, since: Date): Promise<any[]> {
    try {
      const logs = await prisma.monitoringLog.findMany({
        where: {
          childId,
          service: 'progress-update',
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'desc' }
      });

      return logs.map(log => ({
        ...JSON.parse(log.metadata as string),
        timestamp: log.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get progress logs for child', { error, childId });
      return [];
    }
  }

  private async getDashboardLogsForChild(childId: string, since: Date): Promise<any[]> {
    try {
      const logs = await prisma.monitoringLog.findMany({
        where: {
          childId,
          service: 'dashboard-access',
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'desc' }
      });

      return logs.map(log => ({
        ...JSON.parse(log.metadata as string),
        timestamp: log.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get dashboard logs for child', { error, childId });
      return [];
    }
  }

  private async getRecentAccessAttempts(childId: string, minutes: number): Promise<any[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.getAccessLogsForChild(childId, since);
  }
}