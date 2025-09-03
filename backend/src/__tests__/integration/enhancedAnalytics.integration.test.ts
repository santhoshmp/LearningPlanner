import { PrismaClient } from '@prisma/client';
import { EnhancedAnalyticsService } from '../../services/enhancedAnalyticsService';
import { MasterDataService } from '../../services/masterDataService';
import { TimeFrame, ProficiencyLevel } from '../../types/analytics';

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
    }
  }
});

describe('EnhancedAnalyticsService Integration Tests', () => {
  let enhancedAnalyticsService: EnhancedAnalyticsService;
  let masterDataService: MasterDataService;
  let testChildId: string;
  let testParentId: string;
  let testGradeId: string;
  let testSubjectId: string;
  let testTopicId: string;
  let testPlanId: string;
  let testActivityId: string;

  beforeAll(async () => {
    enhancedAnalyticsService = new EnhancedAnalyticsService(prisma);
    masterDataService = new MasterDataService(prisma);

    // Clean up any existing test data
    await cleanupTestData();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up progress records before each test
    await prisma.progressRecord.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.contentInteraction.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.resourceUsage.deleteMany({
      where: { childId: testChildId }
    });
  });

  describe('getRealProgressTracking', () => {
    it('should return comprehensive progress tracking with real data', async () => {
      // Create test progress records
      const progressRecords = await createTestProgressRecords();
      const contentInteractions = await createTestContentInteractions();
      const resourceUsage = await createTestResourceUsage();

      const timeFrame: TimeFrame = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await enhancedAnalyticsService.getRealProgressTracking(testChildId, timeFrame);

      expect(result).toBeDefined();
      expect(result.timeFrame).toEqual(timeFrame);
      expect(result.detailedMetrics).toBeDefined();
      expect(result.learningVelocity).toBeDefined();
      expect(result.engagementPatterns).toBeDefined();
      expect(result.masteryIndicators).toBeDefined();
      expect(result.totalDataPoints).toBeGreaterThan(0);

      // Verify detailed metrics
      expect(result.detailedMetrics.basic.totalActivities).toBe(progressRecords.length);
      expect(result.detailedMetrics.basic.completedActivities).toBe(
        progressRecords.filter(r => r.status === 'COMPLETED').length
      );
      expect(result.detailedMetrics.basic.completionRate).toBeGreaterThan(0);

      // Verify learning velocity
      expect(result.learningVelocity.velocity).toBeGreaterThanOrEqual(0);
      expect(result.learningVelocity.trend).toMatch(/^(increasing|decreasing|stable)$/);

      // Verify engagement patterns
      expect(result.engagementPatterns.averageSessionLength).toBeGreaterThan(0);
      expect(result.engagementPatterns.peakLearningHours).toBeInstanceOf(Array);
      expect(result.engagementPatterns.subjectEngagement).toBeInstanceOf(Object);
    });

    it('should handle empty data gracefully', async () => {
      const timeFrame: TimeFrame = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await enhancedAnalyticsService.getRealProgressTracking(testChildId, timeFrame);

      expect(result).toBeDefined();
      expect(result.detailedMetrics.basic.totalActivities).toBe(0);
      expect(result.detailedMetrics.basic.completedActivities).toBe(0);
      expect(result.detailedMetrics.basic.completionRate).toBe(0);
      expect(result.totalDataPoints).toBe(0);
    });

    it('should calculate metrics correctly with mixed progress statuses', async () => {
      // Create mixed progress records
      await createMixedProgressRecords();

      const result = await enhancedAnalyticsService.getRealProgressTracking(testChildId);

      expect(result.detailedMetrics.basic.totalActivities).toBe(5);
      expect(result.detailedMetrics.basic.completedActivities).toBe(3);
      expect(result.detailedMetrics.basic.completionRate).toBe(60);
      expect(result.detailedMetrics.performance.averageScore).toBeGreaterThan(0);
    });
  });

  describe('getComprehensiveDashboardData', () => {
    it('should return complete dashboard data with all components', async () => {
      await createTestProgressRecords();
      await createTestContentInteractions();
      await createTestResourceUsage();

      const result = await enhancedAnalyticsService.getComprehensiveDashboardData(testChildId);

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.subjectBreakdown).toBeInstanceOf(Array);
      expect(result.topicMastery).toBeInstanceOf(Array);
      expect(result.skillVisualization).toBeDefined();
      expect(result.timeSeriesData).toBeInstanceOf(Array);
      expect(result.comparativeAnalysis).toBeDefined();

      // Verify overview data
      expect(result.overview.detailedMetrics).toBeDefined();
      expect(result.overview.learningVelocity).toBeDefined();

      // Verify subject breakdown
      expect(result.subjectBreakdown.length).toBeGreaterThan(0);
      result.subjectBreakdown.forEach(subject => {
        expect(subject.subjectId).toBeDefined();
        expect(subject.subjectName).toBeDefined();
        expect(subject.overallProgress).toBeGreaterThanOrEqual(0);
        expect(subject.proficiencyLevel).toMatch(/^(beginner|intermediate|advanced|mastery)$/);
      });

      // Verify skill visualization
      expect(result.skillVisualization.childId).toBe(testChildId);
      expect(result.skillVisualization.subjectProficiencies).toBeInstanceOf(Array);
      expect(result.skillVisualization.skillRadarChart).toBeInstanceOf(Array);
    });

    it('should handle time frame filtering correctly', async () => {
      await createTestProgressRecords();

      const timeFrame: TimeFrame = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await enhancedAnalyticsService.getComprehensiveDashboardData(testChildId, timeFrame);

      expect(result.overview.timeFrame).toEqual(timeFrame);
      expect(result.timeSeriesData.length).toBeLessThanOrEqual(7); // Max 7 days
    });
  });

  describe('generateTimeSeriesData', () => {
    it('should generate daily time series data correctly', async () => {
      await createTimeSeriesTestData();

      const timeFrame: TimeFrame = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await enhancedAnalyticsService.generateTimeSeriesData(testChildId, timeFrame);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(8); // 7 days + 1 (inclusive)

      result.forEach(day => {
        expect(day.date).toBeDefined();
        expect(day.dateFormatted).toBeDefined();
        expect(day.activitiesCompleted).toBeGreaterThanOrEqual(0);
        expect(day.completionRate).toBeGreaterThanOrEqual(0);
        expect(day.averageScore).toBeGreaterThanOrEqual(0);
        expect(day.sessionTime).toBeGreaterThanOrEqual(0);
        expect(day.engagementScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should fill in missing days with zero values', async () => {
      // Create data for only some days
      await createSparseTimeSeriesData();

      const timeFrame: TimeFrame = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await enhancedAnalyticsService.generateTimeSeriesData(testChildId, timeFrame);

      expect(result.length).toBe(8); // All days should be present
      
      const daysWithData = result.filter(day => day.activitiesCompleted > 0);
      const daysWithoutData = result.filter(day => day.activitiesCompleted === 0);
      
      expect(daysWithData.length).toBeGreaterThan(0);
      expect(daysWithoutData.length).toBeGreaterThan(0);
    });
  });

  describe('getSubjectProgressBreakdown', () => {
    it('should return detailed subject progress with master data integration', async () => {
      await createSubjectSpecificProgressData();

      const result = await enhancedAnalyticsService.getSubjectProgressBreakdown(testChildId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(subject => {
        expect(subject.subjectId).toBeDefined();
        expect(subject.subjectName).toBeDefined();
        expect(subject.overallProgress).toBeGreaterThanOrEqual(0);
        expect(subject.overallProgress).toBeLessThanOrEqual(100);
        expect(subject.proficiencyLevel).toMatch(/^(beginner|intermediate|advanced|mastery)$/);
        expect(subject.topicsCompleted).toBeGreaterThanOrEqual(0);
        expect(subject.totalTopics).toBeGreaterThanOrEqual(0);
        expect(subject.averageScore).toBeGreaterThanOrEqual(0);
        expect(subject.timeSpent).toBeGreaterThanOrEqual(0);
        expect(subject.strengthAreas).toBeInstanceOf(Array);
        expect(subject.improvementAreas).toBeInstanceOf(Array);
        expect(subject.nextRecommendedTopics).toBeInstanceOf(Array);
        expect(subject.masteryTrend).toMatch(/^(improving|stable|declining)$/);
      });
    });

    it('should calculate proficiency levels correctly', async () => {
      await createProficiencyTestData();

      const result = await enhancedAnalyticsService.getSubjectProgressBreakdown(testChildId);

      // Find the math subject (should have high proficiency)
      const mathSubject = result.find(s => s.subjectName.toLowerCase().includes('math'));
      expect(mathSubject).toBeDefined();
      expect(mathSubject!.proficiencyLevel).toMatch(/^(intermediate|advanced|mastery)$/);
      expect(mathSubject!.averageScore).toBeGreaterThan(70);
    });
  });

  describe('getTopicMasteryDetails', () => {
    it('should return detailed topic mastery information', async () => {
      await createTopicMasteryTestData();

      const result = await enhancedAnalyticsService.getTopicMasteryDetails(testChildId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(topic => {
        expect(topic.topicId).toBeDefined();
        expect(topic.topicName).toBeDefined();
        expect(topic.subjectId).toBeDefined();
        expect(topic.masteryLevel).toBeGreaterThanOrEqual(0);
        expect(topic.masteryLevel).toBeLessThanOrEqual(100);
        expect(topic.attemptsCount).toBeGreaterThanOrEqual(0);
        expect(topic.averageScore).toBeGreaterThanOrEqual(0);
        expect(topic.timeSpent).toBeGreaterThanOrEqual(0);
        expect(topic.lastActivity).toBeInstanceOf(Date);
        expect(topic.status).toBeDefined();
        expect(topic.difficultyProgression).toBeInstanceOf(Array);
        expect(topic.resourcesUsed).toBeInstanceOf(Array);
      });
    });

    it('should handle topics with no progress correctly', async () => {
      // Don't create any progress data
      const result = await enhancedAnalyticsService.getTopicMasteryDetails(testChildId);

      expect(result).toBeInstanceOf(Array);
      
      if (result.length > 0) {
        const notStartedTopics = result.filter(t => t.status.status === 'not_started');
        expect(notStartedTopics.length).toBeGreaterThan(0);
        
        notStartedTopics.forEach(topic => {
          expect(topic.masteryLevel).toBe(0);
          expect(topic.attemptsCount).toBe(0);
          expect(topic.averageScore).toBe(0);
          expect(topic.timeSpent).toBe(0);
        });
      }
    });
  });

  describe('getSkillProficiencyVisualization', () => {
    it('should generate comprehensive skill visualization', async () => {
      await createSkillVisualizationTestData();

      const result = await enhancedAnalyticsService.getSkillProficiencyVisualization(testChildId);

      expect(result).toBeDefined();
      expect(result.childId).toBe(testChildId);
      expect(result.overallLevel).toMatch(/^(beginner|intermediate|advanced|mastery)$/);
      expect(result.subjectProficiencies).toBeInstanceOf(Array);
      expect(result.skillRadarChart).toBeInstanceOf(Array);
      expect(result.progressTimeline).toBeInstanceOf(Array);
      expect(result.achievementBadges).toBeInstanceOf(Array);
      expect(result.nextMilestones).toBeInstanceOf(Array);

      // Verify subject proficiencies
      result.subjectProficiencies.forEach(subject => {
        expect(subject.subjectId).toBeDefined();
        expect(subject.subjectName).toBeDefined();
        expect(subject.proficiencyLevel).toMatch(/^(beginner|intermediate|advanced|mastery)$/);
        expect(subject.proficiencyScore).toBeGreaterThanOrEqual(0);
        expect(subject.proficiencyScore).toBeLessThanOrEqual(100);
        expect(subject.visualIndicator).toBeDefined();
        expect(subject.topicBreakdown).toBeInstanceOf(Array);
        expect(subject.trendDirection).toMatch(/^(up|down|stable)$/);
        expect(subject.confidenceLevel).toBeGreaterThanOrEqual(0);
        expect(subject.confidenceLevel).toBeLessThanOrEqual(1);
      });

      // Verify radar chart data
      result.skillRadarChart.forEach(dataPoint => {
        expect(dataPoint.subject).toBeDefined();
        expect(dataPoint.proficiency).toBeGreaterThanOrEqual(0);
        expect(dataPoint.fullMark).toBe(100);
      });
    });

    it('should calculate trend directions correctly', async () => {
      await createTrendTestData();

      const result = await enhancedAnalyticsService.getSkillProficiencyVisualization(testChildId);

      const subjectsWithTrends = result.subjectProficiencies.filter(s => s.trendDirection !== 'stable');
      expect(subjectsWithTrends.length).toBeGreaterThan(0);
    });
  });

  describe('generateComparativeAnalysis', () => {
    it('should generate period-over-period comparison', async () => {
      // Create data for current period
      await createCurrentPeriodData();
      
      // Wait a bit and create data for previous period
      await new Promise(resolve => setTimeout(resolve, 100));
      await createPreviousPeriodData();

      const result = await enhancedAnalyticsService.generateComparativeAnalysis(testChildId);

      expect(result).toBeDefined();
      expect(result.periodComparison).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);

      // Verify period comparison structure
      expect(result.periodComparison.completionRate).toBeDefined();
      expect(result.periodComparison.averageScore).toBeDefined();
      expect(result.periodComparison.timeSpent).toBeDefined();
      expect(result.periodComparison.learningVelocity).toBeDefined();

      // Each comparison should have current, previous, and change values
      Object.values(result.periodComparison).forEach((metric: any) => {
        expect(metric.current).toBeDefined();
        expect(metric.previous).toBeDefined();
        expect(metric.change).toBeDefined();
      });

      // Verify trends summary
      expect(result.trends.improving).toBeGreaterThanOrEqual(0);
      expect(result.trends.declining).toBeGreaterThanOrEqual(0);
      expect(result.trends.stable).toBeGreaterThanOrEqual(0);
      expect(result.trends.improving + result.trends.declining + result.trends.stable).toBe(4);
    });
  });

  // Helper functions for test data creation
  async function setupTestData() {
    // Create test parent
    const parent = await prisma.user.create({
      data: {
        email: 'test-parent@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT',
        isEmailVerified: true
      }
    });
    testParentId = parent.id;

    // Create test child
    const child = await prisma.childProfile.create({
      data: {
        parentId: testParentId,
        name: 'Test Child',
        age: 8,
        gradeLevel: '3',
        learningStyle: 'VISUAL',
        username: 'testchild123',
        pinHash: 'hashed-pin',
        isActive: true
      }
    });
    testChildId = child.id;

    // Create test grade level
    const grade = await prisma.gradeLevel.create({
      data: {
        grade: '3',
        displayName: 'Grade 3',
        ageMin: 8,
        ageMax: 9,
        ageTypical: 8,
        educationalLevel: 'elementary',
        sortOrder: 3,
        isActive: true
      }
    });
    testGradeId = grade.id;

    // Create test subject
    const subject = await prisma.subject.create({
      data: {
        name: 'math',
        displayName: 'Mathematics',
        description: 'Mathematical concepts',
        icon: 'calculate',
        color: '#2196F3',
        category: 'core',
        isCore: true,
        sortOrder: 1
      }
    });
    testSubjectId = subject.id;

    // Create grade-subject relationship
    await prisma.gradeSubject.create({
      data: {
        gradeId: testGradeId,
        subjectId: testSubjectId,
        estimatedHours: 30,
        isCore: true
      }
    });

    // Create test topic
    const topic = await prisma.topic.create({
      data: {
        name: 'addition',
        displayName: 'Addition',
        description: 'Basic addition concepts',
        gradeId: testGradeId,
        subjectId: testSubjectId,
        difficulty: 'BEGINNER',
        estimatedHours: 2,
        prerequisites: '[]',
        learningObjectives: '["Learn basic addition"]',
        skills: '["arithmetic"]',
        sortOrder: 1,
        isActive: true
      }
    });
    testTopicId = topic.id;

    // Create test study plan
    const plan = await prisma.studyPlan.create({
      data: {
        childId: testChildId,
        title: 'Math Study Plan',
        description: 'Basic math concepts',
        subject: 'math',
        gradeLevel: '3',
        difficultyLevel: 1,
        estimatedDuration: 30,
        isActive: true
      }
    });
    testPlanId = plan.id;

    // Create test activity
    const activity = await prisma.studyActivity.create({
      data: {
        planId: testPlanId,
        title: 'Addition Practice',
        description: 'Practice basic addition',
        activityType: 'practice',
        estimatedDuration: 15,
        difficultyLevel: 1,
        sortOrder: 1,
        isActive: true
      }
    });
    testActivityId = activity.id;
  }

  async function cleanupTestData() {
    // Delete in reverse dependency order
    await prisma.resourceUsage.deleteMany({ where: { childId: testChildId } });
    await prisma.contentInteraction.deleteMany({ where: { childId: testChildId } });
    await prisma.progressRecord.deleteMany({ where: { childId: testChildId } });
    await prisma.studyContent.deleteMany({ where: { activityId: testActivityId } });
    await prisma.studyActivity.deleteMany({ where: { planId: testPlanId } });
    await prisma.studyPlan.deleteMany({ where: { childId: testChildId } });
    await prisma.topicResource.deleteMany({ where: { topicId: testTopicId } });
    await prisma.topic.deleteMany({ where: { id: testTopicId } });
    await prisma.gradeSubject.deleteMany({ where: { gradeId: testGradeId } });
    await prisma.subject.deleteMany({ where: { id: testSubjectId } });
    await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
    await prisma.childProfile.deleteMany({ where: { id: testChildId } });
    await prisma.user.deleteMany({ where: { id: testParentId } });
  }

  async function createTestProgressRecords() {
    const records = [];
    for (let i = 0; i < 5; i++) {
      const record = await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: i < 3 ? 'COMPLETED' : 'IN_PROGRESS',
          score: i < 3 ? 80 + (i * 5) : null,
          timeSpent: 10 + (i * 2),
          completedAt: i < 3 ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) : null,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
      records.push(record);
    }
    return records;
  }

  async function createTestContentInteractions() {
    const content = await prisma.studyContent.create({
      data: {
        activityId: testActivityId,
        contentType: 'video',
        title: 'Math Video',
        description: 'Educational math video',
        contentUrl: 'https://example.com/video',
        duration: 300,
        difficultyLevel: 1,
        safetyRating: 'safe',
        ageAppropriateMin: 7,
        ageAppropriateMax: 10
      }
    });

    const interactions = [];
    for (let i = 0; i < 3; i++) {
      const interaction = await prisma.contentInteraction.create({
        data: {
          childId: testChildId,
          contentId: content.id,
          interactionType: 'view',
          progressPercentage: 80 + (i * 5),
          timeSpent: 120 + (i * 30),
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
      interactions.push(interaction);
    }
    return interactions;
  }

  async function createTestResourceUsage() {
    const resource = await prisma.topicResource.create({
      data: {
        topicId: testTopicId,
        type: 'VIDEO',
        title: 'Addition Video',
        description: 'Learn addition',
        url: 'https://example.com/addition-video',
        duration: 180,
        difficulty: 'BEGINNER',
        ageAppropriate: true,
        safetyRating: 'SAFE',
        source: 'YouTube',
        tags: ['math', 'addition'],
        sortOrder: 1,
        isActive: true
      }
    });

    const usage = [];
    for (let i = 0; i < 3; i++) {
      const record = await prisma.resourceUsage.create({
        data: {
          childId: testChildId,
          resourceId: resource.id,
          action: i === 0 ? 'view' : i === 1 ? 'complete' : 'bookmark',
          duration: i === 0 ? 180 : i === 1 ? 180 : null,
          timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
      usage.push(record);
    }
    return usage;
  }

  async function createMixedProgressRecords() {
    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'];
    const scores = [85, 92, 78, null, null];

    for (let i = 0; i < 5; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: statuses[i] as any,
          score: scores[i],
          timeSpent: 10 + (i * 2),
          completedAt: statuses[i] === 'COMPLETED' ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) : null,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
    }
  }

  async function createTimeSeriesTestData() {
    // Create progress records for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 80 + (i % 20),
          timeSpent: 15 + (i % 10),
          completedAt: date,
          createdAt: date,
          updatedAt: date
        }
      });
    }
  }

  async function createSparseTimeSeriesData() {
    // Create data for only days 1, 3, and 5
    const days = [1, 3, 5];
    for (const day of days) {
      const date = new Date(Date.now() - (day * 24 * 60 * 60 * 1000));
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 85,
          timeSpent: 20,
          completedAt: date,
          createdAt: date,
          updatedAt: date
        }
      });
    }
  }

  async function createSubjectSpecificProgressData() {
    // Create multiple activities for different subjects
    const subjects = ['math', 'science', 'english'];
    
    for (const subjectName of subjects) {
      // Create subject if it doesn't exist
      let subject = await prisma.subject.findFirst({ where: { name: subjectName } });
      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName,
            displayName: subjectName.charAt(0).toUpperCase() + subjectName.slice(1),
            description: `${subjectName} concepts`,
            icon: 'book',
            color: '#4CAF50',
            category: 'core',
            isCore: true,
            sortOrder: subjects.indexOf(subjectName) + 1
          }
        });
      }

      // Create plan for this subject
      const plan = await prisma.studyPlan.create({
        data: {
          childId: testChildId,
          title: `${subjectName} Plan`,
          description: `Study plan for ${subjectName}`,
          subject: subjectName,
          gradeLevel: '3',
          difficultyLevel: 1,
          estimatedDuration: 30,
          isActive: true
        }
      });

      // Create activity for this subject
      const activity = await prisma.studyActivity.create({
        data: {
          planId: plan.id,
          title: `${subjectName} Activity`,
          description: `Practice ${subjectName}`,
          activityType: 'practice',
          estimatedDuration: 15,
          difficultyLevel: 1,
          sortOrder: 1,
          isActive: true
        }
      });

      // Create progress records
      for (let i = 0; i < 3; i++) {
        await prisma.progressRecord.create({
          data: {
            childId: testChildId,
            activityId: activity.id,
            status: 'COMPLETED',
            score: 75 + (i * 5) + (subjects.indexOf(subjectName) * 5),
            timeSpent: 12 + i,
            completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
          }
        });
      }
    }
  }

  async function createProficiencyTestData() {
    // Create high-scoring math records
    for (let i = 0; i < 5; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 90 + (i % 10),
          timeSpent: 15,
          completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
    }
  }

  async function createTopicMasteryTestData() {
    // Create multiple attempts for the same topic
    for (let i = 0; i < 4; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 70 + (i * 5), // Improving scores
          timeSpent: 20 - (i * 2), // Decreasing time (getting faster)
          completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
    }
  }

  async function createSkillVisualizationTestData() {
    await createSubjectSpecificProgressData();
    await createTestResourceUsage();
  }

  async function createTrendTestData() {
    // Create improving trend data (recent scores higher than older scores)
    const scores = [70, 75, 80, 85, 90]; // Improving trend
    
    for (let i = 0; i < scores.length; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: scores[i],
          timeSpent: 15,
          completedAt: new Date(Date.now() - ((scores.length - i) * 24 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - ((scores.length - i) * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - ((scores.length - i) * 24 * 60 * 60 * 1000))
        }
      });
    }
  }

  async function createCurrentPeriodData() {
    // Create recent progress records
    for (let i = 0; i < 3; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 85 + (i * 2),
          timeSpent: 15 + i,
          completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
    }
  }

  async function createPreviousPeriodData() {
    // Create older progress records (30-33 days ago)
    for (let i = 0; i < 3; i++) {
      await prisma.progressRecord.create({
        data: {
          childId: testChildId,
          activityId: testActivityId,
          status: 'COMPLETED',
          score: 75 + (i * 2), // Lower scores than current period
          timeSpent: 20 + i, // More time than current period
          completedAt: new Date(Date.now() - ((30 + i) * 24 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - ((30 + i) * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - ((30 + i) * 24 * 60 * 60 * 1000))
        }
      });
    }
  }
});