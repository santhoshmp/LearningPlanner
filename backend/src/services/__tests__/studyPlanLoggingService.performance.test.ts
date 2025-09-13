import { PrismaClient } from '@prisma/client';
import { studyPlanLoggingService } from '../studyPlanLoggingService';

// Mock Prisma for performance testing
const mockPrisma = {
  studyPlanAccessLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([])
  },
  progressUpdateLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([])
  },
  dashboardAccessLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([])
  },
  databasePerformanceLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([])
  }
} as unknown as PrismaClient;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  auditLogger: { info: jest.fn() },
  securityLogger: { warn: jest.fn() },
  logAuditEvent: jest.fn(),
  logSecurityEvent: jest.fn()
}));

describe('StudyPlanLoggingService Performance Tests', () => {
  const testChildId = 'perf-test-child';
  const testActivityId = 'perf-test-activity';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logging Performance', () => {
    it('should log study plan access within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true,
        responseTime: 150
      });
      
      const executionTime = Date.now() - startTime;
      
      // Logging should complete within 100ms
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle concurrent logging operations efficiently', async () => {
      const concurrentOperations = 50;
      const startTime = Date.now();
      
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        studyPlanLoggingService.logProgressUpdate({
          childId: `${testChildId}-${i}`,
          activityId: `${testActivityId}-${i}`,
          action: 'PROGRESS_UPDATE',
          success: true,
          timeSpent: 100 + i
        })
      );
      
      await Promise.all(operations);
      
      const totalExecutionTime = Date.now() - startTime;
      const averageTimePerOperation = totalExecutionTime / concurrentOperations;
      
      // Average time per operation should be reasonable
      expect(averageTimePerOperation).toBeLessThan(50); // 50ms per operation
      expect(totalExecutionTime).toBeLessThan(2000); // Total under 2 seconds
    });

    it('should maintain performance with large metadata objects', async () => {
      const largeMetadata = {
        sessionData: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date().toISOString(),
          action: `action-${i}`,
          data: `data-${i}`.repeat(10)
        })),
        userInteractions: Array.from({ length: 500 }, (_, i) => ({
          type: 'click',
          element: `element-${i}`,
          coordinates: { x: i * 10, y: i * 5 }
        }))
      };

      const startTime = Date.now();
      
      await studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true,
        metadata: largeMetadata
      });
      
      const executionTime = Date.now() - startTime;
      
      // Should handle large metadata within reasonable time
      expect(executionTime).toBeLessThan(200);
    });

    it('should not significantly impact database operation monitoring', async () => {
      const mockDbOperation = jest.fn().mockImplementation(async () => {
        // Simulate a 100ms database operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'success' };
      });

      const startTime = Date.now();
      
      const result = await studyPlanLoggingService.monitorDatabaseOperation(
        'test_operation',
        'test_table',
        'SELECT',
        mockDbOperation,
        { childId: testChildId }
      );
      
      const totalTime = Date.now() - startTime;
      
      expect(result).toEqual({ result: 'success' });
      expect(mockDbOperation).toHaveBeenCalled();
      
      // Monitoring overhead should be minimal (< 20ms)
      expect(totalTime).toBeLessThan(130); // 100ms operation + 30ms overhead max
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated logging', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many logging operations
      for (let i = 0; i < 1000; i++) {
        await studyPlanLoggingService.logProgressUpdate({
          childId: `${testChildId}-${i}`,
          activityId: `${testActivityId}-${i}`,
          action: 'PROGRESS_UPDATE',
          success: true,
          timeSpent: 100
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large batch operations without excessive memory usage', async () => {
      const batchSize = 100;
      const initialMemory = process.memoryUsage().heapUsed;
      
      const batchOperations = Array.from({ length: batchSize }, (_, i) =>
        studyPlanLoggingService.logDashboardAccess({
          childId: `${testChildId}-${i}`,
          action: 'DASHBOARD_ACCESS',
          success: true,
          dataReturned: {
            studyPlansCount: i,
            progressRecordsCount: i * 2,
            streaksCount: i % 5,
            badgesCount: i % 3
          },
          responseTime: 200 + i
        })
      );
      
      await Promise.all(batchOperations);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be proportional to batch size
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // < 5MB for 100 operations
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle database errors quickly without blocking', async () => {
      // Mock database to throw errors
      (mockPrisma.studyPlanAccessLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const startTime = Date.now();
      
      // Should not throw and should complete quickly
      await studyPlanLoggingService.logStudyPlanAccess({
        childId: testChildId,
        action: 'ACCESS_PLAN',
        success: true
      });
      
      const executionTime = Date.now() - startTime;
      
      // Error handling should be fast
      expect(executionTime).toBeLessThan(50);
    });

    it('should handle multiple concurrent errors efficiently', async () => {
      (mockPrisma.progressUpdateLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const concurrentErrorOperations = 20;
      const startTime = Date.now();
      
      const operations = Array.from({ length: concurrentErrorOperations }, (_, i) =>
        studyPlanLoggingService.logProgressUpdate({
          childId: `${testChildId}-${i}`,
          activityId: `${testActivityId}-${i}`,
          action: 'PROGRESS_UPDATE',
          success: true
        })
      );
      
      await Promise.all(operations);
      
      const totalTime = Date.now() - startTime;
      
      // Should handle all errors quickly
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Analytics Performance', () => {
    it('should retrieve analytics within acceptable time limits', async () => {
      // Mock analytics data
      (mockPrisma.studyPlanAccessLog.groupBy as jest.Mock).mockResolvedValue([
        { action: 'ACCESS_PLAN', success: true, _count: 100 }
      ]);
      (mockPrisma.progressUpdateLog.groupBy as jest.Mock).mockResolvedValue([
        { action: 'PROGRESS_UPDATE', success: true, _count: 200 }
      ]);
      (mockPrisma.dashboardAccessLog.groupBy as jest.Mock).mockResolvedValue([
        { action: 'DASHBOARD_ACCESS', success: true, _count: 50, _avg: { responseTime: 250 } }
      ]);
      (mockPrisma.databasePerformanceLog.groupBy as jest.Mock).mockResolvedValue([
        { operation: 'get_data', queryComplexity: 'LOW', _count: 300, _avg: { executionTime: 150 } }
      ]);

      const startTime = Date.now();
      
      const analytics = await studyPlanLoggingService.getLoggingAnalytics({
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });
      
      const executionTime = Date.now() - startTime;
      
      expect(analytics).toBeDefined();
      expect(analytics.accessStats).toBeDefined();
      expect(analytics.progressStats).toBeDefined();
      expect(analytics.dashboardStats).toBeDefined();
      expect(analytics.performanceStats).toBeDefined();
      
      // Analytics retrieval should be fast
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing load', async () => {
      const loadLevels = [10, 50, 100, 200];
      const performanceResults: number[] = [];
      
      for (const load of loadLevels) {
        const startTime = Date.now();
        
        const operations = Array.from({ length: load }, (_, i) =>
          studyPlanLoggingService.logStudyPlanAccess({
            childId: `${testChildId}-${i}`,
            action: 'ACCESS_PLAN',
            success: true,
            responseTime: 100 + i
          })
        );
        
        await Promise.all(operations);
        
        const executionTime = Date.now() - startTime;
        const avgTimePerOperation = executionTime / load;
        
        performanceResults.push(avgTimePerOperation);
      }
      
      // Performance should not degrade significantly with increased load
      // Allow for some variance but ensure it doesn't grow exponentially
      for (let i = 1; i < performanceResults.length; i++) {
        const degradation = performanceResults[i] / performanceResults[0];
        expect(degradation).toBeLessThan(3); // No more than 3x degradation
      }
    });

    it('should handle burst traffic efficiently', async () => {
      const burstSize = 500;
      const burstDuration = 1000; // 1 second
      
      const startTime = Date.now();
      
      // Create a burst of operations
      const burstOperations = Array.from({ length: burstSize }, (_, i) => {
        const operationType = i % 4;
        
        switch (operationType) {
          case 0:
            return studyPlanLoggingService.logStudyPlanAccess({
              childId: `${testChildId}-${i}`,
              action: 'ACCESS_PLAN',
              success: true
            });
          case 1:
            return studyPlanLoggingService.logProgressUpdate({
              childId: `${testChildId}-${i}`,
              activityId: `${testActivityId}-${i}`,
              action: 'PROGRESS_UPDATE',
              success: true
            });
          case 2:
            return studyPlanLoggingService.logDashboardAccess({
              childId: `${testChildId}-${i}`,
              action: 'DASHBOARD_ACCESS',
              success: true
            });
          default:
            return studyPlanLoggingService.logDatabasePerformance({
              operation: `operation-${i}`,
              table: 'test_table',
              queryType: 'SELECT',
              executionTime: 100 + i % 100
            });
        }
      });
      
      await Promise.all(burstOperations);
      
      const totalTime = Date.now() - startTime;
      
      // Should handle burst within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 500 operations
      
      const avgTimePerOperation = totalTime / burstSize;
      expect(avgTimePerOperation).toBeLessThan(20); // 20ms average per operation
    });
  });
});