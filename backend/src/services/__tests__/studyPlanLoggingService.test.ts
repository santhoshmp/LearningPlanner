import { PrismaClient } from '@prisma/client';
import { studyPlanLoggingService, StudyPlanAccessLog, ProgressUpdateLog, DashboardAccessLog, DatabasePerformanceLog } from '../studyPlanLoggingService';
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
  },
  logAuditEvent: jest.fn(),
  logSecurityEvent: jest.fn()
}));

// Mock Prisma Client
const mockPrisma = {
  studyPlanAccessLog: {
    create: jest.fn(),
    groupBy: jest.fn()
  },
  progressUpdateLog: {
    create: jest.fn(),
    groupBy: jest.fn()
  },
  dashboardAccessLog: {
    create: jest.fn(),
    groupBy: jest.fn()
  },
  databasePerformanceLog: {
    create: jest.fn(),
    groupBy: jest.fn()
  }
} as unknown as PrismaClient;

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

describe('StudyPlanLoggingService', () => {
  const testChildId = 'test-child-id';
  const testPlanId = 'test-plan-id';
  const testActivityId = 'test-activity-id';
  const testSessionId = 'test-session-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logStudyPlanAccess', () => {
    it('should log successful study plan access', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        planId: testPlanId,
        action: 'ACCESS_PLAN',
        success: true,
        responseTime: 150,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        sessionId: testSessionId
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);

      expect(logger.info).toHaveBeenCalledWith('Study plan access successful', expect.objectContaining({
        service: 'study-plan-access',
        ...accessLog,
        timestamp: expect.any(String)
      }));

      expect(mockPrisma.studyPlanAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          planId: testPlanId,
          action: 'ACCESS_PLAN',
          success: true,
          responseTime: 150,
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          sessionId: testSessionId
        })
      });
    });

    it('should log failed study plan access with security event', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        planId: testPlanId,
        action: 'ACCESS_PLAN',
        success: false,
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'Child not authorized',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1'
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);

      expect(logger.warn).toHaveBeenCalledWith('Study plan access failed', expect.objectContaining({
        service: 'study-plan-access',
        ...accessLog
      }));

      expect(require('../../utils/logger').logSecurityEvent).toHaveBeenCalledWith(
        'STUDY_PLAN_ACCESS_DENIED',
        expect.objectContaining({
          childId: testChildId,
          planId: testPlanId,
          action: 'ACCESS_PLAN',
          errorCode: 'ACCESS_DENIED'
        })
      );
    });

    it('should handle database storage errors gracefully', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        action: 'ACCESS_PLANS',
        success: true
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);

      expect(logger.info).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Failed to store access log in database', expect.any(Object));
    });

    it('should handle logging service errors gracefully', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        action: 'ACCESS_PLANS',
        success: true
      };

      (logger.info as jest.Mock).mockImplementation(() => {
        throw new Error('Logger error');
      });

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);

      expect(logger.error).toHaveBeenCalledWith('Failed to log study plan access', expect.any(Object));
    });
  });

  describe('logProgressUpdate', () => {
    it('should log successful progress update', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        action: 'PROGRESS_UPDATE',
        success: true,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'IN_PROGRESS',
        scoreChange: 5,
        timeSpent: 300,
        responseTime: 120
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logProgressUpdate(progressLog);

      expect(logger.info).toHaveBeenCalledWith('Progress update successful', expect.objectContaining({
        service: 'progress-update',
        ...progressLog
      }));

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          activityId: testActivityId,
          planId: testPlanId,
          action: 'PROGRESS_UPDATE',
          success: true,
          scoreChange: 5,
          timeSpent: 300
        })
      });
    });

    it('should log progress update with validation issues as warning', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        action: 'PROGRESS_UPDATE',
        success: true,
        validationErrors: ['Score too high'],
        consistencyIssues: ['Time inconsistency']
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logProgressUpdate(progressLog);

      expect(logger.warn).toHaveBeenCalledWith('Progress update succeeded with issues', expect.objectContaining({
        validationErrors: ['Score too high'],
        consistencyIssues: ['Time inconsistency']
      }));
    });

    it('should log audit event for activity completion', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        action: 'ACTIVITY_COMPLETION',
        success: true,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        scoreChange: 85,
        timeSpent: 600
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logProgressUpdate(progressLog);

      expect(require('../../utils/logger').logAuditEvent).toHaveBeenCalledWith(
        'ACTIVITY_COMPLETED',
        testChildId,
        `activity:${testActivityId}`,
        expect.objectContaining({
          planId: testPlanId,
          scoreChange: 85,
          timeSpent: 600,
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED'
        }),
        true
      );
    });

    it('should log failed progress update as error', async () => {
      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        action: 'PROGRESS_UPDATE',
        success: false
      };

      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logProgressUpdate(progressLog);

      expect(logger.error).toHaveBeenCalledWith('Progress update failed', expect.objectContaining({
        success: false
      }));
    });
  });

  describe('logDashboardAccess', () => {
    it('should log successful dashboard access', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        action: 'DASHBOARD_ACCESS',
        success: true,
        dataReturned: {
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5
        },
        responseTime: 250,
        cacheHit: true
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDashboardAccess(dashboardLog);

      expect(logger.info).toHaveBeenCalledWith('Dashboard access successful', expect.objectContaining({
        service: 'dashboard-access',
        ...dashboardLog
      }));

      expect(mockPrisma.dashboardAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: testChildId,
          action: 'DASHBOARD_ACCESS',
          success: true,
          studyPlansCount: 3,
          progressRecordsCount: 15,
          streaksCount: 2,
          badgesCount: 5,
          responseTime: 250,
          cacheHit: true
        })
      });
    });

    it('should log slow dashboard response as warning', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        action: 'DASHBOARD_ACCESS',
        success: true,
        responseTime: 3000 // Slow response
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDashboardAccess(dashboardLog);

      expect(logger.warn).toHaveBeenCalledWith('Slow dashboard response', expect.objectContaining({
        responseTime: 3000
      }));
    });

    it('should log failed dashboard access as error', async () => {
      const dashboardLog: DashboardAccessLog = {
        childId: testChildId,
        action: 'DASHBOARD_ACCESS',
        success: false,
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Connection timeout'
      };

      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDashboardAccess(dashboardLog);

      expect(logger.error).toHaveBeenCalledWith('Dashboard access failed', expect.objectContaining({
        success: false,
        errorCode: 'DATABASE_ERROR'
      }));
    });
  });

  describe('logDatabasePerformance', () => {
    it('should log normal database performance', async () => {
      const performanceLog: DatabasePerformanceLog = {
        operation: 'get_child_progress',
        table: 'progress_records',
        queryType: 'SELECT',
        executionTime: 150,
        recordsAffected: 10,
        queryComplexity: 'LOW',
        childId: testChildId
      };

      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDatabasePerformance(performanceLog);

      expect(mockPrisma.databasePerformanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          operation: 'get_child_progress',
          tableName: 'progress_records',
          queryType: 'SELECT',
          executionTime: 150,
          recordsAffected: 10,
          queryComplexity: 'LOW',
          childId: testChildId
        })
      });
    });

    it('should log slow queries as warning', async () => {
      const performanceLog: DatabasePerformanceLog = {
        operation: 'complex_analytics_query',
        table: 'progress_records',
        queryType: 'SELECT',
        executionTime: 1500, // Slow query
        queryComplexity: 'HIGH'
      };

      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDatabasePerformance(performanceLog);

      expect(logger.warn).toHaveBeenCalledWith('Slow database query detected', expect.objectContaining({
        executionTime: 1500,
        queryComplexity: 'HIGH'
      }));
    });

    it('should log medium performance queries as info', async () => {
      const performanceLog: DatabasePerformanceLog = {
        operation: 'get_dashboard_data',
        table: 'study_plans',
        queryType: 'SELECT',
        executionTime: 750, // Medium performance
        queryComplexity: 'MEDIUM'
      };

      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logDatabasePerformance(performanceLog);

      expect(logger.info).toHaveBeenCalledWith('Database query performance', expect.objectContaining({
        executionTime: 750
      }));
    });
  });

  describe('monitorDatabaseOperation', () => {
    it('should monitor successful database operation', async () => {
      const mockDbOperation = jest.fn().mockResolvedValue({ id: 'result' });
      
      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      const result = await studyPlanLoggingService.monitorDatabaseOperation(
        'test_operation',
        'test_table',
        'SELECT',
        mockDbOperation,
        { childId: testChildId }
      );

      expect(result).toEqual({ id: 'result' });
      expect(mockDbOperation).toHaveBeenCalled();
      expect(mockPrisma.databasePerformanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          operation: 'test_operation',
          tableName: 'test_table',
          queryType: 'SELECT',
          executionTime: expect.any(Number),
          queryComplexity: expect.any(String),
          childId: testChildId
        })
      });
    });

    it('should monitor failed database operation and log error', async () => {
      const mockError = new Error('Database connection failed');
      const mockDbOperation = jest.fn().mockRejectedValue(mockError);
      
      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      await expect(
        studyPlanLoggingService.monitorDatabaseOperation(
          'test_operation',
          'test_table',
          'SELECT',
          mockDbOperation
        )
      ).rejects.toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith('Database operation failed', expect.objectContaining({
        operation: 'test_operation',
        table: 'test_table',
        queryType: 'SELECT',
        error: 'Database connection failed'
      }));
    });

    it('should determine query complexity based on execution time', async () => {
      const mockDbOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({}), 600))
      );
      
      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.monitorDatabaseOperation(
        'medium_operation',
        'test_table',
        'SELECT',
        mockDbOperation
      );

      expect(mockPrisma.databasePerformanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          queryComplexity: 'MEDIUM' // Should be MEDIUM for 500+ ms
        })
      });
    });
  });

  describe('getLoggingAnalytics', () => {
    it('should retrieve comprehensive logging analytics', async () => {
      const timeFrame = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const mockAccessStats = [
        { action: 'ACCESS_PLAN', success: true, _count: 150 },
        { action: 'ACCESS_PLAN', success: false, _count: 5 }
      ];

      const mockProgressStats = [
        { action: 'PROGRESS_UPDATE', success: true, _count: 300 },
        { action: 'ACTIVITY_COMPLETION', success: true, _count: 45 }
      ];

      const mockDashboardStats = [
        { action: 'DASHBOARD_ACCESS', success: true, _count: 80, _avg: { responseTime: 250 } }
      ];

      const mockPerformanceStats = [
        { operation: 'get_progress', queryComplexity: 'LOW', _count: 200, _avg: { executionTime: 150 }, _max: { executionTime: 300 } }
      ];

      (mockPrisma.studyPlanAccessLog.groupBy as jest.Mock).mockResolvedValue(mockAccessStats);
      (mockPrisma.progressUpdateLog.groupBy as jest.Mock).mockResolvedValue(mockProgressStats);
      (mockPrisma.dashboardAccessLog.groupBy as jest.Mock).mockResolvedValue(mockDashboardStats);
      (mockPrisma.databasePerformanceLog.groupBy as jest.Mock).mockResolvedValue(mockPerformanceStats);

      const analytics = await studyPlanLoggingService.getLoggingAnalytics(timeFrame);

      expect(analytics).toEqual({
        accessStats: mockAccessStats,
        progressStats: mockProgressStats,
        dashboardStats: mockDashboardStats,
        performanceStats: mockPerformanceStats,
        timeFrame
      });

      expect(mockPrisma.studyPlanAccessLog.groupBy).toHaveBeenCalledWith({
        by: ['action', 'success'],
        where: {
          timestamp: {
            gte: timeFrame.start,
            lte: timeFrame.end
          }
        },
        _count: true
      });
    });

    it('should handle analytics retrieval errors', async () => {
      const timeFrame = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      (mockPrisma.studyPlanAccessLog.groupBy as jest.Mock).mockRejectedValue(new Error('Analytics error'));

      await expect(
        studyPlanLoggingService.getLoggingAnalytics(timeFrame)
      ).rejects.toThrow('Analytics error');

      expect(logger.error).toHaveBeenCalledWith('Failed to get logging analytics', expect.objectContaining({
        error: expect.any(Error),
        timeFrame
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle all logging methods gracefully when database is unavailable', async () => {
      // Mock all database operations to fail
      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (mockPrisma.progressUpdateLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (mockPrisma.dashboardAccessLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (mockPrisma.databasePerformanceLog.create as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

      // All methods should complete without throwing
      await expect(studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        action: 'ACCESS_PLANS',
        success: true
      })).resolves.toBeUndefined();

      await expect(studyPlanLoggingService.logProgressUpdate({
        childId: testChildId,
        activityId: testActivityId,
        action: 'PROGRESS_UPDATE',
        success: true
      })).resolves.toBeUndefined();

      await expect(studyPlanLoggingService.logDashboardAccess({
        childId: testChildId,
        action: 'DASHBOARD_ACCESS',
        success: true
      })).resolves.toBeUndefined();

      await expect(studyPlanLoggingService.logDatabasePerformance({
        operation: 'test',
        table: 'test',
        queryType: 'SELECT',
        executionTime: 100
      })).resolves.toBeUndefined();

      // Should log errors but not throw
      expect(logger.error).toHaveBeenCalledTimes(4);
    });
  });

  describe('Data Serialization', () => {
    it('should properly serialize metadata and session data', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true,
        metadata: {
          customField: 'value',
          nested: { data: 'test' }
        }
      };

      const progressLog: ProgressUpdateLog = {
        childId: testChildId,
        activityId: testActivityId,
        action: 'PROGRESS_UPDATE',
        success: true,
        sessionData: {
          interactions: ['click', 'scroll'],
          timing: { start: Date.now() }
        }
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.progressUpdateLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);
      await studyPlanLoggingService.logProgressUpdate(progressLog);

      expect(mockPrisma.studyPlanAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: JSON.stringify(accessLog.metadata)
        })
      });

      expect(mockPrisma.progressUpdateLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionData: JSON.stringify(progressLog.sessionData)
        })
      });
    });

    it('should handle null metadata and session data', async () => {
      const accessLog: StudyPlanAccessLog = {
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true
        // No metadata
      };

      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockResolvedValue({});

      await studyPlanLoggingService.logStudyPlanAccess(accessLog);

      expect(mockPrisma.studyPlanAccessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: null
        })
      });
    });
  });
});