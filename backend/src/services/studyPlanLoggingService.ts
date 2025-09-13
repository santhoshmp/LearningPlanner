import { logger, auditLogger, securityLogger, logAuditEvent, logSecurityEvent } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudyPlanAccessLog {
  childId: string;
  planId?: string;
  activityId?: string;
  action: 'ACCESS_PLANS' | 'ACCESS_PLAN' | 'ACCESS_ACTIVITY' | 'UPDATE_PROGRESS' | 'COMPLETE_ACTIVITY';
  success: boolean;
  responseTime?: number;
  errorCode?: string;
  errorMessage?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  metadata?: any;
}

export interface ProgressUpdateLog {
  childId: string;
  activityId: string;
  planId?: string;
  action: 'PROGRESS_UPDATE' | 'ACTIVITY_COMPLETION' | 'STREAK_UPDATE';
  success: boolean;
  previousStatus?: string;
  newStatus?: string;
  scoreChange?: number;
  timeSpent?: number;
  validationErrors?: string[];
  consistencyIssues?: string[];
  responseTime?: number;
  sessionData?: any;
}

export interface DashboardAccessLog {
  childId: string;
  action: 'DASHBOARD_ACCESS' | 'PROGRESS_FETCH' | 'STREAKS_FETCH' | 'BADGES_FETCH';
  success: boolean;
  dataReturned?: {
    studyPlansCount?: number;
    progressRecordsCount?: number;
    streaksCount?: number;
    badgesCount?: number;
  };
  responseTime?: number;
  cacheHit?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface DatabasePerformanceLog {
  operation: string;
  table: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  executionTime: number;
  recordsAffected?: number;
  indexesUsed?: string[];
  queryComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  childId?: string;
  planId?: string;
  activityId?: string;
}

class StudyPlanLoggingService {
  /**
   * Log study plan access attempts with detailed information
   */
  async logStudyPlanAccess(logData: StudyPlanAccessLog): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'study-plan-access',
        ...logData
      };

      // Log to appropriate logger based on success/failure
      if (logData.success) {
        logger.info('Study plan access successful', logEntry);
      } else {
        logger.warn('Study plan access failed', logEntry);
      }

      // Log security events for access denials or suspicious activity
      if (!logData.success && (logData.errorCode === 'ACCESS_DENIED' || logData.errorCode === 'AUTHENTICATION_FAILED')) {
        logSecurityEvent('STUDY_PLAN_ACCESS_DENIED', {
          childId: logData.childId,
          planId: logData.planId,
          action: logData.action,
          errorCode: logData.errorCode,
          userAgent: logData.userAgent,
          ipAddress: logData.ipAddress
        });
      }

