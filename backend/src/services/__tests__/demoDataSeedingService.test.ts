import { PrismaClient } from '@prisma/client';
import { DemoDataSeedingService, DemoSeedingConfig } from '../demoDataSeedingService';
import { MockDataGeneratorService } from '../mockDataGeneratorService';
import { MasterDataService } from '../masterDataService';

// Mock dependencies
jest.mock('../mockDataGeneratorService');
jest.mock('../masterDataService');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  childProfile: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  studyPlan: {
    upsert: jest.fn()
  },
  studyActivity: {
    upsert: jest.fn()
  },
  progressRecord: {
    upsert: jest.fn()
  },
  studyContent: {
    upsert: jest.fn()
  },
  contentInteraction: {
    upsert: jest.fn()
  },
  topicResource: {
    upsert: jest.fn()
  },
  resourceUsage: {
    upsert: jest.fn()
  },
  helpRequest: {
    upsert: jest.fn()
  },
  // For clearing data
  resourceUsage: {
    deleteMany: jest.fn()
  },
  contentInteraction: {
    deleteMany: jest.fn()
  },
  helpRequest: {
    deleteMany: jest.fn()
  },
  progressRecord: {
    deleteMany: jest.fn()
  },
  studyContent: {
    deleteMany: jest.fn()
  },
  studyActivity: {
    deleteMany: jest.fn()
  },
  studyPlan: {
    deleteMany: jest.fn()
  },
  childProfile: {
    deleteMany: jest.fn()
  },
  user: {
    deleteMany: jest.fn()
  }
} as unknown as PrismaClient;

const MockedMockDataGeneratorService = MockDataGeneratorService as jest.MockedClass<typeof MockDataGeneratorService>;
const MockedMasterDataService = MasterDataService as jest.MockedClass<typeof MasterDataService>;

