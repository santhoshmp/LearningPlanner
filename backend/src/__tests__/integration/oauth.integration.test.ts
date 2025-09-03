import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createServer } from 'http';
import crypto from 'crypto';

// Import your app setup
import { setupApp } from '../../app';

// Mock external OAuth providers
jest.mock('axios');
const mockedAxios = require('axios');

describe('OAuth Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
    process.env.APPLE_TEAM_ID = 'test-apple-team-id';
    process.env.APPLE_KEY_ID = 'test-apple-key-id';
    process.env.APPLE_PRIVATE_KEY = 'test-apple-private-key';
    process.env.OAUTH_ENCRYPTION_KEY = 'test-encryption-key-32-characters';

    // Initialize Prisma
    prisma = new PrismaClient();
    
    // Set up Express app
    app = setupApp();
    server = createServer(app);
    
    // Clean up database
    await prisma.$executeRaw`TRUNCATE TABLE "User", "SocialAuthProvider", "SecurityLog" CASCADE`;
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
    
    // Clean up test data
    await prisma.socialAuthProvider.deleteMany();
    await prisma.user.deleteMany();
    await prisma.securityLog.deleteMany();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('OAuth Initiation Flow', () => {
    it('should initiate Google OAuth flow successfully', async () => {
      const response = await request(app)
        .post('/auth/oauth/initiate')
        .send({
          provider: 'google',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
        .expect(200);

      expect(response.body).toEqual({
        authUrl: expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth'),
        state: expect.any(String),
        codeVerifier: expect.any(String),
        provider: 'google'
      });

      // Verify URL contains required parameters
      const authUrl = new URL(response.body.authUrl);
      expect(authUrl.searchParams.get('client_id')).toBe('test-google-client-id');
      expect(authUrl.searchParams.get('response_type')).toBe('code');
      expect(authUrl.searchParams.get('scope')).toBe('profile email');
      expect(authUrl.searchParams.get('state')).toBe(response.body.state);
      expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
      expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should initiate Apple OAuth flow successfully', async () => {
      const response = await request(app)
        .post('/auth/oauth/initiate')
        .send({
          provider: 'apple',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
        .expect(200);

      expect(response.body).toEqual({
        authUrl: expect.stringContaining('https://appleid.apple.com/auth/authorize'),
        state: expect.any(String),
        provider: 'apple'
      });

      // Verify Apple-specific parameters
      const authUrl = new URL(response.body.authUrl);
      expect(authUrl.searchParams.get('response_mode')).toBe('form_post');
      expect(authUrl.searchParams.get('scope')).toBe('name email');
    });

    it('should reject invalid provider', async () => {
      const response = await request(app)
        .post('/auth/oauth/initiate')
        .send({
          provider: 'invalid-provider',
          redirectUri: 'http://localhost:3000/auth/callback'
        })
        .expect(400);

      expect(response.body.error).toContain('Unsupported OAuth provider');
    });

    it('should validate redirect URI', async () => {
      const response = await request(app)
        .post('/auth/oauth/initiate')
        .send({
          provider: 'google',
          redirectUri: 'javascript:alert(1)' // Invalid/malicious URI
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid redirect URI');
    });
  });

  describe('OAuth Callback Flow', () => {
    it('should handle successful Google OAuth callback for new user', async () => {
      // Mock Google token exchange
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_in: 3600
        }
      });

      // Mock Google user info
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'google-user-123',
          email: 'newuser@example.com',
          name: 'New User',
          picture: 'https://example.com/avatar.jpg'
        }
      });

      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'google-auth-code',
          state: state,
          codeVerifier: codeVerifier,
          provider: 'google'
        })
        .expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'PARENT'
        }),
        tokens: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }),
        isNewUser: true,
        linkedAccount: false
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' },
        include: { socialAuthProviders: true }
      });

      expect(user).toBeTruthy();
      expect(user?.socialAuthProviders).toHaveLength(1);
      expect(user?.socialAuthProviders[0].provider).toBe('google');
      expect(user?.socialAuthProviders[0].providerUserId).toBe('google-user-123');

      // Verify security log was created
      const securityLogs = await prisma.securityLog.findMany({
        where: { userId: user?.id }
      });

      expect(securityLogs.length).toBeGreaterThan(0);
      expect(securityLogs.some(log => 
        log.eventType === 'AUTHENTICATION' && 
        log.details.action === 'oauth_login_success'
      )).toBe(true);
    });

    it('should handle OAuth callback for existing user (account linking)', async () => {
      // Create existing user
      const existingUser = await prisma.user.create({
        data: {
          email: 'existing@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Existing',
          lastName: 'User',
          role: 'PARENT'
        }
      });

      // Mock Google responses
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_in: 3600
        }
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'google-user-456',
          email: 'existing@example.com',
          name: 'Existing User',
          picture: 'https://example.com/avatar.jpg'
        }
      });

      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'google-auth-code',
          state: state,
          codeVerifier: codeVerifier,
          provider: 'google'
        })
        .expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: existingUser.id,
          email: 'existing@example.com'
        }),
        tokens: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }),
        isNewUser: false,
        linkedAccount: true,
        conflictResolution: 'linked_to_existing_email'
      });

      // Verify social auth provider was linked
      const socialAuth = await prisma.socialAuthProvider.findFirst({
        where: { userId: existingUser.id }
      });

      expect(socialAuth).toBeTruthy();
      expect(socialAuth?.provider).toBe('google');
      expect(socialAuth?.providerUserId).toBe('google-user-456');
    });

    it('should handle account conflict (same email, different provider user ID)', async () => {
      // Create user with existing Google auth
      const existingUser = await prisma.user.create({
        data: {
          email: 'conflict@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Conflict',
          lastName: 'User',
          role: 'PARENT',
          socialAuthProviders: {
            create: {
              provider: 'google',
              providerUserId: 'different-google-id',
              providerEmail: 'conflict@example.com',
              accessTokenEncrypted: 'encrypted-token'
            }
          }
        }
      });

      // Mock Google responses for different user ID
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_in: 3600
        }
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'new-google-user-789', // Different from existing
          email: 'conflict@example.com',
          name: 'Conflict User'
        }
      });

      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'google-auth-code',
          state: state,
          codeVerifier: codeVerifier,
          provider: 'google'
        })
        .expect(409); // Conflict

      expect(response.body.error).toContain('account cannot be linked');

      // Verify security log for conflict
      const conflictLogs = await prisma.securityLog.findMany({
        where: { 
          userId: existingUser.id,
          eventType: 'ACCOUNT_CHANGE'
        }
      });

      expect(conflictLogs.some(log => 
        log.details.action === 'oauth_account_conflict'
      )).toBe(true);
    });

    it('should handle invalid authorization code', async () => {
      // Mock failed token exchange
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'invalid_grant' }
        }
      });

      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'invalid-auth-code',
          state: state,
          codeVerifier: codeVerifier,
          provider: 'google'
        })
        .expect(400);

      expect(response.body.error).toContain('Failed to exchange code for tokens');
    });

    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          // Missing code
          state: 'test-state',
          provider: 'google'
        })
        .expect(400);

      expect(response.body.error).toContain('Missing required parameters');
    });
  });

  describe('OAuth Provider Management', () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      // Create test user with auth token
      testUser = await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARENT'
        }
      });

      // Generate auth token (simplified for testing)
      authToken = `Bearer test-token-${testUser.id}`;
    });

    it('should list user social providers', async () => {
      // Create social auth providers
      await prisma.socialAuthProvider.createMany({
        data: [
          {
            userId: testUser.id,
            provider: 'google',
            providerUserId: 'google-123',
            providerEmail: 'testuser@example.com',
            accessTokenEncrypted: 'encrypted-google-token'
          },
          {
            userId: testUser.id,
            provider: 'apple',
            providerUserId: 'apple-456',
            providerEmail: 'testuser@example.com',
            accessTokenEncrypted: 'encrypted-apple-token'
          }
        ]
      });

      const response = await request(app)
        .get('/auth/oauth/providers')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.providers).toHaveLength(2);
      expect(response.body.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: 'google',
            providerEmail: 'testuser@example.com'
          }),
          expect.objectContaining({
            provider: 'apple',
            providerEmail: 'testuser@example.com'
          })
        ])
      );
    });

    it('should unlink social provider', async () => {
      // Create social auth provider
      await prisma.socialAuthProvider.create({
        data: {
          userId: testUser.id,
          provider: 'google',
          providerUserId: 'google-123',
          providerEmail: 'testuser@example.com',
          accessTokenEncrypted: 'encrypted-google-token'
        }
      });

      const response = await request(app)
        .delete('/auth/oauth/providers/google')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.message).toContain('unlinked successfully');

      // Verify provider was removed
      const provider = await prisma.socialAuthProvider.findFirst({
        where: {
          userId: testUser.id,
          provider: 'google'
        }
      });

      expect(provider).toBeNull();
    });

    it('should prevent unlinking last authentication method', async () => {
      // Create user with only social auth (no password)
      const socialOnlyUser = await prisma.user.create({
        data: {
          email: 'socialonly@example.com',
          passwordHash: '', // No password
          firstName: 'Social',
          lastName: 'Only',
          role: 'PARENT',
          socialAuthProviders: {
            create: {
              provider: 'google',
              providerUserId: 'google-only-123',
              providerEmail: 'socialonly@example.com',
              accessTokenEncrypted: 'encrypted-token'
            }
          }
        }
      });

      const socialAuthToken = `Bearer test-token-${socialOnlyUser.id}`;

      const response = await request(app)
        .delete('/auth/oauth/providers/google')
        .set('Authorization', socialAuthToken)
        .expect(400);

      expect(response.body.error).toContain('Cannot unlink all authentication methods');

      // Verify provider still exists
      const provider = await prisma.socialAuthProvider.findFirst({
        where: {
          userId: socialOnlyUser.id,
          provider: 'google'
        }
      });

      expect(provider).toBeTruthy();
    });
  });

  describe('OAuth Security Features', () => {
    it('should log all OAuth authentication attempts', async () => {
      // Mock successful Google OAuth
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_in: 3600
        }
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'google-user-security',
          email: 'security@example.com',
          name: 'Security User'
        }
      });

      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'google-auth-code',
          state: state,
          codeVerifier: codeVerifier,
          provider: 'google'
        })
        .set('X-Forwarded-For', '192.168.1.100')
        .set('User-Agent', 'Test Browser')
        .expect(200);

      // Verify security logs
      const securityLogs = await prisma.securityLog.findMany({
        where: {
          eventType: 'AUTHENTICATION'
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(securityLogs.length).toBeGreaterThan(0);
      
      const authLog = securityLogs.find(log => 
        log.details.action === 'oauth_login_success'
      );

      expect(authLog).toBeTruthy();
      expect(authLog?.ipAddress).toBe('192.168.1.100');
      expect(authLog?.userAgent).toBe('Test Browser');
      expect(authLog?.details.provider).toBe('google');
    });

    it('should handle rate limiting for OAuth attempts', async () => {
      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');

      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/auth/oauth/callback')
          .send({
            code: 'test-code',
            state: state,
            codeVerifier: codeVerifier,
            provider: 'google'
          })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate PKCE challenge correctly', async () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const wrongCodeVerifier = crypto.randomBytes(32).toString('base64url');

      // Mock token exchange that validates PKCE
      mockedAxios.post.mockImplementation((url, data) => {
        if (data.code_verifier !== codeVerifier) {
          return Promise.reject({
            response: {
              status: 400,
              data: { error: 'invalid_grant', error_description: 'PKCE verification failed' }
            }
          });
        }
        return Promise.resolve({
          data: {
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600
          }
        });
      });

      const state = crypto.randomBytes(16).toString('hex');

      // Test with wrong code verifier
      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          code: 'valid-code',
          state: state,
          codeVerifier: wrongCodeVerifier,
          provider: 'google'
        })
        .expect(400);

      expect(response.body.error).toContain('PKCE verification failed');
    });
  });

  describe('OAuth Token Management', () => {
    let testUser: any;
    let socialAuth: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'tokentest@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Token',
          lastName: 'Test',
          role: 'PARENT'
        }
      });

      socialAuth = await prisma.socialAuthProvider.create({
        data: {
          userId: testUser.id,
          provider: 'google',
          providerUserId: 'google-token-test',
          providerEmail: 'tokentest@example.com',
          accessTokenEncrypted: 'encrypted-access-token',
          refreshTokenEncrypted: 'encrypted-refresh-token',
          tokenExpiresAt: new Date(Date.now() - 1000) // Expired token
        }
      });
    });

    it('should refresh expired tokens automatically', async () => {
      // Mock token refresh
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }
      });

      const response = await request(app)
        .post('/auth/oauth/refresh')
        .send({
          userId: testUser.id,
          provider: 'google'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Tokens refreshed successfully'
      });

      // Verify tokens were updated in database
      const updatedAuth = await prisma.socialAuthProvider.findUnique({
        where: { id: socialAuth.id }
      });

      expect(updatedAuth?.tokenExpiresAt).toBeInstanceOf(Date);
      expect(updatedAuth?.tokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle token refresh failures', async () => {
      // Mock failed token refresh
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'invalid_grant' }
        }
      });

      const response = await request(app)
        .post('/auth/oauth/refresh')
        .send({
          userId: testUser.id,
          provider: 'google'
        })
        .expect(400);

      expect(response.body.error).toContain('Failed to refresh tokens');
    });
  });
});