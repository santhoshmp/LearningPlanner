import planAdaptationService from '../planAdaptationService';
import analyticsService from '../analyticsService';
import claudeService from '../claudeService';
import emailService from '../emailService';
import logger from '../../utils/logger';
import { PrismaClient, StudyPlanStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../analyticsService');
jest.mock('../claudeService');
jest.mock('../emailService');
jest.mock('../../utils/logger');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    studyPlan: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    studyActivity: {
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    $executeRaw: jest.fn()
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    StudyPlanStatus: {
      ACTIVE: 'ACTIVE',
      COMPLETED: 'COMPLETED',
      DRAFT: 'DRAFT',
      PAUSED: 'PAUSED'
    }
  };
});

describe('PlanAdaptationService', () => {
  const mockPrisma = new PrismaClient() as jest.Mocked<any>;
  const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;
  const mockClaudeService = claudeService as jest.Mocked<typeof claudeService>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;
  const mockLogger = logger as jest.Mocked<typeof logger>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('adaptPlanBasedOnPerformance', () => {
    const childId = 'child-123';
    const planId = 'plan-123';
    
    const mockPlan = {
      id: planId,
      subject: 'Mathematics',
      difficulty: 'medium',
      status: StudyPlanStatus.ACTIVE,
      activities: [
        {
          id: 'activity-1',
          difficulty: 5,
          progressRecords: [
            {
              childId,
              status: 'COMPLETED',
              score: 90,
              timeSpent: 300,
              helpRequests: []
            }
          ]
        },
        {
          id: 'activity-2',
          difficulty: 5,
          progressRecords: [
            {
              childId,
              status: 'COMPLETED',
              score: 85,
              timeSpent: 250,
              helpRequests: []
            }
          ]
        },
        {
          id: 'activity-3',
          difficulty: 6,
          progressRecords: [
            {
              childId,
              status: 'COMPLETED',
              score: 95,
              timeSpent: 200,
              helpRequests: []
            }
          ]
        },
        {
          id: 'activity-4',
          difficulty: 6,
          progressRecords: []
        }
      ],
      child: {
        id: childId,
        name: 'Test Child',
        age: 10,
        gradeLevel: '5th',
        learningStyle: 'VISUAL',
        parentId: 'parent-123'
      }
    };
    
    const mockAdaptationRecommendations = {
      recommendedDifficulty: 'hard',
      contentRecommendations: ['Introduce advanced concepts'],
      teachingApproaches: ['Use more visual aids'],
      accommodations: ['Allow more time for complex problems'],
      explanation: 'Student is excelling and needs more challenge'
    };
    
    const mockUpdatedPlan = {
      ...mockPlan,
      difficulty: 'hard'
    };
    
    const mockParent = {
      id: 'parent-123',
      email: 'parent@example.com',
      firstName: 'Parent'
    };
    
    it('should adapt plan when student is performing well', async () => {
      // Arrange
      mockPrisma.studyPlan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.studyPlan.update.mockResolvedValue(mockUpdatedPlan);
      mockPrisma.user.findUnique.mockResolvedValue(mockParent);
      mockClaudeService.generateContent.mockResolvedValue(JSON.stringify(mockAdaptationRecommendations));
      mockEmailService.sendEmail.mockResolvedValue();
      
      // Act
      const result = await planAdaptationService.adaptPlanBasedOnPerformance(childId, planId);
      
      // Assert
      expect(mockPrisma.studyPlan.findUnique).toHaveBeenCalledWith({
        where: { id: planId },
        include: expect.objectContaining({
          activities: expect.objectContaining({
            include: expect.objectContaining({
              progressRecords: expect.objectContaining({
                where: { childId }
              })
            })
          }),
          child: true
        })
      });
      
      expect(mockPrisma.studyPlan.update).toHaveBeenCalledWith({
        where: { id: planId },
        data: { difficulty: mockAdaptationRecommendations.recommendedDifficulty }
      });
      
      expect(mockPrisma.studyActivity.update).toHaveBeenCalledWith({
        where: { id: 'activity-4' },
        data: { difficulty: expect.any(Number) }
      });
      
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        mockParent.email,
        expect.stringContaining('Study Plan Adapted'),
        expect.stringContaining(mockPlan.child.name)
      );
      
      expect(result).toEqual({
        adapted: true,
        adaptationType: 'increase_difficulty',
        metrics: expect.objectContaining({
          averageScore: expect.any(Number),
          completedActivities: 3,
          totalActivities: 4
        }),
        recommendations: mockAdaptationRecommendations
      });
    });
    
    it('should not adapt plan when it is not active', async () => {
      // Arrange
      const inactivePlan = {
        ...mockPlan,
        status: StudyPlanStatus.PAUSED
      };
      
      mockPrisma.studyPlan.findUnique.mockResolvedValue(inactivePlan);
      
      // Act
      const result = await planAdaptationService.adaptPlanBasedOnPerformance(childId, planId);
      
      // Assert
      expect(result).toEqual({
        adapted: false,
        reason: 'Plan is not active'
      });
      
      expect(mockPrisma.studyPlan.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
    
    it('should not adapt plan when there is not enough data', async () => {
      // Arrange
      const planWithLittleData = {
        ...mockPlan,
        activities: [
          {
            id: 'activity-1',
            difficulty: 5,
            progressRecords: [
              {
                childId,
                status: 'COMPLETED',
                score: 90,
                timeSpent: 300,
                helpRequests: []
              }
            ]
          },
          {
            id: 'activity-2',
            difficulty: 5,
            progressRecords: []
          }
        ]
      };
      
      mockPrisma.studyPlan.findUnique.mockResolvedValue(planWithLittleData);
      
      // Act
      const result = await planAdaptationService.adaptPlanBasedOnPerformance(childId, planId);
      
      // Assert
      expect(result).toEqual({
        adapted: false,
        reason: expect.stringContaining('Not enough completed activities')
      });
      
      expect(mockPrisma.studyPlan.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.studyPlan.findUnique.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(planAdaptationService.adaptPlanBasedOnPerformance(childId, planId))
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error adapting plan based on performance:',
        mockError
      );
    });
  });
  
  describe('checkAllPlansForAdaptation', () => {
    const mockActivePlans = [
      { id: 'plan-1', childId: 'child-1' },
      { id: 'plan-2', childId: 'child-2' }
    ];
    
    it('should check all active plans for adaptation', async () => {
      // Arrange
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockActivePlans);
      
      // Mock adaptPlanBasedOnPerformance to return different results for each plan
      const adaptPlanBasedOnPerformanceSpy = jest.spyOn(planAdaptationService, 'adaptPlanBasedOnPerformance');
      adaptPlanBasedOnPerformanceSpy
        .mockResolvedValueOnce({ adapted: true, adaptationType: 'increase_difficulty' })
        .mockResolvedValueOnce({ adapted: false, reason: 'Current difficulty level appears appropriate' });
      
      // Act
      const result = await planAdaptationService.checkAllPlansForAdaptation();
      
      // Assert
      expect(mockPrisma.studyPlan.findMany).toHaveBeenCalledWith({
        where: { status: StudyPlanStatus.ACTIVE },
        select: { id: true, childId: true }
      });
      
      expect(adaptPlanBasedOnPerformanceSpy).toHaveBeenCalledTimes(2);
      expect(adaptPlanBasedOnPerformanceSpy).toHaveBeenCalledWith('child-1', 'plan-1');
      expect(adaptPlanBasedOnPerformanceSpy).toHaveBeenCalledWith('child-2', 'plan-2');
      
      expect(result).toEqual({
        totalPlans: 2,
        adaptedPlans: 1,
        results: [
          {
            planId: 'plan-1',
            childId: 'child-1',
            adapted: true,
            reason: 'increase_difficulty'
          },
          {
            planId: 'plan-2',
            childId: 'child-2',
            adapted: false,
            reason: 'Current difficulty level appears appropriate'
          }
        ]
      });
      
      // Restore the spy
      adaptPlanBasedOnPerformanceSpy.mockRestore();
    });
    
    it('should handle errors for individual plans', async () => {
      // Arrange
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockActivePlans);
      
      // Mock adaptPlanBasedOnPerformance to throw an error for the second plan
      const adaptPlanBasedOnPerformanceSpy = jest.spyOn(planAdaptationService, 'adaptPlanBasedOnPerformance');
      adaptPlanBasedOnPerformanceSpy
        .mockResolvedValueOnce({ adapted: true, adaptationType: 'increase_difficulty' })
        .mockRejectedValueOnce(new Error('Failed to adapt plan'));
      
      // Act
      const result = await planAdaptationService.checkAllPlansForAdaptation();
      
      // Assert
      expect(result).toEqual({
        totalPlans: 2,
        adaptedPlans: 1,
        results: [
          {
            planId: 'plan-1',
            childId: 'child-1',
            adapted: true,
            reason: 'increase_difficulty'
          },
          {
            planId: 'plan-2',
            childId: 'child-2',
            adapted: false,
            error: 'Failed to adapt plan'
          }
        ]
      });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking plan plan-2 for adaptation:'),
        expect.any(Error)
      );
      
      // Restore the spy
      adaptPlanBasedOnPerformanceSpy.mockRestore();
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.studyPlan.findMany.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(planAdaptationService.checkAllPlansForAdaptation())
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking plans for adaptation:',
        mockError
      );
    });
  });
  
  describe('createContentRecommendations', () => {
    const childId = 'child-123';
    
    const mockChild = {
      name: 'Test Child',
      age: 10,
      gradeLevel: '5th',
      learningStyle: 'VISUAL'
    };
    
    const mockLearningPatterns = {
      recommendedFocus: {
        strengths: ['Mathematics', 'Science'],
        focusAreas: ['Reading Comprehension']
      },
      subjectInsights: [
        {
          subject: 'Mathematics',
          averageScore: 90,
          isStrength: true
        },
        {
          subject: 'Reading',
          averageScore: 65,
          isWeakness: true
        }
      ]
    };
    
    const mockRecommendations = {
      focusAreaRecommendations: [
        {
          subject: 'Reading',
          activityType: 'interactive story',
          title: 'Adventure Reading Quest',
          description: 'Interactive story with comprehension questions',
          reason: 'Builds reading comprehension skills'
        }
      ],
      strengthBuildingRecommendations: [
        {
          subject: 'Mathematics',
          activityType: 'game',
          title: 'Math Challenge',
          description: 'Fun math puzzles to solve',
          reason: 'Builds on existing math strengths'
        }
      ],
      learningStyleRecommendations: [
        {
          activityType: 'visual diagram',
          title: 'Visual Science Explorer',
          description: 'Science concepts explained through diagrams',
          reason: 'Matches visual learning style'
        }
      ]
    };
    
    it('should create content recommendations based on learning patterns', async () => {
      // Arrange
      mockAnalyticsService.detectLearningPatterns.mockResolvedValue(mockLearningPatterns);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockClaudeService.generateContent.mockResolvedValue(JSON.stringify(mockRecommendations));
      
      // Act
      const result = await planAdaptationService.createContentRecommendations(childId);
      
      // Assert
      expect(mockAnalyticsService.detectLearningPatterns).toHaveBeenCalledWith(childId);
      
      expect(mockPrisma.childProfile.findUnique).toHaveBeenCalledWith({
        where: { id: childId },
        select: {
          name: true,
          age: true,
          gradeLevel: true,
          learningStyle: true
        }
      });
      
      expect(mockClaudeService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('You are an educational AI assistant'),
        expect.objectContaining({
          maxTokens: 1500,
          temperature: 0.4,
          childAge: mockChild.age
        })
      );
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content_recommendations'),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
      
      expect(result).toEqual(mockRecommendations);
    });
    
    it('should handle errors when child is not found', async () => {
      // Arrange
      mockAnalyticsService.detectLearningPatterns.mockResolvedValue(mockLearningPatterns);
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(planAdaptationService.createContentRecommendations(childId))
        .rejects.toThrow(`Child ${childId} not found`);
    });
    
    it('should handle Claude API errors', async () => {
      // Arrange
      mockAnalyticsService.detectLearningPatterns.mockResolvedValue(mockLearningPatterns);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      
      const mockError = new Error('Claude API Error');
      mockClaudeService.generateContent.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(planAdaptationService.createContentRecommendations(childId))
        .rejects.toThrow(mockError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating content recommendations:',
        mockError
      );
    });
    
    it('should handle JSON parsing errors', async () => {
      // Arrange
      mockAnalyticsService.detectLearningPatterns.mockResolvedValue(mockLearningPatterns);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockClaudeService.generateContent.mockResolvedValue('Invalid JSON response');
      
      // Act & Assert
      await expect(planAdaptationService.createContentRecommendations(childId))
        .rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error parsing Claude content recommendations:',
        expect.any(Error)
      );
    });
  });
});