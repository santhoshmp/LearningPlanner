import { PrismaClient } from '@prisma/client';
import { MasterDataService } from '../masterDataService';
import { redisService } from '../redisService';
import {
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationError,
  ValidationWarning,
  MasterDataUpdate
} from '../../types/masterData';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../redisService');
jest.mock('../../utils/logger');

const mockPrisma = {
  gradeLevel: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  subject: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  topic: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  topicResource: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  gradeSubject: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedisService = redisService as jest.Mocked<typeof redisService>;

(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('MasterDataService', () => {
  let masterDataService: MasterDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    masterDataService = new MasterDataService(mockPrisma as any);
  });

  describe('getAllGrades', () => {
    it('should return cached grades if available', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          grade: 'K',
          displayName: 'Kindergarten',
          ageMin: 5,
          ageMax: 6,
          ageTypical: 5,
          isActive: true,
          subjects: []
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(mockGrades);

      const result = await masterDataService.getAllGrades();

      expect(mockRedisService.getCacheObject).toHaveBeenCalledWith('masterdata:grades:all');
      expect(mockPrisma.gradeLevel.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockGrades);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          grade: 'K',
          displayName: 'Kindergarten',
          ageMin: 5,
          ageMax: 6,
          ageTypical: 5,
          isActive: true,
          subjects: []
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockGrades);
      mockRedisService.setCacheObject.mockResolvedValue();

      const result = await masterDataService.getAllGrades();

      expect(mockPrisma.gradeLevel.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          subjects: {
            include: {
              subject: true
            }
          }
        }
      });
      expect(mockRedisService.setCacheObject).toHaveBeenCalledWith(
        'masterdata:grades:all',
        mockGrades,
        7200
      );
      expect(result).toEqual(mockGrades);
    });

    it('should handle cache errors gracefully', async () => {
      const mockGrades = [{ id: 'grade-1', grade: 'K' }];

      mockRedisService.getCacheObject.mockRejectedValue(new Error('Cache error'));
      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockGrades);
      mockRedisService.setCacheObject.mockRejectedValue(new Error('Cache error'));

      const result = await masterDataService.getAllGrades();

      expect(result).toEqual(mockGrades);
    });
  });

  describe('getGradeByAge', () => {
    it('should return grade for valid age', async () => {
      const mockGrade = {
        id: 'grade-1',
        grade: '3',
        ageMin: 8,
        ageMax: 9,
        ageTypical: 8,
        isActive: true,
        subjects: []
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findFirst.mockResolvedValue(mockGrade);

      const result = await masterDataService.getGradeByAge(8);

      expect(mockPrisma.gradeLevel.findFirst).toHaveBeenCalledWith({
        where: {
          ageMin: { lte: 8 },
          ageMax: { gte: 8 },
          isActive: true
        },
        include: {
          subjects: {
            include: {
              subject: true
            }
          }
        }
      });
      expect(result).toEqual(mockGrade);
    });

    it('should return null for invalid age', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findFirst.mockResolvedValue(null);

      const result = await masterDataService.getGradeByAge(25);

      expect(result).toBeNull();
    });
  });

  describe('getAgeRangeByGrade', () => {
    it('should return age range for valid grade', async () => {
      const mockGradeLevel = {
        ageMin: 8,
        ageMax: 9,
        ageTypical: 8
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findUnique.mockResolvedValue(mockGradeLevel);

      const result = await masterDataService.getAgeRangeByGrade('3');

      expect(mockPrisma.gradeLevel.findUnique).toHaveBeenCalledWith({
        where: { grade: '3' },
        select: { ageMin: true, ageMax: true, ageTypical: true }
      });
      expect(result).toEqual({
        min: 8,
        max: 9,
        typical: 8
      });
    });

    it('should return null for invalid grade', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findUnique.mockResolvedValue(null);

      const result = await masterDataService.getAgeRangeByGrade('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getSubjectsByGrade', () => {
    it('should return subjects for valid grade', async () => {
      const mockGradeLevel = {
        subjects: [
          {
            subject: {
              id: 'subject-1',
              name: 'math',
              displayName: 'Mathematics',
              topics: []
            }
          }
        ]
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findUnique.mockResolvedValue(mockGradeLevel);

      const result = await masterDataService.getSubjectsByGrade('3');

      expect(mockPrisma.gradeLevel.findUnique).toHaveBeenCalledWith({
        where: { grade: '3' },
        include: {
          subjects: {
            include: {
              subject: {
                include: {
                  topics: {
                    where: { grade: { grade: '3' } }
                  }
                }
              }
            },
            orderBy: { subject: { sortOrder: 'asc' } }
          }
        }
      });
      expect(result).toEqual([mockGradeLevel.subjects[0].subject]);
    });

    it('should return empty array for invalid grade', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findUnique.mockResolvedValue(null);

      const result = await masterDataService.getSubjectsByGrade('invalid');

      expect(result).toEqual([]);
    });
  });

  describe('getAllSubjects', () => {
    it('should return all subjects with grade relationships', async () => {
      const mockSubjects = [
        {
          id: 'subject-1',
          name: 'math',
          displayName: 'Mathematics',
          gradeSubjects: []
        }
      ];

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);

      const result = await masterDataService.getAllSubjects();

      expect(mockPrisma.subject.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
        include: {
          gradeSubjects: {
            include: {
              grade: true
            }
          }
        }
      });
      expect(result).toEqual(mockSubjects);
    });
  });

  describe('getSubjectById', () => {
    it('should return subject by ID', async () => {
      const mockSubject = {
        id: 'subject-1',
        name: 'math',
        displayName: 'Mathematics',
        gradeSubjects: [],
        topics: []
      };

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);

      const result = await masterDataService.getSubjectById('subject-1');

      expect(mockPrisma.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
        include: {
          gradeSubjects: {
            include: {
              grade: true
            }
          },
          topics: true
        }
      });
      expect(result).toEqual(mockSubject);
    });

    it('should return null for invalid ID', async () => {
      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      const result = await masterDataService.getSubjectById('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getTopicsBySubject', () => {
    it('should return topics for valid grade and subject', async () => {
      const mockGradeLevel = { id: 'grade-1', grade: '3' };
      const mockTopics = [
        {
          id: 'topic-1',
          name: 'addition',
          displayName: 'Addition',
          gradeId: 'grade-1',
          subjectId: 'subject-1',
          isActive: true,
          grade: mockGradeLevel,
          subject: { id: 'subject-1', name: 'math' },
          resources: []
        }
      ];

      mockPrisma.gradeLevel.findUnique.mockResolvedValue(mockGradeLevel);
      mockPrisma.topic.findMany.mockResolvedValue(mockTopics);

      const result = await masterDataService.getTopicsBySubject('3', 'subject-1');

      expect(mockPrisma.topic.findMany).toHaveBeenCalledWith({
        where: {
          gradeId: 'grade-1',
          subjectId: 'subject-1',
          isActive: true
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          grade: true,
          subject: true,
          resources: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
      expect(result).toEqual(mockTopics);
    });

    it('should return empty array for invalid grade', async () => {
      mockPrisma.gradeLevel.findUnique.mockResolvedValue(null);

      const result = await masterDataService.getTopicsBySubject('invalid', 'subject-1');

      expect(result).toEqual([]);
    });
  });

  describe('getResourcesByTopic', () => {
    it('should return resources with filters', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          topicId: 'topic-1',
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

      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);

      const filters = {
        resourceType: ResourceType.VIDEO,
        safetyRating: SafetyRating.SAFE
      };

      const result = await masterDataService.getResourcesByTopic('topic-1', filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          topicId: 'topic-1',
          isActive: true,
          type: ResourceType.VIDEO,
          safetyRating: SafetyRating.SAFE
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        }
      });
      expect(result).toEqual(mockResources);
    });

    it('should handle duration filters', async () => {
      const mockResources = [];
      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);

      const filters = {
        minDuration: 5,
        maxDuration: 30
      };

      await masterDataService.getResourcesByTopic('topic-1', filters);

      expect(mockPrisma.topicResource.findMany).toHaveBeenCalledWith({
        where: {
          topicId: 'topic-1',
          isActive: true,
          duration: {
            gte: 5,
            lte: 30
          }
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          topic: {
            include: {
              grade: true,
              subject: true
            }
          }
        }
      });
    });
  });

  describe('validateMasterData', () => {
    it('should validate all master data entities', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          grade: 'K',
          ageMin: 5,
          ageMax: 6,
          ageTypical: 5
        }
      ];
      const mockSubjects = [
        {
          id: 'subject-1',
          name: 'math',
          displayName: 'Mathematics',
          color: '#FF0000'
        }
      ];
      const mockTopics = [
        {
          id: 'topic-1',
          name: 'addition',
          estimatedHours: 2,
          prerequisites: '[]'
        }
      ];
      const mockResources = [
        {
          id: 'resource-1',
          title: 'Math Video',
          url: 'https://example.com/video',
          type: ResourceType.VIDEO,
          duration: 10
        }
      ];

      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockGrades);
      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrisma.topic.findMany.mockResolvedValue(mockTopics);
      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);

      const result = await masterDataService.validateMasterData();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalEntities).toBe(4);
      expect(result.summary.validEntities).toBe(4);
    });

    it('should detect validation errors', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          grade: 'K',
          ageMin: 6, // Invalid: min > max
          ageMax: 5,
          ageTypical: 5
        }
      ];
      const mockSubjects = [
        {
          id: 'subject-1',
          name: 'math',
          displayName: '', // Invalid: empty display name
          color: 'invalid-color' // Invalid: bad color format
        }
      ];
      const mockTopics = [
        {
          id: 'topic-1',
          name: 'addition',
          estimatedHours: -1, // Invalid: negative hours
          prerequisites: 'invalid-json' // Invalid: bad JSON
        }
      ];
      const mockResources = [
        {
          id: 'resource-1',
          title: 'Math Video',
          url: 'invalid-url', // Invalid: bad URL
          type: ResourceType.VIDEO,
          duration: 0 // Invalid: zero duration for video
        }
      ];

      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockGrades);
      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrisma.topic.findMany.mockResolvedValue(mockTopics);
      mockPrisma.topicResource.findMany.mockResolvedValue(mockResources);

      const result = await masterDataService.validateMasterData();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('updateMasterData', () => {
    it('should process updates in transaction', async () => {
      const updates: MasterDataUpdate[] = [
        {
          entity: 'grade',
          operation: 'create',
          data: {
            grade: '13',
            displayName: 'Grade 13',
            ageMin: 18,
            ageMax: 19,
            ageTypical: 18
          }
        },
        {
          entity: 'subject',
          operation: 'update',
          id: 'subject-1',
          data: {
            displayName: 'Updated Mathematics'
          }
        }
      ];

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: {
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({})
          },
          subject: {
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({})
          }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;
      mockRedisService.deletePattern.mockResolvedValue();

      const result = await masterDataService.updateMasterData(updates);

      expect(result.success).toBe(true);
      expect(result.updatedEntities).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const updates: MasterDataUpdate[] = [
        {
          entity: 'grade',
          operation: 'create',
          data: {}
        }
      ];

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const result = await masterDataService.updateMasterData(updates);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('synchronizeMasterData', () => {
    it('should synchronize all master data', async () => {
      // Mock validation
      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: {
          totalEntities: 10,
          validEntities: 10,
          errorCount: 0,
          warningCount: 0,
          lastValidated: new Date()
        }
      };

      // Mock entity counts
      mockPrisma.gradeLevel.count.mockResolvedValue(5);
      mockPrisma.subject.count.mockResolvedValue(3);
      mockPrisma.topic.count.mockResolvedValue(15);
      mockPrisma.topicResource.count.mockResolvedValue(25);

      // Mock validation methods
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.topic.findMany.mockResolvedValue([]);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      mockRedisService.deletePattern.mockResolvedValue();

      const result = await masterDataService.synchronizeMasterData();

      expect(result.success).toBe(true);
      expect(result.updatedEntities).toBe(48); // 5 + 3 + 15 + 25
      expect(result.errors).toHaveLength(0);
    });

    it('should handle synchronization errors', async () => {
      mockPrisma.gradeLevel.findMany.mockRejectedValue(new Error('Database error'));

      const result = await masterDataService.synchronizeMasterData();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    it('should clear all caches', async () => {
      mockRedisService.deletePattern.mockResolvedValue();

      await masterDataService.invalidateAllCaches();

      expect(mockRedisService.deletePattern).toHaveBeenCalledWith('masterdata:*');
    });

    it('should warm up caches', async () => {
      const mockGrades = [{ id: 'grade-1', grade: 'K' }];
      const mockSubjects = [{ id: 'subject-1', name: 'math' }];

      mockRedisService.getCacheObject.mockResolvedValue(null);
      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockGrades);
      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);
      mockRedisService.setCacheObject.mockResolvedValue();

      await masterDataService.warmupCaches();

      expect(mockPrisma.gradeLevel.findMany).toHaveBeenCalled();
      expect(mockPrisma.subject.findMany).toHaveBeenCalled();
    });

    it('should get cache stats', async () => {
      const mockStats = {
        totalKeys: 100,
        memoryUsage: '10MB',
        hitRate: 85.5,
        missRate: 14.5
      };

      mockRedisService.getCacheStats.mockResolvedValue(mockStats);

      const result = await masterDataService.getCacheStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('integrity checks', () => {
    it('should check referential integrity', async () => {
      // Mock orphaned topics
      const orphanedTopics = [
        { id: 'topic-1', name: 'orphaned-topic', grade: null, subject: null }
      ];
      
      // Mock orphaned resources
      const orphanedResources = [
        { id: 'resource-1', title: 'orphaned-resource', topic: null }
      ];

      mockPrisma.topic.findMany.mockResolvedValue(orphanedTopics);
      mockPrisma.topicResource.findMany.mockResolvedValue(orphanedResources);
      
      // Mock other validation data
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.gradeLevel.groupBy.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await masterDataService.performIntegrityCheck();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('orphaned-topic'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('orphaned-resource'))).toBe(true);
    });

    it('should check data consistency', async () => {
      // Mock duplicate grades
      const duplicateGrades = [
        { grade: 'K' }
      ];
      
      // Mock subjects without topics
      const subjectsWithoutTopics = [
        { id: 'subject-1', name: 'empty-subject' }
      ];

      mockPrisma.gradeLevel.groupBy.mockResolvedValue(duplicateGrades);
      mockPrisma.subject.findMany
        .mockResolvedValueOnce([]) // For validation
        .mockResolvedValueOnce(subjectsWithoutTopics); // For consistency check
      
      // Mock other validation data
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.topic.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockPrisma.topicResource.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await masterDataService.performIntegrityCheck();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('Duplicate grade level'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('has no associated topics'))).toBe(true);
    });
  });
});