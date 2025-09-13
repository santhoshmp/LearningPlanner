import { PrismaClient } from '@prisma/client';
import { studyPlanLoggingService } from '../../services/studyPlanLoggingService';

describe('StudyPlanLogging Integration Tests', () => {
  let prisma: PrismaClient;
  const testChildId = 'test-child-integration';
  const testPlanId = 'test-plan-integration';
  const testActivityId = 'test-activity-integration';

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.studyPlanAccessLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.progressUpdateLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.dashboardAccessLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.databasePerformanceLog.deleteMany({
      where: { childId: testChildId }
    });
    
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.studyPlanAccessLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.progressUpdateLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.dashboardAccessLog.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.databasePerformanceLog.deleteMany({
      where: { childId: testChildId }
    });
  });

  describe('Database Storage Integration', () => {
    it('should store study plan access logs in database', async () => {
      await studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        planId: testPlanId,
        action: 'ACCESS_PLAN',
        success: true,
        responseTime: 150,
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.100',
        sessionId: 'test-session-123',
        metadata: { testData: 'integration test' }
      });

      const storedLog = await prisma.studyPlanAccessLog.findFirst({
        where: { childId: testChildId }
      });

      expect(storedLog).toBeTruthy();
      expect(storedLog?.planId).toBe(testPlanId);
      expect(storedLog?.action).toBe('ACCESS_PLAN');
      expect(storedLog?.success).toBe(true);
      expect(storedLog?.responseTime).toBe(150);
      expect(storedLog?.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(storedLog?.ipAddress).toBe('192.168.1.100');
      expect(storedLog?.sessionId).toBe('test-session-123');
      expect(storedLog?.metadata).toBe('{"testData":"integration test"}');
      expect(storedLog?.timestamp).toBeInstanceOf(Date);
    });

    it('should store progress update logs in database', async () => {
      await studyPlanLoggingService.logProgressUpdate({
        childId: testChildId,
        activityId: testActivityId,
        planId: testPlanId,
        action: 'ACTIVITY_COMPLETION',
        success: true,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        scoreChange: 85,
        timeSpent: 600,
        validationErrors: ['Minor timing issue'],
        consistencyIssues: ['Score adjustment applied'],
        responseTime: 200,
        sessionData: { interactions: ['click', 'scroll'], helpRequests: 0 }
      });

      const storedLog = await prisma.progressUpdateLog.findFirst({
        where: { childId: testChildId }
      });

      expect(storedLog).toBeTruthy();
      expect(storedLog?.activityId).toBe(testActivityId);
      expect(storedLog?.planId).toBe(testPlanId);
      expect(storedLog?.action).toBe('ACTIVITY_COMPLETION');
      expect(storedLog?.success).toBe(true);
      expect(storedLog?.previousStatus).toBe('IN_PROGRESS');
      expect(storedLog?.newStatus).toBe('COMPLETED');
      expect(storedLog?.scoreChange).toBe(85);
      expect(storedLog?.timeSpent).toBe(600);
      expect(storedLog?.validationErrors).toBe('["Minor timing issue"]');
      expect(storedLog?.consistencyIssues).toBe('["Score adjustment applied"]');
      expect(storedLog?.responseTime).toBe(200);
      expect(storedLog?.sessionData).toBe('{"interactions":["click","scroll"],"helpRequests":0}');
    });

    it('should store dashboard access logs in database', async () => {
      await studyPlanLoggingService.logDashboardAccess({
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
      });

      const storedLog = await prisma.dashboardAccessLog.findFirst({
        where: { childId: testChildId }
      });

      expect(storedLog).toBeTruthy();
      expect(storedLog?.action).toBe('DASHBOARD_ACCESS');
      expect(storedLog?.success).toBe(true);
      expect(storedLog?.studyPlansCount).toBe(3);
      expect(storedLog?.progressRecordsCount).toBe(15);
      expect(storedLog?.streaksCount).toBe(2);
      expect(storedLog?.badgesCount).toBe(5);
      expect(storedLog?.responseTime).toBe(250);
      expect(storedLog?.cacheHit).toBe(true);
    });

    it('should store database performance logs in database', async () => {
      await studyPlanLoggingService.logDatabasePerformance({
        operation: 'get_child_dashboard_data',
        table: 'progress_records',
        queryType: 'SELECT',
        executionTime: 350,
        recordsAffected: 25,
        indexesUsed: ['idx_child_id', 'idx_activity_id'],
        queryComplexity: 'MEDIUM',
        childId: testChildId,
        planId: testPlanId,
        activityId: testActivityId
      });

      const storedLog = await prisma.databasePerformanceLog.findFirst({
        where: { childId: testChildId }
      });

      expect(storedLog).toBeTruthy();
      expect(storedLog?.operation).toBe('get_child_dashboard_data');
      expect(storedLog?.tableName).toBe('progress_records');
      expect(storedLog?.queryType).toBe('SELECT');
      expect(storedLog?.executionTime).toBe(350);
      expect(storedLog?.recordsAffected).toBe(25);
      expect(storedLog?.indexesUsed).toBe('["idx_child_id","idx_activity_id"]');
      expect(storedLog?.queryComplexity).toBe('MEDIUM');
      expect(storedLog?.childId).toBe(testChildId);
      expect(storedLog?.planId).toBe(testPlanId);
      expect(storedLog?.activityId).toBe(testActivityId);
    });
  });

  describe('Database Operation Monitoring', () => {
    it('should monitor actual database operation and log performance', async () => {
      const mockDbOperation = async () => {
        // Simulate a database query with some delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 'test-result', data: 'success' };
      };

      const result = await studyPlanLoggingService.monitorDatabaseOperation(
        'integration_test_query',
        'test_table',
        'SELECT',
        mockDbOperation,
        { childId: testChildId }
      );

      expect(result).toEqual({ id: 'test-result', data: 'success' });

      // Check that performance was logged
      const performanceLog = await prisma.databasePerformanceLog.findFirst({
        where: { 
          operation: 'integration_test_query',
          childId: testChildId
        }
      });

      expect(performanceLog).toBeTruthy();
      expect(performanceLog?.executionTime).toBeGreaterThanOrEqual(90);
      expect(performanceLog?.executionTime).toBeLessThan(200);
      expect(performanceLog?.queryComplexity).toBe('LOW'); // Should be LOW for < 500ms
    });

    it('should handle database operation failures and still log performance', async () => {
      const mockDbOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Simulated database error');
      };

      await expect(
        studyPlanLoggingService.monitorDatabaseOperation(
          'failing_integration_test',
          'test_table',
          'SELECT',
          mockDbOperation,
          { childId: testChildId }
        )
      ).rejects.toThrow('Simulated database error');

      // Performance should still be logged even for failed operations
      const performanceLog = await prisma.databasePerformanceLog.findFirst({
        where: { 
          operation: 'failing_integration_test',
          childId: testChildId
        }
      });

      expect(performanceLog).toBeTruthy();
      expect(performanceLog?.executionTime).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Analytics Retrieval', () => {
    beforeEach(async () => {
      // Create test data for analytics
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create access logs
      await prisma.studyPlanAccessLog.createMany({
        data: [
          {
            childId: testChildId,
            action: 'ACCESS_PLAN',
            success: true,
            responseTime: 150,
            timestamp: now
          },
          {
            childId: testChildId,
            action: 'ACCESS_PLAN',
            success: false,
            errorCode: 'ACCESS_DENIED',
            timestamp: yesterday
          }
        ]
      });

      // Create progress logs
      await prisma.progressUpdateLog.createMany({
        data: [
          {
            childId: testChildId,
            activityId: testActivityId,
            action: 'PROGRESS_UPDATE',
            success: true,
            responseTime: 100,
            timestamp: now
          },
          {
            childId: testChildId,
            activityId: testActivityId,
            action: 'ACTIVITY_COMPLETION',
            success: true,
            responseTime: 200,
            timestamp: now
          }
        ]
      });

      // Create dashboard logs
      await prisma.dashboardAccessLog.createMany({
        data: [
          {
            childId: testChildId,
            action: 'DASHBOARD_ACCESS',
            success: true,
            responseTime: 250,
            timestamp: now
          }
        ]
      });

      // Create performance logs
      await prisma.databasePerformanceLog.createMany({
        data: [
          {
            operation: 'get_progress',
            tableName: 'progress_records',
            queryType: 'SELECT',
            executionTime: 150,
            queryComplexity: 'LOW',
            timestamp: now
          },
          {
            operation: 'update_progress',
            tableName: 'progress_records',
            queryType: 'UPDATE',
            executionTime: 800,
            queryComplexity: 'MEDIUM',
            timestamp: now
          }
        ]
      });
    });

    it('should retrieve comprehensive logging analytics', async () => {
      const timeFrame = {
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        end: new Date() // now
      };

      const analytics = await studyPlanLoggingService.getLoggingAnalytics(timeFrame);

      expect(analytics).toHaveProperty('accessStats');
      expect(analytics).toHaveProperty('progressStats');
      expect(analytics).toHaveProperty('dashboardStats');
      expect(analytics).toHaveProperty('performanceStats');
      expect(analytics.timeFrame).toEqual(timeFrame);

      // Verify access stats
      expect(analytics.accessStats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'ACCESS_PLAN',
            success: true,
            _count: expect.any(Number)
          })
        ])
      );

      // Verify progress stats
      expect(analytics.progressStats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'PROGRESS_UPDATE',
            success: true,
            _count: expect.any(Number)
          })
        ])
      );

      // Verify dashboard stats include average response time
      expect(analytics.dashboardStats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'DASHBOARD_ACCESS',
            success: true,
            _count: expect.any(Number),
            _avg: expect.objectContaining({
              responseTime: expect.any(Number)
            })
          })
        ])
      );

      // Verify performance stats include execution time metrics
      expect(analytics.performanceStats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            operation: expect.any(String),
            queryComplexity: expect.any(String),
            _count: expect.any(Number),
            _avg: expect.objectContaining({
              executionTime: expect.any(Number)
            }),
            _max: expect.objectContaining({
              executionTime: expect.any(Number)
            })
          })
        ])
      );
    });

    it('should filter analytics by time frame correctly', async () => {
      const recentTimeFrame = {
        start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        end: new Date() // now
      };

      const analytics = await studyPlanLoggingService.getLoggingAnalytics(recentTimeFrame);

      // Should only include recent logs, not the yesterday log
      const accessStats = analytics.accessStats;
      const successfulAccess = accessStats.find(stat => stat.success === true);
      const failedAccess = accessStats.find(stat => stat.success === false);

      expect(successfulAccess?._count).toBeGreaterThan(0);
      expect(failedAccess).toBeUndefined(); // Yesterday's failed access should be filtered out
    });
  });

  describe('Error Resilience', () => {
    it('should continue logging even when some database operations fail', async () => {
      // This test verifies that the service is resilient to partial database failures
      
      // First, create a successful log
      await studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true
      });

      // Verify it was stored
      const successfulLog = await prisma.studyPlanAccessLog.findFirst({
        where: { childId: testChildId }
      });
      expect(successfulLog).toBeTruthy();

      // Now test with invalid data that might cause constraint violations
      // The service should handle this gracefully without throwing
      await expect(
        studyPlanLoggingService.logStudyPlanAccess({
          childId: testChildId,
          action: 'ACCESS_PLAN',
          success: true,
          metadata: { invalidData: 'x'.repeat(10000) } // Very large metadata
        })
      ).resolves.toBeUndefined(); // Should not throw

      // Original log should still be there
      const logs = await prisma.studyPlanAccessLog.findMany({
        where: { childId: testChildId }
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across multiple concurrent logging operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        studyPlanLoggingService.logProgressUpdate({
          childId: testChildId,
          activityId: `${testActivityId}-${i}`,
          action: 'PROGRESS_UPDATE',
          success: true,
          timeSpent: 100 + i * 10,
          responseTime: 50 + i * 5
        })
      );

      await Promise.all(concurrentOperations);

      const logs = await prisma.progressUpdateLog.findMany({
        where: { childId: testChildId },
        orderBy: { timestamp: 'asc' }
      });

      expect(logs).toHaveLength(10);
      
      // Verify each log has correct data
      logs.forEach((log, index) => {
        expect(log.activityId).toBe(`${testActivityId}-${index}`);
        expect(log.timeSpent).toBe(100 + index * 10);
        expect(log.responseTime).toBe(50 + index * 5);
        expect(log.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});