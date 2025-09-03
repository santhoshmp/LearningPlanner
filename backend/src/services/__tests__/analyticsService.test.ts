import analyticsService from '../analyticsService';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    studyActivity: {
      findUnique: jest.fn()
    },
    progressRecord: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn()
    },
    helpRequest: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    childProfile: {
      findUnique: jest.fn()
    },
    achievement: {
      findMany: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    ProgressStatus: {
      NOT_STARTED: 'NOT_STARTED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      NEEDS_HELP: 'NEEDS_HELP'
    }
  };
});

describe('AnalyticsService', () => {
  const mockPrisma = new PrismaClient() as jest.Mocked<any>;
  const mockLogger = logger as jest.Mocked<typeof logger>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('trackActivityCompletion', () => {
    const childId = 'child-123';
    const activityId = 'activity-123';
    const score = 85;
    const timeSpent = 300; // seconds
    
    const mockActivity = {
      id: activityId,
      planId: 'plan-123'
    };
    
    const mockProgressRecord = {
      id: 'progress-123',
      childId,
      activityId,
      status: ProgressStatus.COMPLETED,
      score,
      timeSpent,
      attempts: 1,
      completedAt: new Date()
    };
    
    it('should track activity completion successfully', async () => {
      // Arrange
      mockPrisma.studyActivity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.progressRecord.upsert.mockResolvedValue(mockProgressRecord);
      
      // Act
      const result = await analyticsService.trackActivityCompletion(
        childId,
        activityId,
        score,
        timeSpent
      );
      
      // Assert
      expect(mockPrisma.studyActivity.findUnique).toHaveBeenCalledWith({
        where: { id: activityId },
        select: { planId: true }
      });
      
      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalledWith({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        },
        update: expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          score,
          timeSpent: { increment: timeSpent },
          attempts: { increment: 1 },
          completedAt: expect.any(Date)
        }),
        create: expect.objectContaining({
          childId,
          activityId,
          status: ProgressStatus.COMPLETED,
          score,
          timeSpent,
          attempts: 1,
          completedAt: expect.any(Date)
        })
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Activity completed: ${activityId} by child ${childId}`)
      );
      
      expect(result).toEqual(mockProgressRecord);
    });
    
    it('should throw error when activity is not found', async () => {
      // Arrange
      mockPrisma.studyActivity.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(analyticsService.trackActivityCompletion(
        childId,
        activityId,
        score,
        timeSpent
      )).rejects.toThrow(`Activity ${activityId} not found`);
      
      expect(mockPrisma.progressRecord.upsert).not.toHaveBeenCalled();
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.studyActivity.findUnique.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.trackActivityCompletion(
        childId,
        activityId,
        score,
        timeSpent
      )).rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error tracking activity completion:',
        mockError
      );
    });
  });
  
  describe('trackActivityProgress', () => {
    const childId = 'child-123';
    const activityId = 'activity-123';
    const timeSpent = 150; // seconds
    
    const mockProgressRecord = {
      id: 'progress-123',
      childId,
      activityId,
      status: ProgressStatus.IN_PROGRESS,
      score: 0,
      timeSpent,
      attempts: 0
    };
    
    it('should track activity progress successfully', async () => {
      // Arrange
      mockPrisma.progressRecord.upsert.mockResolvedValue(mockProgressRecord);
      
      // Act
      const result = await analyticsService.trackActivityProgress(
        childId,
        activityId,
        timeSpent
      );
      
      // Assert
      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalledWith({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        },
        update: expect.objectContaining({
          status: ProgressStatus.IN_PROGRESS,
          timeSpent: { increment: timeSpent }
        }),
        create: expect.objectContaining({
          childId,
          activityId,
          status: ProgressStatus.IN_PROGRESS,
          timeSpent,
          score: 0,
          attempts: 0
        })
      });
      
      expect(result).toEqual(mockProgressRecord);
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.progressRecord.upsert.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.trackActivityProgress(
        childId,
        activityId,
        timeSpent
      )).rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error tracking activity progress:',
        mockError
      );
    });
  });
  
  describe('trackHelpRequest', () => {
    const childId = 'child-123';
    const activityId = 'activity-123';
    const question = 'How do I solve this problem?';
    const context = { step: 2, problem: '5 + 3 = ?' };
    
    const mockProgressRecord = {
      id: 'progress-123',
      childId,
      activityId,
      status: ProgressStatus.IN_PROGRESS
    };
    
    const mockHelpRequest = {
      id: 'help-123',
      childId,
      activityId,
      progressRecordId: 'progress-123',
      question,
      context,
      isResolved: false
    };
    
    it('should track help request and update progress record status', async () => {
      // Arrange
      mockPrisma.progressRecord.findUnique.mockResolvedValue(mockProgressRecord);
      mockPrisma.helpRequest.create.mockResolvedValue(mockHelpRequest);
      
      // Act
      const result = await analyticsService.trackHelpRequest(
        childId,
        activityId,
        question,
        context
      );
      
      // Assert
      expect(mockPrisma.progressRecord.findUnique).toHaveBeenCalledWith({
        where: {
          childId_activityId: {
            childId,
            activityId
          }
        }
      });
      
      expect(mockPrisma.helpRequest.create).toHaveBeenCalledWith({
        data: {
          childId,
          activityId,
          progressRecordId: mockProgressRecord.id,
          question,
          context,
          isResolved: false
        }
      });
      
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: mockProgressRecord.id },
        data: { status: ProgressStatus.NEEDS_HELP }
      });
      
      expect(result).toEqual(mockHelpRequest);
    });
    
    it('should create help request even when progress record does not exist', async () => {
      // Arrange
      mockPrisma.progressRecord.findUnique.mockResolvedValue(null);
      mockPrisma.helpRequest.create.mockResolvedValue({
        ...mockHelpRequest,
        progressRecordId: null
      });
      
      // Act
      const result = await analyticsService.trackHelpRequest(
        childId,
        activityId,
        question,
        context
      );
      
      // Assert
      expect(mockPrisma.helpRequest.create).toHaveBeenCalledWith({
        data: {
          childId,
          activityId,
          progressRecordId: null,
          question,
          context,
          isResolved: false
        }
      });
      
      expect(mockPrisma.progressRecord.update).not.toHaveBeenCalled();
      
      expect(result).toEqual({
        ...mockHelpRequest,
        progressRecordId: null
      });
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.progressRecord.findUnique.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.trackHelpRequest(
        childId,
        activityId,
        question,
        context
      )).rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error tracking help request:',
        mockError
      );
    });
  });
  
  describe('generateProgressReport', () => {
    const childId = 'child-123';
    const timeFrame = {
      start: '2023-01-01',
      end: '2023-01-31'
    };
    
    const mockProgressRecords = [
      {
        id: 'progress-1',
        childId,
        status: ProgressStatus.COMPLETED,
        score: 90,
        timeSpent: 300,
        updatedAt: new Date('2023-01-05'),
        activity: { title: 'Math Quiz 1' },
        helpRequests: []
      },
      {
        id: 'progress-2',
        childId,
        status: ProgressStatus.COMPLETED,
        score: 80,
        timeSpent: 250,
        updatedAt: new Date('2023-01-10'),
        activity: { title: 'Reading Exercise' },
        helpRequests: [{ id: 'help-1' }]
      },
      {
        id: 'progress-3',
        childId,
        status: ProgressStatus.IN_PROGRESS,
        score: null,
        timeSpent: 150,
        updatedAt: new Date('2023-01-15'),
        activity: { title: 'Science Project' },
        helpRequests: []
      }
    ];
    
    it('should generate progress report with correct metrics', async () => {
      // Arrange
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockProgressRecords);
      
      // Act
      const result = await analyticsService.generateProgressReport(childId, timeFrame);
      
      // Assert
      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId,
          updatedAt: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        },
        include: {
          activity: true,
          helpRequests: true
        }
      });
      
      expect(result).toEqual({
        childId,
        completionRate: (2 / 3) * 100, // 2 completed out of 3 total
        averageScore: (90 + 80) / 2, // Average of completed activities
        totalTimeSpent: 300 + 250 + 150, // Sum of all time spent
        activitiesCompleted: 2,
        activitiesInProgress: 1,
        activitiesNotStarted: 0,
        helpRequestsCount: 1,
        lastActivityDate: expect.any(String)
      });
      
      // Verify the last activity date is the most recent one
      expect(new Date(result.lastActivityDate!)).toEqual(mockProgressRecords[2].updatedAt);
    });
    
    it('should handle empty progress records', async () => {
      // Arrange
      mockPrisma.progressRecord.findMany.mockResolvedValue([]);
      
      // Act
      const result = await analyticsService.generateProgressReport(childId, timeFrame);
      
      // Assert
      expect(result).toEqual({
        childId,
        completionRate: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        activitiesCompleted: 0,
        activitiesInProgress: 0,
        activitiesNotStarted: 0,
        helpRequestsCount: 0,
        lastActivityDate: undefined
      });
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.progressRecord.findMany.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.generateProgressReport(childId, timeFrame))
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error generating progress report:',
        mockError
      );
    });
  });
  
  describe('detectLearningPatterns', () => {
    const childId = 'child-123';
    
    const mockProgressRecords = [
      {
        id: 'progress-1',
        status: ProgressStatus.COMPLETED,
        score: 90,
        timeSpent: 300,
        completedAt: new Date('2023-01-05'),
        activity: {
          id: 'activity-1',
          difficulty: 5,
          plan: { subject: 'Mathematics' }
        },
        helpRequests: []
      },
      {
        id: 'progress-2',
        status: ProgressStatus.COMPLETED,
        score: 85,
        timeSpent: 320,
        completedAt: new Date('2023-01-07'),
        activity: {
          id: 'activity-2',
          difficulty: 6,
          plan: { subject: 'Mathematics' }
        },
        helpRequests: []
      },
      {
        id: 'progress-3',
        status: ProgressStatus.COMPLETED,
        score: 60,
        timeSpent: 400,
        completedAt: new Date('2023-01-10'),
        activity: {
          id: 'activity-3',
          difficulty: 4,
          plan: { subject: 'Reading' }
        },
        helpRequests: [{ id: 'help-1' }, { id: 'help-2' }]
      }
    ];
    
    it('should detect learning patterns and provide insights', async () => {
      // Arrange
      mockPrisma.progressRecord.findMany.mockResolvedValue(mockProgressRecords);
      
      // Act
      const result = await analyticsService.detectLearningPatterns(childId);
      
      // Assert
      expect(mockPrisma.progressRecord.findMany).toHaveBeenCalledWith({
        where: {
          childId,
          status: ProgressStatus.COMPLETED
        },
        include: expect.objectContaining({
          activity: expect.objectContaining({
            include: expect.objectContaining({
              plan: true
            })
          }),
          helpRequests: true
        }),
        orderBy: {
          completedAt: 'asc'
        }
      });
      
      // Check subject insights
      expect(result.subjectInsights).toHaveLength(2); // Mathematics and Reading
      
      const mathInsight = result.subjectInsights.find(s => s.subject === 'Mathematics');
      expect(mathInsight).toBeDefined();
      expect(mathInsight?.averageScore).toBeCloseTo(87.5); // (90 + 85) / 2
      expect(mathInsight?.isStrength).toBe(true);
      
      const readingInsight = result.subjectInsights.find(s => s.subject === 'Reading');
      expect(readingInsight).toBeDefined();
      expect(readingInsight?.averageScore).toBe(60);
      expect(readingInsight?.helpRequestRate).toBe(2); // 2 help requests for 1 activity
      expect(readingInsight?.isWeakness).toBe(true);
      
      // Check recommended focus
      expect(result.recommendedFocus.strengths).toContain('Mathematics');
      expect(result.recommendedFocus.focusAreas).toContain('Reading');
    });
    
    it('should handle empty progress records', async () => {
      // Arrange
      mockPrisma.progressRecord.findMany.mockResolvedValue([]);
      
      // Act
      const result = await analyticsService.detectLearningPatterns(childId);
      
      // Assert
      expect(result.subjectInsights).toEqual([]);
      expect(result.recommendedFocus.strengths).toEqual([]);
      expect(result.recommendedFocus.focusAreas).toEqual([]);
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.progressRecord.findMany.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.detectLearningPatterns(childId))
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error detecting learning patterns:',
        mockError
      );
    });
  });
  
  describe('generateAlerts', () => {
    const childId = 'child-123';
    
    const mockChild = {
      id: childId,
      name: 'Test Child'
    };
    
    const mockAchievements = [
      {
        id: 'achievement-1',
        title: 'Math Master',
        earnedAt: new Date('2023-01-15')
      }
    ];
    
    it('should generate inactivity alert when no activity is found', async () => {
      // Arrange
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.progressRecord.findFirst.mockResolvedValue(null);
      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
      
      // Act
      const result = await analyticsService.generateAlerts(childId);
      
      // Assert
      expect(result).toHaveLength(2); // Inactivity alert + achievement alert
      
      const inactivityAlert = result.find(a => a.type === 'inactivity');
      expect(inactivityAlert).toBeDefined();
      expect(inactivityAlert?.message).toContain("hasn't engaged");
      
      const achievementAlert = result.find(a => a.type === 'achievement');
      expect(achievementAlert).toBeDefined();
      expect(achievementAlert?.message).toContain('Math Master');
    });
    
    it('should generate low performance alert when recent scores are low', async () => {
      // Arrange
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.progressRecord.findFirst.mockResolvedValue({
        updatedAt: new Date()
      });
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      
      // Mock getRecentPerformance to return low scores
      const getRecentPerformanceSpy = jest.spyOn(analyticsService as any, 'getRecentPerformance');
      getRecentPerformanceSpy.mockResolvedValue({
        averageScore: 55,
        activitiesCompleted: 3
      });
      
      // Act
      const result = await analyticsService.generateAlerts(childId);
      
      // Assert
      expect(result).toHaveLength(1); // Only low performance alert
      
      const lowPerformanceAlert = result[0];
      expect(lowPerformanceAlert.type).toBe('low_performance');
      expect(lowPerformanceAlert.message).toContain('struggling');
      expect(lowPerformanceAlert.severity).toBe('warning');
      
      // Restore the spy
      getRecentPerformanceSpy.mockRestore();
    });
    
    it('should handle child not found error', async () => {
      // Arrange
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(analyticsService.generateAlerts(childId))
        .rejects.toThrow(`Child ${childId} not found`);
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.childProfile.findUnique.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(analyticsService.generateAlerts(childId))
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error generating alerts:',
        mockError
      );
    });
  });
});