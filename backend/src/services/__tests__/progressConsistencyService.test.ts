import { ProgressConsistencyService } from '../progressConsistencyService';
import { PrismaClient, ProgressStatus, StreakType } from '@prisma/client';

describe('ProgressConsistencyService', () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let consistencyService: ProgressConsistencyService;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    consistencyService = new ProgressConsistencyService(prismaMock);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  describe('updateProgressWithConsistencyChecks', () => {
    it('should successfully update progress with valid data', async () => {
      const childId = 'child-123';
      const update = {
        childId,
        payload: {
          activityId: 'activity-123',
          timeSpent: 300,
          score: 85,
          status: ProgressStatus.IN_PROGRESS
        },
        validateConsistency: true,
        autoCorrect: false
      };

      // Mock validation service to return valid result
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedData: update.payload,
        consistencyChecks: []
      };

      // Mock transaction
      const mockProgressRecord = {
        id: 'progress-123',
        childId,
        activityId: 'activity-123',
        status: ProgressStatus.IN_PROGRESS,
        score: 85,
        timeSpent: 300,
        attempts: 1,
        sessionData: {},
        helpRequestsCount: 0,
        pauseCount: 0,
        resumeCount: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return await callback(prismaMock);
      });

      prismaMock.progressRecord.findUnique.mockResolvedValue(null);
      prismaMock.progressRecord.upsert.mockResolvedValue(mockProgressRecord);

      // Mock validation service
      jest.spyOn(consistencyService['validationService'], 'validateProgressUpdate')
        .mockResolvedValue(mockValidationResult);

      const result = await consistencyService.updateProgressWithConsistencyChecks(update);

      expect(result.success).toBe(true);
      expect(result.progressRecord).toEqual(mockProgressRecord);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with invalid validation', async () => {
      const childId = 'child-123';
      const update = {
        childId,
        payload: {
          activityId: 'activity-123',
          timeSpent: -100, // Invalid negative time
          score: 85
        },
        validateConsistency: true,
        autoCorrect: false
      };

      // Mock validation service to return invalid result
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'timeSpent',
            message: 'Time spent must be positive',
            code: 'INVALID_TIME',
            severity: 'error' as const
          }
        ],
        warnings: [],
        sanitizedData: update.payload,
        consistencyChecks: []
      };

      jest.spyOn(consistencyService['validationService'], 'validateProgressUpdate')
        .mockResolvedValue(mockValidationResult);

      const result = await consistencyService.updateProgressWithConsistencyChecks(update);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Time spent must be positive');
    });

    it('should handle transaction failures gracefully', async () => {
      const childId = 'child-123';
      const update = {
        childId,
        payload: {
          activityId: 'activity-123',
          timeSpent: 300,
          score: 85
        },
        validateConsistency: false,
        autoCorrect: false
      };

      // Mock validation service to return valid result
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedData: update.payload,
        consistencyChecks: []
      };

      jest.spyOn(consistencyService['validationService'], 'validateProgressUpdate')
        .mockResolvedValue(mockValidationResult);

      // Mock transaction to fail
      prismaMock.$transaction.mockRejectedValue(new Error('Database connection failed'));

      const result = await consistencyService.updateProgressWithConsistencyChecks(update);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to update progress with consistency checks');
    });
  });

  describe('performConsistencyChecks', () => {
    it('should detect progress record inconsistencies', async () => {
      const childId = 'child-123';

      // Mock progress records with inconsistencies
      const mockProgressRecords = [
        {
          id: 'progress-1',
          childId,
          activityId: 'activity-1',
          status: ProgressStatus.COMPLETED,
          score: -10, // Invalid negative score
          timeSpent: 300,
          attempts: 1,
          sessionData: {},
          helpRequestsCount: 0,
          pauseCount: 0,
          resumeCount: 0,
          completedAt: null, // Missing completion date for completed status
          createdAt: new Date(),
          updatedAt: new Date(),
          activity: {
            plan: { subject: 'Math' }
          }
        },
        {
          id: 'progress-2',
          childId,
          activityId: 'activity-2',
          status: ProgressStatus.IN_PROGRESS,
          score: 150, // Invalid score over 100
          timeSpent: -50, // Invalid negative time
          attempts: 1,
          sessionData: {},
          helpRequestsCount: 0,
          pauseCount: 0,
          resumeCount: 0,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          activity: {
            plan: { subject: 'Science' }
          }
        }
      ];

      prismaMock.progressRecord.findMany.mockResolvedValue(mockProgressRecords);
      prismaMock.learningStreak.findMany.mockResolvedValue([]);
      prismaMock.studyPlan.findMany.mockResolvedValue([]);

      // Mock generateProgressSummary
      jest.spyOn(consistencyService as any, 'generateProgressSummary')
        .mockResolvedValue({
          totalTimeSpent: 250,
          averageScore: 70
        });

      const result = await consistencyService.performConsistencyChecks(childId);

      expect(result.progressRecordsConsistent).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThan(0);
      
      // Check for specific inconsistencies
      const negativeScoreIssue = result.inconsistencies.find(i => 
        i.description.includes('Invalid score') && i.actual === -10
      );
      expect(negativeScoreIssue).toBeDefined();

      const missingCompletionDateIssue = result.inconsistencies.find(i => 
        i.description.includes('missing completion date')
      );
      expect(missingCompletionDateIssue).toBeDefined();

      const negativeTimeIssue = result.inconsistencies.find(i => 
        i.description.includes('Negative time spent')
      );
      expect(negativeTimeIssue).toBeDefined();
    });

    it('should detect learning streak inconsistencies', async () => {
      const childId = 'child-123';

      // Mock streaks with inconsistencies
      const mockStreaks = [
        {
          id: 'streak-1',
          childId,
          streakType: StreakType.DAILY,
          currentCount: -5, // Invalid negative count
          longestCount: 10,
          lastActivityDate: new Date(),
          streakStartDate: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'streak-2',
          childId,
          streakType: StreakType.WEEKLY,
          currentCount: 15,
          longestCount: 10, // Current exceeds longest
          lastActivityDate: new Date(),
          streakStartDate: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockProgressRecords = [
        {
          id: 'progress-1',
          childId,
          activityId: 'activity-1',
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.progressRecord.findMany.mockResolvedValue([]);
      prismaMock.learningStreak.findMany.mockResolvedValue(mockStreaks);
      prismaMock.studyPlan.findMany.mockResolvedValue([]);
      prismaMock.progressRecord.findMany
        .mockResolvedValueOnce([]) // First call for progress records consistency
        .mockResolvedValueOnce(mockProgressRecords); // Second call for streak consistency

      // Mock generateProgressSummary
      jest.spyOn(consistencyService as any, 'generateProgressSummary')
        .mockResolvedValue({
          totalTimeSpent: 300,
          averageScore: 85
        });

      const result = await consistencyService.performConsistencyChecks(childId);

      expect(result.streaksConsistent).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThan(0);

      // Check for specific streak inconsistencies
      const negativeCountIssue = result.inconsistencies.find(i => 
        i.description.includes('Negative streak count')
      );
      expect(negativeCountIssue).toBeDefined();

      const currentExceedsLongestIssue = result.inconsistencies.find(i => 
        i.description.includes('Current count exceeds longest count')
      );
      expect(currentExceedsLongestIssue).toBeDefined();
    });

    it('should detect study plan progress inconsistencies', async () => {
      const childId = 'child-123';

      // Mock study plan that should be completed but isn't marked as such
      const mockStudyPlans = [
        {
          id: 'plan-1',
          childId,
          subject: 'Math',
          difficulty: 'INTERMEDIATE',
          objectives: '[]',
          status: 'ACTIVE', // Should be COMPLETED
          estimatedDuration: 300,
          createdAt: new Date(),
          updatedAt: new Date(),
          activities: [
            {
              id: 'activity-1',
              progressRecords: [
                {
                  id: 'progress-1',
                  childId,
                  status: ProgressStatus.COMPLETED
                }
              ]
            },
            {
              id: 'activity-2',
              progressRecords: [
                {
                  id: 'progress-2',
                  childId,
                  status: ProgressStatus.COMPLETED
                }
              ]
            }
          ]
        }
      ];

      prismaMock.progressRecord.findMany.mockResolvedValue([]);
      prismaMock.learningStreak.findMany.mockResolvedValue([]);
      prismaMock.studyPlan.findMany.mockResolvedValue(mockStudyPlans);

      // Mock generateProgressSummary
      jest.spyOn(consistencyService as any, 'generateProgressSummary')
        .mockResolvedValue({
          totalTimeSpent: 600,
          averageScore: 90
        });

      const result = await consistencyService.performConsistencyChecks(childId);

      expect(result.studyPlanProgressConsistent).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThan(0);

      // Check for study plan completion inconsistency
      const completionIssue = result.inconsistencies.find(i => 
        i.description.includes('should be marked as completed')
      );
      expect(completionIssue).toBeDefined();
    });
  });

  describe('correctInconsistencies', () => {
    it('should apply corrections successfully', async () => {
      const childId = 'child-123';
      const corrections = [
        {
          type: 'progress_record_fix',
          description: 'Fix negative time spent',
          action: 'set_time_spent_to_zero',
          data: { recordId: 'progress-1', currentValue: -100 }
        },
        {
          type: 'progress_record_fix',
          description: 'Fix invalid score',
          action: 'clamp_score',
          data: { recordId: 'progress-2', currentValue: 150 }
        },
        {
          type: 'streak_fix',
          description: 'Fix negative streak counts',
          action: 'reset_negative_counts',
          data: { streakId: 'streak-1', streakType: 'DAILY' }
        }
      ];

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return await callback(prismaMock);
      });

      prismaMock.progressRecord.update.mockResolvedValue({} as any);
      prismaMock.learningStreak.update.mockResolvedValue({} as any);

      await expect(
        consistencyService.correctInconsistencies(childId, corrections)
      ).resolves.not.toThrow();

      // Verify corrections were applied
      expect(prismaMock.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: { timeSpent: 0 }
      });

      expect(prismaMock.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-2' },
        data: { score: 100 } // Clamped to 100
      });

      expect(prismaMock.learningStreak.update).toHaveBeenCalledWith({
        where: { id: 'streak-1' },
        data: { 
          currentCount: 0,
          longestCount: 0
        }
      });
    });

    it('should handle correction failures gracefully', async () => {
      const childId = 'child-123';
      const corrections = [
        {
          type: 'progress_record_fix',
          description: 'Fix negative time spent',
          action: 'set_time_spent_to_zero',
          data: { recordId: 'progress-1', currentValue: -100 }
        }
      ];

      prismaMock.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        consistencyService.correctInconsistencies(childId, corrections)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateLearningStreaksInTransaction', () => {
    it('should update streaks correctly for completed activity', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';
      const score = 95;
      const helpRequestsCount = 1;

      // Mock activity with plan
      const mockActivity = {
        id: activityId,
        plan: {
          subject: 'Math'
        }
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        learningStreak: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateLearningStreaksInTransaction'](
        mockTx,
        childId,
        activityId,
        score,
        helpRequestsCount
      );

      // Verify streak updates were called
      expect(mockTx.learningStreak.create).toHaveBeenCalledTimes(4); // Daily, weekly, activity completion, perfect score
      expect(mockTx.learningStreak.findUnique).toHaveBeenCalledTimes(5); // All streak types checked
    });

    it('should handle perfect score streak correctly', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';
      const score = 100; // Perfect score
      const helpRequestsCount = 0; // No help

      const mockActivity = {
        id: activityId,
        plan: {
          subject: 'Math'
        }
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        learningStreak: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateLearningStreaksInTransaction'](
        mockTx,
        childId,
        activityId,
        score,
        helpRequestsCount
      );

      // Should create all 5 streak types (including perfect score and help-free)
      expect(mockTx.learningStreak.create).toHaveBeenCalledTimes(5);
    });

    it('should reset perfect score streak for non-perfect scores', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';
      const score = 85; // Not perfect
      const helpRequestsCount = 0;

      const mockActivity = {
        id: activityId,
        plan: {
          subject: 'Math'
        }
      };

      // Mock existing perfect score streak
      const mockExistingStreak = {
        id: 'streak-1',
        childId,
        streakType: StreakType.PERFECT_SCORE,
        currentCount: 5,
        isActive: true
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        learningStreak: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(null) // Daily
            .mockResolvedValueOnce(null) // Weekly  
            .mockResolvedValueOnce(null) // Activity completion
            .mockResolvedValueOnce(mockExistingStreak) // Perfect score
            .mockResolvedValueOnce(null), // Help-free
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateLearningStreaksInTransaction'](
        mockTx,
        childId,
        activityId,
        score,
        helpRequestsCount
      );

      // Should reset perfect score streak
      expect(mockTx.learningStreak.update).toHaveBeenCalledWith({
        where: { id: 'streak-1' },
        data: {
          currentCount: 0,
          isActive: false
        }
      });
    });
  });

  describe('updateStudyPlanProgressInTransaction', () => {
    it('should update study plan status to completed when all activities are done', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';

      const mockActivity = {
        id: activityId,
        plan: {
          id: 'plan-123',
          status: 'ACTIVE',
          activities: [
            {
              id: 'activity-1',
              progressRecords: [
                { childId, status: ProgressStatus.COMPLETED }
              ]
            },
            {
              id: 'activity-2',
              progressRecords: [
                { childId, status: ProgressStatus.COMPLETED }
              ]
            }
          ]
        }
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        studyPlan: {
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateStudyPlanProgressInTransaction'](
        mockTx,
        childId,
        activityId
      );

      // Should update plan status to COMPLETED
      expect(mockTx.studyPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
        data: {
          status: 'COMPLETED',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should activate draft plan when progress is made', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';

      const mockActivity = {
        id: activityId,
        plan: {
          id: 'plan-123',
          status: 'DRAFT', // Draft status
          activities: [
            {
              id: 'activity-1',
              progressRecords: [
                { childId, status: ProgressStatus.COMPLETED }
              ]
            },
            {
              id: 'activity-2',
              progressRecords: [] // Not completed
            }
          ]
        }
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        studyPlan: {
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateStudyPlanProgressInTransaction'](
        mockTx,
        childId,
        activityId
      );

      // Should update plan status to ACTIVE
      expect(mockTx.studyPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
        data: {
          status: 'ACTIVE',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should not update plan status if no change needed', async () => {
      const childId = 'child-123';
      const activityId = 'activity-123';

      const mockActivity = {
        id: activityId,
        plan: {
          id: 'plan-123',
          status: 'ACTIVE', // Already active
          activities: [
            {
              id: 'activity-1',
              progressRecords: [
                { childId, status: ProgressStatus.COMPLETED }
              ]
            },
            {
              id: 'activity-2',
              progressRecords: [] // Not completed, so plan shouldn't be completed
            }
          ]
        }
      };

      const mockTx = {
        studyActivity: {
          findUnique: jest.fn().mockResolvedValue(mockActivity)
        },
        studyPlan: {
          update: jest.fn().mockResolvedValue({})
        }
      };

      await consistencyService['updateStudyPlanProgressInTransaction'](
        mockTx,
        childId,
        activityId
      );

      // Should not update plan status
      expect(mockTx.studyPlan.update).not.toHaveBeenCalled();
    });
  });
});