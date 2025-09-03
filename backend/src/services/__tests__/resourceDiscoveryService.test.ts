import { PrismaClient } from '@prisma/client';
import { ResourceDiscoveryService } from '../resourceDiscoveryService';
import { redisService } from '../redisService';
import {
  ResourceFilters,
  ResourceType,
  DifficultyLevel,
  SafetyRating,
  ResourceRecommendation,
  ResourceMetadata,
  ResourceUsageAnalytics,
  LearningPattern,
  UserPreferences
} from '../../types/masterData';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../redisService');
jest.mock('../../utils/logger');

const mockPrisma = {
  topicResource: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  resourceUsage: {
    create: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  childProfile: {
    findUnique: jest.fn(),
  },
  childSettings: {
    findUnique: jest.fn(),
  },
};

const mockRedisService = redisService as jest.Mocked<typeof redisService>;

(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('ResourceDiscoveryService', () => {
  let resourceDiscoveryService: ResourceDiscoveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    resourceDiscoveryService = new ResourceDiscoveryService(mockPrisma as any);
  });

  describe('getResourcesByFilters', () => {
    it('should return cached resources if available', async () => {
      const filters: ResourceFilters = {
        grade: '3',
        subject: 'math',
        resourceType: ResourceType.VIDEO,
        difficulty: DifficultyLevel.BEGINNER
      };

      const mockResources = [
        {
          id: 'resource-1',
          type: ResourceType.VIDEO,
          title: 'Math Video',
          url: 'https://example.com/video',
          isActive: true,
          topic: {
            grade: { grade: '3' },
            subject: { name: 'math' }
          }
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(mockResources);

      const result = await resourceDiscoveryService.getResourcesByFilters(filters);

      expect(mockRedisService.getCacheObject).toHaveBeenCalledWith(
        expect.stringContaining('resource-discovery:resources-filtered:')
      );
      expect(mockPrisma.topicResource.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockResources);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const filters: ResourceFilters = {
        grade: '3',
        subject: 'math',
        resourceType: ResourceType.VIDEO,
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE
      };

      const mockResources = [
        {
          id: 'resource-1',
          type: ResourceType.VIDEO,
          title: 'Math Video',
          difficulty: DifficultyLevel.BEGINNER,
          safetyRating: SafetyRating.SAFE,
          topic: {
            grade: { grade: '3' },
            subject: { name: 'math' }
          }
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);
      mockRedisService.setCacheObject.mockResolvedValue();

      const result = await resourceDiscoveryService.getResourcesByFilters(filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          topic: {
            grade: {
              grade: '3'
            },
            subjectId: 'math'
          },
          type: ResourceType.VIDEO,
          difficulty: DifficultyLevel.BEGINNER,
          safetyRating: SafetyRating.SAFE
        },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      expect(mockRedisService.setCacheObject).toHaveBeenCalled();
      expect(result).toEqual(mockResources);
    });

    it('should handle duration filters', async () => {
      const filters: ResourceFilters = {
        minDuration: 5,
        maxDuration: 30
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      await resourceDiscoveryService.getResourcesByFilters(filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          duration: {
            gte: 5,
            lte: 30
          }
        },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    });

    it('should handle source and tags filters', async () => {
      const filters: ResourceFilters = {
        source: 'YouTube',
        tags: ['math', 'beginner']
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      await resourceDiscoveryService.getResourcesByFilters(filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          source: {
            contains: 'YouTube',
            mode: 'insensitive'
          },
          tags: {
            hasSome: ['math', 'beginner']
          }
        },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    });
  });

  describe('getResourceRecommendations', () => {
    it('should return cached recommendations if available', async () => {
      const mockRecommendations: ResourceRecommendation[] = [
        {
          resource: {
            id: 'resource-1',
            title: 'Math Video',
            type: ResourceType.VIDEO
          },
          score: 85,
          reasons: ['You enjoy video resources', 'Matches your preferred difficulty level']
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(mockRecommendations);

      const result = await resourceDiscoveryService.getResourceRecommendations('child-1', 'topic-1', 5);

      expect(mockRedisService.getCacheObject).toHaveBeenCalledWith(
        'resource-discovery:recommendations:child-1-topic-1-5'
      );
      expect(result).toEqual(mockRecommendations);
    });

    it('should generate recommendations based on learning patterns', async () => {
      const mockChild = {
        id: 'child-1',
        age: 8,
        contentInteractions: [
          { contentId: 'content-1', interactionType: 'complete' }
        ]
      };

      const mockChildSettings = {
        childId: 'child-1',
        preferredResourceTypes: [ResourceType.VIDEO],
        preferredDifficulty: DifficultyLevel.BEGINNER,
        maxResourceDuration: 20,
        safetyLevel: SafetyRating.SAFE,
        preferredLanguages: ['en']
      };

      const mockUsageHistory = [
        {
          resource: {
            type: ResourceType.VIDEO,
            difficulty: DifficultyLevel.BEGINNER,
            topic: {
              subject: { name: 'math' }
            }
          },
          timestamp: new Date()
        }
      ];

      const mockResources = [
        {
          id: 'resource-1',
          title: 'Math Video',
          type: ResourceType.VIDEO,
          difficulty: DifficultyLevel.BEGINNER,
          duration: 15,
          safetyRating: SafetyRating.SAFE,
          createdAt: new Date(),
          topic: {
            subject: { name: 'math' }
          }
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.childSettings.findUnique.mockResolvedValue(mockChildSettings);
      mockPrisma.resourceUsage.findMany.mockResolvedValue(mockUsageHistory);
      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);
      mockRedisService.setCacheObject.mockResolvedValue();

      const result = await resourceDiscoveryService.getResourceRecommendations('child-1', 'topic-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0].resource).toEqual(mockResources[0]);
      expect(result[0].score).toBeGreaterThan(0);
      expect(result[0].reasons).toBeInstanceOf(Array);
    });

    it('should handle missing child data gracefully', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);
      mockPrisma.childSettings.findUnique.mockResolvedValue(null);
      mockPrisma.resourceUsage.findMany.mockResolvedValue([]);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      const result = await resourceDiscoveryService.getResourceRecommendations('child-1', 'topic-1', 5);

      expect(result).toEqual([]);
    });
  });

  describe('enrichResourceMetadata', () => {
    it('should enrich video metadata', async () => {
      const mockResource = {
        id: 'resource-1',
        title: 'Math Video',
        description: 'A great math video',
        type: ResourceType.VIDEO,
        url: 'https://youtube.com/watch?v=abc123',
        thumbnailUrl: 'https://img.youtube.com/vi/abc123/default.jpg',
        duration: 300,
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE,
        tags: ['math', 'video'],
        source: 'YouTube',
        lastValidated: new Date(),
        closedCaptions: true,
        topic: {
          id: 'topic-1',
          name: 'addition',
          grade: { grade: '3' },
          subject: { name: 'math' }
        }
      };

      const mockAnalytics = {
        resourceId: 'resource-1',
        totalViews: 100,
        totalCompletions: 80,
        completionRate: 80,
        averageDuration: 250,
        uniqueUsers: 50,
        lastUpdated: new Date()
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findUnique.mockResolvedValue(mockResource);
      mockPrisma.resourceUsage.count
        .mockResolvedValueOnce(100) // total views
        .mockResolvedValueOnce(80); // total completions
      mockPrisma.resourceUsage.aggregate.mockResolvedValue({
        _avg: { duration: 250 }
      });
      mockPrisma.resourceUsage.findMany.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({ childId: `child-${i}` }))
      );
      mockRedisService.setCacheObject.mockResolvedValue();

      const result = await resourceDiscoveryService.enrichResourceMetadata('resource-1');

      expect(result.id).toBe('resource-1');
      expect(result.videoMetadata).toEqual({
        videoId: 'abc123',
        platform: 'youtube',
        hasClosedCaptions: true
      });
      expect(result.analytics).toEqual(mockAnalytics);
    });

    it('should enrich reading material metadata', async () => {
      const mockResource = {
        id: 'resource-1',
        title: 'Math Article',
        description: 'A comprehensive article about addition with many words to read and understand the concepts',
        type: ResourceType.ARTICLE,
        url: 'https://example.com/article',
        readingLevel: 'grade-3',
        topic: {
          id: 'topic-1',
          name: 'addition',
          grade: { grade: '3' },
          subject: { name: 'math' }
        }
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findUnique.mockResolvedValue(mockResource);
      mockPrisma.resourceUsage.count.mockResolvedValue(0);
      mockPrisma.resourceUsage.aggregate.mockResolvedValue({ _avg: { duration: null } });
      mockPrisma.resourceUsage.findMany.mockResolvedValue([]);

      const result = await resourceDiscoveryService.enrichResourceMetadata('resource-1');

      expect(result.readingMetadata).toEqual({
        estimatedReadingTime: 1, // Based on word count
        readingLevel: 'grade-3'
      });
    });

    it('should throw error for non-existent resource', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.topicResource.findUnique.mockResolvedValue(null);

      await expect(
        resourceDiscoveryService.enrichResourceMetadata('nonexistent')
      ).rejects.toThrow('Resource not found: nonexistent');
    });
  });

  describe('trackResourceUsage', () => {
    it('should track resource usage successfully', async () => {
      const mockUsage = {
        id: 'usage-1',
        childId: 'child-1',
        resourceId: 'resource-1',
        action: 'view',
        duration: 120,
        timestamp: new Date()
      };

      mockPrisma.resourceUsage.create.mockResolvedValue(mockUsage);
      mockRedisService.del.mockResolvedValue(1);

      await resourceDiscoveryService.trackResourceUsage('child-1', 'resource-1', 'view', 120);

      expect(mockPrisma.resourceUsage.create).toHaveBeenCalledWith({
        data: {
          childId: 'child-1',
          resourceId: 'resource-1',
          action: 'view',
          duration: 120,
          timestamp: expect.any(Date)
        }
      });
      expect(mockRedisService.del).toHaveBeenCalledWith('resource-discovery:analytics:resource-1');
      expect(mockRedisService.del).toHaveBeenCalledWith('resource-discovery:learning-pattern:child-1');
    });

    it('should handle different action types', async () => {
      const actions = ['view', 'complete', 'bookmark', 'share'] as const;

      for (const action of actions) {
        mockPrisma.resourceUsage.create.mockResolvedValue({});
        mockRedisService.del.mockResolvedValue(1);

        await resourceDiscoveryService.trackResourceUsage('child-1', 'resource-1', action);

        expect(mockPrisma.resourceUsage.create).toHaveBeenCalledWith({
          data: {
            childId: 'child-1',
            resourceId: 'resource-1',
            action,
            duration: undefined,
            timestamp: expect.any(Date)
          }
        });
      }
    });
  });

  describe('getResourceAnalytics', () => {
    it('should return cached analytics if available', async () => {
      const mockAnalytics: ResourceUsageAnalytics = {
        resourceId: 'resource-1',
        totalViews: 100,
        totalCompletions: 80,
        completionRate: 80,
        averageDuration: 250,
        uniqueUsers: 50,
        lastUpdated: new Date()
      };

      mockRedisService.getCacheObject.mockResolvedValue(mockAnalytics);

      const result = await resourceDiscoveryService.getResourceAnalytics('resource-1');

      expect(result).toEqual(mockAnalytics);
      expect(mockPrisma.resourceUsage.count).not.toHaveBeenCalled();
    });

    it('should calculate analytics from database', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.resourceUsage.count
        .mockResolvedValueOnce(150) // total views
        .mockResolvedValueOnce(120); // total completions
      mockPrisma.resourceUsage.aggregate.mockResolvedValue({
        _avg: { duration: 300 }
      });
      mockPrisma.resourceUsage.findMany.mockResolvedValue(
        Array.from({ length: 75 }, (_, i) => ({ childId: `child-${i}` }))
      );
      mockRedisService.setCacheObject.mockResolvedValue();

      const result = await resourceDiscoveryService.getResourceAnalytics('resource-1');

      expect(result).toEqual({
        resourceId: 'resource-1',
        totalViews: 150,
        totalCompletions: 120,
        completionRate: 80, // (120/150) * 100
        averageDuration: 300,
        uniqueUsers: 75,
        lastUpdated: expect.any(Date)
      });
    });

    it('should handle zero views gracefully', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.resourceUsage.count
        .mockResolvedValueOnce(0) // total views
        .mockResolvedValueOnce(0); // total completions
      mockPrisma.resourceUsage.aggregate.mockResolvedValue({
        _avg: { duration: null }
      });
      mockPrisma.resourceUsage.findMany.mockResolvedValue([]);

      const result = await resourceDiscoveryService.getResourceAnalytics('resource-1');

      expect(result.completionRate).toBe(0);
      expect(result.averageDuration).toBe(0);
      expect(result.uniqueUsers).toBe(0);
    });
  });

  describe('private helper methods', () => {
    it('should analyze resource type preferences correctly', async () => {
      const service = resourceDiscoveryService as any;
      const usageHistory = [
        { resource: { type: ResourceType.VIDEO } },
        { resource: { type: ResourceType.VIDEO } },
        { resource: { type: ResourceType.ARTICLE } }
      ];

      const preferences = service.analyzeResourceTypePreferences(usageHistory);

      expect(preferences[ResourceType.VIDEO]).toBeCloseTo(0.67, 2);
      expect(preferences[ResourceType.ARTICLE]).toBeCloseTo(0.33, 2);
    });

    it('should analyze difficulty preferences correctly', async () => {
      const service = resourceDiscoveryService as any;
      const usageHistory = [
        { resource: { difficulty: DifficultyLevel.BEGINNER } },
        { resource: { difficulty: DifficultyLevel.BEGINNER } },
        { resource: { difficulty: DifficultyLevel.INTERMEDIATE } }
      ];

      const preferences = service.analyzeDifficultyPreferences(usageHistory);

      expect(preferences[DifficultyLevel.BEGINNER]).toBeCloseTo(0.67, 2);
      expect(preferences[DifficultyLevel.INTERMEDIATE]).toBeCloseTo(0.33, 2);
    });

    it('should analyze subject engagement correctly', async () => {
      const service = resourceDiscoveryService as any;
      const usageHistory = [
        { resource: { topic: { subject: { name: 'math' } } } },
        { resource: { topic: { subject: { name: 'math' } } } },
        { resource: { topic: { subject: { name: 'science' } } } }
      ];

      const engagement = service.analyzeSubjectEngagement(usageHistory);

      expect(engagement['math']).toBeCloseTo(0.67, 2);
      expect(engagement['science']).toBeCloseTo(0.33, 2);
    });

    it('should analyze time patterns correctly', async () => {
      const service = resourceDiscoveryService as any;
      const now = new Date();
      const usageHistory = [
        { timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2) }, // 2 hours ago (same hour)
        { timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2) }, // 2 hours ago (same hour)
        { timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5) }  // 5 hours ago (different hour)
      ];

      const patterns = service.analyzeTimePatterns(usageHistory);

      expect(patterns.totalSessions).toBe(3);
      expect(patterns.peakHours).toBeInstanceOf(Array);
      expect(patterns.peakHours.length).toBeLessThanOrEqual(3);
    });

    it('should extract YouTube video ID correctly', async () => {
      const service = resourceDiscoveryService as any;

      expect(service.extractYouTubeVideoId('https://youtube.com/watch?v=abc123')).toBe('abc123');
      expect(service.extractYouTubeVideoId('https://youtu.be/def456')).toBe('def456');
      expect(service.extractYouTubeVideoId('https://example.com/video')).toBeNull();
    });

    it('should calculate reading time correctly', async () => {
      const service = resourceDiscoveryService as any;
      const text = 'This is a test text with exactly twenty words to test the reading time calculation function properly.';

      const readingTime = service.calculateReadingTime(text);

      expect(readingTime).toBe(1); // 20 words / 200 words per minute = 0.1, rounded up to 1
    });

    it('should get difficulty level number correctly', async () => {
      const service = resourceDiscoveryService as any;

      expect(service.getDifficultyLevel(DifficultyLevel.BEGINNER)).toBe(1);
      expect(service.getDifficultyLevel(DifficultyLevel.INTERMEDIATE)).toBe(2);
      expect(service.getDifficultyLevel(DifficultyLevel.ADVANCED)).toBe(3);
      expect(service.getDifficultyLevel(DifficultyLevel.EXPERT)).toBe(4);
    });

    it('should generate recommendation reasons correctly', async () => {
      const service = resourceDiscoveryService as any;
      const resource = {
        type: ResourceType.VIDEO,
        difficulty: DifficultyLevel.BEGINNER,
        duration: 15,
        topic: { subject: { name: 'math' } },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
      };

      const learningPattern: LearningPattern = {
        childId: 'child-1',
        resourceTypePreferences: { [ResourceType.VIDEO]: 0.8 },
        difficultyPreferences: { [DifficultyLevel.BEGINNER]: 0.7 },
        subjectEngagement: { 'math': 0.6 },
        timePatterns: { peakHours: [14, 15, 16], totalSessions: 50 },
        lastUpdated: new Date()
      };

      const preferences: UserPreferences = {
        childId: 'child-1',
        preferredResourceTypes: [ResourceType.VIDEO],
        preferredDifficulty: DifficultyLevel.BEGINNER,
        maxDuration: 20,
        safetyLevel: SafetyRating.SAFE,
        languages: ['en'],
        lastUpdated: new Date()
      };

      const reasons = service.generateRecommendationReasons(resource, learningPattern, preferences);

      expect(reasons).toContain('You enjoy video resources');
      expect(reasons).toContain('Matches your preferred difficulty level');
      expect(reasons).toContain('Perfect length for your attention span');
      expect(reasons).toContain('You\'re engaged with math');
    });
  });
});