import request from 'supertest';
import express from 'express';
import childRoutes from '../child';
import { authenticateToken } from '../../middleware/auth';

// Mock the middleware and services
jest.mock('../../middleware/auth');
jest.mock('../../services/childProgressService');
jest.mock('../../services/childBadgeService');
jest.mock('../../utils/logger');
jest.mock('../../services/studyPlanLoggingService');
jest.mock('../../middleware/studyPlanLoggingMiddleware');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

// Mock the logging middleware
jest.mock('../../middleware/studyPlanLoggingMiddleware', () => ({
  dashboardLogging: jest.fn(() => [
    (req: any, res: any, next: any) => {
      res.locals = { startTime: Date.now() };
      next();
    },
    (req: any, res: any, next: any) => next()
  ]),
  progressUpdateLogging: jest.fn(() => [
    (req: any, res: any, next: any) => {
      res.locals = { startTime: Date.now(), requestData: req.body };
      next();
    },
    (req: any, res: any, next: any) => next()
  ]),
  monitorDatabaseOperation: jest.fn((operation, table, queryType, dbOperation, metadata) => dbOperation())
}));

describe('Child API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to pass through
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        userId: 'test-child-id',
        role: 'CHILD'
      };
      next();
    });
    
    app.use('/api/child', childRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/child/:childId/dashboard', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .get('/api/child/test-child-id/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });

    it('should deny access to different child dashboard', async () => {
      const response = await request(app)
        .get('/api/child/different-child-id/dashboard');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/child/activity/:activityId/progress', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .post('/api/child/activity/test-activity-id/progress')
        .send({
          activityId: 'test-activity-id',
          timeSpent: 300
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/child/activity/test-activity-id/progress')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/child/activity/:activityId/complete', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .post('/api/child/activity/test-activity-id/complete')
        .send({
          activityId: 'test-activity-id',
          score: 85,
          timeSpent: 600,
          sessionData: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });
  });

  describe('GET /api/child/:childId/badges', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .get('/api/child/test-child-id/badges');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });

    it('should deny access to different child badges', async () => {
      const response = await request(app)
        .get('/api/child/different-child-id/badges');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('GET /api/child/:childId/badges/progress', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .get('/api/child/test-child-id/badges/progress');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });
  });

  describe('POST /api/child/:childId/badges/celebrate', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .post('/api/child/test-child-id/badges/celebrate')
        .send({
          achievementId: 'test-achievement-id'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });
  });

  describe('GET /api/child/:childId/achievements', () => {
    it('should require child authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'test-child-id',
          role: 'PARENT' // Wrong role
        };
        next();
      });

      const response = await request(app)
        .get('/api/child/test-child-id/achievements');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('CHILD_AUTH_REQUIRED');
    });
  });

  describe('Logging Middleware Integration', () => {
    const { dashboardLogging, progressUpdateLogging } = require('../../middleware/studyPlanLoggingMiddleware');

    it('should apply dashboard logging middleware to dashboard routes', async () => {
      // Mock successful dashboard response
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient = jest.fn(() => ({
        childProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'test-child-id',
            name: 'Test Child',
            age: 10,
            gradeLevel: 5
          })
        },
        studyPlan: {
          findMany: jest.fn().mockResolvedValue([])
        },
        progressRecord: {
          findMany: jest.fn().mockResolvedValue([])
        },
        learningStreak: {
          findMany: jest.fn().mockResolvedValue([])
        },
        achievement: {
          findMany: jest.fn().mockResolvedValue([])
        }
      }));

      const response = await request(app)
        .get('/api/child/test-child-id/dashboard');

      // Verify dashboard logging middleware was called
      expect(dashboardLogging).toHaveBeenCalledWith('DASHBOARD_ACCESS');
    });

    it('should apply progress logging middleware to progress routes', async () => {
      const response = await request(app)
        .post('/api/child/activity/test-activity-id/progress')
        .send({
          activityId: 'test-activity-id',
          timeSpent: 300,
          score: 85
        });

      // Verify progress logging middleware was called
      expect(progressUpdateLogging).toHaveBeenCalledWith('PROGRESS_UPDATE');
    });

    it('should apply progress logging middleware to completion routes', async () => {
      const response = await request(app)
        .post('/api/child/activity/test-activity-id/complete')
        .send({
          activityId: 'test-activity-id',
          score: 85,
          timeSpent: 600,
          sessionData: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        });

      // Verify progress logging middleware was called
      expect(progressUpdateLogging).toHaveBeenCalledWith('ACTIVITY_COMPLETION');
    });
  });

  describe('Database Operation Monitoring', () => {
    const { monitorDatabaseOperation } = require('../../middleware/studyPlanLoggingMiddleware');

    it('should monitor database operations in dashboard endpoint', async () => {
      // Mock the database operations to verify monitoring
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient = jest.fn(() => ({
        childProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'test-child-id',
            name: 'Test Child'
          })
        },
        studyPlan: {
          findMany: jest.fn().mockResolvedValue([])
        },
        progressRecord: {
          findMany: jest.fn().mockResolvedValue([])
        },
        learningStreak: {
          findMany: jest.fn().mockResolvedValue([])
        },
        achievement: {
          findMany: jest.fn().mockResolvedValue([])
        }
      }));

      const response = await request(app)
        .get('/api/child/test-child-id/dashboard');

      // Verify that database monitoring was used
      expect(monitorDatabaseOperation).toHaveBeenCalled();
    });
  });
});