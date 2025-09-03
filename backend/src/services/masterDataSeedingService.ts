import { PrismaClient } from '@prisma/client';
import { 
  SeedDataConfig, 
  MigrationResult, 
  SeedResult,
  BackupResult,
  RestoreResult
} from '../types/masterData';
import { GRADE_AGE_MAPPINGS } from '../data/gradeAgeData';
import { SUBJECT_DEFINITIONS } from '../data/subjectData';
import { ALL_TOPICS } from '../data/topicData';
import { youtubeResourceSeedData } from '../data/youtubeResourceData';
import { readingMaterialsSeedData } from '../data/readingMaterialsData';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MasterDataSeedingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Comprehensive Database Seeding
  async seedMasterData(config: SeedDataConfig = this.getDefaultConfig()): Promise<SeedResult> {
    const startTime = Date.now();
    const result: SeedResult = {
      success: true,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      errors: [],
      warnings: [],
      duration: 0,
      summary: {
        grades: 0,
        subjects: 0,
        topics: 0,
        resources: 0
      }
    };

    try {
      console.log('Starting master data seeding...');

      // Clear existing data if requested
      if (config.clearExisting) {
        await this.clearExistingData();
        console.log('Cleared existing master data');
      }

      // Seed in dependency order
      await this.prisma.$transaction(async (tx) => {
        // 1. Seed grade levels
        const gradeResult = await this.seedGradeLevels(tx, config);
        result.entitiesCreated += gradeResult.created;
        result.entitiesUpdated += gradeResult.updated;
        result.summary.grades = gradeResult.created + gradeResult.updated;

        // 2. Seed subjects
        const subjectResult = await this.seedSubjects(tx, config);
        result.entitiesCreated += subjectResult.created;
        result.entitiesUpdated += subjectResult.updated;
        result.summary.subjects = subjectResult.created + subjectResult.updated;

        // 3. Seed grade-subject relationships
        await this.seedGradeSubjectRelationships(tx, config);

        // 4. Seed topics
        const topicResult = await this.seedTopics(tx, config);
        result.entitiesCreated += topicResult.created;
        result.entitiesUpdated += topicResult.updated;
        result.summary.topics = topicResult.created + topicResult.updated;

        // 5. Seed resources
        const resourceResult = await this.seedResources(tx, config);
        result.entitiesCreated += resourceResult.created;
        result.entitiesUpdated += resourceResult.updated;
        result.summary.resources = resourceResult.created + resourceResult.updated;
      });

      result.duration = Date.now() - startTime;
      console.log(`Master data seeding completed in ${result.duration}ms`);
      console.log(`Created: ${result.entitiesCreated}, Updated: ${result.entitiesUpdated}`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown seeding error');
      result.duration = Date.now() - startTime;
      console.error('Master data seeding failed:', error);
    }

    return result;
  }

  // Data Migration Utilities
  async migrateMasterDataStructure(fromVersion: string, toVersion: string): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      console.log(`Migrating master data from version ${fromVersion} to ${toVersion}`);

      // Create backup before migration
      const backupResult = await this.createBackup(`pre-migration-${fromVersion}-to-${toVersion}`);
      if (!backupResult.success) {
        throw new Error(`Backup failed: ${backupResult.errors.join(', ')}`);
      }

      // Apply version-specific migrations
      await this.applyVersionMigrations(fromVersion, toVersion, result);

      result.duration = Date.now() - startTime;
      console.log(`Migration completed in ${result.duration}ms`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Migration failed');
      result.duration = Date.now() - startTime;
      console.error('Migration failed:', error);
    }

    return result;
  }

  // Data Export and Import Tools
  async exportMasterData(outputPath: string): Promise<BackupResult> {
    const result: BackupResult = {
      success: true,
      filePath: outputPath,
      fileSize: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      console.log(`Exporting master data to ${outputPath}`);

      // Export all master data
      const [grades, subjects, gradeSubjects, topics, resources] = await Promise.all([
        this.prisma.gradeLevel.findMany({ include: { subjects: true } }),
        this.prisma.subject.findMany({ include: { gradeSubjects: true, topics: true } }),
        this.prisma.gradeSubject.findMany(),
        this.prisma.topic.findMany({ include: { resources: true } }),
        this.prisma.topicResource.findMany()
      ]);

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          grades,
          subjects,
          gradeSubjects,
          topics,
          resources
        },
        metadata: {
          totalGrades: grades.length,
          totalSubjects: subjects.length,
          totalTopics: topics.length,
          totalResources: resources.length
        }
      };

      // Write to file
      const jsonData = JSON.stringify(exportData, null, 2);
      await fs.writeFile(outputPath, jsonData, 'utf8');

      // Get file size
      const stats = await fs.stat(outputPath);
      result.fileSize = stats.size;

      console.log(`Export completed: ${result.fileSize} bytes written to ${outputPath}`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Export failed');
      console.error('Export failed:', error);
    }

    return result;
  }

  async importMasterData(filePath: string, config: SeedDataConfig = this.getDefaultConfig()): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: true,
      entitiesRestored: 0,
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    try {
      console.log(`Importing master data from ${filePath}`);

      // Read and parse file
      const fileContent = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(fileContent);

      // Validate import data structure
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import data structure');
      }

      // Clear existing data if requested
      if (config.clearExisting) {
        await this.clearExistingData();
      }

      // Import data in dependency order
      await this.prisma.$transaction(async (tx) => {
        // Import grades
        for (const grade of importData.data.grades) {
          await tx.gradeLevel.upsert({
            where: { id: grade.id },
            update: grade,
            create: grade
          });
          result.entitiesRestored++;
        }

        // Import subjects
        for (const subject of importData.data.subjects) {
          await tx.subject.upsert({
            where: { id: subject.id },
            update: subject,
            create: subject
          });
          result.entitiesRestored++;
        }

        // Import grade-subject relationships
        for (const gradeSubject of importData.data.gradeSubjects) {
          await tx.gradeSubject.upsert({
            where: { 
              gradeId_subjectId: {
                gradeId: gradeSubject.gradeId,
                subjectId: gradeSubject.subjectId
              }
            },
            update: gradeSubject,
            create: gradeSubject
          });
        }

        // Import topics
        for (const topic of importData.data.topics) {
          await tx.topic.upsert({
            where: { id: topic.id },
            update: topic,
            create: topic
          });
          result.entitiesRestored++;
        }

        // Import resources
        for (const resource of importData.data.resources) {
          await tx.topicResource.upsert({
            where: { id: resource.id },
            update: resource,
            create: resource
          });
          result.entitiesRestored++;
        }
      });

      console.log(`Import completed: ${result.entitiesRestored} entities restored`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Import failed');
      console.error('Import failed:', error);
    }

    return result;
  }

  // Backup and Recovery Procedures
  async createBackup(backupName?: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = backupName || `master-data-backup-${timestamp}`;
    const backupPath = path.join(process.cwd(), 'backups', `${fileName}.json`);

    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    return await this.exportMasterData(backupPath);
  }

  async restoreFromBackup(backupPath: string): Promise<RestoreResult> {
    return await this.importMasterData(backupPath, {
      ...this.getDefaultConfig(),
      clearExisting: true
    });
  }

  async listBackups(): Promise<string[]> {
    const backupDir = path.join(process.cwd(), 'backups');
    
    try {
      const files = await fs.readdir(backupDir);
      return files.filter(file => file.endsWith('.json') && file.includes('master-data-backup'));
    } catch (error) {
      console.warn('Backup directory not found or empty');
      return [];
    }
  }

  // Private helper methods
  private getDefaultConfig(): SeedDataConfig {
    return {
      includeGrades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      includeSubjects: ['math', 'science', 'english', 'social-studies', 'art', 'music', 'physical-education'],
      resourcesPerTopic: 5,
      validateResources: true,
      clearExisting: false
    };
  }

  private async clearExistingData(): Promise<void> {
    // Delete in reverse dependency order
    await this.prisma.topicResource.deleteMany();
    await this.prisma.topic.deleteMany();
    await this.prisma.gradeSubject.deleteMany();
    await this.prisma.subject.deleteMany();
    await this.prisma.gradeLevel.deleteMany();
  }

  private async seedGradeLevels(tx: any, config: SeedDataConfig): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;

    for (const gradeData of GRADE_AGE_MAPPINGS) {
      if (!config.includeGrades.includes(gradeData.grade)) {
        continue;
      }

      const existing = await tx.gradeLevel.findUnique({
        where: { grade: gradeData.grade }
      });

      // Filter data to only include fields that exist in the schema
      const gradeRecord = {
        grade: gradeData.grade,
        displayName: gradeData.displayName,
        ageMin: gradeData.ageMin,
        ageMax: gradeData.ageMax,
        ageTypical: gradeData.ageTypical,
        educationalLevel: gradeData.educationalLevel,
        prerequisites: gradeData.prerequisites,
        nextGrade: gradeData.nextGrade,
        sortOrder: gradeData.sortOrder
      };

      if (existing) {
        await tx.gradeLevel.update({
          where: { id: existing.id },
          data: gradeRecord
        });
        updated++;
      } else {
        await tx.gradeLevel.create({
          data: gradeRecord
        });
        created++;
      }
    }

    return { created, updated };
  }

  private async seedSubjects(tx: any, config: SeedDataConfig): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;

    for (const subjectDataItem of SUBJECT_DEFINITIONS) {
      if (!config.includeSubjects.includes(subjectDataItem.name)) {
        continue;
      }

      const existing = await tx.subject.findUnique({
        where: { name: subjectDataItem.name }
      });

      // Filter data to only include fields that exist in the schema
      const subjectRecord = {
        id: subjectDataItem.id,
        name: subjectDataItem.name,
        displayName: subjectDataItem.displayName,
        description: subjectDataItem.description,
        icon: subjectDataItem.icon,
        color: subjectDataItem.color,
        category: subjectDataItem.category,
        isCore: subjectDataItem.isCore,
        sortOrder: subjectDataItem.sortOrder
      };

      if (existing) {
        await tx.subject.update({
          where: { id: existing.id },
          data: subjectRecord
        });
        updated++;
      } else {
        await tx.subject.create({
          data: subjectRecord
        });
        created++;
      }
    }

    return { created, updated };
  }

  private async seedGradeSubjectRelationships(tx: any, config: SeedDataConfig): Promise<void> {
    // Get all grades and subjects
    const grades = await tx.gradeLevel.findMany();
    const subjects = await tx.subject.findMany();

    // Create relationships based on subject grade availability
    for (const subject of subjects) {
      const subjectConfig = SUBJECT_DEFINITIONS.find(s => s.name === subject.name);
      if (!subjectConfig) continue;

      for (const grade of grades) {
        if (subjectConfig.gradeAvailability.includes(grade.grade)) {
          await tx.gradeSubject.upsert({
            where: {
              gradeId_subjectId: {
                gradeId: grade.id,
                subjectId: subject.id
              }
            },
            update: {},
            create: {
              gradeId: grade.id,
              subjectId: subject.id,
              estimatedHours: subjectConfig.estimatedHoursPerGrade[grade.grade] || 30,
              isRequired: subjectConfig.isCore
            }
          });
        }
      }
    }
  }

  private async seedTopics(tx: any, config: SeedDataConfig): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;

    const grades = await tx.gradeLevel.findMany();
    const subjects = await tx.subject.findMany();

    for (const topicDataItem of ALL_TOPICS) {
      const grade = grades.find(g => g.grade === topicDataItem.gradeId);
      const subject = subjects.find(s => s.name === topicDataItem.subjectId);

      if (!grade || !subject) {
        console.warn(`Skipping topic ${topicDataItem.name}: grade or subject not found`);
        continue;
      }

      const existing = await tx.topic.findFirst({
        where: {
          name: topicDataItem.name,
          gradeId: grade.id,
          subjectId: subject.id
        }
      });

      const topicData = {
        ...topicDataItem,
        gradeId: grade.id,
        subjectId: subject.id
      };

      if (existing) {
        await tx.topic.update({
          where: { id: existing.id },
          data: topicData
        });
        updated++;
      } else {
        await tx.topic.create({
          data: topicData
        });
        created++;
      }
    }

    return { created, updated };
  }

  private async seedResources(tx: any, config: SeedDataConfig): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;

    const topics = await tx.topic.findMany();

    // Seed YouTube resources
    for (const resourceData of youtubeResourceSeedData) {
      const topic = topics.find(t => t.name === resourceData.topicName);
      if (!topic) {
        console.warn(`Skipping YouTube resource: topic ${resourceData.topicName} not found`);
        continue;
      }

      // Process each video in the resource data
      for (const video of resourceData.videos) {
        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
        
        const existing = await tx.topicResource.findFirst({
          where: {
            url: url,
            topicId: topic.id
          }
        });

        const resourceRecord = {
          title: video.title,
          description: video.description,
          url: url,
          type: 'VIDEO',
          difficulty: video.difficulty,
          safetyRating: video.safetyRating,
          duration: video.duration,
          ageAppropriate: video.ageAppropriate,
          source: video.channelName,
          topicId: topic.id,
          tags: video.tags,
          metadata: {
            channelName: video.channelName,
            educationalValue: video.educationalValue
          }
        };

        if (existing) {
          await tx.topicResource.update({
            where: { id: existing.id },
            data: resourceRecord
          });
          updated++;
        } else {
          await tx.topicResource.create({
            data: resourceRecord
          });
          created++;
        }
      }
    }

    // Seed reading materials
    for (const resourceData of readingMaterialsSeedData) {
      const topic = topics.find(t => t.name === resourceData.topicName);
      if (!topic) {
        console.warn(`Skipping reading resource: topic ${resourceData.topicName} not found`);
        continue;
      }

      // Process each material in the resource data
      for (const material of resourceData.materials) {
        const existing = await tx.topicResource.findFirst({
          where: {
            url: material.url,
            topicId: topic.id
          }
        });

        const resourceRecord = {
          title: material.title,
          description: material.description,
          url: material.url,
          type: 'ARTICLE',
          difficulty: material.difficulty,
          safetyRating: material.safetyRating,
          duration: material.estimatedReadingTime,
          ageAppropriate: material.ageAppropriate,
          source: material.publisher || material.author || 'Unknown',
          thumbnailUrl: material.thumbnailUrl,
          topicId: topic.id,
          tags: material.tags,
          metadata: {
            author: material.author,
            publisher: material.publisher,
            isbn: material.isbn,
            readingLevel: material.readingLevel,
            wordCount: material.wordCount,
            language: material.language,
            format: material.format,
            educationalValue: material.educationalValue
          }
        };

        if (existing) {
          await tx.topicResource.update({
            where: { id: existing.id },
            data: resourceRecord
          });
          updated++;
        } else {
          await tx.topicResource.create({
            data: resourceRecord
          });
          created++;
        }
      }
    }

    return { created, updated };
  }

  private async applyVersionMigrations(fromVersion: string, toVersion: string, result: MigrationResult): Promise<void> {
    // Version-specific migration logic would go here
    // For now, this is a placeholder for future version migrations
    console.log(`No specific migrations needed from ${fromVersion} to ${toVersion}`);
  }

  private validateImportData(data: any): boolean {
    return (
      data &&
      data.version &&
      data.data &&
      data.data.grades &&
      data.data.subjects &&
      data.data.topics &&
      data.data.resources &&
      Array.isArray(data.data.grades) &&
      Array.isArray(data.data.subjects) &&
      Array.isArray(data.data.topics) &&
      Array.isArray(data.data.resources)
    );
  }
}