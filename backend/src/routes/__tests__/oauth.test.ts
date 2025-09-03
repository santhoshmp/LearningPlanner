import request from 'supertest';
import express from 'express';
import oauthRoutes from '../oauth';
import { oauthService } from '../../services/oauthService';

// Mock the OAuth service
jest.mock('../../services/oauthService');
jest.mock('../../utils/database');
jest.mock('../../utils/logger');

const app = express();
app.use(express.json());
app.use('/oauth', oauthRoutes);

describe('OAuth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /oauth/:provider/authorize', () => {
    it('should generate authorization URL for valid provider', async () => {
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
      (oauthService.generatePKCEChallenge as jest.Mock).mockReturnValue({
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256'
      });
      (oauthService.getAuthorizationUrl as jest.Mock).mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/oauth/google/authorize')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toBe(mockAuthUrl);
      expect(oauthService.getAuthorizationUrl).toHaveBeenCalledWith(
        'google',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should return 400 for invalid provider', async () => {
      const response = await request(app)
        .get('/oauth/invalid/authorize')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /oauth/:provider/callback', () => {
    it('should handle OAuth callback successfully', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date()
      };
      const mockUserInfo = {
        id: 'provider-user-id',
        email: 'test@example.com',
        name: 'Test User'
      };
      const mockResult = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARENT',
          isEmailVerified: true
        },
        isNewUser: false,
        linkedAccount: false
      };

      (oauthService.exchangeCodeForTokens as jest.Mock).mockResolvedValue(mockTokens);
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockResult);

      // Mock prisma
      const mockPrisma = {
        refreshToken: {
          create: jest.fn().mockResolvedValue({})
        }
      };
      jest.doMock('../../utils/database', () => ({
        prisma: mockPrisma
      }));

      const response = await request(app)
        .post('/oauth/google/callback')
        .send({ code: 'auth-code' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.provider).toBe('google');
    });

    it('should return 400 for missing authorization code', async () => {
      const response = await request(app)
        .post('/oauth/google/callback')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /oauth/providers', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/oauth/providers')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /oauth/:provider/link', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/oauth/google/link')
        .send({ code: 'auth-code' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /oauth/:provider/unlink', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/oauth/google/unlink')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /oauth/:provider/refresh', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/oauth/google/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});