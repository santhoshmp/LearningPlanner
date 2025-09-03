import request from 'supertest';
import express from 'express';
import childRoutes from '../child';
import { authenticateToken } from '../../middleware/auth';

// Mock the middleware and services
jest.mock('../../middleware/auth');
jest.mock('../../services/childProgressService');
jest.mock('../../services/childBadgeService');
jest.mock('../../utils/logger');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

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
});