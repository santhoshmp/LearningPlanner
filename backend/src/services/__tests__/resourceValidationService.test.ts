import { PrismaClient } from '@prisma/client';
import { ResourceValidationService } from '../resourceValidationService';
import { ResourceType, SafetyRating, ValidationStatus, DifficultyLevel } from '../../types/masterData';

// Mock Prisma Client
const mockPrisma = {
  topicResource: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  }
} as unknown as PrismaClient;

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('ResourceValidationService', () => {
  let service: ResourceValidationService;

  beforeEach(() => {
    service = new ResourceValidationService(mockPrisma, {
      enableUrlChecking: true,
      enableContentAnalysis: true,
      enableSafetyScoring: true,
      timeoutMs: 5000,
      retryAttempts: 2,
      batchSize: 5
    });
    jest.clearAllMocks();
  });

  describe('validateResource', () => {
    it('should validate a resource successfully', async () => {
      const resourceId = 'resource-123';
      const mockResource = {
        id: resourceId,
        title: 'Educational Video',
        description: 'Learn about mathematics',
        url: 'https://www.khanacademy.org/math/video',
        type: ResourceType.VIDEO,
        source: 'Khan Academy',
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE,
        duration: 10,
        metadata: {},
        topic: {
          grade: { grade: '3', ageMin: 8, ageMax: 9 },
          subject: { name: 'mathematics' }
        }
      };

      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const result = await service.validateResource(resourceId);

      expect(result.resourceId).toBe(resourceId);
      expect(result.resourceTitle).toBe('Educational Video');
      expect(result.resourceType).toBe(ResourceType.VIDEO);
      expect(result.validationResult.isValid).toBe(true);
      expect(result.safetyAssessment.safetyRating).toBe(SafetyRating.SAFE);
      expect(result.qualityScore.overallScore).toBeGreaterThan(0);
      expect(result.lastValidated).toBeInstanceOf(Date);
      expect(result.nextValidationDue).toBeInstanceOf(Date);

      expect(mockPrisma.topicResource.update).toHaveBeenCalledWith({
        where: { id: resourceId },
        data: expect.objectContaining({
          validationStatus: ValidationStatus.VALIDATED,
          lastValidated: expect.any(Date),
          safetyRating: SafetyRating.SAFE
        })
      });
    });

    it('should handle resource not found', async () => {
      const resourceId = 'nonexistent-resource';

      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateResource(resourceId)).rejects.toThrow(
        `Resource with ID ${resourceId} not found`
      );
    });

    it('should handle validation errors gracefully', async () => {
      const resourceId = 'resource-123';
      const mockResource = {
        id: resourceId,
        title: 'Broken Resource',
        url: 'invalid-url',
        type: ResourceType.VIDEO,
        source: 'Unknown',
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE,
        topic: {
          grade: { grade: '3' },
          subject: { name: 'mathematics' }
        }
      };

      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const result = await service.validateResource(resourceId);

      expect(result.validationResult.isValid).toBe(false);
      expect(result.validationResult.status).toBe(ValidationStatus.BROKEN);
      expect(result.safetyAssessment.safetyRating).toBe(SafetyRating.REVIEW_NEEDED);
      expect(result.qualityScore.overallScore).toBeGreaterThan(0);
    });
  });

  describe('validateResourcesBatch', () => {
    it('should validate multiple resources in batch', async () => {
      const resourceIds = ['resource-1', 'resource-2', 'resource-3'];
      
      const mockResources = resourceIds.map((id, index) => ({
        id,
        title: `Resource ${index + 1}`,
        url: `https://example.com/resource${index + 1}`,
        type: ResourceType.ARTICLE,
        source: 'Education.com',
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE,
        topic: {
          grade: { grade: '3' },
          subject: { name: 'mathematics' }
        }
      }));

      (mockPrisma.topicResource.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockResources[0])
        .mockResolvedValueOnce(mockResources[1])
        .mockResolvedValueOnce(mockResources[2]);
      
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const results = await service.validateResourcesBatch(resourceIds);

      expect(results).toHaveLength(3);
      expect(results[0].resourceId).toBe('resource-1');
      expect(results[1].resourceId).toBe('resource-2');
      expect(results[2].resourceId).toBe('resource-3');
    });

    it('should handle batch validation with some failures', async () => {
      const resourceIds = ['resource-1', 'resource-2'];
      
      (mockPrisma.topicResource.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'resource-1',
          title: 'Valid Resource',
          url: 'https://example.com/valid',
          type: ResourceType.ARTICLE,
          source: 'Education.com',
          difficulty: DifficultyLevel.BEGINNER,
          safetyRating: SafetyRating.SAFE,
          topic: { grade: { grade: '3' }, subject: { name: 'math' } }
        })
        .mockResolvedValueOnce(null); // Second resource not found
      
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const results = await service.validateResourcesBatch(resourceIds);

      expect(results).toHaveLength(1); // Only successful validation
      expect(results[0].resourceId).toBe('resource-1');
    });
  });

  describe('validateAllResourcesByType', () => {
    it('should validate all resources of a specific type', async () => {
      const resourceType = ResourceType.VIDEO;
      const mockResourceIds = [
        { id: 'resource-1' },
        { id: 'resource-2' }
      ];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockResourceIds);
      
      // Mock individual resource validations
      (mockPrisma.topicResource.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'resource-1',
          title: 'Video 1',
          url: 'https://youtube.com/video1',
          type: ResourceType.VIDEO,
          source: 'YouTube',
          difficulty: DifficultyLevel.BEGINNER,
          safetyRating: SafetyRating.SAFE,
          topic: { grade: { grade: '3' }, subject: { name: 'math' } }
        })
        .mockResolvedValueOnce({
          id: 'resource-2',
          title: 'Video 2',
          url: 'https://youtube.com/video2',
          type: ResourceType.VIDEO,
          source: 'YouTube',
          difficulty: DifficultyLevel.BEGINNER,
          safetyRating: SafetyRating.SAFE,
          topic: { grade: { grade: '3' }, subject: { name: 'math' } }
        });

      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const results = await service.validateAllResourcesByType(resourceType);

      expect(results.total).toBe(2);
      expect(results.validated).toBe(2);
      expect(results.broken).toBe(0);
      expect(results.reports).toHaveLength(2);
      expect(results.summary).toHaveProperty('safetyBreakdown');
      expect(results.summary).toHaveProperty('qualityDistribution');
    });
  });

  describe('getResourcesNeedingValidation', () => {
    it('should return resources that need validation', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          title: 'Pending Resource',
          type: ResourceType.VIDEO,
          url: 'https://example.com/pending',
          lastValidated: null,
          validationStatus: ValidationStatus.PENDING
        },
        {
          id: 'resource-2',
          title: 'Old Resource',
          type: ResourceType.ARTICLE,
          url: 'https://example.com/old',
          lastValidated: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
          validationStatus: ValidationStatus.VALIDATED
        }
      ];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockResources);

      const results = await service.getResourcesNeedingValidation(10);

      expect(results).toHaveLength(2);
      expect(results[0].priority).toBe('high'); // Pending resource
      expect(results[1].priority).toBe('medium'); // Old resource
    });
  });

  describe('scheduleValidation', () => {
    it('should schedule validation for resources', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          title: 'High Priority',
          type: ResourceType.VIDEO,
          url: 'https://example.com/high',
          lastValidated: null,
          validationStatus: ValidationStatus.PENDING
        },
        {
          id: 'resource-2',
          title: 'Medium Priority',
          type: ResourceType.ARTICLE,
          url: 'https://example.com/medium',
          lastValidated: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          validationStatus: ValidationStatus.VALIDATED
        }
      ];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockResources);
      
      // Mock validation for high priority resource
      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue({
        id: 'resource-1',
        title: 'High Priority',
        url: 'https://example.com/high',
        type: ResourceType.VIDEO,
        source: 'Example',
        difficulty: DifficultyLevel.BEGINNER,
        safetyRating: SafetyRating.SAFE,
        topic: { grade: { grade: '3' }, subject: { name: 'math' } }
      });

      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const results = await service.scheduleValidation();

      expect(results.scheduled).toBe(2);
      expect(results.highPriority).toBe(1);
      expect(results.mediumPriority).toBe(1);
      expect(results.lowPriority).toBe(0);
    });
  });

  describe('getValidationStatistics', () => {
    it('should return validation statistics', async () => {
      const mockCounts = [100, 80, 5, 15]; // total, validated, broken, pending
      const mockSafetyBreakdown = [
        { safetyRating: SafetyRating.SAFE, _count: { id: 85 } },
        { safetyRating: SafetyRating.REVIEW_NEEDED, _count: { id: 10 } },
        { safetyRating: SafetyRating.RESTRICTED, _count: { id: 5 } }
      ];
      const mockTypeBreakdown = [
        { type: ResourceType.VIDEO, _count: { id: 60 } },
        { type: ResourceType.ARTICLE, _count: { id: 40 } }
      ];
      const mockLastValidated = { lastValidated: new Date() };

      (mockPrisma.topicResource.count as jest.Mock)
        .mockResolvedValueOnce(mockCounts[0])
        .mockResolvedValueOnce(mockCounts[1])
        .mockResolvedValueOnce(mockCounts[2])
        .mockResolvedValueOnce(mockCounts[3]);

      (mockPrisma.topicResource.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockSafetyBreakdown)
        .mockResolvedValueOnce(mockTypeBreakdown);

      (mockPrisma.topicResource.findFirst as jest.Mock).mockResolvedValue(mockLastValidated);

      const stats = await service.getValidationStatistics();

      expect(stats.totalResources).toBe(100);
      expect(stats.validatedResources).toBe(80);
      expect(stats.brokenResources).toBe(5);
      expect(stats.pendingValidation).toBe(15);
      expect(stats.safetyBreakdown[SafetyRating.SAFE]).toBe(85);
      expect(stats.typeBreakdown[ResourceType.VIDEO]).toBe(60);
      expect(stats.lastValidationRun).toBeInstanceOf(Date);
    });
  });
});