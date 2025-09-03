import { PrismaClient } from '@prisma/client';
import { MockDataGeneratorService, MockDataConfig } from '../mockDataGeneratorService';
import { MasterDataService } from '../masterDataService';

// Mock Prisma
const mockPrisma = {
  childProfile: {
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

// Mock MasterDataService
jest.mock('../masterDataService');
const MockedMasterDataService = MasterDataService as jest.MockedClass<typeof MasterDataService>;

describe('MockDataGeneratorService', () => {
  let service: MockDataGeneratorService;
  let mockMasterDataService: jest.Mocked<MasterDataService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MockDataGeneratorService(mockPrisma);
    mockMasterDataService = new MockedMasterDataService(mockPrisma) as jest.Mocked<MasterDataService>;
    (service as any).masterDataService = mockMasterDataService;
  });

  describe('generateRealisticMockData', () => {
    const mockConfig: MockDataConfig = {
      childId: 'test-child-1',
      timeRangeMonths: 3,
      learningVelocity: 'average',
      subjectPreferences: {
        'mathematics': 0.8,
        'english-language-arts': 0.6,
        'science': 0.7
      },
      difficultyPreference: 'balanced',
      sessionFrequency: 'medium',
      consistencyLevel: 'moderate',
      helpSeekingBehavior: 'moderate'
    };

    const mockChild = {
      gradeLevel: '5',
      firstName: 'Test Child'
    };

    const mockSubjects = [
      {
        id: 'mathematics',
        name: 'mathematics',
        displayName: 'Mathematics',
        description: 'Mathematics subject',
        icon: 'calculate',
        color: '#2196F3',
        category: 'CORE_ACADEMIC' as any,
        isCore: true,
        sortOrder: 1,
        gradeAvailability: ['5'],
        estimatedHoursPerGrade: { '5': 120 },
        prerequisites: [],
        difficultyProgression: { '5': 'intermediate' as any },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'english-language-arts',
        name: 'english-language-arts',
        displayName: 'English Language Arts',
        description: 'English Language Arts subject',
        icon: 'menu_book',
        color: '#4CAF50',
        category: 'LANGUAGE_ARTS' as any,
        isCore: true,
        sortOrder: 2,
        gradeAvailability: ['5'],
        estimatedHoursPerGrade: { '5': 140 },
        prerequisites: [],
        difficultyProgression: { '5': 'intermediate' as any },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'science',
        name: 'science',
        displayName: 'Science',
        description: 'Science subject',
        icon: 'science',
        color: '#FF9800',
        category: 'STEM' as any,
        isCore: true,
        sortOrder: 3,
        gradeAvailability: ['5'],
        estimatedHoursPerGrade: { '5': 90 },
        prerequisites: [],
        difficultyProgression: { '5': 'intermediate' as any },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockTopics = [
      {
        id: 'topic-1',
        name: 'fractions',
        displayName: 'Fractions',
        description: 'Understanding fractions',
        gradeId: '5',
        subjectId: 'mathematics',
        difficulty: 'INTERMEDIATE' as any,
        estimatedHours: 4,
        prerequisites: [],
        learningObjectives: ['Understand fractions'],
        skills: ['Fraction concepts'],
        assessmentCriteria: ['Can identify fractions'],
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'topic-2',
        name: 'reading-comprehension',
        displayName: 'Reading Comprehension',
        description: 'Reading comprehension skills',
        gradeId: '5',
        subjectId: 'english-language-arts',
        difficulty: 'INTERMEDIATE' as any,
        estimatedHours: 3,
        prerequisites: [],
        learningObjectives: ['Improve reading comprehension'],
        skills: ['Reading skills'],
        assessmentCriteria: ['Can comprehend text'],
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue(mockChild);
      mockMasterDataService.getSubjectsByGrade.mockResolvedValue(mockSubjects);
      mockMasterDataService.getTopicsBySubject.mockResolvedValue(mockTopics);
    });

    it('should generate realistic mock data with correct structure', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      expect(result).toHaveProperty('progressRecords');
      expect(result).toHaveProperty('contentInteractions');
      expect(result).toHaveProperty('resourceUsage');
      expect(result).toHaveProperty('helpRequests');
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('studyPlans');
      expect(result).toHaveProperty('activities');

      expect(Array.isArray(result.progressRecords)).toBe(true);
      expect(Array.isArray(result.contentInteractions)).toBe(true);
      expect(Array.isArray(result.resourceUsage)).toBe(true);
      expect(Array.isArray(result.helpRequests)).toBe(true);
      expect(Array.isArray(result.achievements)).toBe(true);
      expect(Array.isArray(result.studyPlans)).toBe(true);
      expect(Array.isArray(result.activities)).toBe(true);
    });

    it('should generate study plans based on subject preferences', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      expect(result.studyPlans.length).toBeGreaterThan(0);
      
      // Should have plans for preferred subjects
      const planSubjects = result.studyPlans.map(plan => plan.subject);
      expect(planSubjects).toContain('mathematics'); // High preference (0.8)
    });

    it('should generate activities for each study plan', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      expect(result.activities.length).toBeGreaterThan(0);
      
      // Each activity should have required fields
      result.activities.forEach(activity => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('planId');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('difficulty');
        expect(activity).toHaveProperty('estimatedMinutes');
      });
    });

    it('should generate progress records with realistic scores based on learning velocity', async () => {
      const fastLearnerConfig = {
        ...mockConfig,
        learningVelocity: 'fast' as const
      };

      const slowLearnerConfig = {
        ...mockConfig,
        learningVelocity: 'slow' as const
      };

      const fastResult = await service.generateRealisticMockData(fastLearnerConfig);
      const slowResult = await service.generateRealisticMockData(slowLearnerConfig);

      // Fast learners should generally have higher scores
      const fastAvgScore = fastResult.progressRecords
        .filter(r => r.score > 0)
        .reduce((sum, r) => sum + r.score, 0) / fastResult.progressRecords.filter(r => r.score > 0).length;

      const slowAvgScore = slowResult.progressRecords
        .filter(r => r.score > 0)
        .reduce((sum, r) => sum + r.score, 0) / slowResult.progressRecords.filter(r => r.score > 0).length;

      if (fastResult.progressRecords.length > 0 && slowResult.progressRecords.length > 0) {
        expect(fastAvgScore).toBeGreaterThan(slowAvgScore);
      }
    });

    it('should generate help requests based on help seeking behavior', async () => {
      const frequentHelpConfig = {
        ...mockConfig,
        helpSeekingBehavior: 'frequent' as const
      };

      const independentConfig = {
        ...mockConfig,
        helpSeekingBehavior: 'independent' as const
      };

      const frequentResult = await service.generateRealisticMockData(frequentHelpConfig);
      const independentResult = await service.generateRealisticMockData(independentConfig);

      // Frequent help seekers should have more help requests
      if (frequentResult.progressRecords.length > 0 && independentResult.progressRecords.length > 0) {
        const frequentHelpRatio = frequentResult.helpRequests.length / frequentResult.progressRecords.length;
        const independentHelpRatio = independentResult.helpRequests.length / independentResult.progressRecords.length;
        
        expect(frequentHelpRatio).toBeGreaterThan(independentHelpRatio);
      }
    });

    it('should generate content interactions for each progress record', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      if (result.progressRecords.length > 0) {
        expect(result.contentInteractions.length).toBeGreaterThan(0);
        
        // Each interaction should have required fields
        result.contentInteractions.forEach(interaction => {
          expect(interaction).toHaveProperty('id');
          expect(interaction).toHaveProperty('childId', mockConfig.childId);
          expect(interaction).toHaveProperty('contentId');
          expect(interaction).toHaveProperty('interactionType');
          expect(interaction).toHaveProperty('duration');
          expect(interaction).toHaveProperty('completed');
        });
      }
    });

    it('should generate resource usage based on preferences', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      if (result.progressRecords.length > 0) {
        expect(result.resourceUsage.length).toBeGreaterThan(0);
        
        // Each usage should have required fields
        result.resourceUsage.forEach(usage => {
          expect(usage).toHaveProperty('id');
          expect(usage).toHaveProperty('childId', mockConfig.childId);
          expect(usage).toHaveProperty('resourceId');
          expect(usage).toHaveProperty('duration');
          expect(usage).toHaveProperty('completed');
          expect(usage).toHaveProperty('resource');
        });
      }
    });

    it('should generate achievements based on progress', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      if (result.progressRecords.some(r => r.status === 'COMPLETED')) {
        expect(result.achievements.length).toBeGreaterThan(0);
        
        // Should have first completion achievement
        const firstCompletion = result.achievements.find(a => a.type === 'FIRST_COMPLETION');
        expect(firstCompletion).toBeDefined();
        expect(firstCompletion?.title).toBe('First Steps');
      }
    });

    it('should handle child not found error', async () => {
      (mockPrisma.childProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.generateRealisticMockData(mockConfig))
        .rejects.toThrow('Child not found: test-child-1');
    });

    it('should generate data within specified time range', async () => {
      const result = await service.generateRealisticMockData(mockConfig);

      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // All timestamps should be within the specified range
      result.progressRecords.forEach(record => {
        expect(new Date(record.createdAt)).toBeInstanceOf(Date);
        expect(new Date(record.createdAt).getTime()).toBeGreaterThanOrEqual(threeMonthsAgo.getTime());
        expect(new Date(record.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should respect consistency level in session generation', async () => {
      const consistentConfig = {
        ...mockConfig,
        consistencyLevel: 'consistent' as const,
        sessionFrequency: 'high' as const
      };

      const inconsistentConfig = {
        ...mockConfig,
        consistencyLevel: 'inconsistent' as const,
        sessionFrequency: 'high' as const
      };

      const consistentResult = await service.generateRealisticMockData(consistentConfig);
      const inconsistentResult = await service.generateRealisticMockData(inconsistentConfig);

      // Consistent learners should have more regular progress records
      if (consistentResult.progressRecords.length > 0 && inconsistentResult.progressRecords.length > 0) {
        // This is a rough heuristic - consistent learners should have more total records
        // for the same time period due to regular sessions
        expect(consistentResult.progressRecords.length).toBeGreaterThanOrEqual(inconsistentResult.progressRecords.length * 0.8);
      }
    });
  });

  describe('learning pattern generation', () => {
    it('should generate appropriate learning patterns for different configurations', () => {
      const config: MockDataConfig = {
        childId: 'test-child',
        timeRangeMonths: 6,
        learningVelocity: 'fast',
        subjectPreferences: {
          'mathematics': 0.9,
          'science': 0.8,
          'english-language-arts': 0.4
        },
        difficultyPreference: 'challenging',
        sessionFrequency: 'high',
        consistencyLevel: 'consistent',
        helpSeekingBehavior: 'independent'
      };

      const subjects = [
        { id: 'mathematics', name: 'mathematics', displayName: 'Mathematics' },
        { id: 'science', name: 'science', displayName: 'Science' },
        { id: 'english-language-arts', name: 'english-language-arts', displayName: 'English Language Arts' }
      ];

      // Access private method for testing
      const learningPattern = (service as any).generateLearningPattern(config, subjects);

      expect(learningPattern.subjectEngagement['mathematics']).toBeGreaterThan(0.7);
      expect(learningPattern.subjectEngagement['science']).toBeGreaterThan(0.6);
      expect(learningPattern.subjectEngagement['english-language-arts']).toBeLessThan(0.6);

      expect(learningPattern.helpRequestPatterns.frequency).toBeLessThan(0.3); // Independent behavior
      expect(learningPattern.difficultyProgression['mathematics']).toBe('ADVANCED'); // High engagement + challenging preference
    });
  });
});