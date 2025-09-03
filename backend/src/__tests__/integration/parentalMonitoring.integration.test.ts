import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Parental Monitoring Integration Tests', () => {
  let parentToken: string;
  let childId: string;
  let parentId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.childProfile.deleteMany({
      where: { name: { contains: 'Test Child Monitoring' } }
    });
    await prisma.user.deleteMany({
      where: { email: 'parent.monitoring@test.com' }
    });

    // Create test parent
    const parentResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'parent.monitoring@test.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT'
      });

    expect(parentResponse.status).toBe(201);
    parentToken = parentResponse.body.accessToken;
    parentId = parentResponse.body.user.id;

    // Create test child
    const childResponse = await request(app)
      .post('/api/child-profiles')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Test Child Monitoring',
        age: 10,
        gradeLevel: '5',
        learningStyle: 'VISUAL',
        username: 'testchild_monitoring',
        pin: '1234'
      });

    expect(childResponse.status).toBe(201);
    childId = childResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.childProfile.deleteMany({
      where: { name: { contains: 'Test Child Monitoring' } }
    });
    await prisma.user.deleteMany({
      where: { email: 'parent.monitoring@test.com' }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/parental-monitoring/activity-summary', () => {
    it('should return activity summary for parent children', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/activity-summary')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const childSummary = response.body[0];
      expect(childSummary).toHaveProperty('childId');
      expect(childSummary).toHaveProperty('childName');
      expect(childSummary).toHaveProperty('loginSessions');
      expect(childSummary).toHaveProperty('progress');
      expect(childSummary).toHaveProperty('achievements');
      expect(childSummary).toHaveProperty('streaks');
      expect(childSummary).toHaveProperty('helpRequests');
      expect(childSummary).toHaveProperty('suspiciousActivity');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/activity-summary');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/parental-monitoring/detailed-report/:childId', () => {
    it('should return detailed report for child', async () => {
      const response = await request(app)
        .get(`/api/parental-monitoring/detailed-report/${childId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('childId', childId);
      expect(response.body).toHaveProperty('childName');
      expect(response.body).toHaveProperty('reportPeriod');
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('progressDetails');
      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('helpAnalytics');
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/detailed-report/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/parental-monitoring/detailed-report/${childId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/parental-monitoring/security-alerts/:childId', () => {
    it('should return security alerts for child', async () => {
      const response = await request(app)
        .get(`/api/parental-monitoring/security-alerts/${childId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should return empty array for new child with no suspicious activity
      expect(response.body.length).toBe(0);
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/security-alerts/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/parental-monitoring/notifications', () => {
    it('should return parent notifications', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/notifications')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/parental-monitoring/notifications?limit=5')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/parental-monitoring/notification-preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        loginNotifications: true,
        achievementNotifications: true,
        weeklyReports: false,
        securityAlerts: true,
        helpRequestAlerts: true,
        emailFrequency: 'daily'
      };

      const response = await request(app)
        .put('/api/parental-monitoring/notification-preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/parental-monitoring/send-weekly-report', () => {
    it('should send weekly report', async () => {
      const response = await request(app)
        .post('/api/parental-monitoring/send-weekly-report')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });
});