      // Store in database for analytics
      await this.storeAccessLog(logEntry);
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
        ...logData
      };

      // Log to appropriate level based on success and issues
      if (logData.success) {
        if (logData.validationErrors?.length || logData.consistencyIssues?.length) {
          logger.warn('Progress update succeeded with issues', logEntry);
        } else {
          logger.info('Progress update successful', logEntry);
        }
      } else {
        logger.error('Progress update failed', logEntry);
      }

      // Audit log for progress changes
      if (logData.success && logData.action === 'ACTIVITY_COMPLETION') {
        logAuditEvent(
          'ACTIVITY_COMPLETED',
          logData.childId,
          `activity:${logData.activityId}`,
          {
            planId: logData.planId,
            scoreChange: logData.scoreChange,
            timeSpent: logData.timeSpent,
            previousStatus: logData.previousStatus,
            newStatus: logData.newStatus
          },
          true
        );
      }

      // Store in database for analytics
      await this.storeProgressLog(logEntry);
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
        ...logData
      };

      // Log performance issues
      if (logData.responseTime && logData.responseTime > 2000) {
        logger.warn('Slow dashboard response', logEntry);
      } else if (logData.success) {
        logger.info('Dashboard access successful', logEntry);
      } else {
        logger.error('Dashboard access failed', logEntry);
      }

      // Store in database for analytics
      await this.storeDashboardLog(logEntry);
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
        ...logData
      };

      // Log slow queries
      if (logData.executionTime > 1000) {
        logger.warn('Slow database query detected', logEntry);
      } else if (logData.executionTime > 500) {
        logger.info('Database query performance', logEntry);
      }

      // Store performance metrics
      await this.storePerformanceLog(logEntry);
    } catch (error) {
      logger.error('Failed to log database performance', { error, logData });
    }
  }

  /**
   * Create a performance monitoring wrapper for database operations
   */
  async monitorDatabaseOperation<T>(
    operation: string,
    table: string,
    queryType: DatabasePerformanceLog['queryType'],
    dbOperation: () => Promise<T>,
    metadata?: { childId?: string; planId?: string; activityId?: string }
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: Error | null = null;

    try {
      result = await dbOperation();
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const executionTime = Date.now() - startTime;
      
      // Determine query complexity based on execution time and operation
      let queryComplexity: DatabasePerformanceLog['queryComplexity'] = 'LOW';
      if (executionTime > 500) queryComplexity = 'MEDIUM';
      if (executionTime > 1000) queryComplexity = 'HIGH';

      await this.logDatabasePerformance({
        operation,
        table,
        queryType,
        executionTime,
        queryComplexity,
        ...metadata
      });

      // Log errors separately
      if (error) {
        logger.error('Database operation failed', {
          operation,
          table,
          queryType,
          executionTime,
          error: error.message,
          ...metadata
        });
      }
    }
  }

  /**
   * Store access logs in database for analytics
   */
  private async storeAccessLog(logEntry: any): Promise<void> {
    try {
      await prisma.studyPlanAccessLog.create({
        data: {
          childId: logEntry.childId,
          planId: logEntry.planId,
          activityId: logEntry.activityId,
          action: logEntry.action,
          success: logEntry.success,
          responseTime: logEntry.responseTime,
          errorCode: logEntry.errorCode,
          errorMessage: logEntry.errorMessage,
          userAgent: logEntry.userAgent,
          ipAddress: logEntry.ipAddress,
          sessionId: logEntry.sessionId,
          metadata: logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      // Don't throw - logging should not break the main operation
      logger.error('Failed to store access log in database', { error, logEntry });
    }
  }

  /**
   * Store progress logs in database for analytics
   */
  private async storeProgressLog(logEntry: any): Promise<void> {
    try {
      await prisma.progressUpdateLog.create({
        data: {
          childId: logEntry.childId,
          activityId: logEntry.activityId,
          planId: logEntry.planId,
          action: logEntry.action,
          success: logEntry.success,
          previousStatus: logEntry.previousStatus,
          newStatus: logEntry.newStatus,
          scoreChange: logEntry.scoreChange,
          timeSpent: logEntry.timeSpent,
          validationErrors: logEntry.validationErrors ? JSON.stringify(logEntry.validationErrors) : null,
          consistencyIssues: logEntry.consistencyIssues ? JSON.stringify(logEntry.consistencyIssues) : null,
          responseTime: logEntry.responseTime,
          sessionData: logEntry.sessionData ? JSON.stringify(logEntry.sessionData) : null,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store progress log in database', { error, logEntry });
    }
  }

  /**
   * Store dashboard logs in database for analytics
   */
  private async storeDashboardLog(logEntry: any): Promise<void> {
    try {
      await prisma.dashboardAccessLog.create({
        data: {
          childId: logEntry.childId,
          action: logEntry.action,
          success: logEntry.success,
          studyPlansCount: logEntry.dataReturned?.studyPlansCount,
          progressRecordsCount: logEntry.dataReturned?.progressRecordsCount,
          streaksCount: logEntry.dataReturned?.streaksCount,
          badgesCount: logEntry.dataReturned?.badgesCount,
          responseTime: logEntry.responseTime,
          cacheHit: logEntry.cacheHit,
          errorCode: logEntry.errorCode,
          errorMessage: logEntry.errorMessage,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store dashboard log in database', { error, logEntry });
    }
  }

  /**
   * Store performance logs in database for monitoring
   */
  private async storePerformanceLog(logEntry: any): Promise<void> {
    try {
      await prisma.databasePerformanceLog.create({
        data: {
          operation: logEntry.operation,
          tableName: logEntry.table,
          queryType: logEntry.queryType,
          executionTime: logEntry.executionTime,
          recordsAffected: logEntry.recordsAffected,
          indexesUsed: logEntry.indexesUsed ? JSON.stringify(logEntry.indexesUsed) : null,
          queryComplexity: logEntry.queryComplexity,
          childId: logEntry.childId,
          planId: logEntry.planId,
          activityId: logEntry.activityId,
          timestamp: new Date(logEntry.timestamp)
        }
      });
    } catch (error) {
      logger.error('Failed to store performance log in database', { error, logEntry });
    }
  }

  /**
   * Get logging analytics for monitoring dashboard
   */
  async getLoggingAnalytics(timeFrame: { start: Date; end: Date }) {
    try {
      const [accessStats, progressStats, dashboardStats, performanceStats] = await Promise.all([
        // Access statistics
        prisma.studyPlanAccessLog.groupBy({
          by: ['action', 'success'],
          where: {
            timestamp: {
              gte: timeFrame.start,
              lte: timeFrame.end
            }
          },
          _count: true
        }),
        
        // Progress update statistics
        prisma.progressUpdateLog.groupBy({
          by: ['action', 'success'],
          where: {
            timestamp: {
              gte: timeFrame.start,
              lte: timeFrame.end
            }
          },
          _count: true
        }),
        
        // Dashboard access statistics
        prisma.dashboardAccessLog.groupBy({
          by: ['action', 'success'],
          where: {
            timestamp: {
              gte: timeFrame.start,
              lte: timeFrame.end
            }
          },
          _count: true,
          _avg: {
            responseTime: true
          }
        }),
        
        // Performance statistics
        prisma.databasePerformanceLog.groupBy({
          by: ['operation', 'queryComplexity'],
          where: {
            timestamp: {
              gte: timeFrame.start,
              lte: timeFrame.end
            }
          },
          _count: true,
          _avg: {
            executionTime: true
          },
          _max: {
            executionTime: true
          }
        })
      ]);

      return {
        accessStats,
        progressStats,
        dashboardStats,
        performanceStats,
        timeFrame
      };
    } catch (error) {
      logger.error('Failed to get logging analytics', { error, timeFrame });
      throw error;
    }
  }
}

export const studyPlanLoggingService = new StudyPlanLoggingService();