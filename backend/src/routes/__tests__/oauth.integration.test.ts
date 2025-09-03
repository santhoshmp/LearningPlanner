import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-123', role: 'PARENT' };
    next();
  }),
}));

// Mock the OAuth service
jest.mock('../../services/oauthService', () => ({
  oauthService: {
    checkAccountConflicts: jest.fn(),
    getUserSocialProvidersDetailed: jest.fn(),
    getUserSocialProviders: jest.fn(),
    getSocialAuthProvider: jest.fn(),
    getOAuthAuditLogs: jest.fn(),
    bulkUnlinkProviders: jest.fn(),
    cleanupExpiredTokens: jest.fn(),
    needsTokenRefresh: jest.fn(),
    handleOAuthCallback: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    getUserInfo: jest.fn(),
    unlinkProvider: jest.fn(),
    logSecurityEvent: jest.fn(),
    encryptToken: jest.fn(),
    decryptToken: jest.fn(),
  },
}));

// Mock Prisma
const mockPrisma = {
  socialAuthProvider: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
  },
  refreshToken: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock('../../utils/database', () => ({
  prisma: mockPrisma,
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
}));

describe('OAuth Routes Database Integration', () => {
  let app: express.Application;
  let mockOAuthService: any;

  beforeEach(async () => {
    // Import after mocks are set up
    const oauthRouter = (await import('../oauth')).default;
    const { oauthService } = await import('../../services/oauthService');
    
    mockOAuthService = oauthService;
    
    app = express();
    app.use(express.json());
    app.use('/oauth', oauthRouter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /oauth/providers', () => {
    it('should return detailed provider information when requested', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          provider: 'google',
          providerEmail: 'test@example.com',
          tokenStatus: 'valid',
          needsRefresh: false,
        },
      ];

      mockOAuthService.getUserSocialProvidersDetailed.mockResolvedValue(mockProviders);

      const response = await request(app)
        .get('/oauth/providers?detailed=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toEqual(mockProviders);
      expect(mockOAuthService.getUserSocialProvidersDetailed).toHaveBeenCalledWith('test-user-123');
    });

    it('should return basic provider information by default', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          provider: 'google',
          providerEmail: 'test@example.com',
        },
      ];

      mockOAuthService.getUserSocialProviders.mockResolvedValue(mockProviders);

      const response = await request(app)
        .get('/oauth/providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toEqual(mockProviders);
      expect(mockOAuthService.getUserSocialProviders).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('GET /oauth/:provider/status', () => {
    it('should return provider status information', async () => {
      const mockProvider = {
        provider: 'google',
        providerEmail: 'test@example.com',
        providerName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + 3600000),
      };

      mockOAuthService.getSocialAuthProvider.mockResolvedValue(mockProvider);
      mockOAuthService.needsTokenRefresh.mockReturnValue(false);

      const response = await request(app)
        .get('/oauth/google/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.provider).toBe('google');
      expect(response.body.data.isLinked).toBe(true);
      expect(response.body.data.tokenStatus).toBe('valid');
    });

    it('should return 404 when provider is not linked', async () => {
      mockOAuthService.getSocialAuthProvider.mockResolvedValue(null);

      const response = await request(app)
        .get('/oauth/google/status')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('google account not linked');
    });
  });

  describe('POST /oauth/check-conflicts', () => {
    it('should check for account conflicts', async () => {
      const mockConflictCheck = {
        hasConflict: false,
      };

      mockOAuthService.checkAccountConflicts.mockResolvedValue(mockConflictCheck);

      const response = await request(app)
        .post('/oauth/check-conflicts')
        .send({
          provider: 'google',
          userInfo: {
            id: 'google-user-123',
            email: 'test@example.com',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockConflictCheck);
      expect(mockOAuthService.checkAccountConflicts).toHaveBeenCalledWith(
        { id: 'google-user-123', email: 'test@example.com' },
        'google',
        'test-user-123'
      );
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/oauth/check-conflicts')
        .send({
          provider: 'invalid-provider',
          userInfo: {},
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /oauth/audit-logs', () => {
    it('should return OAuth audit logs', async () => {
      const mockAuditLogs = {
        logs: [
          {
            id: 'log-1',
            eventType: 'AUTHENTICATION',
            details: { provider: 'google', action: 'oauth_login_success' },
            timestamp: new Date().toISOString(),
          },
        ],
        total: 1,
      };

      mockOAuthService.getOAuthAuditLogs.mockResolvedValue(mockAuditLogs);

      const response = await request(app)
        .get('/oauth/audit-logs?provider=google&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAuditLogs);
      expect(mockOAuthService.getOAuthAuditLogs).toHaveBeenCalledWith('test-user-123', {
        provider: 'google',
        eventType: undefined,
        limit: 10,
        offset: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/oauth/audit-logs?limit=200') // Exceeds max limit
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /oauth/bulk-unlink', () => {
    it('should successfully unlink multiple providers', async () => {
      const mockResults = {
        success: ['google', 'apple'],
        failed: [],
        errors: {},
      };

      mockOAuthService.bulkUnlinkProviders.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/oauth/bulk-unlink')
        .send({
          providers: ['google', 'apple'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResults);
      expect(mockOAuthService.bulkUnlinkProviders).toHaveBeenCalledWith('test-user-123', ['google', 'apple']);
    });

    it('should return partial success status for mixed results', async () => {
      const mockResults = {
        success: ['google'],
        failed: ['apple'],
        errors: { apple: 'Provider not found' },
      };

      mockOAuthService.bulkUnlinkProviders.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/oauth/bulk-unlink')
        .send({
          providers: ['google', 'apple'],
        })
        .expect(207); // Multi-Status

      expect(response.body.success).toBe(false);
      expect(response.body.data).toEqual(mockResults);
    });

    it('should handle service errors', async () => {
      mockOAuthService.bulkUnlinkProviders.mockRejectedValue(
        new Error('Cannot unlink all authentication methods')
      );

      const response = await request(app)
        .post('/oauth/bulk-unlink')
        .send({
          providers: ['google'],
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot unlink all authentication methods');
    });
  });

  describe('POST /oauth/cleanup-tokens', () => {
    it('should cleanup expired tokens', async () => {
      const mockResults = {
        cleaned: 5,
        errors: [],
      };

      mockOAuthService.cleanupExpiredTokens.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/oauth/cleanup-tokens')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokensRefreshed).toBe(5);
      expect(response.body.data.hasErrors).toBe(false);
    });

    it('should handle cleanup errors', async () => {
      const mockResults = {
        cleaned: 2,
        errors: ['Failed to refresh google token: Invalid refresh token'],
      };

      mockOAuthService.cleanupExpiredTokens.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/oauth/cleanup-tokens')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokensRefreshed).toBe(2);
      expect(response.body.data.hasErrors).toBe(true);
      expect(response.body.data.errors).toHaveLength(1);
    });
  });

  describe('POST /oauth/:provider/callback', () => {
    it('should handle OAuth callback with enhanced logging', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      };

      const mockUserInfo = {
        id: 'google-user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARENT',
          isEmailVerified: true,
        },
        isNewUser: false,
        linkedAccount: false,
        conflictResolution: undefined,
      };

      mockOAuthService.exchangeCodeForTokens.mockResolvedValue(mockTokens);
      mockOAuthService.getUserInfo.mockResolvedValue(mockUserInfo);
      mockOAuthService.handleOAuthCallback.mockResolvedValue(mockResult);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const response = await request(app)
        .post('/oauth/google/callback')
        .send({
          code: 'auth-code-123',
          state: 'state-123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe('user-123');
      expect(response.body.data.provider).toBe('google');
      expect(mockOAuthService.handleOAuthCallback).toHaveBeenCalledWith(
        'google',
        mockUserInfo,
        mockTokens,
        expect.stringMatching(/127\.0\.0\.1/), // IP address
        undefined   // User agent is undefined in test environment
      );
    });
  });
});