describe('DemoDataSeedingService', () => {
  let service: DemoDataSeedingService;
  let mockDataGenerator: jest.Mocked<MockDataGeneratorService>;
  let masterDataService: jest.Mocked<MasterDataService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DemoDataSeedingService(mockPrisma);
    
    mockDataGenerator = new MockedMockDataGeneratorService(mockPrisma) as jest.Mocked<MockDataGeneratorService>;
    masterDataService = new MockedMasterDataService(mockPrisma) as jest.Mocked<MasterDataService>;
    
    (service as any).mockDataGenerator = mockDataGenerator;
    (service as any).masterDataService = masterDataService;
  });

  describe('seedDemoData', () => {
    const mockConfig: DemoSeedingConfig = {
      familyCount: 2,
      childrenPerFamily: { min: 1, max: 2 },
      timeRangeMonths: 3,
      includeVariedProfiles: true,
      generateResourceUsage: true,
      createRealisticProgression: true
    };

    const mockSubjects = [
      { id: 'mathematics', name: 'mathematics', displayName: 'Mathematics' },
      { id: 'science', name: 'science', displayName: 'Science' }
    ];

    const mockMockData = {
      progressRecords: [
        { id: 'progress-1', childId: 'child-1', score: 85, status: 'COMPLETED' }
      ],
      contentInteractions: [
        { id: 'interaction-1', childId: 'child-1', contentId: 'content-1' }
      ],
      resourceUsage: [
        { id: 'usage-1', childId: 'child-1', resourceId: 'resource-1' }
      ],
      helpRequests: [
        { id: 'help-1', childId: 'child-1', question: 'Need help' }
      ],
      achievements: [
        { id: 'achievement-1', childId: 'child-1', type: 'FIRST_COMPLETION' }
      ],
      studyPlans: [
        { id: 'plan-1', childId: 'child-1', subject: 'mathematics' }
      ],
      activities: [
        { id: 'activity-1', planId: 'plan-1', title: 'Math Activity' }
      ]
    };

    beforeEach(() => {
      masterDataService.getAllSubjects.mockResolvedValue(mockSubjects);
      mockDataGenerator.generateRealisticMockData.mockResolvedValue(mockMockData);
      
      // Mock database operations
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.childProfile.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.studyPlan.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.studyActivity.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.progressRecord.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.studyContent.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.contentInteraction.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.topicResource.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.resourceUsage.upsert as jest.Mock).mockResolvedValue({});
      (mockPrisma.helpRequest.upsert as jest.Mock).mockResolvedValue({});
    });

    it('should successfully seed demo data', async () => {
      const result = await service.seedDemoData(mockConfig);

      expect(result.success).toBe(true);
      expect(result.familiesCreated).toBe(2);
      expect(result.childrenCreated).toBeGreaterThan(0);
      expect(result.progressRecordsCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should create families with varied profiles', async () => {
      await service.seedDemoData(mockConfig);

      // Should call mock data generator for each child
      expect(mockDataGenerator.generateRealisticMockData).toHaveBeenCalled();
      
      // Should create parent users
      expect(mockPrisma.user.create).toHaveBeenCalled();
      
      // Should create child profiles
      expect(mockPrisma.childProfile.create).toHaveBeenCalled();
    });

    it('should generate different learning profiles for variety', async () => {
      const config = {
        ...mockConfig,
        familyCount: 8, // Enough to test all profile types
        childrenPerFamily: { min: 1, max: 1 }
      };

      await service.seedDemoData(config);

      // Should generate different profiles
      const calls = mockDataGenerator.generateRealisticMockData.mock.calls;
      expect(calls.length).toBe(8);

      // Check that different learning velocities are used
      const velocities = calls.map(call => call[0].learningVelocity);
      const uniqueVelocities = new Set(velocities);
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in user creation
      (mockPrisma.user.create as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const result = await service.seedDemoData(mockConfig);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Database error');
    });

    it('should skip existing users and children', async () => {
      // Mock existing user
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing-user' });
      (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing-child' });

      await service.seedDemoData(mockConfig);

      // Should not create existing users/children
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should store all generated mock data', async () => {
      await service.seedDemoData(mockConfig);

      // Should store all types of data
      expect(mockPrisma.studyPlan.upsert).toHaveBeenCalled();
      expect(mockPrisma.studyActivity.upsert).toHaveBeenCalled();
      expect(mockPrisma.progressRecord.upsert).toHaveBeenCalled();
      expect(mockPrisma.contentInteraction.upsert).toHaveBeenCalled();
      expect(mockPrisma.helpRequest.upsert).toHaveBeenCalled();
    });

    it('should track subjects and grades covered', async () => {
      const result = await service.seedDemoData(mockConfig);

      expect(result.summary.subjectsCovered).toContain('mathematics');
      expect(result.summary.gradesCovered.length).toBeGreaterThan(0);
      expect(result.summary.totalUsers).toBeGreaterThan(0);
      expect(result.summary.totalActivities).toBeGreaterThan(0);
    });

    it('should respect family and children count limits', async () => {
      const config = {
        ...mockConfig,
        familyCount: 3,
        childrenPerFamily: { min: 2, max: 3 }
      };

      const result = await service.seedDemoData(config);

      expect(result.familiesCreated).toBe(3);
      expect(result.childrenCreated).toBeGreaterThanOrEqual(6); // 3 families * 2 min children
      expect(result.childrenCreated).toBeLessThanOrEqual(9); // 3 families * 3 max children
    });
  });

  describe('clearDemoData', () => {
    beforeEach(() => {
      // Mock all delete operations
      (mockPrisma.resourceUsage.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (mockPrisma.contentInteraction.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });
      (mockPrisma.helpRequest.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (mockPrisma.progressRecord.deleteMany as jest.Mock).mockResolvedValue({ count: 20 });
      (mockPrisma.studyContent.deleteMany as jest.Mock).mockResolvedValue({ count: 15 });
      (mockPrisma.studyActivity.deleteMany as jest.Mock).mockResolvedValue({ count: 25 });
      (mockPrisma.studyPlan.deleteMany as jest.Mock).mockResolvedValue({ count: 8 });
      (mockPrisma.childProfile.deleteMany as jest.Mock).mockResolvedValue({ count: 6 });
      (mockPrisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
    });

    it('should clear all demo data in correct order', async () => {
      await service.clearDemoData();

      // Should delete in reverse dependency order
      expect(mockPrisma.resourceUsage.deleteMany).toHaveBeenCalledWith({
        where: { childId: { startsWith: 'demo-child-' } }
      });
      expect(mockPrisma.contentInteraction.deleteMany).toHaveBeenCalledWith({
        where: { childId: { startsWith: 'demo-child-' } }
      });
      expect(mockPrisma.helpRequest.deleteMany).toHaveBeenCalledWith({
        where: { childId: { startsWith: 'demo-child-' } }
      });
      expect(mockPrisma.progressRecord.deleteMany).toHaveBeenCalledWith({
        where: { childId: { startsWith: 'demo-child-' } }
      });
      expect(mockPrisma.studyContent.deleteMany).toHaveBeenCalledWith({
        where: { id: { startsWith: 'mock-content-' } }
      });
      expect(mockPrisma.studyActivity.deleteMany).toHaveBeenCalledWith({
        where: { id: { startsWith: 'mock-activity-' } }
      });
      expect(mockPrisma.studyPlan.deleteMany).toHaveBeenCalledWith({
        where: { id: { startsWith: 'mock-plan-' } }
      });
      expect(mockPrisma.childProfile.deleteMany).toHaveBeenCalledWith({
        where: { id: { startsWith: 'demo-child-' } }
      });
      expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { startsWith: 'demo-parent-' } }
      });
    });

    it('should handle errors during clearing', async () => {
      (mockPrisma.user.deleteMany as jest.Mock).mockRejectedValue(new Error('Delete error'));

      await expect(service.clearDemoData()).rejects.toThrow('Delete error');
    });
  });

  describe('demo family generation', () => {
    it('should generate families with realistic names and emails', async () => {
      const config: DemoSeedingConfig = {
        familyCount: 2,
        childrenPerFamily: { min: 1, max: 2 },
        timeRangeMonths: 3,
        includeVariedProfiles: true,
        generateResourceUsage: true,
        createRealisticProgression: true
      };

      masterDataService.getAllSubjects.mockResolvedValue([
        { id: 'mathematics', name: 'mathematics', displayName: 'Mathematics' }
      ]);

      // Access private method for testing
      const families = await (service as any).generateDemoFamilies(config);

      expect(families).toHaveLength(2);
      
      families.forEach((family: any) => {
        expect(family.parentId).toMatch(/^demo-parent-\d+$/);
        expect(family.parentName).toBeTruthy();
        expect(family.parentEmail).toContain('@demo.com');
        expect(family.children.length).toBeGreaterThanOrEqual(1);
        expect(family.children.length).toBeLessThanOrEqual(2);
        
        family.children.forEach((child: any) => {
          expect(child.id).toMatch(/^demo-child-demo-family-\d+-\d+$/);
          expect(child.firstName).toBeTruthy();
          expect(child.lastName).toBeTruthy();
          expect(child.gradeLevel).toMatch(/^(K|[1-9]|1[0-2])$/);
          expect(child.age).toBeGreaterThan(0);
          expect(child.learningProfile).toBeDefined();
        });
      });
    });

    it('should generate varied learning profiles', async () => {
      const config: DemoSeedingConfig = {
        familyCount: 8,
        childrenPerFamily: { min: 1, max: 1 },
        timeRangeMonths: 3,
        includeVariedProfiles: true,
        generateResourceUsage: true,
        createRealisticProgression: true
      };

      masterDataService.getAllSubjects.mockResolvedValue([
        { id: 'mathematics', name: 'mathematics', displayName: 'Mathematics' },
        { id: 'science', name: 'science', displayName: 'Science' }
      ]);

      const families = await (service as any).generateDemoFamilies(config);

      // Should have different learning velocities
      const velocities = families.map((f: any) => f.children[0].learningProfile.learningVelocity);
      const uniqueVelocities = new Set(velocities);
      expect(uniqueVelocities.size).toBeGreaterThan(1);

      // Should have different difficulty preferences
      const difficulties = families.map((f: any) => f.children[0].learningProfile.difficultyPreference);
      const uniqueDifficulties = new Set(difficulties);
      expect(uniqueDifficulties.size).toBeGreaterThan(1);
    });
  });

  describe('age calculation', () => {
    it('should return correct ages for grade levels', () => {
      expect((service as any).getAgeForGrade('K')).toBe(5);
      expect((service as any).getAgeForGrade('1')).toBe(6);
      expect((service as any).getAgeForGrade('5')).toBe(10);
      expect((service as any).getAgeForGrade('12')).toBe(17);
      expect((service as any).getAgeForGrade('invalid')).toBe(10); // Default
    });
  });
});