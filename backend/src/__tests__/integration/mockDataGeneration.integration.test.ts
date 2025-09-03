import { PrismaClient } from '@prisma/client';
import { MockDataGeneratorService, MockDataConfig } from '../../services/mockDataGeneratorService';
import { DemoDataSeedingService, DemoSeedingConfig } from '../../services/demoDataSeedingService';
import { MasterDataService } from '../../services/masterDataService';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

describe('Mock Data Generation Integration', () => {
  let mockDataService: MockDataGeneratorService;
  let demoSeedingService: DemoDataSeedingService;
  let masterDataService: MasterDataService;
  let testChildId: string;

  beforeAll(async () => {
    mockDataService = new MockDataGeneratorService(prisma);
    demoSeedingService = new DemoDataSeedingService(prisma);
    masterDataService = new MasterDataService(prisma);

    // Create a test child for single data generation
    testChildId = 'integration-test-child';
    
    // Create test parent first
    await prisma.user.upsert({
      where: { id: 'integration-test-parent' },
      update: {},
      create: {
        id: 'integration-test-parent',
        email: 'test.parent@integration.test',
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    // Create test child
    await prisma.childProfile.upsert({
      where: { id: testChildId },
      update: {},
      create: {
        id: testChildId,
        parentId: 'integration-test-parent',
        firstName: 'Test',
        lastName: 'Child',
        gradeLevel: '5',
        age: 10,
        isActive: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.resourceUsage.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.contentInteraction.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.helpRequest.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.progressRecord.deleteMany({
      where: { childId: testChildId }
    });
    await prisma.studyContent.deleteMany({
      where: { id: { startsWith: 'integration-test-' } }
    });
    await prisma.studyActivity.deleteMany({
      where: { id: { startsWith: 'integration-test-' } }
    });
    await prisma.studyPlan.deleteMany({
      where: { id: { startsWith: 'integration-test-' } }
    });
    await prisma.childProfile.deleteMany({
      where: { id: testChildId }
    });
    await prisma.user.deleteMany({
      where: { id: 'integration-test-parent' }
    });

    await prisma.$disconnect();
  });

  describe('MockDataGeneratorService Integration', () => {
    it('should generate realistic mock data using actual master data', async () => {
      const config: MockDataConfig = {
        childId: testChildId,
        timeRangeMonths: 2,
        learningVelocity: 'average',
        subjectPreferences: {
          'mathematics': 0.8,
          'science': 0.6,
          'english-language-arts': 0.7
        },
        difficultyPreference: 'balanced',
        sessionFrequency: 'medium',
        consistencyLevel: 'moderate',
        helpSeekingBehavior: 'moderate'
      };

      const result = await mockDataService.generateRealisticMockData(config);

      // Verify structure
      expect(result).toHaveProperty('progressRecords');
      expect(result).toHaveProperty('contentInteractions');
      expect(result).toHaveProperty('resourceUsage');
      expect(result).toHaveProperty('helpRequests');
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('studyPlans');
      expect(result).toHaveProperty('activities');

      // Verify data quality
      expect(result.studyPlans.length).toBeGreaterThan(0);
      expect(result.activities.length).toBeGreaterThan(0);
      expect(result.progressRecords.length).toBeGreaterThan(0);

      // Verify relationships
      result.activities.forEach(activity => {
        expect(result.studyPlans.some(plan => plan.id === activity.planId)).toBe(true);
      });

      result.progressRecords.forEach(record => {
        expect(result.activities.some(activity => activity.id === record.activityId)).toBe(true);
      });

      // Verify realistic data
      const completedRecords = result.progressRecords.filter(r => r.status === 'COMPLETED');
      if (completedRecords.length > 0) {
        const avgScore = completedRecords.reduce((sum, r) => sum + r.score, 0) / completedRecords.length;
        expect(avgScore).toBeGreaterThan(0);
        expect(avgScore).toBeLessThanOrEqual(100);
      }
    }, 30000); // Increase timeout for integration test

    it('should generate different patterns for different learning profiles', async () => {
      const highAchieverConfig: MockDataConfig = {
        childId: testChildId,
        timeRangeMonths: 1,
        learningVelocity: 'fast',
        subjectPreferences: { 'mathematics': 0.9 },
        difficultyPreference: 'challenging',
        sessionFrequency: 'high',
        consistencyLevel: 'consistent',
        helpSeekingBehavior: 'independent'
      };

      const strugglingConfig: MockDataConfig = {
        childId: testChildId,
        timeRangeMonths: 1,
        learningVelocity: 'slow',
        subjectPreferences: { 'mathematics': 0.3 },
        difficultyPreference: 'conservative',
        sessionFrequency: 'low',
        consistencyLevel: 'inconsistent',
        helpSeekingBehavior: 'frequent'
      };

      const highAchieverResult = await mockDataService.generateRealisticMockData(highAchieverConfig);
      const strugglingResult = await mockDataService.generateRealisticMockData(strugglingConfig);

      // High achievers should have better performance
      const highAchieverAvg = highAchieverResult.progressRecords
        .filter(r => r.score > 0)
        .reduce((sum, r) => sum + r.score, 0) / highAchieverResult.progressRecords.filter(r => r.score > 0).length;

      const strugglingAvg = strugglingResult.progressRecords
        .filter(r => r.score > 0)
        .reduce((sum, r) => sum + r.score, 0) / strugglingResult.progressRecords.filter(r => r.score > 0).length;

      if (!isNaN(highAchieverAvg) && !isNaN(strugglingAvg)) {
        expect(highAchieverAvg).toBeGreaterThan(strugglingAvg);
      }

      // Struggling learners should have more help requests
      const highAchieverHelpRatio = highAchieverResult.helpRequests.length / Math.max(1, highAchieverResult.progressRecords.length);
      const strugglingHelpRatio = strugglingResult.helpRequests.length / Math.max(1, strugglingResult.progressRecords.length);

      expect(strugglingHelpRatio).toBeGreaterThanOrEqual(highAchieverHelpRatio);
    }, 30000);
  });

  describe('DemoDataSeedingService Integration', () => {
    beforeEach(async () => {
      // Clear any existing demo data
      await demoSeedingService.clearDemoData();
    });

    afterEach(async () => {
      // Clean up after each test
      await demoSeedingService.clearDemoData();
    });

    it('should seed complete demo data with realistic families', async () => {
      const config: DemoSeedingConfig = {
        familyCount: 2,
        childrenPerFamily: { min: 1, max: 2 },
        timeRangeMonths: 1,
        includeVariedProfiles: true,
        generateResourceUsage: true,
        createRealisticProgression: true
      };

      const result = await demoSeedingService.seedDemoData(config);

      expect(result.success).toBe(true);
      expect(result.familiesCreated).toBe(2);
      expect(result.childrenCreated).toBeGreaterThanOrEqual(2);
      expect(result.childrenCreated).toBeLessThanOrEqual(4);
      expect(result.progressRecordsCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify data was actually created in database
      const demoUsers = await prisma.user.findMany({
        where: { id: { startsWith: 'demo-parent-' } }
      });
      expect(demoUsers.length).toBe(2);

      const demoChildren = await prisma.childProfile.findMany({
        where: { id: { startsWith: 'demo-child-' } }
      });
      expect(demoChildren.length).toBe(result.childrenCreated);

      const demoProgress = await prisma.progressRecord.findMany({
        where: { childId: { startsWith: 'demo-child-' } }
      });
      expect(demoProgress.length).toBe(result.progressRecordsCreated);

      // Verify realistic data distribution
      expect(result.summary.subjectsCovered.length).toBeGreaterThan(0);
      expect(result.summary.gradesCovered.length).toBeGreaterThan(0);
    }, 60000); // Longer timeout for full seeding

    it('should handle existing data gracefully', async () => {
      const config: DemoSeedingConfig = {
        familyCount: 1,
        childrenPerFamily: { min: 1, max: 1 },
        timeRangeMonths: 1,
        includeVariedProfiles: true,
        generateResourceUsage: true,
        createRealisticProgression: true
      };

      // Seed once
      const firstResult = await demoSeedingService.seedDemoData(config);
      expect(firstResult.success).toBe(true);

      // Seed again - should handle existing data
      const secondResult = await demoSeedingService.seedDemoData(config);
      expect(secondResult.success).toBe(true);

      // Should not create duplicate users
      const demoUsers = await prisma.user.findMany({
        where: { id: { startsWith: 'demo-parent-' } }
      });
      expect(demoUsers.length).toBe(1); // Should still be 1, not 2
    }, 60000);

    it('should clear all demo data completely', async () => {
      const config: DemoSeedingConfig = {
        familyCount: 1,
        childrenPerFamily: { min: 1, max: 1 },
        timeRangeMonths: 1,
        includeVariedProfiles: true,
        generateResourceUsage: true,
        createRealisticProgression: true
      };

      // Seed data
      await demoSeedingService.seedDemoData(config);

      // Verify data exists
      const beforeUsers = await prisma.user.count({
        where: { id: { startsWith: 'demo-parent-' } }
      });
      const beforeChildren = await prisma.childProfile.count({
        where: { id: { startsWith: 'demo-child-' } }
      });
      expect(beforeUsers).toBeGreaterThan(0);
      expect(beforeChildren).toBeGreaterThan(0);

      // Clear data
      await demoSeedingService.clearDemoData();

      // Verify data is gone
      const afterUsers = await prisma.user.count({
        where: { id: { startsWith: 'demo-parent-' } }
      });
      const afterChildren = await prisma.childProfile.count({
        where: { id: { startsWith: 'demo-child-' } }
      });
      const afterProgress = await prisma.progressRecord.count({
        where: { childId: { startsWith: 'demo-child-' } }
      });

      expect(afterUsers).toBe(0);
      expect(afterChildren).toBe(0);
      expect(afterProgress).toBe(0);
    }, 60000);
  });

  describe('Master Data Integration', () => {
    it('should use actual master data for realistic generation', async () => {
      // Get actual subjects from master data
      const subjects = await masterDataService.getAllSubjects();
      expect(subjects.length).toBeGreaterThan(0);

      // Get topics for a specific grade and subject
      const mathTopics = await masterDataService.getTopicsBySubject('5', 'mathematics');
      
      if (mathTopics.length > 0) {
        const config: MockDataConfig = {
          childId: testChildId,
          timeRangeMonths: 1,
          learningVelocity: 'average',
          subjectPreferences: { 'mathematics': 0.8 },
          difficultyPreference: 'balanced',
          sessionFrequency: 'medium',
          consistencyLevel: 'moderate',
          helpSeekingBehavior: 'moderate'
        };

        const result = await mockDataService.generateRealisticMockData(config);

        // Should have math-focused study plans
        const mathPlans = result.studyPlans.filter(plan => plan.subject === 'mathematics');
        expect(mathPlans.length).toBeGreaterThan(0);

        // Activities should reference actual topics
        const mathActivities = result.activities.filter(activity => 
          mathPlans.some(plan => plan.id === activity.planId)
        );
        expect(mathActivities.length).toBeGreaterThan(0);
      }
    }, 30000);
  });
});