import { PrismaClient } from '@prisma/client';
import { MasterDataSeedingService } from '../masterDataSeedingService';
import { SeedDataConfig, MigrationResult, SeedResult } from '../../types/masterData';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('fs/promises');
jest.mock('../../data/gradeAgeData');
jest.mock('../../data/subjectData');
jest.mock('../../data/topicData');
jest.mock('../../data/youtubeResourceData');
jest.mock('../../data/readingMaterialsData');

const mockPrisma = {
  gradeLevel: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  subject: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  topic: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  topicResource: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  gradeSubject: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockFs = fs as jest.Mocked<typeof fs>;

(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

// Mock data
const mockGradeAgeData = [
  {
    id: 'grade-1',
    grade: 'K',
    displayName: 'Kindergarten',
    ageMin: 5,
    ageMax: 6,
    ageTypical: 5,
    sortOrder: 1,
    isActive: true
  }
];

const mockSubjectData = [
  {
    id: 'subject-1',
    name: 'math',
    displayName: 'Mathematics',
    description: 'Mathematical concepts and problem solving',
    icon: 'calculate',
    color: '#2196F3',
    category: 'core',
    gradeAvailability: ['K', '1', '2', '3'],
    estimatedHoursPerGrade: { 'K': 20, '1': 25, '2': 30, '3': 35 },
    prerequisites: [],
    isCore: true,
    sortOrder: 1
  }
];

const mockTopicData = [
  {
    id: 'topic-1',
    name: 'counting',
    displayName: 'Counting Numbers',
    description: 'Learning to count from 1 to 10',
    grade: 'K',
    subjectName: 'math',
    difficulty: 'BEGINNER',
    estimatedHours: 2,
    prerequisites: [],
    learningObjectives: ['Count from 1 to 10'],
    skills: ['number-recognition'],
    sortOrder: 1,
    isActive: true
  }
];

const mockYoutubeResourceData = [
  {
    id: 'resource-1',
    topicName: 'counting',
    type: 'VIDEO',
    title: 'Counting Song for Kids',
    description: 'Fun counting song',
    url: 'https://youtube.com/watch?v=123',
    thumbnailUrl: 'https://img.youtube.com/vi/123/default.jpg',
    duration: 180,
    difficulty: 'BEGINNER',
    ageAppropriate: true,
    safetyRating: 'SAFE',
    source: 'YouTube',
    tags: ['counting', 'song'],
    sortOrder: 1,
    isActive: true
  }
];

const mockReadingMaterialsData = [
  {
    id: 'resource-2',
    topicName: 'counting',
    type: 'ARTICLE',
    title: 'Counting Practice Worksheet',
    description: 'Practice counting exercises',
    url: 'https://example.com/counting-worksheet.pdf',
    difficulty: 'BEGINNER',
    ageAppropriate: true,
    safetyRating: 'SAFE',
    source: 'Educational Website',
    tags: ['counting', 'worksheet'],
    sortOrder: 1,
    isActive: true
  }
];

// Mock the data imports
jest.mock('../../data/gradeAgeData', () => ({
  gradeAgeData: mockGradeAgeData
}));

jest.mock('../../data/subjectData', () => ({
  subjectData: mockSubjectData
}));

jest.mock('../../data/topicData', () => ({
  topicData: mockTopicData
}));

jest.mock('../../data/youtubeResourceData', () => ({
  youtubeResourceData: mockYoutubeResourceData
}));

jest.mock('../../data/readingMaterialsData', () => ({
  readingMaterialsData: mockReadingMaterialsData
}));

describe('MasterDataSeedingService', () => {
  let seedingService: MasterDataSeedingService;

  beforeEach(() => {
    jest.clearAllMocks();
    seedingService = new MasterDataSeedingService(mockPrisma as any);
  });

  describe('seedMasterData', () => {
    it('should seed all master data successfully', async () => {
      const config: SeedDataConfig = {
        includeGrades: ['K'],
        includeSubjects: ['math'],
        resourcesPerTopic: 5,
        validateResources: true,
        clearExisting: false
      };

      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'grade-1' }),
            update: jest.fn().mockResolvedValue({ id: 'grade-1' })
          },
          subject: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'subject-1' }),
            update: jest.fn().mockResolvedValue({ id: 'subject-1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'subject-1', name: 'math' }])
          },
          gradeSubject: {
            upsert: jest.fn().mockResolvedValue({})
          },
          topic: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'topic-1' }),
            update: jest.fn().mockResolvedValue({ id: 'topic-1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'topic-1', name: 'counting' }])
          },
          topicResource: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'resource-1' }),
            update: jest.fn().mockResolvedValue({ id: 'resource-1' })
          }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await seedingService.seedMasterData(config);

      expect(result.success).toBe(true);
      expect(result.entitiesCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.grades).toBe(1);
      expect(result.summary.subjects).toBe(1);
      expect(result.summary.topics).toBe(1);
      expect(result.summary.resources).toBe(2); // YouTube + reading material
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should clear existing data when requested', async () => {
      const config: SeedDataConfig = {
        includeGrades: ['K'],
        includeSubjects: ['math'],
        resourcesPerTopic: 5,
        validateResources: true,
        clearExisting: true
      };

      mockPrisma.topicResource.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.topic.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.gradeSubject.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.subject.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.gradeLevel.deleteMany.mockResolvedValue({ count: 0 });

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
          subject: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
          gradeSubject: { upsert: jest.fn().mockResolvedValue({}) },
          topic: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
          topicResource: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await seedingService.seedMasterData(config);

      expect(mockPrisma.topicResource.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.topic.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.gradeSubject.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.subject.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.gradeLevel.deleteMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle seeding errors gracefully', async () => {
      const config: SeedDataConfig = {
        includeGrades: ['K'],
        includeSubjects: ['math'],
        resourcesPerTopic: 5,
        validateResources: true,
        clearExisting: false
      };

      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      const result = await seedingService.seedMasterData(config);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBe('Database error');
    });

    it('should update existing entities when found', async () => {
      const config: SeedDataConfig = {
        includeGrades: ['K'],
        includeSubjects: ['math'],
        resourcesPerTopic: 5,
        validateResources: true,
        clearExisting: false
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: {
            findUnique: jest.fn().mockResolvedValue({ id: 'existing-grade' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-grade' })
          },
          subject: {
            findUnique: jest.fn().mockResolvedValue({ id: 'existing-subject' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-subject' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'existing-subject', name: 'math' }])
          },
          gradeSubject: {
            upsert: jest.fn().mockResolvedValue({})
          },
          topic: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-topic' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-topic' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'existing-topic', name: 'counting' }])
          },
          topicResource: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-resource' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-resource' })
          }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await seedingService.seedMasterData(config);

      expect(result.success).toBe(true);
      expect(result.entitiesUpdated).toBeGreaterThan(0);
      expect(result.entitiesCreated).toBe(0);
    });
  });

  describe('migrateMasterDataStructure', () => {
    it('should migrate data structure successfully', async () => {
      // Mock backup creation
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue();
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);

      // Mock data for export
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.gradeSubject.findMany.mockResolvedValue([]);
      mockPrisma.topic.findMany.mockResolvedValue([]);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      const result = await seedingService.migrateMasterDataStructure('1.0', '2.0');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle migration errors', async () => {
      // Mock backup failure
      mockFs.mkdir.mockRejectedValue(new Error('Backup failed'));

      const result = await seedingService.migrateMasterDataStructure('1.0', '2.0');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('exportMasterData', () => {
    it('should export master data to file', async () => {
      const outputPath = '/tmp/export.json';
      const mockData = {
        grades: [{ id: 'grade-1', grade: 'K' }],
        subjects: [{ id: 'subject-1', name: 'math' }],
        gradeSubjects: [],
        topics: [{ id: 'topic-1', name: 'counting' }],
        resources: [{ id: 'resource-1', title: 'Video' }]
      };

      mockPrisma.gradeLevel.findMany.mockResolvedValue(mockData.grades);
      mockPrisma.subject.findMany.mockResolvedValue(mockData.subjects);
      mockPrisma.gradeSubject.findMany.mockResolvedValue(mockData.gradeSubjects);
      mockPrisma.topic.findMany.mockResolvedValue(mockData.topics);
      mockPrisma.topicResource.findMany.mockResolvedValue(mockData.resources);

      mockFs.writeFile.mockResolvedValue();
      mockFs.stat.mockResolvedValue({ size: 2048 } as any);

      const result = await seedingService.exportMasterData(outputPath);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(outputPath);
      expect(result.fileSize).toBe(2048);
      expect(result.errors).toHaveLength(0);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"version":"1.0"'),
        'utf8'
      );
    });

    it('should handle export errors', async () => {
      const outputPath = '/tmp/export.json';

      mockPrisma.gradeLevel.findMany.mockRejectedValue(new Error('Database error'));

      const result = await seedingService.exportMasterData(outputPath);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('importMasterData', () => {
    it('should import master data from file', async () => {
      const filePath = '/tmp/import.json';
      const importData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          grades: [{ id: 'grade-1', grade: 'K' }],
          subjects: [{ id: 'subject-1', name: 'math' }],
          gradeSubjects: [],
          topics: [{ id: 'topic-1', name: 'counting' }],
          resources: [{ id: 'resource-1', title: 'Video' }]
        },
        metadata: {
          totalGrades: 1,
          totalSubjects: 1,
          totalTopics: 1,
          totalResources: 1
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(importData));

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: { upsert: jest.fn().mockResolvedValue({}) },
          subject: { upsert: jest.fn().mockResolvedValue({}) },
          gradeSubject: { upsert: jest.fn().mockResolvedValue({}) },
          topic: { upsert: jest.fn().mockResolvedValue({}) },
          topicResource: { upsert: jest.fn().mockResolvedValue({}) }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await seedingService.importMasterData(filePath);

      expect(result.success).toBe(true);
      expect(result.entitiesRestored).toBe(4); // grades + subjects + topics + resources
      expect(result.errors).toHaveLength(0);
      expect(mockFs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it('should handle invalid import data', async () => {
      const filePath = '/tmp/invalid.json';
      const invalidData = {
        version: '1.0',
        // Missing required data structure
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidData));

      const result = await seedingService.importMasterData(filePath);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBe('Invalid import data structure');
    });

    it('should handle file read errors', async () => {
      const filePath = '/tmp/nonexistent.json';

      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await seedingService.importMasterData(filePath);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createBackup', () => {
    it('should create backup with default name', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue();
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);

      // Mock data for export
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.gradeSubject.findMany.mockResolvedValue([]);
      mockPrisma.topic.findMany.mockResolvedValue([]);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      const result = await seedingService.createBackup();

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('master-data-backup-');
      expect(result.filePath).toContain('.json');
      expect(mockFs.mkdir).toHaveBeenCalled();
    });

    it('should create backup with custom name', async () => {
      const backupName = 'custom-backup';

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue();
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);

      // Mock data for export
      mockPrisma.gradeLevel.findMany.mockResolvedValue([]);
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.gradeSubject.findMany.mockResolvedValue([]);
      mockPrisma.topic.findMany.mockResolvedValue([]);
      mockPrisma.topicResource.findMany.mockResolvedValue([]);

      const result = await seedingService.createBackup(backupName);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('custom-backup.json');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup file', async () => {
      const backupPath = '/tmp/backup.json';
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          grades: [{ id: 'grade-1', grade: 'K' }],
          subjects: [{ id: 'subject-1', name: 'math' }],
          gradeSubjects: [],
          topics: [{ id: 'topic-1', name: 'counting' }],
          resources: [{ id: 'resource-1', title: 'Video' }]
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(backupData));

      // Mock clear existing data
      mockPrisma.topicResource.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.topic.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.gradeSubject.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.subject.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.gradeLevel.deleteMany.mockResolvedValue({ count: 0 });

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          gradeLevel: { upsert: jest.fn().mockResolvedValue({}) },
          subject: { upsert: jest.fn().mockResolvedValue({}) },
          gradeSubject: { upsert: jest.fn().mockResolvedValue({}) },
          topic: { upsert: jest.fn().mockResolvedValue({}) },
          topicResource: { upsert: jest.fn().mockResolvedValue({}) }
        };
        return await callback(mockTx);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await seedingService.restoreFromBackup(backupPath);

      expect(result.success).toBe(true);
      expect(result.entitiesRestored).toBe(4);
      expect(mockPrisma.gradeLevel.deleteMany).toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should list available backup files', async () => {
      const mockFiles = [
        'master-data-backup-2023-01-01.json',
        'master-data-backup-2023-01-02.json',
        'other-file.txt'
      ];

      mockFs.readdir.mockResolvedValue(mockFiles as any);

      const result = await seedingService.listBackups();

      expect(result).toEqual([
        'master-data-backup-2023-01-01.json',
        'master-data-backup-2023-01-02.json'
      ]);
    });

    it('should return empty array if backup directory does not exist', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await seedingService.listBackups();

      expect(result).toEqual([]);
    });
  });

  describe('private helper methods', () => {
    it('should validate import data structure correctly', async () => {
      const validData = {
        version: '1.0',
        data: {
          grades: [],
          subjects: [],
          topics: [],
          resources: []
        }
      };

      const invalidData = {
        version: '1.0'
        // Missing data property
      };

      // Access private method through any cast for testing
      const service = seedingService as any;

      expect(service.validateImportData(validData)).toBe(true);
      expect(service.validateImportData(invalidData)).toBe(false);
      expect(service.validateImportData(null)).toBe(false);
      expect(service.validateImportData(undefined)).toBe(false);
    });

    it('should get default config correctly', async () => {
      const service = seedingService as any;
      const config = service.getDefaultConfig();

      expect(config).toEqual({
        includeGrades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        includeSubjects: ['math', 'science', 'english', 'social-studies', 'art', 'music', 'physical-education'],
        resourcesPerTopic: 5,
        validateResources: true,
        clearExisting: false
      });
    });
  });
});