import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../utils/database';
import bcrypt from 'bcrypt';

describe('Child Progress Integration', () => {
  let parentUser: any;
  let childProfile: any;
  let studyPlan: any;
  let studyActivity: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test data
    parentUser = await prisma.user.create({
      data: {
        email: 'parent@test.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT'
      }
    });

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

    studyPlan = await prisma.studyPlan.create({
      data: {
        title: 'Math Adventures',
        description: 'Fun math activities',
        childId: childProfile.id,
        isActive: true,
        targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    studyActivity = await prisma.studyActivity.create({
      data: {
        title: 'Addition Practice',
        description: 'Practice adding numbers',
        type: 'EXERCISE',
        studyPlanId: studyPlan.id,
        orderIndex: 1,
        estimatedDuration: 15
      }
    });

    // Login child to get auth token
    const loginResponse = await request(app)
      .post('/api/child/auth/login')
      .send({
        username: 'testchild',
        pin: '1234'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.progressRecord.deleteMany({});
    await prisma.learningStreak.deleteMany({});
    await prisma.achievement.deleteMany({});
    await prisma.childLoginSession.deleteMany({});
    await prisma.studyActivity.deleteMany({});
    await prisma.studyPlan.deleteMany({});
    await prisma.childProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/child/:childId/dashboard', () => {
    it('should return child dashboard data', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.child.id).toBe(childProfile.id);
      expect(response.body.studyPlans).toHaveLength(1);
      expect(response.body.studyPlans[0].title).toBe('Math Adventures');
      expect(response.body.progressSummary).toBeDefined();
      expect(response.body.learningStreak).toBeDefined();
    });

    it('should include progress statistics', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.progressSummary.totalActivities).toBeDefined();
      expect(response.body.progressSummary.completedActivities).toBeDefined();
      expect(response.body.progressSummary.averageScore).toBeDefined();
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/child/${childProfile.id}/dashboard`)
        .expect(401);
    });

    it('should fail for different child', async () => {
      const otherChild = await prisma.childProfile.create({
        data: {
          username: 'otherchild',
          pin: await bcrypt.hash('5678', 10),
          firstName: 'Other',
          lastName: 'Child',
          age: 10,
          grade: '5th Grade',
          parentId: parentUser.id,
          isActive: true
        }
      });

      await request(app)
        .get(`/api/child/${otherChild.id}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await prisma.childProfile.delete({ where: { id: otherChild.id } });
    });
  });

  describe('POST /api/child/activity/:activityId/progress', () => {
    it('should update activity progress', async () => {
      const response = await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 50,
          timeSpent: 300, // 5 minutes
          sessionData: {
            startTime: new Date(Date.now() - 5 * 60 * 1000),
            interactions: 10,
            helpRequests: 1
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.progress.progress).toBe(50);
      expect(response.body.progress.timeSpent).toBe(300);
    });

    it('should create progress record in database', async () => {
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 75,
          timeSpent: 600,
          sessionData: {
            startTime: new Date(Date.now() - 10 * 60 * 1000),
            interactions: 20
          }
        });

      const progressRecord = await prisma.progressRecord.findFirst({
        where: {
          childId: childProfile.id,
          activityId: studyActivity.id
        }
      });

      expect(progressRecord).toBeTruthy();
      expect(progressRecord?.progress).toBe(75);
      expect(progressRecord?.timeSpent).toBe(600);
    });

    it('should update learning streak on progress', async () => {
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 100,
          timeSpent: 900
        });

      const streak = await prisma.learningStreak.findFirst({
        where: {
          childId: childProfile.id,
          streakType: 'daily'
        }
      });

      expect(streak).toBeTruthy();
      expect(streak?.currentCount).toBeGreaterThan(0);
    });
  });

  describe('POST /api/child/activity/:activityId/complete', () => {
    it('should mark activity as complete', async () => {
      const response = await request(app)
        .post(`/api/child/activity/${studyActivity.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          score: 85,
          timeSpent: 900,
          sessionData: {
            startTime: new Date(Date.now() - 15 * 60 * 1000),
            endTime: new Date(),
            totalInteractions: 25,
            helpRequests: 2
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.completed).toBe(true);
      expect(response.body.score).toBe(85);
    });

    it('should check for badge eligibility on completion', async () => {
      const response = await request(app)
        .post(`/api/child/activity/${studyActivity.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          score: 95,
          timeSpent: 600
        });

      expect(response.body.badgesEarned).toBeDefined();
      expect(Array.isArray(response.body.badgesEarned)).toBe(true);
    });

    it('should update study plan progress', async () => {
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          score: 90,
          timeSpent: 800
        });

      const updatedPlan = await prisma.studyPlan.findUnique({
        where: { id: studyPlan.id },
        include: { activities: true }
      });

      // Check if progress is calculated correctly
      const completedActivities = updatedPlan?.activities.filter(a => 
        a.id === studyActivity.id
      ).length || 0;
      
      expect(completedActivities).toBeGreaterThan(0);
    });
  });

  describe('GET /api/child/:childId/progress', () => {
    beforeEach(async () => {
      // Create some progress data
      await prisma.progressRecord.create({
        data: {
          childId: childProfile.id,
          activityId: studyActivity.id,
          progress: 100,
          score: 85,
          timeSpent: 900,
          completedAt: new Date(),
          sessionData: {
            interactions: 20,
            helpRequests: 1
          }
        }
      });
    });

    it('should return detailed progress information', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalActivities).toBeDefined();
      expect(response.body.completedActivities).toBeDefined();
      expect(response.body.averageScore).toBeDefined();
      expect(response.body.totalTimeSpent).toBeDefined();
      expect(response.body.recentProgress).toBeDefined();
    });

    it('should filter progress by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get(`/api/child/${childProfile.id}/progress`)
        .query({
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.recentProgress).toBeDefined();
    });

    it('should include subject-specific progress', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.subjectProgress).toBeDefined();
      expect(Array.isArray(response.body.subjectProgress)).toBe(true);
    });
  });

  describe('GET /api/child/:childId/streaks', () => {
    beforeEach(async () => {
      // Create learning streak data
      await prisma.learningStreak.create({
        data: {
          childId: childProfile.id,
          streakType: 'daily',
          currentCount: 5,
          longestCount: 12,
          lastActivityDate: new Date(),
          streakStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      });
    });

    it('should return learning streak information', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/streaks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.streaks).toBeDefined();
      expect(Array.isArray(response.body.streaks)).toBe(true);
      
      const dailyStreak = response.body.streaks.find((s: any) => s.streakType === 'daily');
      expect(dailyStreak.currentCount).toBe(5);
      expect(dailyStreak.longestCount).toBe(12);
    });

    it('should include streak milestones', async () => {
      const response = await request(app)
        .get(`/api/child/${childProfile.id}/streaks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.milestones).toBeDefined();
      expect(response.body.nextMilestone).toBeDefined();
    });
  });

  describe('Real-time progress updates', () => {
    it('should handle concurrent progress updates', async () => {
      const promises = [];
      
      // Simulate multiple concurrent progress updates
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post(`/api/child/activity/${studyActivity.id}/progress`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              progress: 20 * (i + 1),
              timeSpent: 60 * (i + 1)
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Final progress should be the last update
      const finalProgress = await prisma.progressRecord.findFirst({
        where: {
          childId: childProfile.id,
          activityId: studyActivity.id
        },
        orderBy: { updatedAt: 'desc' }
      });

      expect(finalProgress?.progress).toBe(100);
    });
  });

  describe('Progress validation', () => {
    it('should validate progress values', async () => {
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 150, // Invalid: > 100
          timeSpent: 300
        })
        .expect(400);
    });

    it('should validate time spent values', async () => {
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 50,
          timeSpent: -100 // Invalid: negative
        })
        .expect(400);
    });

    it('should prevent progress updates on completed activities', async () => {
      // First, complete the activity
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          score: 85,
          timeSpent: 900
        });

      // Then try to update progress
      await request(app)
        .post(`/api/child/activity/${studyActivity.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 75,
          timeSpent: 300
        })
        .expect(409); // Conflict - already completed
    });
  });
});