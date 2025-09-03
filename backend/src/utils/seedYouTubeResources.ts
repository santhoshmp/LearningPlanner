import { PrismaClient } from '@prisma/client';
import { YouTubeResourceService } from '../services/youtubeResourceService';
import { youtubeResourceSeedData } from '../data/youtubeResourceData';
import { logger } from './logger';

export class YouTubeResourceSeeder {
  private prisma: PrismaClient;
  private youtubeService: YouTubeResourceService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.youtubeService = new YouTubeResourceService(prisma);
  }

  async seedYouTubeResources(): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    logger.info('Starting YouTube resources seeding...');

    try {
      for (const topicData of youtubeResourceSeedData) {
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

        // Seed videos for this topic
        for (const videoData of topicData.videos) {
          try {
            // Check if video already exists
            const existingResource = await this.prisma.topicResource.findFirst({
              where: {
                topicId: topic.id,
                url: `https://www.youtube.com/watch?v=${videoData.videoId}`
              }
            });

            if (existingResource) {
              logger.info(`Skipping existing video: ${videoData.title}`);
              results.skipped++;
              continue;
            }

            // Create the YouTube resource
            const youtubeVideoData = {
              videoId: videoData.videoId,
              title: videoData.title,
              description: videoData.description,
              channelName: videoData.channelName,
              publishedAt: new Date().toISOString(),
              duration: videoData.duration,
              thumbnailUrl: `https://img.youtube.com/vi/${videoData.videoId}/maxresdefault.jpg`,
              tags: videoData.tags,
              categoryId: '27', // Education category
              closedCaptions: true // Assume most educational videos have captions
            };

            await this.youtubeService.createYouTubeResource(
              topic.id,
              youtubeVideoData,
              videoData.difficulty,
              videoData.ageAppropriate
            );

            logger.info(`Created YouTube resource: ${videoData.title}`);
            results.created++;

          } catch (error) {
            const errorMsg = `Failed to create video ${videoData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMsg);
            results.errors.push(errorMsg);
            results.success = false;
          }
        }
      }

      logger.info(`YouTube resources seeding completed. Created: ${results.created}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    } catch (error) {
      const errorMsg = `YouTube resources seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      results.errors.push(errorMsg);
      results.success = false;
    }

    return results;
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

  async validateAllYouTubeResources(): Promise<{
    total: number;
    validated: number;
    broken: number;
    errors: string[];
  }> {
    logger.info('Starting YouTube resources validation...');
    
    const results = await this.youtubeService.validateAllYouTubeResources();
    
    logger.info(`YouTube resources validation completed. Total: ${results.total}, Validated: ${results.validated}, Broken: ${results.broken}`);
    
    return results;
  }

  async getYouTubeResourceStats() {
    const stats = await this.prisma.topicResource.groupBy({
      by: ['safetyRating', 'validationStatus'],
      where: {
        type: 'VIDEO',
        url: {
          contains: 'youtube.com'
        }
      },
      _count: {
        id: true
      }
    });

    const totalVideos = await this.prisma.topicResource.count({
      where: {
        type: 'VIDEO',
        url: {
          contains: 'youtube.com'
        }
      }
    });

    const activeVideos = await this.prisma.topicResource.count({
      where: {
        type: 'VIDEO',
        url: {
          contains: 'youtube.com'
        },
        isActive: true
      }
    });

    const safeVideos = await this.prisma.topicResource.count({
      where: {
        type: 'VIDEO',
        url: {
          contains: 'youtube.com'
        },
        safetyRating: 'SAFE'
      }
    });

    return {
      total: totalVideos,
      active: activeVideos,
      safe: safeVideos,
      breakdown: stats,
      safetyPercentage: totalVideos > 0 ? Math.round((safeVideos / totalVideos) * 100) : 0
    };
  }
}

// Utility function to run seeding
export async function seedYouTubeResourcesUtil() {
  const prisma = new PrismaClient();
  const seeder = new YouTubeResourceSeeder(prisma);

  try {
    const results = await seeder.seedYouTubeResources();
    console.log('YouTube Resources Seeding Results:', results);
    
    if (results.errors.length > 0) {
      console.log('Errors encountered:');
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    // Get stats after seeding
    const stats = await seeder.getYouTubeResourceStats();
    console.log('YouTube Resources Statistics:', stats);

    return results;
  } catch (error) {
    console.error('Failed to seed YouTube resources:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedYouTubeResourcesUtil()
    .then(() => {
      console.log('YouTube resources seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('YouTube resources seeding failed:', error);
      process.exit(1);
    });
}