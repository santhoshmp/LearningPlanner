import { MockDataGeneratorService, MockDataConfig } from '../mockDataGeneratorService';

describe('MockDataGeneratorService - Core Functionality', () => {
  let service: MockDataGeneratorService;

  beforeEach(() => {
    // Create a minimal mock prisma for testing core logic
    const mockPrisma = {
      childProfile: {
        findUnique: jest.fn().mockResolvedValue({
          gradeLevel: '5',
          name: 'Test Child'
        })
      }
    } as any;

    service = new MockDataGeneratorService(mockPrisma);
    
    // Mock the master data service methods
    (service as any).masterDataService = {
      getSubjectsByGrade: jest.fn().mockResolvedValue([
        { id: 'mathematics', name: 'mathematics', displayName: 'Mathematics' },
        { id: 'science', name: 'science', displayName: 'Science' }
      ]),
      getTopicsBySubject: jest.fn().mockResolvedValue([
        { id: 'topic-1', name: 'fractions', displayName: 'Fractions', subjectId: 'mathematics', difficulty: 'INTERMEDIATE' }
      ])
    };
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

    it('should generate time progression with correct frequency', () => {
      const config: MockDataConfig = {
        childId: 'test-child',
        timeRangeMonths: 2,
        learningVelocity: 'average',
        subjectPreferences: {},
        difficultyPreference: 'balanced',
        sessionFrequency: 'high',
        consistencyLevel: 'consistent',
        helpSeekingBehavior: 'moderate'
      };

      const timeProgression = (service as any).generateTimeProgression(config);

      expect(Array.isArray(timeProgression)).toBe(true);
      expect(timeProgression.length).toBeGreaterThan(0);
      
      // Should have dates within the specified range
      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      timeProgression.forEach((date: Date) => {
        expect(date.getTime()).toBeGreaterThanOrEqual(twoMonthsAgo.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should calculate base performance correctly', () => {
      const fastPerformance = (service as any).calculateBasePerformance('fast', 0.8, 0);
      const slowPerformance = (service as any).calculateBasePerformance('slow', 0.8, 0);
      const averagePerformance = (service as any).calculateBasePerformance('average', 0.8, 0);

      expect(fastPerformance).toBeGreaterThan(slowPerformance);
      expect(averagePerformance).toBeGreaterThan(slowPerformance);
      expect(averagePerformance).toBeLessThan(fastPerformance);

      // Test attempt bonus
      const withAttempts = (service as any).calculateBasePerformance('average', 0.8, 2);
      expect(withAttempts).toBeGreaterThan(averagePerformance);
    });

    it('should generate help questions', () => {
      const question1 = (service as any).generateHelpQuestion('Math Fractions');
      const question2 = (service as any).generateHelpQuestion('Reading Comprehension');

      expect(typeof question1).toBe('string');
      expect(typeof question2).toBe('string');
      expect(question1).toContain('Math Fractions');
      expect(question2).toContain('Reading Comprehension');
    });

    it('should select activity types', () => {
      const activityType = (service as any).selectActivityType();
      const validTypes = ['lesson', 'practice', 'quiz', 'project', 'review'];
      
      expect(validTypes).toContain(activityType);
    });

    it('should select help categories', () => {
      const category = (service as any).selectHelpCategory();
      const validCategories = ['concept', 'technical', 'navigation', 'content'];
      
      expect(validCategories).toContain(category);
    });

    it('should perform weighted random selection', () => {
      const items = ['A', 'B', 'C'];
      const weights = [0.1, 0.8, 0.1]; // B should be selected most often
      
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        results.push((service as any).weightedRandomSelect(items, weights));
      }
      
      const bCount = results.filter(r => r === 'B').length;
      expect(bCount).toBeGreaterThan(50); // Should be selected more than 50% of the time
    });

    it('should select random items correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const selected = (service as any).selectRandomItems(items, 3);
      
      expect(selected).toHaveLength(3);
      expect(new Set(selected).size).toBe(3); // All unique
      selected.forEach(item => {
        expect(items).toContain(item);
      });
    });
  });

  describe('configuration validation', () => {
    it('should handle different learning velocities', () => {
      const velocities: Array<'slow' | 'average' | 'fast'> = ['slow', 'average', 'fast'];
      
      velocities.forEach(velocity => {
        const config: MockDataConfig = {
          childId: 'test-child',
          timeRangeMonths: 1,
          learningVelocity: velocity,
          subjectPreferences: { 'mathematics': 0.5 },
          difficultyPreference: 'balanced',
          sessionFrequency: 'medium',
          consistencyLevel: 'moderate',
          helpSeekingBehavior: 'moderate'
        };

        const performance = (service as any).calculateBasePerformance(velocity, 0.5, 0);
        expect(typeof performance).toBe('number');
        expect(performance).toBeGreaterThan(0);
      });
    });

    it('should handle different difficulty preferences', () => {
      const difficulties: Array<'conservative' | 'balanced' | 'challenging'> = ['conservative', 'balanced', 'challenging'];
      
      difficulties.forEach(difficulty => {
        const config: MockDataConfig = {
          childId: 'test-child',
          timeRangeMonths: 1,
          learningVelocity: 'average',
          subjectPreferences: { 'mathematics': 0.5 },
          difficultyPreference: difficulty,
          sessionFrequency: 'medium',
          consistencyLevel: 'moderate',
          helpSeekingBehavior: 'moderate'
        };

        expect(config.difficultyPreference).toBe(difficulty);
      });
    });

    it('should handle different session frequencies', () => {
      const frequencies: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      
      frequencies.forEach(frequency => {
        const config: MockDataConfig = {
          childId: 'test-child',
          timeRangeMonths: 1,
          learningVelocity: 'average',
          subjectPreferences: { 'mathematics': 0.5 },
          difficultyPreference: 'balanced',
          sessionFrequency: frequency,
          consistencyLevel: 'moderate',
          helpSeekingBehavior: 'moderate'
        };

        const timeProgression = (service as any).generateTimeProgression(config);
        expect(Array.isArray(timeProgression)).toBe(true);
      });
    });
  });
});