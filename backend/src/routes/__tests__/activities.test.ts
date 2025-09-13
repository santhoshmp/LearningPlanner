import request from 'supertest';
import * as express from 'express';
import activitiesRoutes from '../activities';
import { authenticateToken, requireChild } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../../middleware/auth');
jest.mock('../../utils/logger');
jest.mock('@prisma/client');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequireChild = requireChild as jest.MockedFunction<typeof requireChild>;

// Mock Prisma Client
const mockPrisma = {
  studyActivity: {
    findUnique: jest.fn(),
    count: jest.fn()
  },
  progressRecord: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  studyPlan: {
    update: jest.fn()
  }
} as unknown as PrismaClient;

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

describe('Activities Routes', () => {
  let app: express.Application;
  const testChildId = 'test-child-id';
  const testActivityId = 'test-activity-id';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to pass through with child user
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        userId: testChildId,
        role: 'CHILD'
      };
      next();
    });
    
    mockRequireChild.mockImplementation((req: any, res: any, next: any) => {
      if (req.user?.role !== 'CHILD') {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Child authentication required'
          }
        });
      }
      next();
    });
    
    app.use('/api/activities', activitiesRoutes);
    jest.clearAllMocks();
  });

  describe('GET /:activityId/progress', () => {
    it('should get activity progress successfully', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        plan: {
          childId: testChildId
        }
      };

      const mockProgress = {
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 75,
        timeSpent: 300,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(200);
      expect(response.body.progress).toEqual(mockProgress);
      expect(response.body.message).toBe('Activity progress retrieved successfully');
    });

    it('should return default progress when no record exists', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        plan: {
          childId: testChildId
        }
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(200);
      expect(response.body.progress.status).toBe('NOT_STARTED');
      expect(response.body.progress.timeSpent).toBe(0);
    });

    it('should return 404 when activity not found', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ACTIVITY_NOT_FOUND');
    });

    it('should return 403 when child does not have access to activity', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        plan: {
          childId: 'different-child-id'
        }
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: testChildId,
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /:activityId/start', () => {
    it('should start activity successfully when no progress exists', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: JSON.stringify({ type: 'quiz', questions: [] }),
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        plan: {
          childId: testChildId
        }
      };

      const mockProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: null,
        timeSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.progressRecord.create as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/start`);

      expect(response.status).toBe(200);
      expect(response.body.progress).toEqual(mockProgress);
      expect(response.body.activity.id).toBe(testActivityId);
      expect(response.body.message).toBe('Activity started successfully');
      expect(mockPrisma.progressRecord.create).toHaveBeenCalledWith({
        data: {
          activityId: testActivityId,
          childId: testChildId,
          status: 'IN_PROGRESS',
          score: null,
          timeSpent: 0
        }
      });
    });

    it('should update existing progress when activity already started', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: JSON.stringify({ type: 'quiz' }),
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        plan: {
          childId: testChildId
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'NOT_STARTED',
        score: null,
        timeSpent: 0
      };

      const updatedProgress = {
        ...existingProgress,
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/start`);

      expect(response.status).toBe(200);
      expect(response.body.progress.status).toBe('IN_PROGRESS');
      expect(mockPrisma.progressRecord.update).toHaveBeenCalled();
    });

    it('should not update completed activities', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: JSON.stringify({ type: 'quiz' }),
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        plan: {
          childId: testChildId
        }
      };

      const completedProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'COMPLETED',
        score: 100,
        timeSpent: 1800
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(completedProgress);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/start`);

      expect(response.status).toBe(200);
      expect(response.body.progress.status).toBe('COMPLETED');
      expect(mockPrisma.progressRecord.update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:activityId/progress', () => {
    it('should update activity progress successfully', async () => {
      const mockActivity = {
        id: testActivityId,
        plan: {
          childId: testChildId
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 50,
        timeSpent: 600
      };

      const updatedProgress = {
        ...existingProgress,
        status: 'COMPLETED',
        score: 85,
        timeSpent: 1200,
        completedAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({
          status: 'COMPLETED',
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(200);
      expect(response.body.progress).toEqual(updatedProgress);
      expect(response.body.message).toBe('Activity progress updated successfully');
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          score: 85,
          timeSpent: 1200,
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should return 404 when progress record not found', async () => {
      const mockActivity = {
        id: testActivityId,
        plan: {
          childId: testChildId
        }
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({
          status: 'COMPLETED',
          score: 85
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROGRESS_NOT_FOUND');
      expect(response.body.error.message).toContain('Start the activity first');
    });

    it('should handle partial updates', async () => {
      const mockActivity = {
        id: testActivityId,
        plan: {
          childId: testChildId
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 50,
        timeSpent: 600
      };

      const updatedProgress = {
        ...existingProgress,
        timeSpent: 900,
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({
          timeSpent: 900
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: expect.objectContaining({
          timeSpent: 900,
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should handle empty request body gracefully', async () => {
      const mockActivity = {
        id: testActivityId,
        plan: {
          childId: testChildId
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 50,
        timeSpent: 600
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(existingProgress);

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({});

      expect(response.status).toBe(200);
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: expect.objectContaining({
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should handle score of 0 correctly', async () => {
      const mockActivity = {
        id: testActivityId,
        plan: {
          childId: testChildId
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: null,
        timeSpent: 600
      };

      const updatedProgress = {
        ...existingProgress,
        score: 0,
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({
          score: 0
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: expect.objectContaining({
          score: 0,
          updatedAt: expect.any(Date)
        })
      });
    });
  });

  describe('GET /:activityId', () => {
    it('should get activity details successfully', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: JSON.stringify({ type: 'quiz', questions: [] }),
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        prerequisites: JSON.stringify(['basic-math']),
        completionCriteria: JSON.stringify({ minScore: 70 }),
        plan: {
          childId: testChildId,
          subject: 'Mathematics',
          difficulty: 'MEDIUM'
        },
        progressRecords: [{
          id: 'progress-id',
          status: 'IN_PROGRESS',
          score: 50,
          timeSpent: 600
        }]
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}`);

      expect(response.status).toBe(200);
      expect(response.body.activity.id).toBe(testActivityId);
      expect(response.body.activity.title).toBe('Test Activity');
      expect(response.body.activity.content).toEqual({ type: 'quiz', questions: [] });
      expect(response.body.activity.prerequisites).toEqual(['basic-math']);
      expect(response.body.activity.completionCriteria).toEqual({ minScore: 70 });
      expect(response.body.activity.progress).toEqual(mockActivity.progressRecords[0]);
      expect(response.body.message).toBe('Activity retrieved successfully');
    });

    it('should return activity with null progress when no progress exists', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: JSON.stringify({ type: 'quiz' }),
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        prerequisites: JSON.stringify([]),
        completionCriteria: JSON.stringify({}),
        plan: {
          childId: testChildId,
          subject: 'Mathematics',
          difficulty: 'MEDIUM'
        },
        progressRecords: []
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}`);

      expect(response.status).toBe(200);
      expect(response.body.activity.progress).toBeNull();
    });

    it('should handle malformed JSON in activity content gracefully', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        description: 'Test Description',
        content: 'invalid json',
        estimatedDuration: 30,
        difficulty: 'MEDIUM',
        prerequisites: JSON.stringify([]),
        completionCriteria: JSON.stringify({}),
        plan: {
          childId: testChildId,
          subject: 'Mathematics',
          difficulty: 'MEDIUM'
        },
        progressRecords: []
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /:activityId/submit', () => {
    beforeEach(() => {
      // Add additional mock methods for submit endpoint
      mockPrisma.studyActivity.count = jest.fn();
      mockPrisma.progressRecord.count = jest.fn();
      mockPrisma.studyPlan = {
        update: jest.fn()
      } as any;
    });

    it('should submit activity completion successfully for new progress record', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        estimatedDuration: 30,
        plan: {
          childId: testChildId,
          subject: 'Mathematics'
        }
      };

      const mockProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'COMPLETED',
        score: 85,
        timeSpent: 1800,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.progressRecord.create as jest.Mock).mockResolvedValue(mockProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(3);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          answers: { question1: 'answer1', question2: 'answer2' },
          score: 85,
          timeSpent: 1800
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.progress).toEqual(mockProgress);
      expect(response.body.activity.id).toBe(testActivityId);
      expect(response.body.activity.title).toBe('Test Activity');
      expect(response.body.activity.subject).toBe('Mathematics');
      expect(response.body.planProgress.completedActivities).toBe(3);
      expect(response.body.planProgress.totalActivities).toBe(5);
      expect(response.body.planProgress.completionPercentage).toBe(60);
      expect(response.body.planProgress.isPlanCompleted).toBe(false);
      expect(response.body.message).toBe('Activity submitted successfully');

      expect(mockPrisma.progressRecord.create).toHaveBeenCalledWith({
        data: {
          activityId: testActivityId,
          childId: testChildId,
          status: 'COMPLETED',
          score: 85,
          timeSpent: 1800,
          completedAt: expect.any(Date)
        }
      });
    });

    it('should update existing progress record when submitting', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        estimatedDuration: 30,
        plan: {
          childId: testChildId,
          subject: 'Mathematics'
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 50,
        timeSpent: 900
      };

      const updatedProgress = {
        ...existingProgress,
        status: 'COMPLETED',
        score: 90,
        timeSpent: 1500,
        completedAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(4);
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          answers: { question1: 'correct' },
          score: 90,
          timeSpent: 1500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.progress).toEqual(updatedProgress);
      expect(response.body.planProgress.completionPercentage).toBe(50);

      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: {
          status: 'COMPLETED',
          score: 90,
          timeSpent: 1500,
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should use default values when score or timeSpent not provided', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        estimatedDuration: 45,
        plan: {
          childId: testChildId,
          subject: 'Science'
        }
      };

      const mockProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'COMPLETED',
        score: 100,
        timeSpent: 45,
        completedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.progressRecord.create as jest.Mock).mockResolvedValue(mockProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          answers: { question1: 'answer' }
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.progressRecord.create).toHaveBeenCalledWith({
        data: {
          activityId: testActivityId,
          childId: testChildId,
          status: 'COMPLETED',
          score: 100, // Default score
          timeSpent: 45, // Default to estimatedDuration
          completedAt: expect.any(Date)
        }
      });
    });

    it('should complete study plan when all activities are finished', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Final Activity',
        planId: 'test-plan-id',
        estimatedDuration: 30,
        plan: {
          childId: testChildId,
          subject: 'Mathematics'
        }
      };

      const mockProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'COMPLETED',
        score: 95,
        timeSpent: 1200,
        completedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.progressRecord.create as jest.Mock).mockResolvedValue(mockProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(3); // Total activities
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(3); // All completed
      (mockPrisma.studyPlan.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 95,
          timeSpent: 1200
        });

      expect(response.status).toBe(200);
      expect(response.body.planProgress.isPlanCompleted).toBe(true);
      expect(response.body.planProgress.completionPercentage).toBe(100);

      expect(mockPrisma.studyPlan.update).toHaveBeenCalledWith({
        where: { id: 'test-plan-id' },
        data: { status: 'COMPLETED' }
      });
    });

    it('should return 401 when child authentication is missing', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = null;
        next();
      });

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Child authentication required');
    });

    it('should return 404 when activity not found', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ACTIVITY_NOT_FOUND');
      expect(response.body.error.message).toBe('Activity not found');
    });

    it('should return 403 when child does not have access to activity', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        plan: {
          childId: 'different-child-id', // Different child
          subject: 'Mathematics'
        }
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
      expect(response.body.error.message).toBe('Access denied to this activity');
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SUBMIT_FAILED');
      expect(response.body.error.message).toBe('Failed to submit activity');
    });

    it('should preserve existing score and timeSpent when updating progress', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        estimatedDuration: 30,
        plan: {
          childId: testChildId,
          subject: 'Mathematics'
        }
      };

      const existingProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'IN_PROGRESS',
        score: 75,
        timeSpent: 1000
      };

      const updatedProgress = {
        ...existingProgress,
        status: 'COMPLETED',
        score: 75, // Should preserve existing score
        timeSpent: 1000, // Should preserve existing timeSpent
        completedAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.progressRecord.update as jest.Mock).mockResolvedValue(updatedProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          answers: { question1: 'answer' }
          // No score or timeSpent provided
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.progressRecord.update).toHaveBeenCalledWith({
        where: { id: 'progress-id' },
        data: {
          status: 'COMPLETED',
          score: 75, // Preserved existing score
          timeSpent: 1000, // Preserved existing timeSpent
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should include request ID and timestamp in error responses', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1200
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toHaveProperty('requestId');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle zero completion percentage correctly', async () => {
      const mockActivity = {
        id: testActivityId,
        title: 'Test Activity',
        planId: 'test-plan-id',
        estimatedDuration: 30,
        plan: {
          childId: testChildId,
          subject: 'Mathematics'
        }
      };

      const mockProgress = {
        id: 'progress-id',
        activityId: testActivityId,
        childId: testChildId,
        status: 'COMPLETED',
        score: 85,
        timeSpent: 1800,
        completedAt: new Date()
      };

      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(mockActivity);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.progressRecord.create as jest.Mock).mockResolvedValue(mockProgress);
      (mockPrisma.studyActivity.count as jest.Mock).mockResolvedValue(0); // No activities in plan
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/submit`)
        .send({
          score: 85,
          timeSpent: 1800
        });

      expect(response.status).toBe(200);
      expect(response.body.planProgress.completionPercentage).toBe(0);
      expect(response.body.planProgress.isPlanCompleted).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('FETCH_FAILED');
    });

    it('should handle missing user ID', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = null;
        next();
      });

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should include request ID in error responses', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/activities/${testActivityId}/progress`);

      expect(response.status).toBe(404);
      expect(response.body.error).toHaveProperty('requestId');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should handle database errors in start activity endpoint', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post(`/api/activities/${testActivityId}/start`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('START_FAILED');
    });

    it('should handle database errors in update progress endpoint', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/activities/${testActivityId}/progress`)
        .send({ status: 'COMPLETED', score: 85 });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('UPDATE_FAILED');
    });

    it('should handle database errors in get activity endpoint', async () => {
      (mockPrisma.studyActivity.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/activities/${testActivityId}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      const endpoints = [
        { method: 'get', path: `/api/activities/${testActivityId}/progress` },
        { method: 'post', path: `/api/activities/${testActivityId}/start` },
        { method: 'put', path: `/api/activities/${testActivityId}/progress` },
        { method: 'get', path: `/api/activities/${testActivityId}` },
        { method: 'post', path: `/api/activities/${testActivityId}/submit` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method as keyof typeof request](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should require child role for all endpoints', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: testChildId,
          role: 'PARENT'
        };
        next();
      });

      const endpoints = [
        { method: 'get', path: `/api/activities/${testActivityId}/progress` },
        { method: 'post', path: `/api/activities/${testActivityId}/start` },
        { method: 'put', path: `/api/activities/${testActivityId}/progress` },
        { method: 'get', path: `/api/activities/${testActivityId}` },
        { method: 'post', path: `/api/activities/${testActivityId}/submit` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method as keyof typeof request](endpoint.path);
        expect(response.status).toBe(401);
      }
    });
  });
});