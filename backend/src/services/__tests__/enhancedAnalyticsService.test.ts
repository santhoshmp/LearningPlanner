import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
jest.mock('@prisma/client');
jest.mock('../utils/logger');

// Mock Prisma
const mockPrisma = {
  child: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  studyPlan: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  studyActivity: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  activityCompletion: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  contentInteraction: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  analyticsEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  learningInsight: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  performancePrediction: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

describe('EnhancedAnalyticsService', () => {
  let enhancedAnalyticsService: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset Prisma mocks
    Object.values(mockPrisma).forEach(model => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach(method => {
          if (typeof method === 'function') {
            (method as jest.Mock).mockReset();
          }
        });
      }
    });

    // Import the service after mocking
    const { enhancedAnalyticsService: service } = await import('../enhancedAnalyticsService');
    enhancedAnalyticsService = service;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDetailedProgressAnalytics', () => {
    const mockChild = {
      id: 'child-123',
      firstName: 'Test',
      lastName: 'Child',
      age: 10,
      gradeLevel: '5th Grade'
    };

    const mockStudyPlans = [
      {
        id: 'plan-1',
        subject: 'Mathematics',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        activities: [
          {
            id: 'activity-1',
            title: 'Addition Basics',
            estimatedDuration: 30,
            completions: [
              {
                id: 'completion-1',
                completedAt: new Date('2024-01-02'),
                timeSpent: 25,
                score: 85,
                attempts: 1
              }
            ]
          }
        ]
      }
    ];

    const mockContentInteractions = [
      {
        id: 'interaction-1',
        contentType: 'video',
        interactionType: 'view',
        duration: 300,
        progressPercentage: 100,
        timestamp: new Date('2024-01-02')
      }
    ];

    it('should generate detailed progress analytics successfully', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(mockChild);
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockStudyPlans);
      mockPrisma.contentInteraction.findMany.mockResolvedValue(mockContentInteractions);
      mockPrisma.activityCompletion.groupBy.mockResolvedValue([
        {
          subject: 'Mathematics',
          _avg: { score: 85 },
          _count: { id: 1 }
        }
      ]);

      const result = await enhancedAnalyticsService.getDetailedProgressAnalytics(
        'child-123',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          subjects: ['Mathematics'],
          includeContentInteractions: true
        }
      );

      expect(result).toEqual({
        childInfo: mockChild,
        timeRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        },
        overallProgress: expect.objectContaining({
          totalActivitiesCompleted: expect.any(Number),
          averageScore: expect.any(Number),
          totalTimeSpent: expect.any(Number),
          completionRate: expect.any(Number)
        }),
        subjectBreakdown: expect.arrayContaining([
          expect.objectContaining({
            subject: 'Mathematics',
            activitiesCompleted: expect.any(Number),
            averageScore: expect.any(Number),
            timeSpent: expect.any(Number)
          })
        ]),
        learningPatterns: expect.objectContaining({
          preferredContentTypes: expect.any(Array),
          peakLearningHours: expect.any(Array),
          averageSessionDuration: expect.any(Number),
          consistencyScore: expect.any(Number)
        }),
        contentInteractions: expect.arrayContaining([
          expect.objectContaining({
            contentType: 'video',
            interactionType: 'view',
            duration: 300
          })
        ]),
        insights: expect.any(Array),
        recommendations: expect.any(Array)
      });

      expect(mockPrisma.child.findUnique).toHaveBeenCalledWith({
        where: { id: 'child-123' }
      });
    });

    it('should handle child not found', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(null);

      await expect(
        enhancedAnalyticsService.getDetailedProgressAnalytics('non-existent-child')
      ).rejects.toThrow('Child not found');
    });

    it('should filter by subjects when specified', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(mockChild);
      mockPrisma.studyPlan.findMany.mockResolvedValue(mockStudyPlans);
      mockPrisma.contentInteraction.findMany.mockResolvedValue([]);
      mockPrisma.activityCompletion.groupBy.mockResolvedValue([]);

      await enhancedAnalyticsService.getDetailedProgressAnalytics(
        'child-123',
        {
          subjects: ['Mathematics', 'Science'],
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      );

      expect(mockPrisma.studyPlan.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          childId: 'child-123',
          subject: { in: ['Mathematics', 'Science'] }
        }),
        include: expect.any(Object)
      });
    });

    it('should exclude content interactions when not requested', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(mockChild);
      mockPrisma.studyPlan.findMany.mockResolvedValue([]);
      mockPrisma.activityCompletion.groupBy.mockResolvedValue([]);

      const result = await enhancedAnalyticsService.getDetailedProgressAnalytics(
        'child-123',
        {
          includeContentInteractions: false
        }
      );

      expect(result.contentInteractions).toBeUndefined();
      expect(mockPrisma.contentInteraction.findMany).not.toHaveBeenCalled();
    });
  });

  describe('generateLearningInsights', () => {
    const mockAnalyticsData = {
      childId: 'child-123',
      completedActivities: [
        {
          subject: 'Mathematics',
          score: 85,
          timeSpent: 30,
          completedAt: new Date('2024-01-02'),
          difficulty: 'medium'
        },
        {
          subject: 'Mathematics',
          score: 92,
          timeSpent: 25,
          completedAt: new Date('2024-01-03'),
          difficulty: 'medium'
        }
      ],
      contentInteractions: [
        {
          contentType: 'video',
          duration: 300,
          progressPercentage: 100,
          timestamp: new Date('2024-01-02')
        }
      ]
    };

    it('should generate learning insights successfully', async () => {
      mockPrisma.learningInsight.create.mockResolvedValue({
        id: 'insight-123',
        childId: 'child-123',
        type: 'performance_trend',
        title: 'Improving Mathematics Performance',
        description: 'Child shows consistent improvement in mathematics',
        confidence: 0.85,
        actionable: true,
        recommendations: ['Continue current study plan'],
        generatedAt: new Date()
      });

      const insights = await enhancedAnalyticsService.generateLearningInsights(mockAnalyticsData);

      expect(insights).toHaveLength(1);
      expect(insights[0]).toEqual(
        expect.objectContaining({
          type: 'performance_trend',
          title: 'Improving Mathematics Performance',
          confidence: 0.85,
          actionable: true
        })
      );

      expect(mockPrisma.learningInsight.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 'child-123',
          type: 'performance_trend',
          confidence: expect.any(Number)
        })
      });
    });

    it('should identify learning patterns', async () => {
      const patternData = {
        childId: 'child-123',
        completedActivities: Array.from({ length: 10 }, (_, i) => ({
          subject: 'Mathematics',
          score: 80 + i * 2, // Improving scores
          timeSpent: 30 - i, // Decreasing time (efficiency improvement)
          completedAt: new Date(`2024-01-${i + 1}`),
          difficulty: 'medium'
        })),
        contentInteractions: []
      };

      mockPrisma.learningInsight.create.mockResolvedValue({
        id: 'insight-pattern',
        type: 'learning_pattern',
        title: 'Efficiency Improvement Detected',
        confidence: 0.9
      });

      const insights = await enhancedAnalyticsService.generateLearningInsights(patternData);

      expect(insights[0].type).toBe('learning_pattern');
      expect(insights[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect struggling areas', async () => {
      const strugglingData = {
        childId: 'child-123',
        completedActivities: [
          {
            subject: 'Mathematics',
            score: 45,
            timeSpent: 60,
            completedAt: new Date('2024-01-02'),
            difficulty: 'easy',
            attempts: 3
          },
          {
            subject: 'Mathematics',
            score: 50,
            timeSpent: 55,
            completedAt: new Date('2024-01-03'),
            difficulty: 'easy',
            attempts: 2
          }
        ],
        contentInteractions: []
      };

      mockPrisma.learningInsight.create.mockResolvedValue({
        id: 'insight-struggle',
        type: 'struggling_area',
        title: 'Mathematics Needs Attention',
        confidence: 0.8,
        actionable: true,
        recommendations: ['Consider additional practice', 'Review fundamentals']
      });

      const insights = await enhancedAnalyticsService.generateLearningInsights(strugglingData);

      expect(insights[0].type).toBe('struggling_area');
      expect(insights[0].recommendations).toContain('Consider additional practice');
    });
  });

  describe('generatePerformancePredictions', () => {
    const mockHistoricalData = {
      childId: 'child-123',
      subject: 'Mathematics',
      recentScores: [75, 78, 82, 85, 88],
      averageTimeSpent: 30,
      completionRate: 0.9,
      difficultyProgression: ['easy', 'easy', 'medium', 'medium', 'medium']
    };

    it('should generate performance predictions successfully', async () => {
      mockPrisma.performancePrediction.create.mockResolvedValue({
        id: 'prediction-123',
        childId: 'child-123',
        subject: 'Mathematics',
        predictedScore: 90,
        confidence: 0.85,
        timeframe: '1_week',
        factors: ['consistent_improvement', 'good_completion_rate'],
        recommendations: ['Continue current pace', 'Consider advancing difficulty'],
        generatedAt: new Date()
      });

      const prediction = await enhancedAnalyticsService.generatePerformancePredictions(mockHistoricalData);

      expect(prediction).toEqual(
        expect.objectContaining({
          subject: 'Mathematics',
          predictedScore: 90,
          confidence: 0.85,
          timeframe: '1_week',
          factors: expect.arrayContaining(['consistent_improvement'])
        })
      );

      expect(mockPrisma.performancePrediction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 'child-123',
          subject: 'Mathematics',
          predictedScore: expect.any(Number),
          confidence: expect.any(Number)
        })
      });
    });

    it('should predict declining performance', async () => {
      const decliningData = {
        childId: 'child-123',
        subject: 'Science',
        recentScores: [90, 85, 80, 75, 70], // Declining trend
        averageTimeSpent: 45,
        completionRate: 0.7,
        difficultyProgression: ['medium', 'medium', 'medium', 'easy', 'easy']
      };

      mockPrisma.performancePrediction.create.mockResolvedValue({
        id: 'prediction-decline',
        predictedScore: 65,
        confidence: 0.75,
        factors: ['declining_scores', 'reduced_completion_rate'],
        recommendations: ['Review recent topics', 'Consider easier content']
      });

      const prediction = await enhancedAnalyticsService.generatePerformancePredictions(decliningData);

      expect(prediction.predictedScore).toBeLessThan(70);
      expect(prediction.factors).toContain('declining_scores');
      expect(prediction.recommendations).toContain('Review recent topics');
    });

    it('should handle insufficient data', async () => {
      const insufficientData = {
        childId: 'child-123',
        subject: 'Art',
        recentScores: [80], // Only one score
        averageTimeSpent: 20,
        completionRate: 1.0,
        difficultyProgression: ['easy']
      };

      const prediction = await enhancedAnalyticsService.generatePerformancePredictions(insufficientData);

      expect(prediction.confidence).toBeLessThan(0.5);
      expect(prediction.factors).toContain('insufficient_data');
    });
  });

  describe('trackLearningEvent', () => {
    it('should track learning events successfully', async () => {
      const eventData = {
        childId: 'child-123',
        eventType: 'activity_completed',
        activityId: 'activity-123',
        score: 85,
        timeSpent: 30,
        metadata: {
          subject: 'Mathematics',
          difficulty: 'medium',
          attempts: 1
        }
      };

      mockPrisma.analyticsEvent.create.mockResolvedValue({
        id: 'event-123',
        ...eventData,
        timestamp: new Date()
      });

      const result = await enhancedAnalyticsService.trackLearningEvent(eventData);

      expect(result).toEqual(
        expect.objectContaining({
          childId: 'child-123',
          eventType: 'activity_completed',
          score: 85,
          timeSpent: 30
        })
      );

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 'child-123',
          eventType: 'activity_completed',
          timestamp: expect.any(Date)
        })
      });
    });

    it('should handle different event types', async () => {
      const contentViewEvent = {
        childId: 'child-123',
        eventType: 'content_viewed',
        contentId: 'content-123',
        duration: 300,
        progressPercentage: 75,
        metadata: {
          contentType: 'video',
          subject: 'Science'
        }
      };

      mockPrisma.analyticsEvent.create.mockResolvedValue({
        id: 'event-content',
        ...contentViewEvent,
        timestamp: new Date()
      });

      await enhancedAnalyticsService.trackLearningEvent(contentViewEvent);

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'content_viewed',
          contentId: 'content-123',
          duration: 300
        })
      });
    });
  });

  describe('getAnalyticsReport', () => {
    const mockReportData = {
      summary: {
        totalActivities: 50,
        completedActivities: 45,
        averageScore: 82,
        totalTimeSpent: 1500
      },
      subjectPerformance: [
        {
          subject: 'Mathematics',
          averageScore: 85,
          completedActivities: 20,
          timeSpent: 600
        },
        {
          subject: 'Science',
          averageScore: 78,
          completedActivities: 15,
          timeSpent: 450
        }
      ],
      trends: {
        scoreProgression: [75, 78, 80, 82, 85],
        timeEfficiency: [35, 32, 30, 28, 25],
        consistencyScore: 0.85
      }
    };

    it('should generate comprehensive analytics report', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-123',
        firstName: 'Test',
        lastName: 'Child'
      });

      mockPrisma.activityCompletion.count.mockResolvedValue(45);
      mockPrisma.studyActivity.count.mockResolvedValue(50);
      
      mockPrisma.activityCompletion.groupBy
        .mockResolvedValueOnce([
          { subject: 'Mathematics', _avg: { score: 85 }, _count: { id: 20 }, _sum: { timeSpent: 600 } },
          { subject: 'Science', _avg: { score: 78 }, _count: { id: 15 }, _sum: { timeSpent: 450 } }
        ])
        .mockResolvedValueOnce([
          { _avg: { score: 82 }, _sum: { timeSpent: 1500 } }
        ]);

      const result = await enhancedAnalyticsService.getAnalyticsReport(
        'child-123',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          includeSubjectBreakdown: true,
          includeTrends: true
        }
      );

      expect(result).toEqual(
        expect.objectContaining({
          childId: 'child-123',
          reportPeriod: expect.objectContaining({
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31')
          }),
          summary: expect.objectContaining({
            totalActivities: expect.any(Number),
            completedActivities: expect.any(Number),
            averageScore: expect.any(Number)
          }),
          subjectPerformance: expect.arrayContaining([
            expect.objectContaining({
              subject: 'Mathematics',
              averageScore: expect.any(Number)
            })
          ]),
          insights: expect.any(Array),
          recommendations: expect.any(Array)
        })
      );
    });

    it('should handle empty data gracefully', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-123',
        firstName: 'Test',
        lastName: 'Child'
      });

      mockPrisma.activityCompletion.count.mockResolvedValue(0);
      mockPrisma.studyActivity.count.mockResolvedValue(0);
      mockPrisma.activityCompletion.groupBy.mockResolvedValue([]);

      const result = await enhancedAnalyticsService.getAnalyticsReport('child-123');

      expect(result.summary.totalActivities).toBe(0);
      expect(result.summary.completedActivities).toBe(0);
      expect(result.subjectPerformance).toHaveLength(0);
    });
  });

  describe('exportAnalyticsData', () => {
    it('should export analytics data in CSV format', async () => {
      const mockData = [
        {
          date: '2024-01-01',
          subject: 'Mathematics',
          activity: 'Addition Practice',
          score: 85,
          timeSpent: 30,
          completed: true
        },
        {
          date: '2024-01-02',
          subject: 'Science',
          activity: 'Plant Biology',
          score: 92,
          timeSpent: 25,
          completed: true
        }
      ];

      mockPrisma.activityCompletion.findMany.mockResolvedValue(mockData);

      const result = await enhancedAnalyticsService.exportAnalyticsData(
        'child-123',
        'csv',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      );

      expect(result).toEqual(
        expect.objectContaining({
          format: 'csv',
          data: expect.stringContaining('date,subject,activity,score,timeSpent,completed'),
          filename: expect.stringMatching(/analytics_child-123_\d{4}-\d{2}-\d{2}\.csv/)
        })
      );
    });

    it('should export analytics data in JSON format', async () => {
      const mockData = [
        {
          id: 'completion-1',
          activityId: 'activity-1',
          score: 85,
          timeSpent: 30,
          completedAt: new Date('2024-01-01')
        }
      ];

      mockPrisma.activityCompletion.findMany.mockResolvedValue(mockData);

      const result = await enhancedAnalyticsService.exportAnalyticsData(
        'child-123',
        'json',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      );

      expect(result.format).toBe('json');
      expect(JSON.parse(result.data)).toEqual(mockData);
      expect(result.filename).toMatch(/analytics_child-123_\d{4}-\d{2}-\d{2}\.json/);
    });

    it('should handle unsupported export formats', async () => {
      await expect(
        enhancedAnalyticsService.exportAnalyticsData('child-123', 'xml')
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('Real-time Analytics Updates', () => {
    it('should process real-time analytics updates', async () => {
      const updateData = {
        childId: 'child-123',
        eventType: 'activity_started',
        activityId: 'activity-123',
        timestamp: new Date(),
        metadata: {
          subject: 'Mathematics',
          estimatedDuration: 30
        }
      };

      mockPrisma.analyticsEvent.create.mockResolvedValue({
        id: 'event-realtime',
        ...updateData
      });

      const result = await enhancedAnalyticsService.processRealtimeUpdate(updateData);

      expect(result).toEqual(
        expect.objectContaining({
          eventId: 'event-realtime',
          processed: true,
          timestamp: expect.any(Date)
        })
      );

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 'child-123',
          eventType: 'activity_started'
        })
      });
    });

    it('should aggregate real-time metrics', async () => {
      const metrics = await enhancedAnalyticsService.getRealtimeMetrics('child-123');

      expect(metrics).toEqual(
        expect.objectContaining({
          activeSession: expect.any(Boolean),
          currentActivity: expect.any(Object),
          todayProgress: expect.objectContaining({
            activitiesCompleted: expect.any(Number),
            timeSpent: expect.any(Number),
            averageScore: expect.any(Number)
          }),
          weeklyProgress: expect.objectContaining({
            activitiesCompleted: expect.any(Number),
            timeSpent: expect.any(Number),
            streak: expect.any(Number)
          })
        })
      );
    });
  });
});