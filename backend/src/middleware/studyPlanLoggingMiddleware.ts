import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Request interface to include logging data
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      loggingData?: {
        childId?: string;
        planId?: string;
        activityId?: string;
        action?: string;
        sessionId?: string;
      };
    }
  }
}

/**
 * Middleware to track request start time for performance monitoring
 */
export const trackRequestTime = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  next();
};

/**
 * Middleware to extract and store logging data from request
 */
export const extractLoggingData = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.loggingData = {
      childId: req.params.childId || req.user?.userId,
      planId: req.params.planId,
      activityId: req.params.activityId,
      action,
      sessionId: req.headers['x-session-id'] as string
    };
    next();
  };
};

/**
 * Middleware to log study plan access attempts
 */
export const logStudyPlanAccess = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    
    // Extract error information if request failed
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    
    if (!success && data) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        errorCode = responseData.error?.code;
        errorMessage = responseData.error?.message;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Log the access attempt
    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    studyPlanLoggingService.logStudyPlanAccess({
      childId: req.loggingData?.childId || 'unknown',
      planId: req.loggingData?.planId,
      activityId: req.loggingData?.activityId,
      action: req.loggingData?.action || 'UNKNOWN_ACTION',
      success,
      responseTime,
      errorCode,
      errorMessage,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: req.loggingData?.sessionId
    }).catch(error => {
      logger.error('Failed to log study plan access', { error });
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log progress update operations
 */
export const logProgressUpdate = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    
    // Extract progress update details
    let previousStatus: string | undefined;
    let newStatus: string | undefined;
    let scoreChange: number | undefined;
    let timeSpent: number | undefined;
    let validationErrors: string[] | undefined;
    let consistencyIssues: string[] | undefined;

    if (success && data) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        newStatus = responseData.progress?.status;
        scoreChange = responseData.progress?.score;
        timeSpent = responseData.progress?.timeSpent;
        validationErrors = responseData.validation?.warnings;
        consistencyIssues = responseData.consistency?.issues > 0 ? ['consistency issues detected'] : undefined;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Extract from request body
    if (req.body) {
      previousStatus = req.body.previousStatus;
      if (!newStatus) newStatus = req.body.status;
      if (!scoreChange) scoreChange = req.body.score;
      if (!timeSpent) timeSpent = req.body.timeSpent;
    }

    // Log the progress update
    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    studyPlanLoggingService.logProgressUpdate({
      childId: req.loggingData?.childId || 'unknown',
      activityId: req.loggingData?.activityId || 'unknown',
      planId: req.loggingData?.planId,
      action: req.loggingData?.action || 'PROGRESS_UPDATE',
      success,
      previousStatus,
      newStatus,
      scoreChange,
      timeSpent,
      validationErrors,
      consistencyIssues,
      responseTime,
      sessionData: req.body?.sessionData
    }).catch(error => {
      logger.error('Failed to log progress update', { error });
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log dashboard access
 */
export const logDashboardAccess = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    
    // Extract dashboard data counts
    let dataReturned: any = {};
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    
    if (data) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (success) {
          // Extract data counts from successful response
          if (responseData.dashboard) {
            dataReturned.studyPlansCount = responseData.dashboard.studyPlans?.length;
            dataReturned.progressRecordsCount = responseData.dashboard.progressSummary?.totalActivities;
            dataReturned.streaksCount = responseData.dashboard.currentStreaks?.length;
            dataReturned.badgesCount = responseData.dashboard.badges?.recent?.length;
          } else if (responseData.streaks) {
            dataReturned.streaksCount = responseData.streaks?.length;
          } else if (responseData.badges) {
            dataReturned.badgesCount = responseData.badges?.length;
          }
        } else {
          // Extract error information
          errorCode = responseData.error?.code;
          errorMessage = responseData.error?.message;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Log the dashboard access
    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    studyPlanLoggingService.logDashboardAccess({
      childId: req.loggingData?.childId || 'unknown',
      action: req.loggingData?.action || 'DASHBOARD_ACCESS',
      success,
      dataReturned,
      responseTime,
      cacheHit: false, // TODO: Implement cache hit detection
      errorCode,
      errorMessage
    }).catch(error => {
      logger.error('Failed to log dashboard access', { error });
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Database operation monitoring wrapper
 */
export const monitorDatabaseOperation = async <T>(
  operation: string,
  table: string,
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT',
  dbOperation: () => Promise<T>,
  metadata?: { childId?: string; planId?: string; activityId?: string }
): Promise<T> => {
  const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
  return studyPlanLoggingService.monitorDatabaseOperation(operation, table, queryType, dbOperation, metadata);
};

/**
 * Composite middleware for study plan routes
 */
export const studyPlanLogging = (action: string) => [
  trackRequestTime,
  extractLoggingData(action),
  logStudyPlanAccess
];

/**
 * Composite middleware for progress update routes
 */
export const progressUpdateLogging = (action: string) => [
  trackRequestTime,
  extractLoggingData(action),
  logProgressUpdate
];

/**
 * Composite middleware for dashboard routes
 */
export const dashboardLogging = (action: string) => [
  trackRequestTime,
  extractLoggingData(action),
  logDashboardAccess
];