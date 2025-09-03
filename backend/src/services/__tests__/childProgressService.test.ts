import { PrismaClient, ProgressStatus, StreakType } from '@prisma/client';
import { ChildProgressService, ActivityProgressUpdate, ActivitySessionData } from '../childProgressService';
import { logger } from '../../utils/logger';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

// Mock logger
jest.mock('../../utils/logger');

const mockPrisma = {
  childProfile: {
    findUnique: jest.fn(),
  },
  studyActivity: {
    findUnique: jest.fn(),
  },
  progressRecord: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  learningStreak: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
} as any;

// Create service instance with mocked Prisma
const childProgressService = new ChildProgressService(mockPrisma);

describe('ChildProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateActivityProgress', () => {
    const mockChild = {
      id: 'child-1',
      name: 'Test Child',
      isActive: true,
    };

    const mockActivity = {
      id: 'activity-1',
      title: 'Test Activity',
      estimatedDuration: 30,
      plan: {
        id: 'plan-1',
        subject: 'mathematics',
      },
    };

    const mockProgressUpdate: ActivityProgressUpdate = {
      activityId: 'activity-1',
      timeSpent: 300, // 5 minutes
      score: 85,
      status: ProgressStatus.COMPLETED,
      sessionData: {
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: new Date('2023-01-01T10:05:00Z'),
        pausedDuration: 0,
        focusEvents: [],
        difficultyAdjustments: [],
        helpRequests: [],
        interactionEvents: [],
      },
    };

    beforeEach(() => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.studyActivity.findUnique.mockResolvedValue(mockActivity);
    });

    it('should create new progress record for first-time activity', async () => {
      mockPrisma.progressRecord.findUnique.mockResolvedValue(null);
      mockPrisma.progressRecord.upsert.mockResolvedValue({
        id: 'progress-1',
        childId: 'child-1',
        activityId: 'activity-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        timeSpent: 300,
        attempts: 1,
      });

      const result = await childProgressService.updateActivityProgress('child-1', mockProgressUpdate);

      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalledWith({
        where: {
          childId_activityId: {
            childId: 'child-1',
            activityId: 'activity-1',
          },
        },
        update: expect.objectContaining({
          timeSpent: 300,
          score: 85,
          status: ProgressStatus.COMPLETED,
        }),
        create: expect.objectContaining({
          childId: 'child-1',
          activityId: 'activity-1',
          status: ProgressStatus.COMPLETED,
          score: 85,
          timeSpent: 300,
          attempts: 1,
        }),
      });

      expect(result).toBeDefined();
      expect(result.score).toBe(85);
    });

    it('should update existing progress record', async () => {
      const existingProgress = {
        id: 'progress-1',
        childId: 'child-1',
        activityId: 'activity-1',
        timeSpent: 200,
        score: 70,
        attempts: 1,
        pauseCount: 1,
        resumeCount: 1,
        sessionData: { previousData: 'test' },
      };

      mockPrisma.progressRecord.findUnique.mockResolvedValue(existingProgress);
      mockPrisma.progressRecord.upsert.mockResolvedValue({
        ...existingProgress,
        timeSpent: 500, // 200 + 300
        score: 85,
      });

      const result = await childProgressService.updateActivityProgress('child-1', mockProgressUpdate);

      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalledWith({
        where: {
          childId_activityId: {
            childId: 'child-1',
            activityId: 'activity-1',
          },
        },
        update: expect.objectContaining({
          timeSpent: 500, // existing 200 + new 300
          score: 85,
          status: ProgressStatus.COMPLETED,
        }),
        create: expect.any(Object),
      });

      expect(result.timeSpent).toBe(500);
    });

    it('should throw error for non-existent child', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      await expect(
        childProgressService.updateActivityProgress('invalid-child', mockProgressUpdate)
      ).rejects.toThrow('Child not found or inactive: invalid-child');
    });

    it('should throw error for non-existent activity', async () => {
      mockPrisma.studyActivity.findUnique.mockResolvedValue(null);

      await expect(
        childProgressService.updateActivityProgress('child-1', mockProgressUpdate)
      ).rejects.toThrow('Activity not found: activity-1');
    });

    it('should handle session data updates correctly', async () => {
      const existingProgress = {
        id: 'progress-1',
        sessionData: { existingField: 'value' },
        timeSpent: 100,
      };

      mockPrisma.progressRecord.findUnique.mockResolvedValue(existingProgress);
      mockPrisma.progressRecord.upsert.mockResolvedValue(existingProgress);

      const updateWithSessionData: ActivityProgressUpdate = {
        activityId: 'activity-1',
        timeSpent: 200,
        sessionData: {
          startTime: new Date(),
          pausedDuration: 30,
          focusEvents: [{ type: 'focus', timestamp: new Date() }],
          difficultyAdjustments: [],
          helpRequests: [],
          interactionEvents: [],
        },
      };

      await childProgressService.updateActivityProgress('child-1', updateWithSessionData);

      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            sessionData: expect.objectContaining({
              existingField: 'value',
              pausedDuration: 30,
              lastUpdate: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  describe('updateLearningStreaks', () => {
    beforeEach(() => {
      // Mock the private methods by spying on the service
      jest.spyOn(childProgressService as any, 'updateStreakByType').mockResolvedValue(undefined);
      jest.spyOn(childProgressService as any, 'resetStreak').mockResolvedValue(undefined);
    });

    it('should update all relevant streaks for completed activity', async () => {
      await childProgressService.updateLearningStreaks('child-1', 'mathematics', 85);

      expect((childProgressService as any).updateStreakByType).toHaveBeenCalledWith(
        'child-1',
        StreakType.DAILY,
        expect.any(Date)
      );
      expect((childProgressService as any).updateStreakByType).toHaveBeenCalledWith(
        'child-1',
        StreakType.WEEKLY,
        expect.any(Date)
      );
      expect((childProgressService as any).updateStreakByType).toHaveBeenCalledWith(
        'child-1',
        StreakType.ACTIVITY_COMPLETION,
        expect.any(Date)
      );
    });

    it('should update perfect score streak for score of 100', async () => {
      await childProgressService.updateLearningStreaks('child-1', 'mathematics', 100);

      expect((childProgressService as any).updateStreakByType).toHaveBeenCalledWith(
        'child-1',
        StreakType.PERFECT_SCORE,
        expect.any(Date)
      );
    });

    it('should reset perfect score streak for score below 100', async () => {
      await childProgressService.updateLearningStreaks('child-1', 'mathematics', 85);

      expect((childProgressService as any).resetStreak).toHaveBeenCalledWith(
        'child-1',
        StreakType.PERFECT_SCORE
      );
    });
  });

  describe('getProgressHistory', () => {
    const mockProgressRecords = [
      {
        id: 'progress-1',
        childId: 'child-1',
        activityId: 'activity-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        timeSpent: 300,
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        activity: {
          id: 'activity-1',
          plan: { subject: 'mathematics' },
        },
        helpRequests: [],
      },
      {
        id: 'progress-2',
        childId: 'child-1',
        activityId: 'activity-2',
        status: ProgressStatus.IN_PROGRESS,
        score: 0,
        timeSpent: 150,
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        activity: {
          id: 'activity-2',
          plan: { subject: 'science' },
        },
        helpRequests: [],
      },
    ];

    beforeEach(() => {
      mockPrisma.progressRecord.count.mockResolvedValue(2);
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockProgressRecords);
      
      // Mock generateProgressSummary
      jest.spyOn(childProgressService, 'generateProgressSummary').mockResolvedValue({
        totalActivities: 2,
        completedActivities: 1,
        inProgressActivities: 1,
        totalTimeSpent: 450,
        averageScore: 85,
        currentDailyStreak: 1,
        longestDailyStreak: 5,
        lastActivityDate: new Date('2023-01-01T11:00:00Z'),
        weeklyGoalProgress: 10,
        monthlyGoalProgress: 2.5,
        subjectProgress: [],
      });
    });

    it('should return progress history with default filters', async () => {
      const result = await childProgressService.getProgressHistory('child-1');

      expect(result.records).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.summary).toBeDefined();
      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1' },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should apply time frame filter', async () => {
      const timeFrame = {
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-01T23:59:59Z',
      };

      await childProgressService.getProgressHistory('child-1', { timeFrame });

      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          updatedAt: {
            gte: new Date('2023-01-01T00:00:00Z'),
            lte: new Date('2023-01-01T23:59:59Z'),
          },
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should apply status filter', async () => {
      await childProgressService.getProgressHistory('child-1', {
        status: [ProgressStatus.COMPLETED],
      });

      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          status: { in: [ProgressStatus.COMPLETED] },
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should apply score range filter', async () => {
      await childProgressService.getProgressHistory('child-1', {
        minScore: 70,
        maxScore: 90,
      });

      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          score: { gte: 70, lte: 90 },
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should apply pagination', async () => {
      await childProgressService.getProgressHistory('child-1', {
        limit: 10,
        offset: 20,
      });

      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1' },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('validateActivityCompletion', () => {
    const mockActivity = {
      id: 'activity-1',
      estimatedDuration: 30, // 30 minutes
      completionCriteria: {
        minimumScore: 70,
        minimumTimeSpent: 600, // 10 minutes
        requiredInteractions: 10,
        allowedHelpRequests: 2,
      },
    };

    const mockSessionData: ActivitySessionData = {
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T10:15:00Z'),
      pausedDuration: 0,
      focusEvents: [],
      difficultyAdjustments: [],
      helpRequests: [],
      interactionEvents: Array(15).fill({ type: 'click', timestamp: new Date() }),
    };

    beforeEach(() => {
      mockPrisma.studyActivity.findUnique.mockResolvedValue(mockActivity);
    });

    it('should validate successful completion', async () => {
      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        85, // score
        900, // 15 minutes
        mockSessionData
      );

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(85);
      expect(result.adjustedScore).toBeGreaterThan(85); // Should have bonus points
      expect(result.validationErrors).toHaveLength(0);
      expect(result.bonusPoints).toBeGreaterThan(0);
    });

    it('should detect score below minimum', async () => {
      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        60, // Below minimum of 70
        900,
        mockSessionData
      );

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContainEqual(
        expect.stringContaining('Score 60 is below minimum required 70')
      );
    });

    it('should detect insufficient time spent', async () => {
      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        85,
        300, // 5 minutes, below minimum of 10
        mockSessionData
      );

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContainEqual(
        expect.stringContaining('Time spent 300s is below minimum required 600s')
      );
      expect(result.penalties).toBeGreaterThan(0);
    });

    it('should detect low interaction count', async () => {
      const lowInteractionSessionData = {
        ...mockSessionData,
        interactionEvents: Array(5).fill({ type: 'click', timestamp: new Date() }),
      };

      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        85,
        900,
        lowInteractionSessionData
      );

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContainEqual(
        expect.stringContaining('Interaction count 5 is below required 10')
      );
      expect(result.penalties).toBeGreaterThan(0);
    });

    it('should apply perfect score bonus', async () => {
      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        100,
        900,
        mockSessionData
      );

      expect(result.bonusPoints).toBeGreaterThanOrEqual(5); // Perfect score bonus
    });

    it('should apply efficiency bonus', async () => {
      // Complete in less than estimated time (30 min = 1800s) with good score
      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        85,
        900, // 15 minutes, half the estimated time
        mockSessionData
      );

      expect(result.bonusPoints).toBeGreaterThan(0); // Efficiency bonus
    });

    it('should apply no help bonus', async () => {
      const noHelpSessionData = {
        ...mockSessionData,
        helpRequests: [],
      };

      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        75,
        900,
        noHelpSessionData
      );

      expect(result.bonusPoints).toBeGreaterThanOrEqual(3); // No help bonus
    });

    it('should penalize excessive help requests', async () => {
      const manyHelpSessionData = {
        ...mockSessionData,
        helpRequests: Array(5).fill({ question: 'Help', timestamp: new Date(), resolved: true }),
      };

      const result = await childProgressService.validateActivityCompletion(
        'child-1',
        'activity-1',
        85,
        900,
        manyHelpSessionData
      );

      expect(result.penalties).toBeGreaterThan(0); // Penalty for excess help requests
    });

    it('should throw error for non-existent activity', async () => {
      mockPrisma.studyActivity.findUnique.mockResolvedValue(null);

      await expect(
        childProgressService.validateActivityCompletion('child-1', 'invalid-activity', 85, 900, mockSessionData)
      ).rejects.toThrow('Activity not found: invalid-activity');
    });
  });

  describe('generateProgressSummary', () => {
    const mockProgressRecords = [
      {
        id: 'progress-1',
        childId: 'child-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        timeSpent: 300,
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        activity: { plan: { subject: 'mathematics' } },
      },
      {
        id: 'progress-2',
        childId: 'child-1',
        status: ProgressStatus.IN_PROGRESS,
        score: 0,
        timeSpent: 150,
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        activity: { plan: { subject: 'mathematics' } },
      },
    ];

    const mockDailyStreak = {
      id: 'streak-1',
      childId: 'child-1',
      streakType: StreakType.DAILY,
      currentCount: 3,
      longestCount: 7,
    };

    beforeEach(() => {
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockProgressRecords);
      mockPrisma.learningStreak.findUnique.mockResolvedValue(mockDailyStreak);
      
      // Mock generateSubjectProgressSummaries
      jest.spyOn(childProgressService as any, 'generateSubjectProgressSummaries').mockResolvedValue([
        {
          subjectId: 'mathematics',
          subjectName: 'mathematics',
          completedActivities: 1,
          totalActivities: 2,
          averageScore: 85,
          timeSpent: 450,
          proficiencyLevel: 'developing',
          lastActivity: new Date('2023-01-01T12:00:00Z'),
        },
      ]);
    });

    it('should generate comprehensive progress summary', async () => {
      const result = await childProgressService.generateProgressSummary('child-1');

      expect(result.totalActivities).toBeGreaterThan(0);
      expect(result.completedActivities).toBeGreaterThanOrEqual(0);
      expect(result.inProgressActivities).toBeGreaterThanOrEqual(0);
      expect(result.totalTimeSpent).toBeGreaterThanOrEqual(0);
      expect(result.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.currentDailyStreak).toBeGreaterThanOrEqual(0);
      expect(result.longestDailyStreak).toBeGreaterThanOrEqual(0);
      expect(result.subjectProgress).toBeDefined();
    });

    it('should handle empty progress records', async () => {
      // Create a new service instance for this test to avoid mock conflicts
      const testService = new ChildProgressService(mockPrisma);
      
      mockPrisma.progressRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.learningStreak.findUnique.mockResolvedValueOnce(null);
      jest.spyOn(testService as any, 'generateSubjectProgressSummaries').mockResolvedValueOnce([]);

      const result = await testService.generateProgressSummary('child-1');

      expect(result.totalActivities).toBe(0);
      expect(result.completedActivities).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.currentDailyStreak).toBe(0);
      expect(result.lastActivityDate).toBeNull();
    });

    it('should apply time frame filter', async () => {
      const timeFrame = {
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-01T23:59:59Z',
      };

      // Create a new service instance for this test
      const testService = new ChildProgressService(mockPrisma);
      const mockFindMany = jest.fn().mockResolvedValue([]);
      const mockFindUnique = jest.fn().mockResolvedValue(null);
      
      const testMockPrisma = {
        ...mockPrisma,
        progressRecord: { ...mockPrisma.progressRecord, findMany: mockFindMany },
        learningStreak: { ...mockPrisma.learningStreak, findUnique: mockFindUnique }
      };
      
      const testServiceWithMock = new ChildProgressService(testMockPrisma as any);
      jest.spyOn(testServiceWithMock as any, 'generateSubjectProgressSummaries').mockResolvedValue([]);

      await testServiceWithMock.generateProgressSummary('child-1', timeFrame);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          updatedAt: {
            gte: new Date('2023-01-01T00:00:00Z'),
            lte: new Date('2023-01-01T23:59:59Z'),
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getLearningStreaks', () => {
    const mockStreaks = [
      {
        id: 'streak-1',
        childId: 'child-1',
        streakType: StreakType.DAILY,
        currentCount: 3,
        longestCount: 7,
      },
      {
        id: 'streak-2',
        childId: 'child-1',
        streakType: StreakType.WEEKLY,
        currentCount: 2,
        longestCount: 4,
      },
    ];

    beforeEach(() => {
      mockPrisma.learningStreak.findMany.mockResolvedValue(mockStreaks);
    });

    it('should return all learning streaks for child', async () => {
      const result = await childProgressService.getLearningStreaks('child-1');

      expect(result).toHaveLength(2);
      expect(result[0].streakType).toBe(StreakType.DAILY);
      expect(result[1].streakType).toBe(StreakType.WEEKLY);
      expect(mockPrisma.learningStreak.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1' },
        orderBy: { streakType: 'asc' },
      });
    });
  });

  describe('getRealtimeProgress', () => {
    const mockActiveActivities = [
      {
        id: 'progress-1',
        childId: 'child-1',
        status: ProgressStatus.IN_PROGRESS,
        activity: {
          id: 'activity-1',
          plan: { subject: 'mathematics' },
        },
      },
    ];

    const mockStreaks = [
      {
        id: 'streak-1',
        streakType: StreakType.DAILY,
        currentCount: 2,
      },
    ];

    beforeEach(() => {
      // Reset all mocks for this test suite
      jest.clearAllMocks();
      
      // Set up specific mocks for getRealtimeProgress
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockActiveActivities);
      mockPrisma.learningStreak.findMany.mockResolvedValue(mockStreaks);
      
      // Mock the methods called by getRealtimeProgress
      jest.spyOn(childProgressService, 'getLearningStreaks').mockResolvedValue(mockStreaks as any);
      jest.spyOn(childProgressService, 'generateProgressSummary').mockResolvedValue({
        totalActivities: 1,
        completedActivities: 0,
        inProgressActivities: 1,
        totalTimeSpent: 150,
        averageScore: 0,
        currentDailyStreak: 2,
        longestDailyStreak: 5,
        lastActivityDate: new Date(),
        weeklyGoalProgress: 0,
        monthlyGoalProgress: 0,
        subjectProgress: [],
      });
    });

    it('should return realtime progress data', async () => {
      // Create a new service instance for this test
      const testService = new ChildProgressService(mockPrisma);
      
      // Set up specific mocks for this test
      mockPrisma.progressRecord.findMany.mockResolvedValueOnce(mockActiveActivities);
      jest.spyOn(testService, 'getLearningStreaks').mockResolvedValueOnce(mockStreaks as any);
      jest.spyOn(testService, 'generateProgressSummary').mockResolvedValueOnce({
        totalActivities: 1,
        completedActivities: 0,
        inProgressActivities: 1,
        totalTimeSpent: 150,
        averageScore: 0,
        currentDailyStreak: 2,
        longestDailyStreak: 5,
        lastActivityDate: new Date(),
        weeklyGoalProgress: 0,
        monthlyGoalProgress: 0,
        subjectProgress: [],
      });

      const result = await testService.getRealtimeProgress('child-1');

      expect(result.activeActivities).toHaveLength(1);
      expect(result.currentStreaks).toHaveLength(1);
      expect(result.todaysSummary).toBeDefined();
      expect(result.todaysSummary.inProgressActivities).toBe(1);
    });

    it('should filter for in-progress activities only', async () => {
      await childProgressService.getRealtimeProgress('child-1');

      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          status: ProgressStatus.IN_PROGRESS,
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });
  });
});