import { PrismaClient, StudyContent, ContentInteraction, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateContentData {
  activityId: string;
  contentType: 'video' | 'article' | 'interactive';
  title: string;
  description?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  difficultyLevel?: number;
  ageAppropriateMin?: number;
  ageAppropriateMax?: number;
  sourceAttribution?: string;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  difficultyLevel?: number;
  ageAppropriateMin?: number;
  ageAppropriateMax?: number;
  safetyRating?: 'safe' | 'review_needed' | 'blocked';
  sourceAttribution?: string;
}

export interface ContentFilters {
  contentType?: string;
  safetyRating?: string;
  difficultyLevel?: number;
  ageRange?: { min: number; max: number };
  activityId?: string;
}

export interface ContentInteractionData {
  childId: string;
  contentId: string;
  interactionType: 'view' | 'complete' | 'like' | 'bookmark';
  progressPercentage?: number;
  timeSpent?: number;
}

export interface ContentAnalytics {
  totalViews: number;
  totalCompletions: number;
  averageTimeSpent: number;
  averageProgressPercentage: number;
  popularContent: Array<{
    contentId: string;
    title: string;
    viewCount: number;
    completionRate: number;
  }>;
}

class ContentService {
  /**
   * Create new study content
   */
  async createContent(data: CreateContentData): Promise<StudyContent> {
    try {
      // Validate activity exists
      const activity = await prisma.studyActivity.findUnique({
        where: { id: data.activityId }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      // Perform content safety screening
      const safetyRating = await this.screenContentSafety(data);

      const content = await prisma.studyContent.create({
        data: {
          ...data,
          safetyRating,
          difficultyLevel: data.difficultyLevel || 1,
          ageAppropriateMin: data.ageAppropriateMin || 5,
          ageAppropriateMax: data.ageAppropriateMax || 18,
        }
      });

      logger.info('Content created successfully', {
        contentId: content.id,
        activityId: data.activityId,
        contentType: data.contentType,
        safetyRating
      });

      return content;
    } catch (error) {
      logger.error('Error creating content', { error: error instanceof Error ? error.message : String(error), data });
      throw error;
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string): Promise<StudyContent | null> {
    try {
      return await prisma.studyContent.findUnique({
        where: { id },
        include: {
          activity: {
            include: {
              plan: {
                include: {
                  child: true
                }
              }
            }
          },
          contentInteractions: true
        }
      });
    } catch (error) {
      logger.error('Error fetching content by ID', { error: error instanceof Error ? error.message : String(error), id });
      throw error;
    }
  }

  /**
   * Get content with filters and pagination
   */
  async getContent(
    filters: ContentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ content: StudyContent[]; total: number; pages: number }> {
    try {
      const where: Prisma.StudyContentWhereInput = {};

      if (filters.contentType) {
        where.contentType = filters.contentType;
      }

      if (filters.safetyRating) {
        where.safetyRating = filters.safetyRating;
      }

      if (filters.difficultyLevel) {
        where.difficultyLevel = filters.difficultyLevel;
      }

      if (filters.ageRange) {
        where.AND = [
          { ageAppropriateMin: { lte: filters.ageRange.max } },
          { ageAppropriateMax: { gte: filters.ageRange.min } }
        ];
      }

      if (filters.activityId) {
        where.activityId = filters.activityId;
      }

      const [content, total] = await Promise.all([
        prisma.studyContent.findMany({
          where,
          include: {
            activity: true,
            contentInteractions: true
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.studyContent.count({ where })
      ]);

      return {
        content,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching content', { error: error instanceof Error ? error.message : String(error), filters });
      throw error;
    }
  }

  /**
   * Update content
   */
  async updateContent(id: string, data: UpdateContentData): Promise<StudyContent> {
    try {
      // Check if content exists
      const existingContent = await prisma.studyContent.findUnique({
        where: { id }
      });

      if (!existingContent) {
        throw new Error('Content not found');
      }

      // Re-screen content safety if content URL changed
      let safetyRating = data.safetyRating;
      if (data.contentUrl && data.contentUrl !== existingContent.contentUrl) {
        safetyRating = await this.screenContentSafety({
          ...existingContent,
          ...data
        } as CreateContentData);
      }

      const updatedContent = await prisma.studyContent.update({
        where: { id },
        data: {
          ...data,
          safetyRating: safetyRating || existingContent.safetyRating
        }
      });

      logger.info('Content updated successfully', {
        contentId: id,
        updatedFields: Object.keys(data)
      });

      return updatedContent;
    } catch (error) {
      logger.error('Error updating content', { error: error instanceof Error ? error.message : String(error), id, data });
      throw error;
    }
  }

  /**
   * Delete content
   */
  async deleteContent(id: string): Promise<void> {
    try {
      const content = await prisma.studyContent.findUnique({
        where: { id }
      });

      if (!content) {
        throw new Error('Content not found');
      }

      await prisma.studyContent.delete({
        where: { id }
      });

      logger.info('Content deleted successfully', { contentId: id });
    } catch (error) {
      logger.error('Error deleting content', { error: error instanceof Error ? error.message : String(error), id });
      throw error;
    }
  }

  /**
   * Screen content for safety
   */
  private async screenContentSafety(data: CreateContentData): Promise<'safe' | 'review_needed' | 'blocked'> {
    try {
      // Basic content safety screening logic
      const suspiciousKeywords = [
        'violence', 'inappropriate', 'adult', 'explicit', 'harmful',
        'dangerous', 'weapon', 'drug', 'alcohol', 'gambling'
      ];

      const contentText = `${data.title} ${data.description || ''}`.toLowerCase();
      
      // Check for suspicious keywords
      const hasSuspiciousContent = suspiciousKeywords.some(keyword => 
        contentText.includes(keyword)
      );

      if (hasSuspiciousContent) {
        logger.warn('Content flagged for review', {
          title: data.title,
          reason: 'suspicious_keywords'
        });
        return 'review_needed';
      }

      // Check age appropriateness
      if (data.ageAppropriateMin && data.ageAppropriateMin > 12) {
        logger.info('Content marked for review due to age restrictions', {
          title: data.title,
          ageMin: data.ageAppropriateMin
        });
        return 'review_needed';
      }

      // Additional safety checks could be added here
      // - External content safety API integration
      // - URL validation
      // - File type validation

      return 'safe';
    } catch (error) {
      logger.error('Error screening content safety', { error: error instanceof Error ? error.message : String(error), data });
      // Default to review_needed if screening fails
      return 'review_needed';
    }
  }

  /**
   * Track content interaction
   */
  async trackInteraction(data: ContentInteractionData): Promise<ContentInteraction> {
    try {
      // Validate content and child exist
      const [content, child] = await Promise.all([
        prisma.studyContent.findUnique({ where: { id: data.contentId } }),
        prisma.childProfile.findUnique({ where: { id: data.childId } })
      ]);

      if (!content) {
        throw new Error('Content not found');
      }

      if (!child) {
        throw new Error('Child profile not found');
      }

      // Upsert interaction (update if exists, create if not)
      const interaction = await prisma.contentInteraction.upsert({
        where: {
          childId_contentId_interactionType: {
            childId: data.childId,
            contentId: data.contentId,
            interactionType: data.interactionType
          }
        },
        update: {
          progressPercentage: data.progressPercentage || 0,
          timeSpent: data.timeSpent || 0
        },
        create: {
          childId: data.childId,
          contentId: data.contentId,
          interactionType: data.interactionType,
          progressPercentage: data.progressPercentage || 0,
          timeSpent: data.timeSpent || 0
        }
      });

      logger.info('Content interaction tracked', {
        childId: data.childId,
        contentId: data.contentId,
        interactionType: data.interactionType
      });

      return interaction;
    } catch (error) {
      logger.error('Error tracking content interaction', { error: error instanceof Error ? error.message : String(error), data });
      throw error;
    }
  }

  /**
   * Get content interactions for a child
   */
  async getChildInteractions(
    childId: string,
    contentType?: string,
    limit: number = 50
  ): Promise<ContentInteraction[]> {
    try {
      const where: Prisma.ContentInteractionWhereInput = {
        childId
      };

      if (contentType) {
        where.content = {
          contentType
        };
      }

      return await prisma.contentInteraction.findMany({
        where,
        include: {
          content: {
            include: {
              activity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error fetching child interactions', { error: error instanceof Error ? error.message : String(error), childId });
      throw error;
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(
    activityId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ContentAnalytics> {
    try {
      const where: Prisma.ContentInteractionWhereInput = {};

      if (activityId) {
        where.content = {
          activityId
        };
      }

      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        };
      }

      // Get basic analytics
      const [totalViews, totalCompletions, interactions] = await Promise.all([
        prisma.contentInteraction.count({
          where: {
            ...where,
            interactionType: 'view'
          }
        }),
        prisma.contentInteraction.count({
          where: {
            ...where,
            interactionType: 'complete'
          }
        }),
        prisma.contentInteraction.findMany({
          where,
          include: {
            content: true
          }
        })
      ]);

      // Calculate average time spent and progress
      const totalTimeSpent = interactions.reduce((sum, interaction) => sum + interaction.timeSpent, 0);
      const totalProgress = interactions.reduce((sum, interaction) => sum + interaction.progressPercentage, 0);
      const averageTimeSpent = interactions.length > 0 ? totalTimeSpent / interactions.length : 0;
      const averageProgressPercentage = interactions.length > 0 ? totalProgress / interactions.length : 0;

      // Get popular content
      const contentStats = new Map<string, {
        contentId: string;
        title: string;
        viewCount: number;
        completionCount: number;
      }>();

      interactions.forEach(interaction => {
        const key = interaction.contentId;
        if (!contentStats.has(key)) {
          contentStats.set(key, {
            contentId: interaction.contentId,
            title: interaction.content.title,
            viewCount: 0,
            completionCount: 0
          });
        }

        const stats = contentStats.get(key)!;
        if (interaction.interactionType === 'view') {
          stats.viewCount++;
        } else if (interaction.interactionType === 'complete') {
          stats.completionCount++;
        }
      });

      const popularContent = Array.from(contentStats.values())
        .map(stats => ({
          ...stats,
          completionRate: stats.viewCount > 0 ? (stats.completionCount / stats.viewCount) * 100 : 0
        }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10);

      return {
        totalViews,
        totalCompletions,
        averageTimeSpent,
        averageProgressPercentage,
        popularContent
      };
    } catch (error) {
      logger.error('Error fetching content analytics', { error: error instanceof Error ? error.message : String(error), activityId });
      throw error;
    }
  }

  /**
   * Get content recommendations for a child
   */
  async getContentRecommendations(
    childId: string,
    limit: number = 10
  ): Promise<StudyContent[]> {
    try {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: {
          contentInteractions: {
            include: {
              content: true
            }
          },
          studyPlans: {
            include: {
              activities: {
                include: {
                  studyContent: true
                }
              }
            }
          }
        }
      });

      if (!child) {
        throw new Error('Child profile not found');
      }

      // Get content that matches child's age and hasn't been completed
      const completedContentIds = child.contentInteractions
        .filter(interaction => interaction.interactionType === 'complete')
        .map(interaction => interaction.contentId);

      const recommendations = await prisma.studyContent.findMany({
        where: {
          AND: [
            { ageAppropriateMin: { lte: child.age } },
            { ageAppropriateMax: { gte: child.age } },
            { safetyRating: 'safe' },
            { id: { notIn: completedContentIds } }
          ]
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          },
          contentInteractions: true
        },
        orderBy: [
          { difficultyLevel: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      logger.info('Content recommendations generated', {
        childId,
        recommendationCount: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Error generating content recommendations', { error: error instanceof Error ? error.message : String(error), childId });
      throw error;
    }
  }

  /**
   * Bulk update content safety ratings
   */
  async bulkUpdateSafetyRatings(
    contentIds: string[],
    safetyRating: 'safe' | 'review_needed' | 'blocked'
  ): Promise<number> {
    try {
      const result = await prisma.studyContent.updateMany({
        where: {
          id: { in: contentIds }
        },
        data: {
          safetyRating
        }
      });

      logger.info('Bulk safety rating update completed', {
        updatedCount: result.count,
        safetyRating
      });

      return result.count;
    } catch (error) {
      logger.error('Error bulk updating safety ratings', { error: error instanceof Error ? error.message : String(error), contentIds, safetyRating });
      throw error;
    }
  }
}

export const contentService = new ContentService();