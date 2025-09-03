import { PrismaClient } from '@prisma/client';
import { ReadingMaterialsService, ReadingMaterialData } from '../readingMaterialsService';
import { DifficultyLevel, ResourceType, SafetyRating, ValidationStatus } from '../../types/masterData';

// Mock Prisma Client
const mockPrisma = {
  topicResource: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  },
  topic: {
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

describe('ReadingMaterialsService', () => {
  let service: ReadingMaterialsService;

  beforeEach(() => {
    service = new ReadingMaterialsService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createReadingMaterial', () => {
    it('should create a reading material successfully', async () => {
      const topicId = 'topic-123';
      const materialData: ReadingMaterialData = {
        title: 'Introduction to Fractions',
        description: 'Learn about fractions with visual examples',
        url: 'https://www.education.com/fractions-intro',
        author: 'Education Team',
        publisher: 'Education.com',
        readingLevel: 'grade-3',
        wordCount: 500,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.education.com/images/fractions.jpg',
        tags: ['fractions', 'math', 'visual'],
        estimatedReadingTime: 10
      };

      const mockCreatedResource = {
        id: 'resource-123',
        topicId,
        type: ResourceType.ARTICLE,
        title: materialData.title,
        url: materialData.url,
        topic: {
          id: topicId,
          grade: { grade: '3' },
          subject: { name: 'mathematics' }
        }
      };

      (mockPrisma.topicResource.create as jest.Mock).mockResolvedValue(mockCreatedResource);

      const result = await service.createReadingMaterial(topicId, materialData);

      expect(mockPrisma.topicResource.create).toHaveBeenCalledWith({
        data: {
          topicId,
          type: ResourceType.ARTICLE,
          title: materialData.title,
          description: materialData.description,
          url: materialData.url,
          thumbnailUrl: materialData.thumbnailUrl,
          duration: materialData.estimatedReadingTime,
          difficulty: DifficultyLevel.BEGINNER,
          ageAppropriate: true,
          safetyRating: expect.any(String),
          source: materialData.publisher,
          tags: materialData.tags,
          metadata: expect.objectContaining({
            author: materialData.author,
            publisher: materialData.publisher,
            readingLevel: materialData.readingLevel,
            format: materialData.format
          }),
          validationStatus: ValidationStatus.PENDING,
          isActive: true,
          sortOrder: 0
        },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        }
      });

      expect(result).toEqual(mockCreatedResource);
    });
  });

  describe('getReadingMaterialsByTopic', () => {
    it('should fetch reading materials for a topic with filters', async () => {
      const topicId = 'topic-123';
      const filters = {
        difficulty: DifficultyLevel.BEGINNER,
        maxReadingTime: 15,
        safetyRating: SafetyRating.SAFE,
        readingLevel: 'grade-3',
        format: 'html' as const
      };

      const mockMaterials = [
        {
          id: 'resource-1',
          topicId,
          type: ResourceType.ARTICLE,
          title: 'Material 1',
          url: 'https://example.com/material1',
          metadata: {
            readingLevel: 'grade-3',
            format: 'html',
            author: 'Test Author',
            publisher: 'Test Publisher'
          }
        },
        {
          id: 'resource-2',
          topicId,
          type: ResourceType.ARTICLE,
          title: 'Material 2',
          url: 'https://example.com/material2',
          metadata: {
            readingLevel: 'grade-3',
            format: 'html',
            author: 'Another Author',
            publisher: 'Another Publisher'
          }
        }
      ];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockMaterials);

      const result = await service.getReadingMaterialsByTopic(topicId, filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          topicId,
          type: ResourceType.ARTICLE,
          isActive: true,
          difficulty: DifficultyLevel.BEGINNER,
          duration: { lte: 15 },
          safetyRating: SafetyRating.SAFE
        },
        orderBy: [
          { safetyRating: 'asc' },
          { difficulty: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        }
      });

      expect(result).toHaveLength(2);
    });

    it('should fetch materials without filters', async () => {
      const topicId = 'topic-123';
      const mockMaterials = [];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockMaterials);

      const result = await service.getReadingMaterialsByTopic(topicId);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          topicId,
          type: ResourceType.ARTICLE,
          isActive: true
        },
        orderBy: [
          { safetyRating: 'asc' },
          { difficulty: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        }
      });

      expect(result).toEqual(mockMaterials);
    });
  });

  describe('validateReadingMaterial', () => {
    it('should validate a resource and mark it as validated', async () => {
      const resourceId = 'resource-123';
      const mockResource = {
        id: resourceId,
        url: 'https://www.education.com/test-material',
        title: 'Test Material'
      };

      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      // Mock the private method by spying on console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.validateReadingMaterial(resourceId);

      expect(mockPrisma.topicResource.findUnique).toHaveBeenCalledWith({
        where: { id: resourceId }
      });

      expect(result.isValid).toBe(true); // Will be true due to mock implementation
      expect(result.status).toBe(ValidationStatus.VALIDATED);
      expect(result.lastChecked).toBeInstanceOf(Date);

      consoleSpy.mockRestore();
    });

    it('should throw error if resource not found', async () => {
      const resourceId = 'nonexistent-resource';

      (mockPrisma.topicResource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateReadingMaterial(resourceId)).rejects.toThrow(
        `Resource with ID ${resourceId} not found`
      );
    });
  });

  describe('validateAllReadingMaterials', () => {
    it('should validate all reading materials', async () => {
      const mockResources = [
        { id: 'resource-1', title: 'Material 1' },
        { id: 'resource-2', title: 'Material 2' }
      ];

      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue(mockResources);
      (mockPrisma.topicResource.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'resource-1', url: 'https://example.com/1', title: 'Material 1' })
        .mockResolvedValueOnce({ id: 'resource-2', url: 'https://example.com/2', title: 'Material 2' });
      (mockPrisma.topicResource.update as jest.Mock).mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.validateAllReadingMaterials();

      expect(result.total).toBe(2);
      expect(result.validated).toBe(2); // Will be validated due to mock implementation
      expect(result.broken).toBe(0);
      expect(Array.isArray(result.errors)).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('getReadingRecommendations', () => {
    it('should return reading recommendations for a topic', async () => {
      const topicId = 'topic-123';
      const childAge = 8;

      const mockTopic = {
        id: topicId,
        displayName: 'Fractions Introduction',
        grade: { grade: '3', ageMin: 8, ageMax: 9 },
        subject: { name: 'mathematics' },
        resources: [
          {
            id: 'resource-1',
            title: 'Fractions Guide',
            description: 'Learn about fractions',
            url: 'https://example.com/fractions',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            duration: 10,
            difficulty: DifficultyLevel.BEGINNER,
            ageAppropriate: true,
            safetyRating: SafetyRating.SAFE,
            metadata: {
              author: 'Math Teacher',
              readingLevel: 'grade-3',
              format: 'html',
              publisher: 'Education.com'
            }
          }
        ]
      };

      (mockPrisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      const result = await service.getReadingRecommendations(topicId, childAge);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('resource-1');
      expect(result[0].title).toBe('Fractions Guide');
      expect(result[0].readingLevel).toBe('grade-3');
    });

    it('should throw error if topic not found', async () => {
      const topicId = 'nonexistent-topic';
      const childAge = 8;

      (mockPrisma.topic.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getReadingRecommendations(topicId, childAge)).rejects.toThrow(
        `Topic with ID ${topicId} not found`
      );
    });
  });

  describe('discoverReadingMaterials', () => {
    it('should discover reading materials for a topic', async () => {
      const topicId = 'topic-123';
      const gradeLevel = '3';
      const subjectName = 'mathematics';

      const mockTopic = {
        id: topicId,
        displayName: 'Fractions Introduction',
        grade: { grade: gradeLevel },
        subject: { name: subjectName }
      };

      (mockPrisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      (mockPrisma.topicResource.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.discoverReadingMaterials(topicId, gradeLevel, subjectName);

      expect(mockPrisma.topic.findUnique).toHaveBeenCalledWith({
        where: { id: topicId },
        include: {
          grade: true,
          subject: true
        }
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error if topic not found', async () => {
      const topicId = 'nonexistent-topic';
      const gradeLevel = '3';
      const subjectName = 'mathematics';

      (mockPrisma.topic.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.discoverReadingMaterials(topicId, gradeLevel, subjectName)).rejects.toThrow(
        `Topic with ID ${topicId} not found`
      );
    });
  });

  describe('getReadingMaterialsStats', () => {
    it('should return reading materials statistics', async () => {
      const mockStats = [
        { safetyRating: 'SAFE', validationStatus: 'VALIDATED', difficulty: 'BEGINNER', _count: { id: 5 } },
        { safetyRating: 'SAFE', validationStatus: 'PENDING', difficulty: 'INTERMEDIATE', _count: { id: 3 } }
      ];

      (mockPrisma.topicResource.groupBy as jest.Mock).mockResolvedValue(mockStats);
      (mockPrisma.topicResource.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(7); // safe

      const result = await service.getReadingMaterialsStats();

      expect(result.total).toBe(10);
      expect(result.active).toBe(8);
      expect(result.safe).toBe(7);
      expect(result.safetyPercentage).toBe(70);
      expect(result.breakdown).toEqual(mockStats);
    });
  });
});