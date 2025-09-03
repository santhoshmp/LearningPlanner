import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../utils/database';
import bcrypt from 'bcrypt';

describe('Child Authentication Integration', () => {
  let parentUser: any;
  let childProfile: any;

  beforeAll(async () => {
    // Create test parent user
    parentUser = await prisma.user.create({
      data: {
        email: 'parent@test.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT'
      }
    });

    // Create test child profile
    childProfile = await prisma.childProfile.create({
      data: {
        username: 'testchild',
        pin: await bcrypt.hash('1234', 10),
        firstName: 'Test',
        lastName: 'Child',
        age: 8,
        grade: '3rd Grade',
        parentId: parentUser.id,
        isActive: true
      }
    });
  });

  afterAll(async () => {
    await prisma.childLoginSession.deleteMany({});
    await prisma.childProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/child/auth/login', () => {
    it('should authenticate child with valid credentials', async () => {
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.child.id).toBe(childProfile.id);
      expect(response.body.child.username).toBe('testchild');
      expect(response.body.sessionId).toBeDefined();
    });

    it('should create login session record', async () => {
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(200);

      const session = await prisma.childLoginSession.findUnique({
        where: { id: response.body.sessionId }
      });

      expect(session).toBeTruthy();
      expect(session?.childId).toBe(childProfile.id);
      expect(session?.ipAddress).toBeDefined();
      expect(session?.deviceInfo).toBeDefined();
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'invalidchild',
          pin: '1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or PIN');
    });

    it('should fail with incorrect PIN', async () => {
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: 'wrongpin'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or PIN');
    });

    it('should detect suspicious activity after multiple failed attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/child/auth/login')
          .send({
            username: 'testchild',
            pin: 'wrongpin'
          })
          .expect(401);
      }

      // Fourth attempt should trigger suspicious activity detection
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: 'wrongpin'
        })
        .expect(429);

      expect(response.body.error).toContain('suspicious activity');
    });

    it('should temporarily lock account after too many failed attempts', async () => {
      // Make multiple failed attempts to trigger lockout
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/child/auth/login')
          .send({
            username: 'testchild',
            pin: 'wrongpin'
          });
      }

      // Even correct credentials should fail when locked
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        })
        .expect(423);

      expect(response.body.error).toContain('temporarily locked');
    });
  });

  describe('GET /api/child/auth/session', () => {
    let authToken: string;
    let sessionId: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      authToken = loginResponse.body.token;
      sessionId = loginResponse.body.sessionId;
    });

    it('should return current session info with valid token', async () => {
      const response = await request(app)
        .get('/api/child/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.session.id).toBe(sessionId);
      expect(response.body.session.childId).toBe(childProfile.id);
      expect(response.body.isValid).toBe(true);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/child/auth/session')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail with expired session', async () => {
      // Manually expire the session
      await prisma.childLoginSession.update({
        where: { id: sessionId },
        data: {
          loginTime: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
        }
      });

      await request(app)
        .get('/api/child/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('POST /api/child/auth/logout', () => {
    let authToken: string;
    let sessionId: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      authToken = loginResponse.body.token;
      sessionId = loginResponse.body.sessionId;
    });

    it('should logout child and update session', async () => {
      const response = await request(app)
        .post('/api/child/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is updated with logout time
      const session = await prisma.childLoginSession.findUnique({
        where: { id: sessionId }
      });

      expect(session?.logoutTime).toBeTruthy();
      expect(session?.sessionDuration).toBeGreaterThan(0);
    });

    it('should invalidate token after logout', async () => {
      await request(app)
        .post('/api/child/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Token should no longer work
      await request(app)
        .get('/api/child/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('Session timeout handling', () => {
    it('should automatically expire sessions after 20 minutes', async () => {
      const loginResponse = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      const authToken = loginResponse.body.token;
      const sessionId = loginResponse.body.sessionId;

      // Manually set session to be expired
      await prisma.childLoginSession.update({
        where: { id: sessionId },
        data: {
          loginTime: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
        }
      });

      // Request should fail due to expired session
      await request(app)
        .get('/api/child/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('Parental notifications', () => {
    it('should notify parent of child login', async () => {
      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      expect(response.body.parentNotified).toBe(true);
    });

    it('should notify parent of suspicious activity', async () => {
      // Simulate late night login (2 AM)
      const lateNightDate = new Date();
      lateNightDate.setHours(2, 0, 0, 0);

      jest.useFakeTimers();
      jest.setSystemTime(lateNightDate);

      const response = await request(app)
        .post('/api/child/auth/login')
        .send({
          username: 'testchild',
          pin: '1234'
        });

      expect(response.body.suspiciousActivity).toBe(true);
      expect(response.body.parentNotified).toBe(true);

      jest.useRealTimers();
    });
  });
});