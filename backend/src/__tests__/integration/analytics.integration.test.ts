import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createServer } from 'http';

// Import your app setup
import { setupApp } from '../../app';

describe('Analytics Data Pipeline Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let prisma: PrismaClient;
  let testUser: any;
  let testChild: any;
  let testStudyPlan: any;
  let authToken: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

    // Initialize Prisma
    prisma = new PrismaClient();
    
    // Set up Express app
    app = setupApp();
    server = createServer(app);
    
    // Clean up database
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Child", "StudyPlan", "StudyActivity", "ActivityCompletion", "ContentInteraction", "AnalyticsEvent", "LearningInsight", "PerformancePrediction" CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create test user and child
    testUser = await prisma.user.create({
      data: {
        email: 'parent@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT'
      }
    });

    testChild = await prisma.child.create({
      data: {
        parentId: testUser.id,
        firstName: 'Test',
        lastName: 'Child',
        age: 10,
        gradeLevel: '5th Grade'
      }
    });

    // Create test study plan
    testStudyPlan = await prisma.studyPlan.create({
      data: {
        childId: testChild.id,
        subject: 'Mathematics',
        difficulty: 'INTERMEDIATE',
        status: 'active',
        objectives: [
          { id: '1', description: 'Learn fractions', completed: false },
          { id: '2', description: 'Understand decimals', completed: false }
        ]
      }
    });

    // Generate auth token (simplified for testing)
    authToken = `Bearer test-token-${testUser.id}`;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.performancePrediction.deleteMany();
    await prisma.learningInsight.deleteMany();
    await prisma.analyticsEvent.deleteMany();
    await prisma.contentInteraction.deleteMany();
    await prisma.activityCompletion.deleteMany();
    await prisma.studyActivity.deleteMany();
    await prisma.studyPlan.deleteMany();
    await prisma.child.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Activity Completion Analytics', () => {
    let testActivity: any;

    beforeEach(async () => {
      testActivity = await prisma.studyActivity.create({
        data: {
          planId: testStudyPlan.id,
          title: 'Fraction Basics',
          description: 'Learn basic fraction concepts',
          subject: 'Mathematics',
          estimatedDuration: 30,
          difficulty: 3,
          prerequisites: [],
          completionCriteria: {
            type: 'score',
            threshold: 80
          },
          content: {
            type: 'video',
            data: {
              videoUrl: 'https://example.com/fractions.mp4',
              duration: 1800
            }
          }
        }
      });
    });

    it('should track activity completion and generate analytics', async () => {
      // Complete the activity
      const completionResponse = await request(app)
        .post(`/api/activities/${testActivity.id}/complete`)
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          score: 85,
          timeSpent: 25, // minutes
          attempts: 1,
          completedAt: new Date().toISOString()
        })
        .expect(200);

      expect(completionResponse.body.success).toBe(true);

      // Verify completion was recorded
      const completion = await prisma.activityCompletion.findFirst({
        where: {
          activityId: testActivity.id,
          childId: testChild.id
        }
      });

      expect(completion).toBeTruthy();
      expect(completion?.score).toBe(85);
      expect(completion?.timeSpent).toBe(25);

      // Check that analytics event was created
      const analyticsEvent = await prisma.analyticsEvent.findFirst({
        where: {
          childId: testChild.id,
          eventType: 'activity_completed'
        }
      });

      expect(analyticsEvent).toBeTruthy();
      expect(analyticsEvent?.metadata).toEqual(
        expect.objectContaining({
          activityId: testActivity.id,
          score: 85,
          timeSpent: 25,
          subject: 'Mathematics'
        })
      );

      // Get analytics data
      const analyticsResponse = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        .set('Authorization', authToken)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(analyticsResponse.body.overallProgress.totalActivitiesCompleted).toBe(1);
      expect(analyticsResponse.body.overallProgress.averageScore).toBe(85);
      expect(analyticsResponse.body.overallProgress.totalTimeSpent).toBe(25);
      expect(analyticsResponse.body.subjectBreakdown).toHaveLength(1);
      expect(analyticsResponse.body.subjectBreakdown[0].subject).toBe('Mathematics');
    });

    it('should handle multiple activity completions and calculate trends', async () => {
      // Create multiple activities
      const activities = await Promise.all([
        prisma.studyActivity.create({
          data: {
            planId: testStudyPlan.id,
            title: 'Activity 1',
            description: 'First activity',
            subject: 'Mathematics',
            estimatedDuration: 20,
            difficulty: 2,
            prerequisites: [],
            completionCriteria: { type: 'completion', threshold: 100 },
            content: { type: 'text', data: {} }
          }
        }),
        prisma.studyActivity.create({
          data: {
            planId: testStudyPlan.id,
            title: 'Activity 2',
            description: 'Second activity',
            subject: 'Mathematics',
            estimatedDuration: 25,
            difficulty: 3,
            prerequisites: [],
            completionCriteria: { type: 'score', threshold: 75 },
            content: { type: 'video', data: {} }
          }
        }),
        prisma.studyActivity.create({
          data: {
            planId: testStudyPlan.id,
            title: 'Activity 3',
            description: 'Third activity',
            subject: 'Mathematics',
            estimatedDuration: 30,
            difficulty: 4,
            prerequisites: [],
            completionCriteria: { type: 'score', threshold: 80 },
            content: { type: 'interactive', data: {} }
          }
        })
      ]);

      // Complete activities with improving scores
      const completions = [
        { activityId: activities[0].id, score: 75, timeSpent: 18 },
        { activityId: activities[1].id, score: 82, timeSpent: 22 },
        { activityId: activities[2].id, score: 88, timeSpent: 26 }
      ];

      for (const completion of completions) {
        await request(app)
          .post(`/api/activities/${completion.activityId}/complete`)
          .set('Authorization', authToken)
          .send({
            childId: testChild.id,
            score: completion.score,
            timeSpent: completion.timeSpent,
            attempts: 1,
            completedAt: new Date().toISOString()
          })
          .expect(200);
      }

      // Get analytics with trend analysis
      const analyticsResponse = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        .set('Authorization', authToken)
        .query({
          includeTrends: true,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(analyticsResponse.body.overallProgress.totalActivitiesCompleted).toBe(3);
      expect(analyticsResponse.body.overallProgress.averageScore).toBeCloseTo(81.67, 1);
      expect(analyticsResponse.body.overallProgress.improvementRate).toBeGreaterThan(0);

      // Check for learning insights
      expect(analyticsResponse.body.insights).toBeDefined();
      expect(analyticsResponse.body.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Content Interaction Tracking', () => {
    it('should track content interactions and analyze patterns', async () => {
      // Track multiple content interactions
      const interactions = [
        {
          contentType: 'video',
          interactionType: 'view',
          duration: 300,
          progressPercentage: 100,
          metadata: { subject: 'Mathematics', topic: 'Fractions' }
        },
        {
          contentType: 'interactive',
          interactionType: 'complete',
          duration: 600,
          progressPercentage: 100,
          metadata: { subject: 'Mathematics', topic: 'Decimals' }
        },
        {
          contentType: 'article',
          interactionType: 'view',
          duration: 240,
          progressPercentage: 75,
          metadata: { subject: 'Science', topic: 'Plants' }
        }
      ];

      for (const interaction of interactions) {
        await request(app)
          .post('/api/analytics/track-interaction')
          .set('Authorization', authToken)
          .send({
            childId: testChild.id,
            ...interaction,
            timestamp: new Date().toISOString()
          })
          .expect(200);
      }

      // Get analytics with content interaction patterns
      const analyticsResponse = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        .set('Authorization', authToken)
        .query({
          includeContentInteractions: true,
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(analyticsResponse.body.contentInteractions).toHaveLength(3);
      expect(analyticsResponse.body.learningPatterns.preferredContentTypes).toContain('video');
      expect(analyticsResponse.body.learningPatterns.preferredContentTypes).toContain('interactive');
    });

    it('should identify peak learning hours from interaction timestamps', async () => {
      // Create interactions at different times
      const now = new Date();
      const interactions = [
        { hour: 9, count: 2 },   // Morning
        { hour: 14, count: 1 },  // Early afternoon
        { hour: 16, count: 4 },  // Late afternoon (peak)
        { hour: 17, count: 3 },  // Evening
        { hour: 20, count: 1 }   // Night
      ];

      for (const { hour, count } of interactions) {
        for (let i = 0; i < count; i++) {
          const timestamp = new Date(now);
          timestamp.setHours(hour, Math.random() * 60, 0, 0);

          await request(app)
            .post('/api/analytics/track-interaction')
            .set('Authorization', authToken)
            .send({
              childId: testChild.id,
              contentType: 'video',
              interactionType: 'view',
              duration: 300,
              progressPercentage: 100,
              timestamp: timestamp.toISOString(),
              metadata: { subject: 'Mathematics' }
            })
            .expect(200);
        }
      }

      // Get learning patterns
      const analyticsResponse = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        .set('Authorization', authToken)
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(analyticsResponse.body.learningPatterns.peakLearningHours).toContain(16);
    });
  });

  describe('Learning Insights Generation', () => {
    it('should generate AI insights based on performance data', async () => {
      // Create performance data showing improvement
      const activities = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          prisma.studyActivity.create({
            data: {
              planId: testStudyPlan.id,
              title: `Math Activity ${i + 1}`,
              description: `Activity ${i + 1}`,
              subject: 'Mathematics',
              estimatedDuration: 20,
              difficulty: 3,
              prerequisites: [],
              completionCriteria: { type: 'score', threshold: 80 },
              content: { type: 'video', data: {} }
            }
          })
        )
      );

      // Complete activities with improving scores
      for (let i = 0; i < activities.length; i++) {
        await prisma.activityCompletion.create({
          data: {
            activityId: activities[i].id,
            childId: testChild.id,
            score: 70 + i * 4, // Improving from 70 to 86
            timeSpent: 25 - i, // Getting more efficient
            attempts: 1,
            completedAt: new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000)
          }
        });
      }

      // Generate insights
      const insightsResponse = await request(app)
        .post(`/api/analytics/generate-insights/${testChild.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(insightsResponse.body.insights).toBeDefined();
      expect(insightsResponse.body.insights.length).toBeGreaterThan(0);

      // Check for performance trend insight
      const performanceInsight = insightsResponse.body.insights.find(
        (insight: any) => insight.type === 'performance_trend'
      );

      expect(performanceInsight).toBeTruthy();
      expect(performanceInsight.confidence).toBeGreaterThan(0.7);
      expect(performanceInsight.actionable).toBe(true);

      // Verify insights were saved to database
      const savedInsights = await prisma.learningInsight.findMany({
        where: { childId: testChild.id }
      });

      expect(savedInsights.length).toBeGreaterThan(0);
    });

    it('should identify struggling areas and provide recommendations', async () => {
      // Create activities with poor performance
      const activities = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          prisma.studyActivity.create({
            data: {
              planId: testStudyPlan.id,
              title: `Difficult Activity ${i + 1}`,
              description: `Challenging activity ${i + 1}`,
              subject: 'Mathematics',
              estimatedDuration: 30,
              difficulty: 5,
              prerequisites: [],
              completionCriteria: { type: 'score', threshold: 80 },
              content: { type: 'interactive', data: {} }
            }
          })
        )
      );

      // Complete activities with low scores and multiple attempts
      for (let i = 0; i < activities.length; i++) {
        await prisma.activityCompletion.create({
          data: {
            activityId: activities[i].id,
            childId: testChild.id,
            score: 45 + i * 5, // Low scores: 45, 50, 55
            timeSpent: 45 + i * 5, // Taking longer
            attempts: 3 - i, // Multiple attempts
            completedAt: new Date(Date.now() - (2 - i) * 24 * 60 * 60 * 1000)
          }
        });
      }

      // Generate insights
      const insightsResponse = await request(app)
        .post(`/api/analytics/generate-insights/${testChild.id}`)
        .set('Authorization', authToken)
        .expect(200);

      // Check for struggling area insight
      const strugglingInsight = insightsResponse.body.insights.find(
        (insight: any) => insight.type === 'struggling_area'
      );

      expect(strugglingInsight).toBeTruthy();
      expect(strugglingInsight.title).toContain('Mathematics');
      expect(strugglingInsight.recommendations).toBeDefined();
      expect(strugglingInsight.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Predictions', () => {
    it('should generate performance predictions based on historical data', async () => {
      // Create historical performance data
      const activities = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          prisma.studyActivity.create({
            data: {
              planId: testStudyPlan.id,
              title: `History Activity ${i + 1}`,
              description: `Historical activity ${i + 1}`,
              subject: 'Mathematics',
              estimatedDuration: 25,
              difficulty: 3,
              prerequisites: [],
              completionCriteria: { type: 'score', threshold: 75 },
              content: { type: 'video', data: {} }
            }
          })
        )
      );

      // Create consistent performance pattern
      for (let i = 0; i < activities.length; i++) {
        await prisma.activityCompletion.create({
          data: {
            activityId: activities[i].id,
            childId: testChild.id,
            score: 75 + Math.sin(i * 0.5) * 10 + i * 2, // Trending upward with variation
            timeSpent: 25 - i * 0.5, // Getting more efficient
            attempts: 1,
            completedAt: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000)
          }
        });
      }

      // Generate predictions
      const predictionsResponse = await request(app)
        .post(`/api/analytics/generate-predictions/${testChild.id}`)
        .set('Authorization', authToken)
        .send({
          subject: 'Mathematics',
          timeframe: '1_week'
        })
        .expect(200);

      expect(predictionsResponse.body.prediction).toBeDefined();
      expect(predictionsResponse.body.prediction.subject).toBe('Mathematics');
      expect(predictionsResponse.body.prediction.predictedScore).toBeGreaterThan(0);
      expect(predictionsResponse.body.prediction.confidence).toBeGreaterThan(0);
      expect(predictionsResponse.body.prediction.factors).toBeDefined();
      expect(predictionsResponse.body.prediction.recommendations).toBeDefined();

      // Verify prediction was saved
      const savedPrediction = await prisma.performancePrediction.findFirst({
        where: {
          childId: testChild.id,
          subject: 'Mathematics'
        }
      });

      expect(savedPrediction).toBeTruthy();
    });

    it('should handle insufficient data for predictions', async () => {
      // Try to generate prediction with no historical data
      const predictionsResponse = await request(app)
        .post(`/api/analytics/generate-predictions/${testChild.id}`)
        .set('Authorization', authToken)
        .send({
          subject: 'Science',
          timeframe: '1_week'
        })
        .expect(200);

      expect(predictionsResponse.body.prediction.confidence).toBeLessThan(0.5);
      expect(predictionsResponse.body.prediction.factors).toContain('insufficient_data');
    });
  });

  describe('Analytics Export', () => {
    beforeEach(async () => {
      // Create sample data for export
      const activity = await prisma.studyActivity.create({
        data: {
          planId: testStudyPlan.id,
          title: 'Export Test Activity',
          description: 'Activity for export testing',
          subject: 'Mathematics',
          estimatedDuration: 30,
          difficulty: 3,
          prerequisites: [],
          completionCriteria: { type: 'score', threshold: 80 },
          content: { type: 'video', data: {} }
        }
      });

      await prisma.activityCompletion.create({
        data: {
          activityId: activity.id,
          childId: testChild.id,
          score: 85,
          timeSpent: 28,
          attempts: 1,
          completedAt: new Date()
        }
      });
    });

    it('should export analytics data in CSV format', async () => {
      const exportResponse = await request(app)
        .post(`/api/analytics/export/${testChild.id}`)
        .set('Authorization', authToken)
        .send({
          format: 'csv',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(exportResponse.body.format).toBe('csv');
      expect(exportResponse.body.data).toContain('date,subject,activity,score,timeSpent,completed');
      expect(exportResponse.body.data).toContain('Mathematics');
      expect(exportResponse.body.data).toContain('Export Test Activity');
      expect(exportResponse.body.filename).toMatch(/analytics_.*\.csv$/);
    });

    it('should export analytics data in JSON format', async () => {
      const exportResponse = await request(app)
        .post(`/api/analytics/export/${testChild.id}`)
        .set('Authorization', authToken)
        .send({
          format: 'json',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(exportResponse.body.format).toBe('json');
      
      const exportedData = JSON.parse(exportResponse.body.data);
      expect(exportedData).toHaveLength(1);
      expect(exportedData[0]).toEqual(
        expect.objectContaining({
          subject: 'Mathematics',
          score: 85,
          timeSpent: 28
        })
      );
      expect(exportResponse.body.filename).toMatch(/analytics_.*\.json$/);
    });
  });

  describe('Real-time Analytics Updates', () => {
    it('should process real-time analytics updates', async () => {
      const updateData = {
        childId: testChild.id,
        eventType: 'activity_started',
        activityId: 'test-activity-123',
        timestamp: new Date().toISOString(),
        metadata: {
          subject: 'Mathematics',
          estimatedDuration: 30
        }
      };

      const response = await request(app)
        .post('/api/analytics/realtime-update')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.processed).toBe(true);
      expect(response.body.eventId).toBeDefined();

      // Verify event was recorded
      const analyticsEvent = await prisma.analyticsEvent.findFirst({
        where: {
          childId: testChild.id,
          eventType: 'activity_started'
        }
      });

      expect(analyticsEvent).toBeTruthy();
      expect(analyticsEvent?.metadata).toEqual(
        expect.objectContaining({
          subject: 'Mathematics',
          estimatedDuration: 30
        })
      );
    });

    it('should get real-time metrics', async () => {
      // Create some recent activity
      const activity = await prisma.studyActivity.create({
        data: {
          planId: testStudyPlan.id,
          title: 'Realtime Activity',
          description: 'Activity for realtime testing',
          subject: 'Mathematics',
          estimatedDuration: 20,
          difficulty: 2,
          prerequisites: [],
          completionCriteria: { type: 'completion', threshold: 100 },
          content: { type: 'text', data: {} }
        }
      });

      await prisma.activityCompletion.create({
        data: {
          activityId: activity.id,
          childId: testChild.id,
          score: 90,
          timeSpent: 18,
          attempts: 1,
          completedAt: new Date()
        }
      });

      const metricsResponse = await request(app)
        .get(`/api/analytics/realtime-metrics/${testChild.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(metricsResponse.body).toEqual(
        expect.objectContaining({
          activeSession: expect.any(Boolean),
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

  describe('Analytics Error Handling', () => {
    it('should handle invalid child ID', async () => {
      const response = await request(app)
        .get('/api/analytics/detailed/invalid-child-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.error).toContain('Child not found');
    });

    it('should handle invalid date ranges', async () => {
      const response = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        .set('Authorization', authToken)
        .query({
          startDate: 'invalid-date',
          endDate: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid date format');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/analytics/detailed/${testChild.id}`)
        // No authorization header
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });
  });
});