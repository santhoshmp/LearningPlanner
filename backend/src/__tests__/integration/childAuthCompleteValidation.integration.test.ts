import request from 'supertest';
import app from '../../index';
import { prisma } from '../../utils/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Child Authentication Complete Validation Integration', () => {
  let parentUser: any;
  let childProfile: any;
  let secondChildProfile: any;
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Create test parent user
    parentUser = await prisma.user.create({
      data: {
        email: 'validation-parent@test.com',
        passwordHash: await bcrypt.hash('password123', 12),
        firstName: 'Validation',
        lastName: 'Parent',
        role: 'PARENT',
        isEmailVerified: true
      }
    });

    // Create first test child profile
    childProfile = await prisma.childProfile.create({
      data: {
        username: 'validationchild1',
        pinHash: await bcrypt.hash('1234', 12),
        name: 'Validation Child 1',
        age: 8,
        gradeLevel: '3rd Grade',
        parentId: parentUser.id,
        isActive: true
      }
    });

    // Create second test child profile for isolation testing
    secondChildProfile = await prisma.childProfile.create({
      data: {
        username: 'validationchild2',
        pinHash: await bcrypt.hash('5678', 12),
        name: 'Validation Child 2',
        age: 10,
        gradeLevel: '5th Grade',
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

  describe('Complete Child Login Flow Validation', () => {
    it('should complete full authentication flow with all validations', async () => {
      // Step 1: Initial login request
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        })
        .expect(200);

      // Validate response structure
      expect(loginResponse.body).toEqual({
        success: true,
        user: expect.objectContaining({
          id: childProfile.id,
          username: 'validationchild1',
          name: 'Validation Child 1',
          role: 'CHILD',
          parentId: parentUser.id,
          age: 8,
          gradeLevel: '3rd Grade',
          isActive: true
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 1200
      });

      // Validate user object doesn't contain sensitive data
      expect(loginResponse.body.user).not.toHaveProperty('pinHash');
      expect(loginResponse.body.user).not.toHaveProperty('passwordHash');

      // Store tokens for subsequent tests
      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;

      // Step 2: Validate token structure
      const decodedToken = jwt.decode(authToken) as any;
      expect(decodedToken).toEqual(
        expect.objectContaining({
          childId: childProfile.id,
          role: 'CHILD',
          iat: expect.any(Number),
          exp: expect.any(Number)
        })
      );

      // Step 3: Validate database state
      const storedRefreshToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { child: true }
      });

      expect(storedRefreshToken).toBeTruthy();
      expect(storedRefreshToken?.childId).toBe(childProfile.id);
      expect(storedRefreshToken?.isRevoked).toBe(false);
      expect(storedRefreshToken?.child?.username).toBe('validationchild1');

      // Step 4: Validate token expiration
      const tokenExp = decodedToken.exp * 1000;
      const now = Date.now();
      const expectedExp = now + (20 * 60 * 1000); // 20 minutes
      expect(tokenExp).toBeGreaterThan(now);
      expect(tokenExp).toBeLessThan(expectedExp + 5000); // Allow 5 second tolerance
    });

    it('should validate all authentication edge cases', async () => {
      // Test case sensitivity
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'VALIDATIONCHILD1', // Wrong case
          pin: '1234'
        })
        .expect(401);

      // Test PIN with leading zeros
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '01234' // Extra digit
        })
        .expect(401);

      // Test empty credentials
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: '',
          pin: ''
        })
        .expect(400);

      // Test missing fields
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1'
          // Missing pin
        })
        .expect(400);
    });

    it('should handle concurrent login attempts correctly', async () => {
      const concurrentLogins = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/child/login-legacy')
          .send({
            username: 'validationchild1',
            pin: '1234'
          })
      );

      const responses = await Promise.all(concurrentLogins);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Each should have unique tokens
      const accessTokens = responses.map(r => r.body.accessToken);
      const refreshTokens = responses.map(r => r.body.refreshToken);

      expect(new Set(accessTokens).size).toBe(accessTokens.length);
      expect(new Set(refreshTokens).size).toBe(refreshTokens.length);

      // All refresh tokens should be stored in database
      const storedTokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(storedTokens).toHaveLength(5);
    });
  });

  describe('Session Persistence and Recovery Validation', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        });

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should validate session across multiple API calls', async () => {
      // Make multiple authenticated requests
      const apiCalls = [
        request(app).get('/api/auth/validate').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/child/profile').set('Authorization', `Bearer ${authToken}`)
      ];

      const responses = await Promise.all(apiCalls);

      // All should succeed with same user context
      responses.forEach(response => {
        expect(response.status).toBe(200);
        if (response.body.user) {
          expect(response.body.user.id).toBe(childProfile.id);
          expect(response.body.user.role).toBe('CHILD');
        }
      });

      // Session should remain active
      const sessionValidation = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(sessionValidation.body.valid).toBe(true);
    });

    it('should validate session cleanup on logout', async () => {
      // Create multiple sessions for the same child
      const session1 = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({ username: 'validationchild1', pin: '1234' });

      const session2 = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({ username: 'validationchild1', pin: '1234' });

      // Verify both sessions exist
      const activeTokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(activeTokens).toHaveLength(2);

      // Logout from first session
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${session1.body.accessToken}`)
        .expect(200);

      // First session tokens should be revoked
      const firstSessionToken = await prisma.refreshToken.findUnique({
        where: { token: session1.body.refreshToken }
      });
      expect(firstSessionToken?.isRevoked).toBe(true);

      // Second session should still be active
      const secondSessionToken = await prisma.refreshToken.findUnique({
        where: { token: session2.body.refreshToken }
      });
      expect(secondSessionToken?.isRevoked).toBe(false);

      // Second session should still work
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${session2.body.accessToken}`)
        .expect(200);
    });
  });

  describe('Token Refresh Mechanism Validation', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        });

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should validate complete token refresh cycle', async () => {
      // Step 1: Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toEqual({
        success: true,
        user: expect.objectContaining({
          id: childProfile.id,
          role: 'CHILD'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 1200
      });

      // Step 2: Validate old tokens are invalidated
      const oldRefreshToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      expect(oldRefreshToken?.isRevoked).toBe(true);

      // Step 3: Validate new tokens work
      const newAccessToken = refreshResponse.body.accessToken;
      const newRefreshToken = refreshResponse.body.refreshToken;

      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // Step 4: Validate new refresh token is stored correctly
      const newStoredToken = await prisma.refreshToken.findUnique({
        where: { token: newRefreshToken }
      });
      expect(newStoredToken).toBeTruthy();
      expect(newStoredToken?.childId).toBe(childProfile.id);
      expect(newStoredToken?.isRevoked).toBe(false);

      // Step 5: Validate old access token is rejected
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });

    it('should handle token refresh race conditions', async () => {
      // Attempt multiple simultaneous refresh requests
      const refreshPromises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken })
      );

      const responses = await Promise.allSettled(refreshPromises);
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled' && (r.value as any).status === 200)
        .map(r => (r as any).value);
      
      const failedResponses = responses
        .filter(r => r.status === 'fulfilled' && (r.value as any).status === 401)
        .map(r => (r as any).value);

      // Only one should succeed
      expect(successfulResponses).toHaveLength(1);
      expect(failedResponses).toHaveLength(2);

      // The successful response should have valid tokens
      const successResponse = successfulResponses[0];
      expect(successResponse.body.success).toBe(true);
      expect(successResponse.body.accessToken).toBeDefined();

      // Verify only one new refresh token was created
      const activeTokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(activeTokens).toHaveLength(1);
    });

    it('should validate token refresh with expired access token', async () => {
      // Create an expired access token
      const expiredToken = jwt.sign(
        { childId: childProfile.id, role: 'CHILD' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1m' }
      );

      // Expired token should be rejected
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // But refresh token should still work
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // New access token should work
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);
    });
  });

  describe('Parent-Child Authentication Isolation Validation', () => {
    let parentAuthToken: string;
    let parentRefreshToken: string;
    let child1AuthToken: string;
    let child1RefreshToken: string;
    let child2AuthToken: string;
    let child2RefreshToken: string;

    beforeEach(async () => {
      // Login as parent
      const parentLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: parentUser.email,
          password: 'password123'
        });

      parentAuthToken = parentLogin.body.accessToken;
      parentRefreshToken = parentLogin.body.refreshToken;

      // Login as first child
      const child1Login = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        });

      child1AuthToken = child1Login.body.accessToken;
      child1RefreshToken = child1Login.body.refreshToken;

      // Login as second child
      const child2Login = await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild2',
          pin: '5678'
        });

      child2AuthToken = child2Login.body.accessToken;
      child2RefreshToken = child2Login.body.refreshToken;
    });

    it('should maintain complete session isolation between users', async () => {
      // Validate parent session
      const parentValidation = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${parentAuthToken}`)
        .expect(200);

      expect(parentValidation.body.user.role).toBe('PARENT');
      expect(parentValidation.body.user.email).toBe(parentUser.email);

      // Validate child 1 session
      const child1Validation = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${child1AuthToken}`)
        .expect(200);

      expect(child1Validation.body.user.role).toBe('CHILD');
      expect(child1Validation.body.user.username).toBe('validationchild1');

      // Validate child 2 session
      const child2Validation = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${child2AuthToken}`)
        .expect(200);

      expect(child2Validation.body.user.role).toBe('CHILD');
      expect(child2Validation.body.user.username).toBe('validationchild2');

      // Verify tokens are completely different
      expect(parentAuthToken).not.toBe(child1AuthToken);
      expect(parentAuthToken).not.toBe(child2AuthToken);
      expect(child1AuthToken).not.toBe(child2AuthToken);

      expect(parentRefreshToken).not.toBe(child1RefreshToken);
      expect(parentRefreshToken).not.toBe(child2RefreshToken);
      expect(child1RefreshToken).not.toBe(child2RefreshToken);
    });

    it('should maintain isolation during logout', async () => {
      // Logout child 1
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${child1AuthToken}`)
        .expect(200);

      // Child 1 should be logged out
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${child1AuthToken}`)
        .expect(401);

      // Parent and child 2 should still be active
      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${parentAuthToken}`)
        .expect(200);

      await request(app)
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${child2AuthToken}`)
        .expect(200);

      // Verify database state
      const child1Tokens = await prisma.refreshToken.findMany({
        where: { childId: childProfile.id, isRevoked: false }
      });
      expect(child1Tokens).toHaveLength(0);

      const child2Tokens = await prisma.refreshToken.findMany({
        where: { childId: secondChildProfile.id, isRevoked: false }
      });
      expect(child2Tokens).toHaveLength(1);

      const parentTokens = await prisma.refreshToken.findMany({
        where: { userId: parentUser.id, isRevoked: false }
      });
      expect(parentTokens).toHaveLength(1);
    });
  });

  describe('Security and Error Handling Validation', () => {
    it('should validate input sanitization and validation', async () => {
      const maliciousInputs = [
        { username: '<script>alert("xss")</script>', pin: '1234' },
        { username: 'validationchild1', pin: '<img src=x onerror=alert(1)>' },
        { username: "'; DROP TABLE childProfile; --", pin: '1234' },
        { username: 'validationchild1', pin: "1234'; DELETE FROM users; --" }
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/child/login-legacy')
          .send(input);

        // Should either return validation error or invalid credentials
        expect([400, 401]).toContain(response.status);
        
        // Should not cause server error
        expect(response.status).not.toBe(500);
      }

      // Verify database integrity
      const childCount = await prisma.childProfile.count();
      expect(childCount).toBe(2); // Should still have our test children
    });

    it('should validate comprehensive error scenarios', async () => {
      // Test with invalid username
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'nonexistent',
          pin: '1234'
        })
        .expect(401);

      // Test with invalid PIN
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: 'wrong'
        })
        .expect(401);

      // Test with inactive child
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: false }
      });

      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        })
        .expect(401);

      // Reactivate for other tests
      await prisma.childProfile.update({
        where: { id: childProfile.id },
        data: { isActive: true }
      });
    });
  });

  describe('Performance and Scalability Validation', () => {
    it('should handle high-volume concurrent operations', async () => {
      const concurrentOperations = 5;
      
      const startTime = Date.now();
      
      // Create concurrent login promises
      const loginPromises = Array(concurrentOperations).fill(null).map(() =>
        request(app)
          .post('/api/auth/child/login-legacy')
          .send({
            username: 'validationchild1',
            pin: '1234'
          })
      );

      const responses = await Promise.all(loginPromises);
      const endTime = Date.now();

      // Verify performance
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should validate database connection pooling', async () => {
      // Create many simultaneous database operations
      const dbOperations = Array(15).fill(null).map(async () => {
        const loginResponse = await request(app)
          .post('/api/auth/child/login-legacy')
          .send({
            username: 'validationchild1',
            pin: '1234'
          });

        // Perform multiple database queries
        await request(app)
          .get('/api/auth/validate')
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

        return loginResponse.body.accessToken;
      });

      const tokens = await Promise.all(dbOperations);
      
      // All operations should succeed
      expect(tokens).toHaveLength(15);
      tokens.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });

      // Database should still be responsive
      await request(app)
        .post('/api/auth/child/login-legacy')
        .send({
          username: 'validationchild1',
          pin: '1234'
        })
        .expect(200);
    });
  });
});