import { PrismaClient } from '@prisma/client';
import { YouTubeResourceSeeder } from './seedYouTubeResources';
import { ReadingMaterialsService } from '../services/readingMaterialsService';
import { ResourceValidationService } from '../services/resourceValidationService';
import { readingMaterialsSeedData } from '../data/readingMaterialsData';
import { logger } from './logger';

export class MultimediaResourceSeeder {
  private prisma: PrismaClient;
  private youtubeSeeder: YouTubeResourceSeeder;
  private readingService: ReadingMaterialsService;
  private validationService: ResourceValidationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.youtubeSeeder = new YouTubeResourceSeeder(prisma);
    this.readingService = new ReadingMaterialsService(prisma);
    this.validationService = new ResourceValidationService(prisma);
  }

  async seedAllMultimediaResources(): Promise<{
    success: boolean;
    youtube: {
      created: number;
      skipped: number;
      errors: string[];
    };
    readingMaterials: {
      created: number;
      skipped: number;
      errors: string[];
    };
    validation: {
      total: number;
      validated: number;
      broken: number;
    };
    summary: {
      totalResourcesCreated: number;
      totalErrors: number;
      validationHealthScore: number;
    };
  }> {
    logger.info('Starting comprehensive multimedia resources seeding...');

    // Seed YouTube resources
    logger.info('Seeding YouTube resources...');
    const youtubeResults = await this.youtubeSeeder.seedYouTubeResources();

    // Seed reading materials
    logger.info('Seeding reading materials...');
    const readingResults = await this.seedReadingMaterials();

    // Validate all resources
    logger.info('Validating all multimedia resources...');
    const validationResults = await this.validateAllResources();

    const summary = {
      totalResourcesCreated: youtubeResults.created + readingResults.created,
      totalErrors: youtubeResults.errors.length + readingResults.errors.length,
      validationHealthScore: validationResults.total > 0 
        ? Math.round((validationResults.validated / validationResults.total) * 100)
        : 100
    };

    const overallSuccess = youtubeResults.success && readingResults.success;

    logger.info('Multimedia resources seeding completed', {
      success: overallSuccess,
      totalCreated: summary.totalResourcesCreated,
      totalErrors: summary.totalErrors,
      healthScore: summary.validationHealthScore
    });

    return {
      success: overallSuccess,
      youtube: youtubeResults,
      readingMaterials: readingResults,
      validation: validationResults,
      summary
    };
  }

  private async seedReadingMaterials(): Promise<{
    created: number;
    skipped: number;
    errors: string[];
    success: boolean;
  }> {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      success: true
    };

    try {
      for (const topicData of readingMaterialsSeedData) {
        // Find the topic in the database
        const topic = await this.findTopicByDetails(
          topicData.topicName,
          topicData.grade,
          topicData.subject
        );

        if (!topic) {
          const errorMsg = `Topic not found: ${topicData.topicName} (${topicData.grade}, ${topicData.subject})`;
          logger.warn(errorMsg);
          results.errors.push(errorMsg);
          continue;
        }

        // Seed materials for this topic
        for (const materialData of topicData.materials) {
          try {
            // Check if material already exists
            const existingResource = await this.prisma.topicResource.findFirst({
              where: {
                topicId: topic.id,
                url: materialData.url
              }
            });

            if (existingResource) {
              logger.info(`Skipping existing reading material: ${materialData.title}`);
              results.skipped++;
              continue;
            }

            // Create the reading material
            await this.readingService.createReadingMaterial(
              topic.id,
              materialData,
              materialData.difficulty,
              materialData.ageAppropriate
            );

            logger.info(`Created reading material: ${materialData.title}`);
            results.created++;

          } catch (error) {
            const errorMsg = `Failed to create reading material ${materialData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMsg);
            results.errors.push(errorMsg);
            results.success = false;
          }
        }
      }
    } catch (error) {
      const errorMsg = `Reading materials seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      results.errors.push(errorMsg);
      results.success = false;
    }

    return results;
  }

  private async validateAllResources(): Promise<{
    total: number;
    validated: number;
    broken: number;
  }> {
    try {
      // Get all multimedia resources that need validation
      const resourcesToValidate = await this.validationService.getResourcesNeedingValidation(100);
      
      if (resourcesToValidate.length === 0) {
        return { total: 0, validated: 0, broken: 0 };
      }

      // Validate resources in batches
      const resourceIds = resourcesToValidate.map(r => r.id);
      const validationReports = await this.validationService.validateResourcesBatch(resourceIds);

      const validated = validationReports.filter(r => r.validationResult.isValid).length;
      const broken = validationReports.filter(r => !r.validationResult.isValid).length;

      return {
        total: validationReports.length,
        validated,
        broken
      };
    } catch (error) {
      logger.error('Failed to validate resources:', error);
      return { total: 0, validated: 0, broken: 0 };
    }
  }

  private async findTopicByDetails(topicName: string, grade: string, subject: string) {
    // First, find the grade level
    const gradeLevel = await this.prisma.gradeLevel.findUnique({
      where: { grade }
    });

    if (!gradeLevel) {
      return null;
    }

    // Then find the subject
    const subjectRecord = await this.prisma.subject.findUnique({
      where: { name: subject }
    });

    if (!subjectRecord) {
      return null;
    }

    // Finally, find the topic
    const topic = await this.prisma.topic.findFirst({
      where: {
        name: topicName,
        gradeId: gradeLevel.id,
        subjectId: subjectRecord.id
      },
      include: {
        grade: true,
        subject: true
      }
    });

    return topic;
  }

  async getMultimediaResourcesStats() {
    const [youtubeStats, readingStats, validationStats] = await Promise.all([
      this.youtubeSeeder.getYouTubeResourceStats(),
      this.readingService.getReadingMaterialsStats(),
      this.validationService.getValidationStatistics()
    ]);

    return {
      youtube: youtubeStats,
      readingMaterials: readingStats,
      validation: validationStats,
      combined: {
        totalResources: youtubeStats.total + readingStats.total,
        totalSafe: youtubeStats.safe + readingStats.safe,
        overallSafetyPercentage: Math.round(
          ((youtubeStats.safe + readingStats.safe) / (youtubeStats.total + readingStats.total)) * 100
        )
      }
    };
  }
}

// Utility function to run comprehensive seeding
export async function seedAllMultimediaResourcesUtil() {
  const prisma = new PrismaClient();
  const seeder = new MultimediaResourceSeeder(prisma);

  try {
    const results = await seeder.seedAllMultimediaResources();
    
    console.log('\n=== Multimedia Resources Seeding Results ===');
    console.log(`Overall Success: ${results.success}`);
    console.log(`Total Resources Created: ${results.summary.totalResourcesCreated}`);
    console.log(`Validation Health Score: ${results.summary.validationHealthScore}%`);
    
    console.log('\n--- YouTube Resources ---');
    console.log(`Created: ${results.youtube.created}`);
    console.log(`Skipped: ${results.youtube.skipped}`);
    console.log(`Errors: ${results.youtube.errors.length}`);
    
    console.log('\n--- Reading Materials ---');
    console.log(`Created: ${results.readingMaterials.created}`);
    console.log(`Skipped: ${results.readingMaterials.skipped}`);
    console.log(`Errors: ${results.readingMaterials.errors.length}`);
    
    console.log('\n--- Validation Results ---');
    console.log(`Total Validated: ${results.validation.total}`);
    console.log(`Valid: ${results.validation.validated}`);
    console.log(`Broken: ${results.validation.broken}`);

    if (results.summary.totalErrors > 0) {
      console.log('\n--- Errors ---');
      [...results.youtube.errors, ...results.readingMaterials.errors].forEach(error => {
        console.log(`- ${error}`);
      });
    }

    // Get final statistics
    const stats = await seeder.getMultimediaResourcesStats();
    console.log('\n=== Final Statistics ===');
    console.log(`Total Multimedia Resources: ${stats.combined.totalResources}`);
    console.log(`Overall Safety Percentage: ${stats.combined.overallSafetyPercentage}%`);

    return results;
  } catch (error) {
    console.error('Failed to seed multimedia resources:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAllMultimediaResourcesUtil()
    .then(() => {
      console.log('\nMultimedia resources seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMultimedia resources seeding failed:', error);
      process.exit(1);
    });
}