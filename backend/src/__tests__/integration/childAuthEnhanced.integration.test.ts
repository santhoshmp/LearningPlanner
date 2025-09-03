import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../utils/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { enhancedAuthService } from '../../services/enhancedAuthService';

describe('Enhanced Child Authentication Integration', () => {
  let parentUser: any;
  let childProfile: any;
  let authToken: string;
  let refreshToken: string;
  let sessionId: string;

  beforeAll(async () => {
    // Create test parent user
    parentUser = await prisma.user.create({
      data: {
        email: 'parent@test.com',
        passwordHash: await bcrypt.hash('password123', 12),
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT',
        isEmailVerified: true
      }
    });

    // Create test child profile
    childProfile = await prisma.childProfile.create({
      data: {
        username: 'testchild',
        pin: await bcrypt.hash('1234', 12),
        name: 'Test Child',
        age: 8,
        grade: '3rd Grade',
        parentId: parentUser.id,
        isActive: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.childProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up tokens and sessions before each test
    await prisma.refreshToken.deleteMany({});
  });

  describe('Child Login Flow', () => {
    it('should authenticate child with valid credentials and create session', async () => {
      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id: childProfile.id,
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD',
          parentId: parentUser.id
        })
      );
      expect(response.body.user).not.toHaveProperty('pin');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.expiresIn).toBe(1200); // 20 minutes for children

      // Store tokens for subsequent tests
      authToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      sessionId = response.body.sessionId;

      // Verify refresh token was stored in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      expect(storedToken).toBeTruthy();
      expect(storedToken?.childId).toBe(childProfile.id);
      expect(storedToken?.sessionId).toBe(sessionId);
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'nonexistent',
          pin: '1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with incorrect PIN', async () => {
      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: 'wrong'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail for inactive child profile', async () => {
      // Deactivate child profile
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: false }
      });

      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account is inactive');

      // Reactivate for other tests
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: true }
      });
    });

    it('should include proper token payload structure', async () => {
      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(200);

      const token = response.body.accessToken;
      const decoded = jwt.decode(token) as any;

      expect(decoded).toEqual(
        expect.objectContaining({
          childId: childProfile.id,
          role: 'CHILD',
          sessionId: expect.any(String)
        })
      );
      expect(decoded).not.toHaveProperty('userId');
    });
  });

  describe('Token Refresh Mechanism', () => {
    beforeEach(async () => {
      // Login to get fresh tokens
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
      sessionId = loginResponse.body.sessionId;
    });

    it('should refresh child tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id: childProfile.id,
          username: 'testchild',
          role: 'CHILD'
        })
      );
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.sessionId).toBe(sessionId);
      expect(response.body.expiresIn).toBe(1200);

      // Verify old refresh token was revoked
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      expect(oldToken?.isRevoked).toBe(true);

      // Verify new refresh token was created
      const newToken = await prisma.refreshToken.findUnique({
        where: { token: response.body.refreshToken }
      });
      expect(newToken).toBeTruthy();
      expect(newToken?.childId).toBe(childProfile.id);
      expect(newToken?.isRevoked).toBe(false);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should fail with expired refresh token', async () => {
      // Manually expire the refresh token
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Refresh token expired');

      // Verify expired token was cleaned up
      const cleanedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      expect(cleanedToken).toBeNull();
    });

    it('should fail with revoked refresh token', async () => {
      // Manually revoke the refresh token
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { isRevoked: true }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should handle concurrent refresh requests', async () => {
      // Make two simultaneous refresh requests
      const [response1, response2] = await Promise.allSettled([
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: refreshToken }),
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: refreshToken })
      ]);

      // One should succeed, one should fail
      const responses = [response1, response2].map(r => 
        r.status === 'fulfilled' ? r.value : null
      ).filter(Boolean);

      const successCount = responses.filter(r => r?.status === 200).length;
      const failureCount = responses.filter(r => r?.status === 401).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });

  describe('Session Persistence and Validation', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
      sessionId = loginResponse.body.sessionId;
    });

    it('should validate active child session', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id: childProfile.id,
          role: 'CHILD'
        })
      );
    });

    it('should reject expired access token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { childId: childProfile.id, role: 'CHILD', sessionId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1m' }
      );

      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Token expired');
    });

    it('should reject malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('No token provided');
    });
  });

  describe('Child Logout Flow', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
      sessionId = loginResponse.body.sessionId;
    });

    it('should logout child and revoke all tokens', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify all refresh tokens were revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(tokens).toHaveLength(0);
    });

    it('should invalidate access token after logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to use the token after logout
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.valid).toBe(false);
    });

    it('should handle logout without valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Enhanced Authentication Service', () => {
    it('should handle child login through service layer', async () => {
      const result = await enhancedAuthService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      expect(result.user).toEqual(
        expect.objectContaining({
          id: childProfile.id,
          username: 'testchild',
          role: 'CHILD'
        })
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.expiresIn).toBe(1200);
    });

    it('should handle token refresh through service layer', async () => {
      // First login to get tokens
      const loginResult = await enhancedAuthService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      // Then refresh
      const refreshResult = await enhancedAuthService.refreshToken(
        loginResult.refreshToken,
        '127.0.0.1',
        'test-user-agent'
      );

      expect(refreshResult.user.id).toBe(childProfile.id);
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.sessionId).toBe(loginResult.sessionId);
    });

    it('should handle child logout through service layer', async () => {
      const loginResult = await enhancedAuthService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      await enhancedAuthService.childLogout(childProfile.id, loginResult.sessionId);

      // Verify tokens were revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(tokens).toHaveLength(0);
    });

    it('should validate token structure and expiration', async () => {
      const loginResult = await enhancedAuthService.childLogin(
        'testchild',
        '1234',
        '127.0.0.1',
        'test-user-agent'
      );

      const tokenInfo = enhancedAuthService.getTokenInfo(loginResult.accessToken);
      expect(tokenInfo).toEqual(
        expect.objectContaining({
          childId: childProfile.id,
          role: 'CHILD',
          sessionId: loginResult.sessionId
        })
      );

      const isExpired = enhancedAuthService.isTokenExpired(loginResult.accessToken);
      expect(isExpired).toBe(false);
    });

    it('should clean up expired tokens', async () => {
      // Create some expired tokens
      await prisma.refreshToken.create({
        data: {
          token: 'expired-token-1',
          childId: childProfile.id,
          expiresAt: new Date(Date.now() - 1000),
          sessionId: 'expired-session-1'
        }
      });

      await prisma.refreshToken.create({
        data: {
          token: 'expired-token-2',
          childId: childProfile.id,
          expiresAt: new Date(Date.now() - 2000),
          sessionId: 'expired-session-2'
        }
      });

      const cleanedCount = await enhancedAuthService.cleanupExpiredTokens();
      expect(cleanedCount).toBeGreaterThanOrEqual(2);

      // Verify tokens were removed
      const remainingTokens = await prisma.refreshToken.findMany({
        where: {
          token: { in: ['expired-token-1', 'expired-token-2'] }
        }
      });
      expect(remainingTokens).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prisma.childProfile, 'findUnique').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Internal server error');

      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: '', // Empty username
          pin: '1234'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should handle concurrent login attempts', async () => {
      const loginPromises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/auth/child/login-legacy')
          .send({
            username: 'testchild',
            pin: '1234'
          })
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Each should have unique session IDs
      const sessionIds = responses.map(r => r.body.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(sessionIds.length);
    });

    it('should handle token refresh with inactive child', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      const refreshToken = loginResponse.body.refreshToken;

      // Deactivate child
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: false }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Child account is inactive');

      // Reactivate for cleanup
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: true }
      });
    });
  });
});