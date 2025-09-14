/**
 * Tests for ChildStudyPlanMonitoringService
 * 
 * Note: This service currently has some TypeScript compilation issues:
 * 1. Prisma schema field mismatch (accessType vs action, updateType vs action)
 * 2. Map.entries() iterator compatibility issues
 * 3. Winston import configuration
 * 
 * These are pre-existing issues not related to the recent cleanup changes.
 * Tests are written to verify the intended behavior of the service methods.
 */

import { PrismaClient } from '@prisma/client';
import { logger, auditLogger, securityLogger } from '../../utils/logger';

// Mock the logger utilities
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  auditLogger: {
    info: jest.fn()
  },
  securityLogger: {
    warn: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  studyPlanAccessLog: {
    create: jest.fn()
  },
  progressUpdateLog: {
    create: jest.fn()
  },
  dashboardAccessLog: {
    create: jest.fn()
  }
} as unknown as PrismaClient;

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Import the service after mocking
import { 
  ChildStudyPlanMonitoringService,
  StudyPlanAccessLog, 
  ProgressUpdateLog, 
  DashboardAccessLog, 
  PerformanceMetrics 
} from '../childStudyPlanMonitoringService';

describe('ChildStudyPlanMonitoringService', () => {
  let service: ChildStudyPlanMonitoringService;
  const testChildId = 'test-child-id';
  const testPlanId = 'test-plan-id';
  const testActivityId = 'test-activity-id';
  const testSessionId = 'test-session-id';

  beforeEach(() => {
    service = new ChildStudyPlanMonitoringService();
    jest.clearAllMocks();
  });

  describe('logStudyPlanAccess', () => {
    it('should log successful study plan access', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        planId: testPlanId,
        accessType: 'GET_SPECIFIC',
        success: true,
        responseTime: 150,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        sessionId: testSessionId
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logStudyPlanAccess(accessLog);

      expect(logger.info).toHaveBeenCalledWith('Study plan access', expect.objectContaining({
        component: 'child-study-plan',
        operation: 'access',
        childId: testChildId,
        planId: testPlanId,
        accessType: 'GET_SPECIFIC',
        success: true,
        responseTime: 150,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        sessionId: testSessionId,
        timestamp: expect.any(String)
      }));

      expect(mockPrisma.studyPlanAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          planId: testPlanId,
          accessType: 'GET_SPECIFIC',
          success: true,
          responseTime: 150,
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          sessionId: testSessionId,
          createdAt: expect.any(Date)
        })
      });
    });

    it('should log failed study plan access with security event', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        planId: testPlanId,
        accessType: 'GET_SPECIFIC',
        success: false,
        responseTime: 100,
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'Child not authorized',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1'
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logStudyPlanAccess(accessLog);

      expect(logger.info).toHaveBeenCalledWith('Study plan access', expect.objectContaining({
        success: false,
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'Child not authorized'
      }));

      expect(securityLogger.warn).toHaveBeenCalledWith('Failed study plan access', expect.objectContaining({
        childId: testChildId,
        planId: testPlanId,
        accessType: 'GET_SPECIFIC',
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'Child not authorized',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String)
      }));
    });

    it('should handle database storage errors gracefully', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'LIST_ALL',
        success: true,
        responseTime: 100
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await service.logStudyPlanAccess(accessLog);

      expect(logger.info).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Failed to store access log in database', expect.objectContaining({
        error: 'Database error'
      }));
    });

    it('should handle logging service errors gracefully', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'LIST_ALL',
        success: true,
        responseTime: 100
      };

      (logger.info as jest.Mock).mockImplementation(() => {
        throw new Error('Logger error');
      });

      await service.logStudyPlanAccess(accessLog);

      expect(logger.error).toHaveBeenCalledWith('Failed to log study plan access', expect.objectContaining({
        error: expect.any(Error),
        logData: accessLog
      }));
    });

    it('should track error counts for failed access attempts', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'GET_SPECIFIC',
        success: false,
        responseTime: 100,
        errorCode: 'NOT_FOUND'
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logStudyPlanAccess(accessLog);
      await service.logStudyPlanAccess(accessLog);

      const errorSummary = service.getErrorSummary();
      expect(errorSummary['GET_SPECIFIC_NOT_FOUND']).toEqual({
        count: 2,
        lastOccurrence: expect.any(String)
      });
    });
  });

  describe('logProgressUpdate', () => {
    it('should log successful progress update', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        updateType: 'PROGRESS',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'IN_PROGRESS',
        timeSpent: 300,
        score: 85,
        success: true,
        responseTime: 120
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(logger.info).toHaveBeenCalledWith('Progress update', expect.objectContaining({
        component: 'child-study-plan',
        operation: 'progress-update',
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        updateType: 'PROGRESS',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'IN_PROGRESS',
        timeSpent: 300,
        score: 85,
        success: true,
        responseTime: 120,
        timestamp: expect.any(String)
      }));

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          activityId: testActivityId,
          planId: testPlanId,
          updateType: 'PROGRESS',
          previousStatus: 'IN_PROGRESS',
          newStatus: 'IN_PROGRESS',
          timeSpent: 300,
          score: 85,
          success: true,
          responseTime: 120,
          createdAt: expect.any(Date)
        })
      });
    });

    it('should log audit event for activity completion', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        updateType: 'COMPLETION',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        timeSpent: 600,
        score: 95,
        success: true,
        responseTime: 150
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(auditLogger.info).toHaveBeenCalledWith('Activity completion', expect.objectContaining({
        operation: 'COMPLETE_ACTIVITY',
        userId: testChildId,
        targetResource: `activity:${testActivityId}`,
        details: {
          planId: testPlanId,
          score: 95,
          timeSpent: 600,
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED'
        },
        success: true,
        timestamp: expect.any(String)
      }));
    });

    it('should log validation errors as warnings', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300,
        validationErrors: ['Score too high', 'Time inconsistency']
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(logger.warn).toHaveBeenCalledWith('Progress update validation errors', expect.objectContaining({
        childId: testChildId,
        activityId: testActivityId,
        validationErrors: ['Score too high', 'Time inconsistency'],
        timestamp: expect.any(String)
      }));
    });

    it('should handle database storage errors gracefully', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await service.logProgressUpdate(progressLog);

      expect(logger.info).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Failed to store progress update log in database', expect.objectContaining({
        error: 'Database error'
      }));
    });

    it('should serialize session data correctly', async () => {
      const sessionData = {
        interactions: ['click', 'scroll'],
        timing: { start: Date.now() }
      };

      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300,
        sessionData
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionData: JSON.stringify(sessionData)
        })
      });
    });
  });

  describe('logDashboardAccess', () => {
    it('should log successful dashboard access', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        success: true,
        responseTime: 250,
        dataPoints: {
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5
        },
        cacheHit: true
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logDashboardAccess(dashboardLog);

      expect(logger.info).toHaveBeenCalledWith('Dashboard access', expect.objectContaining({
        component: 'child-study-plan',
        operation: 'dashboard-access',
        childId: testChildId,
        success: true,
        responseTime: 250,
        dataPoints: dashboardLog.dataPoints,
        cacheHit: true,
        timestamp: expect.any(String)
      }));

      expect(mockPrisma.dashboardAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          success: true,
          responseTime: 250,
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5,
          cacheHit: true,
          createdAt: expect.any(Date)
        })
      });
    });

    it('should log slow dashboard loads as warnings', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        success: true,
        responseTime: 3000, // Slow response
        dataPoints: {
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5
        }
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logDashboardAccess(dashboardLog);

      expect(logger.warn).toHaveBeenCalledWith('Slow dashboard load', expect.objectContaining({
        childId: testChildId,
        responseTime: 3000,
        dataPoints: dashboardLog.dataPoints,
        timestamp: expect.any(String)
      }));
    });

    it('should handle failed dashboard access', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        success: false,
        responseTime: 100,
        dataPoints: {
          studyPlansCount: 0,
          progressRecordsCount: 0,
          streaksCount: 0,
          badgesCount: 0
        },
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Connection timeout'
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logDashboardAccess(dashboardLog);

      expect(logger.info).toHaveBeenCalledWith('Dashboard access', expect.objectContaining({
        success: false,
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Connection timeout'
      }));
    });

    it('should handle database storage errors gracefully', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        success: true,
        responseTime: 250,
        dataPoints: {
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5
        }
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await service.logDashboardAccess(dashboardLog);

      expect(logger.info).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Failed to store dashboard access log in database', expect.objectContaining({
        error: 'Database error'
      }));
    });
  });

  describe('logPerformanceMetrics', () => {
    it('should log normal performance metrics', () => {
      const metrics: PerformanceMetrics = {
        operation: 'get_child_progress',
        duration: 150,
        queryCount: 3,
        cacheHits: 2,
        cacheMisses: 1,
        memoryUsage: 50,
        cpuUsage: 25
      };

      service.logPerformanceMetrics(metrics);

      expect(logger.info).toHaveBeenCalledWith('Performance metrics', expect.objectContaining({
        component: 'child-study-plan',
        operation: 'get_child_progress',
        duration: 150,
        queryCount: 3,
        cacheHits: 2,
        cacheMisses: 1,
        memoryUsage: 50,
        cpuUsage: 25,
        timestamp: expect.any(String)
      }));
    });

    it('should log slow operations as warnings', () => {
      const metrics: PerformanceMetrics = {
        operation: 'complex_analytics_query',
        duration: 1500, // Slow operation
        queryCount: 10,
        cacheHits: 0,
        cacheMisses: 10
      };

      service.logPerformanceMetrics(metrics);

      expect(logger.warn).toHaveBeenCalledWith('Slow operation detected', expect.objectContaining({
        operation: 'complex_analytics_query',
        duration: 1500,
        queryCount: 10,
        timestamp: expect.any(String)
      }));
    });

    it('should store metrics in memory for aggregation', () => {
      const metrics: PerformanceMetrics = {
        operation: 'test_operation',
        duration: 100,
        queryCount: 1,
        cacheHits: 1,
        cacheMisses: 0
      };

      service.logPerformanceMetrics(metrics);
      service.logPerformanceMetrics(metrics);

      const summary = service.getPerformanceSummary();
      expect(summary.test_operation).toEqual({
        count: 2,
        avgDuration: 100,
        minDuration: 100,
        maxDuration: 100,
        totalQueries: 2,
        cacheHitRate: 100,
        lastUpdated: expect.any(String)
      });
    });

    it('should limit stored metrics to 100 per operation', () => {
      const metrics: PerformanceMetrics = {
        operation: 'frequent_operation',
        duration: 50,
        queryCount: 1,
        cacheHits: 1,
        cacheMisses: 0
      };

      // Add 150 metrics
      for (let i = 0; i < 150; i++) {
        service.logPerformanceMetrics(metrics);
      }

      const summary = service.getPerformanceSummary();
      expect(summary.frequent_operation.count).toBe(100);
    });

    it('should handle logging errors gracefully', () => {
      const metrics: PerformanceMetrics = {
        operation: 'test_operation',
        duration: 100,
        queryCount: 1,
        cacheHits: 1,
        cacheMisses: 0
      };

      (logger.info as jest.Mock).mockImplementation(() => {
        throw new Error('Logger error');
      });

      service.logPerformanceMetrics(metrics);

      expect(logger.error).toHaveBeenCalledWith('Failed to log performance metrics', expect.objectContaining({
        error: expect.any(Error),
        metrics
      }));
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return empty summary when no metrics exist', () => {
      const summary = service.getPerformanceSummary();
      expect(summary).toEqual({});
    });

    it('should calculate correct performance statistics', () => {
      const metrics1: PerformanceMetrics = {
        operation: 'test_op',
        duration: 100,
        queryCount: 2,
        cacheHits: 1,
        cacheMisses: 1
      };

      const metrics2: PerformanceMetrics = {
        operation: 'test_op',
        duration: 200,
        queryCount: 3,
        cacheHits: 2,
        cacheMisses: 1
      };

      service.logPerformanceMetrics(metrics1);
      service.logPerformanceMetrics(metrics2);

      const summary = service.getPerformanceSummary();
      expect(summary.test_op).toEqual({
        count: 2,
        avgDuration: 150,
        minDuration: 100,
        maxDuration: 200,
        totalQueries: 5,
        cacheHitRate: 75, // 3 hits out of 4 total
        lastUpdated: expect.any(String)
      });
    });

    it('should handle division by zero in cache hit rate calculation', () => {
      const metrics: PerformanceMetrics = {
        operation: 'no_cache_op',
        duration: 100,
        queryCount: 1,
        cacheHits: 0,
        cacheMisses: 0
      };

      service.logPerformanceMetrics(metrics);

      const summary = service.getPerformanceSummary();
      expect(summary.no_cache_op.cacheHitRate).toBeNaN();
    });
  });

  describe('getErrorSummary', () => {
    it('should return empty summary when no errors exist', () => {
      const summary = service.getErrorSummary();
      expect(summary).toEqual({});
    });

    it('should track error counts correctly', async () => {
      const accessLog1: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'GET_SPECIFIC',
        success: false,
        responseTime: 100,
        errorCode: 'NOT_FOUND'
      };

      const accessLog2: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'LIST_ALL',
        success: false,
        responseTime: 100,
        errorCode: 'ACCESS_DENIED'
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logStudyPlanAccess(accessLog1);
      await service.logStudyPlanAccess(accessLog1);
      await service.logStudyPlanAccess(accessLog2);

      const summary = service.getErrorSummary();
      expect(summary['GET_SPECIFIC_NOT_FOUND']).toEqual({
        count: 2,
        lastOccurrence: expect.any(String)
      });
      expect(summary['LIST_ALL_ACCESS_DENIED']).toEqual({
        count: 1,
        lastOccurrence: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle all logging methods gracefully when database is unavailable', async () => {
      // Mock all database operations to fail
      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (mockPrisma.progressUpdateLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'LIST_ALL',
        success: true,
        responseTime: 100
      };

      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300
      };

      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        success: true,
        responseTime: 250,
        dataPoints: {
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5
        }
      };

      // All methods should complete without throwing
      await expect(service.logStudyPlanAccess(accessLog)).resolves.toBeUndefined();
      await expect(service.logProgressUpdate(progressLog)).resolves.toBeUndefined();
      await expect(service.logDashboardAccess(dashboardLog)).resolves.toBeUndefined();

      // Should log errors but not throw
      expect(logger.error).toHaveBeenCalledTimes(3);
    });

    it('should handle null and undefined values gracefully', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        accessType: 'GET_SPECIFIC',
        success: true,
        responseTime: 100,
        planId: undefined,
        userAgent: null as any,
        ipAddress: undefined,
        sessionId: null as any
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await service.logStudyPlanAccess(accessLog);

      expect(mockPrisma.studyPlanAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          planId: undefined,
          userAgent: null,
          ipAddress: undefined,
          sessionId: null
        })
      });
    });
  });

  describe('Data Serialization', () => {
    it('should properly serialize validation errors', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300,
        validationErrors: ['Error 1', 'Error 2']
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validationErrors: JSON.stringify(['Error 1', 'Error 2'])
        })
      });
    });

    it('should handle null validation errors and session data', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        updateType: 'PROGRESS',
        success: true,
        responseTime: 100,
        timeSpent: 300
        // No validationErrors or sessionData
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await service.logProgressUpdate(progressLog);

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validationErrors: null,
          sessionData: null
        })
      });
    });
  });
});