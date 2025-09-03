import { userAcceptanceTestingService } from '../userAcceptanceTestingService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};

describe('UserAcceptanceTestingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeFeedback', () => {
    it('should store user feedback successfully', async () => {
      const mockFeedback = {
        userId: 'user123',
        userType: 'parent' as const,
        childAge: 8,
        testingSession: 'session123',
        timestamp: new Date(),
        category: 'usability' as const,
        rating: 4,
        feedback: 'Great interface',
        deviceInfo: { platform: 'desktop' },
        sessionDuration: 300,
        completedTasks: ['task1', 'task2'],
        struggledTasks: ['task3'],
        suggestions: ['improve loading'],
      };

      mockPrisma.$executeRaw.mockResolvedValue('feedback_stored');

      const result = await userAcceptanceTestingService.storeFeedback(mockFeedback);

      expect(result).toBe('feedback_stored');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_testing_feedback')
      );
    });
  });

  describe('calculateUsabilityMetrics', () => {
    it('should calculate overall usability metrics', async () => {
      const mockMetricsData = [{
        task_completion_rate: 0.85,
        average_task_time: 120.5,
        error_rate: 0.15,
        satisfaction_score: 4.2,
        total_users: 50,
      }];

      mockPrisma.$queryRaw.mockResolvedValue(mockMetricsData);

      const metrics = await userAcceptanceTestingService.calculateUsabilityMetrics();

      expect(metrics).toEqual({
        taskCompletionRate: 0.85,
        averageTaskTime: 120.5,
        errorRate: 0.15,
        satisfactionScore: 4.2,
        engagementScore: expect.any(Number),
        retentionRate: expect.any(Number),
      });
    });
  });
});