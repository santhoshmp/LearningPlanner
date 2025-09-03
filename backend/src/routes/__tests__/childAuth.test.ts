import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import { authService } from '../../services/authService';

// Mock dependencies
jest.mock('../../services/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Mock authentication middleware for logout tests
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'child-123', role: 'CHILD' };
    next();
  },
  requireParent: (req: any, res: any, next: any) => next(),
  requireRole: () => (req: any, res: any, next: any) => next(),
  requireChild: (req: any, res: any, next: any) => next(),
  requireParentOrChild: (req: any, res: any, next: any) => next()
}));

describe('Child Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/child/login', () => {
    const validLoginData = {
      username: 'alice123',
      pin: '1234'
    };

    it('should successfully login a child with valid credentials', async () => {
      const mockAuthResult = {
        child: {
          id: 'child-123',
          parentId: 'parent-123',
          name: 'Alice',
          age: 8,
          gradeLevel: '3rd',
          learningStyle: 'VISUAL' as const,
          username: 'alice123',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        expiresIn: 900
      };

      mockAuthService.authenticateChild.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .post('/auth/child/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Child login successful',
        child: expect.objectContaining({
          id: 'child-123',
          name: 'Alice',
          username: 'alice123'
        }),
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        expiresIn: 900
      });

      expect(mockAuthService.authenticateChild).toHaveBeenCalledWith(validLoginData);
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.authenticateChild.mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/auth/child/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid username or PIN');
    });

    it('should return 400 for invalid data format', async () => {
      const invalidData = {
        username: 'alice123'
        // Missing PIN
      };

      const response = await request(app)
        .post('/auth/child/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/child/refresh', () => {
    it('should successfully refresh child token', async () => {
      const mockAuthResult = {
        child: {
          id: 'child-123',
          parentId: 'parent-123',
          name: 'Alice',
          age: 8,
          gradeLevel: '3rd',
          learningStyle: 'VISUAL' as const,
          username: 'alice123',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        accessToken: 'new-child-access-token',
        refreshToken: 'new-child-refresh-token',
        expiresIn: 900
      };

      mockAuthService.refreshChildToken.mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .post('/auth/child/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Child token refreshed successfully',
        child: expect.objectContaining({
          id: 'child-123',
          name: 'Alice',
          username: 'alice123'
        }),
        accessToken: 'new-child-access-token',
        refreshToken: 'new-child-refresh-token',
        expiresIn: 900
      });

      expect(mockAuthService.refreshChildToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      mockAuthService.refreshChildToken.mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/auth/child/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /auth/child/logout', () => {
    it('should successfully logout child', async () => {
      mockAuthService.logoutChild.mockResolvedValue();

      const response = await request(app)
        .post('/auth/child/logout')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Child logged out successfully'
      });

      expect(mockAuthService.logoutChild).toHaveBeenCalledWith('child-123');
    });
  });
});