import { PrismaClient } from '@prisma/client';
import { 
  YouTubeResourceMetadata,
  ResourceValidationResult,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationStatus
} from '../types/masterData';

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  publishedAt: string;
  duration: number; // in minutes
  thumbnailUrl: string;
  viewCount?: number;
  likeCount?: number;
  tags: string[];
  categoryId: string;
  defaultLanguage?: string;
  closedCaptions: boolean;
}

export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  duration?: 'short' | 'medium' | 'long';
  safeSearch?: 'moderate' | 'strict';
  relevanceLanguage?: string;
  publishedAfter?: string;
  publishedBefore?: string;
}

export interface YouTubeResourceRecommendation {
  videoId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  channelName: string;
  relevanceScore: number;
  educationalValue: number;
  ageAppropriate: boolean;
  safetyRating: SafetyRating;
  recommendationReason: string;
}

export class YouTubeResourceService {
  private prisma: PrismaClient;
  private apiKey?: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  /**
   * Create YouTube video resource in database
   */
  async createYouTubeResource(
    topicId: string,
    videoData: YouTubeVideoData,
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER,
    ageAppropriate: boolean = true
  ) {
    const metadata: YouTubeResourceMetadata = {
      videoId: videoData.videoId,
      channelName: videoData.channelName,
      publishedAt: videoData.publishedAt,
      viewCount: videoData.viewCount,
      likeCount: videoData.likeCount,
      closedCaptions: videoData.closedCaptions
    };

    return await this.prisma.topicResource.create({
      data: {
        topicId,
        type: ResourceType.VIDEO,
        title: videoData.title,
        description: videoData.description,
        url: `https://www.youtube.com/watch?v=${videoData.videoId}`,
        thumbnailUrl: videoData.thumbnailUrl,
        duration: videoData.duration,
        difficulty,
        ageAppropriate,
        safetyRating: await this.assessVideoSafety(videoData),
        source: 'YouTube',
        tags: videoData.tags,
        metadata: metadata as any,
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
  }

  /**
   * Get YouTube videos for a specific topic
   */
  async getYouTubeVideosByTopic(topicId: string, filters?: {
    difficulty?: DifficultyLevel;
    maxDuration?: number;
    safetyRating?: SafetyRating;
    limit?: number;
  }) {
    const where: any = {
      topicId,
      type: ResourceType.VIDEO,
      isActive: true,
      url: {
        contains: 'youtube.com'
      }
    };

    if (filters) {
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.maxDuration) where.duration = { lte: filters.maxDuration };
      if (filters.safetyRating) where.safetyRating = filters.safetyRating;
    }

    return await this.prisma.topicResource.findMany({
      where,
      orderBy: [
        { safetyRating: 'asc' }, // SAFE first
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: filters?.limit || 20,
      include: {
        topic: {
          include: {
            grade: true,
            subject: true
          }
        }
      }
    });
  }

  /**
   * Discover and recommend YouTube videos for a topic
   */
  async discoverVideosForTopic(
    topicId: string,
    gradeLevel: string,
    subjectName: string
  ): Promise<YouTubeResourceRecommendation[]> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        grade: true,
        subject: true
      }
    });

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Generate search queries based on topic and grade
    const searchQueries = this.generateSearchQueries(topic.displayName, gradeLevel, subjectName);
    const recommendations: YouTubeResourceRecommendation[] = [];

    for (const query of searchQueries) {
      try {
        const videos = await this.searchYouTubeVideos({
          query,
          maxResults: 10,
          duration: 'medium',
          safeSearch: 'strict'
        });

        for (const video of videos) {
          const recommendation = await this.evaluateVideoForEducation(video, topic);
          if (recommendation && recommendation.educationalValue >= 0.6) {
            recommendations.push(recommendation);
          }
        }
      } catch (error) {
        console.error(`Error searching for videos with query "${query}":`, error);
      }
    }

    // Sort by relevance and educational value
    return recommendations
      .sort((a, b) => (b.relevanceScore + b.educationalValue) - (a.relevanceScore + a.educationalValue))
      .slice(0, 15); // Return top 15 recommendations
  }

  /**
   * Validate YouTube video resources
   */
  async validateYouTubeResource(resourceId: string): Promise<ResourceValidationResult> {
    const resource = await this.prisma.topicResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    const startTime = Date.now();
    let validationResult: ResourceValidationResult;

    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(resource.url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }

      // Check if video exists and is accessible
      const videoData = await this.getVideoDetails(videoId);
      if (!videoData) {
        throw new Error('Video not found or not accessible');
      }

      // Update resource with latest data
      await this.prisma.topicResource.update({
        where: { id: resourceId },
        data: {
          validationStatus: ValidationStatus.VALIDATED,
          lastValidated: new Date(),
          title: videoData.title,
          description: videoData.description,
          duration: videoData.duration,
          thumbnailUrl: videoData.thumbnailUrl,
          metadata: {
            ...resource.metadata as any,
            viewCount: videoData.viewCount,
            likeCount: videoData.likeCount
          }
        }
      });

      validationResult = {
        isValid: true,
        status: ValidationStatus.VALIDATED,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      // Mark resource as needing update or broken
      await this.prisma.topicResource.update({
        where: { id: resourceId },
        data: {
          validationStatus: ValidationStatus.BROKEN,
          lastValidated: new Date()
        }
      });

      validationResult = {
        isValid: false,
        status: ValidationStatus.BROKEN,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return validationResult;
  }

  /**
   * Bulk validate all YouTube resources
   */
  async validateAllYouTubeResources(): Promise<{
    total: number;
    validated: number;
    broken: number;
    errors: string[];
  }> {
    const youtubeResources = await this.prisma.topicResource.findMany({
      where: {
        type: ResourceType.VIDEO,
        url: {
          contains: 'youtube.com'
        },
        isActive: true
      }
    });

    const results = {
      total: youtubeResources.length,
      validated: 0,
      broken: 0,
      errors: [] as string[]
    };

    for (const resource of youtubeResources) {
      try {
        const validation = await this.validateYouTubeResource(resource.id);
        if (validation.isValid) {
          results.validated++;
        } else {
          results.broken++;
          if (validation.errorMessage) {
            results.errors.push(`${resource.title}: ${validation.errorMessage}`);
          }
        }
      } catch (error) {
        results.broken++;
        results.errors.push(`${resource.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get video recommendations based on topic and grade
   */
  async getVideoRecommendations(
    topicId: string,
    childAge: number,
    learningStyle?: string
  ): Promise<YouTubeResourceRecommendation[]> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        grade: true,
        subject: true,
        resources: {
          where: {
            type: ResourceType.VIDEO,
            isActive: true,
            safetyRating: SafetyRating.SAFE
          }
        }
      }
    });

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Get existing resources
    const existingRecommendations = topic.resources.map(resource => {
      const metadata = resource.metadata as unknown as YouTubeResourceMetadata;
      return {
        videoId: metadata.videoId,
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        thumbnailUrl: resource.thumbnailUrl || '',
        duration: resource.duration || 0,
        channelName: metadata.channelName,
        relevanceScore: 0.8, // High for curated content
        educationalValue: 0.9, // High for curated content
        ageAppropriate: resource.ageAppropriate,
        safetyRating: resource.safetyRating,
        recommendationReason: 'Curated educational content'
      };
    });

    // If we have enough curated content, return it
    if (existingRecommendations.length >= 5) {
      return existingRecommendations.slice(0, 10);
    }

    // Otherwise, discover new content
    const discoveredRecommendations = await this.discoverVideosForTopic(
      topicId,
      topic.grade.grade,
      topic.subject.name
    );

    // Combine and deduplicate
    const allRecommendations = [...existingRecommendations, ...discoveredRecommendations];
    const uniqueRecommendations = allRecommendations.filter((rec, index, self) =>
      index === self.findIndex(r => r.videoId === rec.videoId)
    );

    return uniqueRecommendations.slice(0, 15);
  }

  /**
   * Private helper methods
   */
  private generateSearchQueries(topicName: string, gradeLevel: string, subjectName: string): string[] {
    const queries = [
      `${topicName} ${gradeLevel} grade education`,
      `${topicName} kids learning ${subjectName}`,
      `${topicName} elementary school lesson`,
      `learn ${topicName} children`,
      `${topicName} educational video kids`
    ];

    // Add grade-specific variations
    if (gradeLevel === 'K') {
      queries.push(`${topicName} kindergarten`, `${topicName} preschool`);
    } else if (parseInt(gradeLevel) <= 5) {
      queries.push(`${topicName} elementary`, `${topicName} primary school`);
    } else if (parseInt(gradeLevel) <= 8) {
      queries.push(`${topicName} middle school`, `${topicName} junior high`);
    } else {
      queries.push(`${topicName} high school`, `${topicName} secondary`);
    }

    return queries;
  }

  private async searchYouTubeVideos(params: YouTubeSearchParams): Promise<YouTubeVideoData[]> {
    // This would integrate with YouTube Data API v3
    // For now, return mock data structure
    console.log('YouTube API search would be called with:', params);
    
    // Mock implementation - in real implementation, this would call YouTube API
    return [];
  }

  private async getVideoDetails(videoId: string): Promise<YouTubeVideoData | null> {
    // This would call YouTube Data API to get video details
    // For now, return null to indicate video checking
    console.log('YouTube API video details would be fetched for:', videoId);
    return null;
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private async assessVideoSafety(videoData: YouTubeVideoData): Promise<SafetyRating> {
    // Implement safety assessment logic
    // This would analyze title, description, tags, channel reputation, etc.
    
    const safetyIndicators = {
      hasEducationalKeywords: this.hasEducationalKeywords(videoData.title, videoData.description),
      isFromEducationalChannel: this.isEducationalChannel(videoData.channelName),
      hasAppropriateLength: videoData.duration >= 2 && videoData.duration <= 30,
      hasClosedCaptions: videoData.closedCaptions,
      hasReasonableViews: (videoData.viewCount || 0) > 100
    };

    const safetyScore = Object.values(safetyIndicators).filter(Boolean).length / Object.keys(safetyIndicators).length;

    if (safetyScore >= 0.8) return SafetyRating.SAFE;
    if (safetyScore >= 0.6) return SafetyRating.REVIEW_NEEDED;
    return SafetyRating.RESTRICTED;
  }

  private hasEducationalKeywords(title: string, description: string): boolean {
    const educationalKeywords = [
      'learn', 'education', 'lesson', 'tutorial', 'teach', 'school', 'study',
      'math', 'science', 'reading', 'writing', 'history', 'geography',
      'kids', 'children', 'student', 'grade', 'elementary', 'middle school'
    ];

    const text = `${title} ${description}`.toLowerCase();
    return educationalKeywords.some(keyword => text.includes(keyword));
  }

  private isEducationalChannel(channelName: string): boolean {
    const educationalChannels = [
      'khan academy', 'crash course', 'ted-ed', 'national geographic kids',
      'brain pump', 'simple learning', 'educational', 'learning', 'academy'
    ];

    const name = channelName.toLowerCase();
    return educationalChannels.some(channel => name.includes(channel));
  }

  private async evaluateVideoForEducation(
    videoData: YouTubeVideoData,
    topic: any
  ): Promise<YouTubeResourceRecommendation | null> {
    // Evaluate video's educational value and relevance
    const relevanceScore = this.calculateRelevanceScore(videoData, topic);
    const educationalValue = this.calculateEducationalValue(videoData);
    const ageAppropriate = this.isAgeAppropriate(videoData, topic.grade.ageMin, topic.grade.ageMax);
    const safetyRating = await this.assessVideoSafety(videoData);

    if (relevanceScore < 0.5 || educationalValue < 0.5 || !ageAppropriate) {
      return null;
    }

    return {
      videoId: videoData.videoId,
      title: videoData.title,
      description: videoData.description,
      url: `https://www.youtube.com/watch?v=${videoData.videoId}`,
      thumbnailUrl: videoData.thumbnailUrl,
      duration: videoData.duration,
      channelName: videoData.channelName,
      relevanceScore,
      educationalValue,
      ageAppropriate,
      safetyRating,
      recommendationReason: this.generateRecommendationReason(relevanceScore, educationalValue)
    };
  }

  private calculateRelevanceScore(videoData: YouTubeVideoData, topic: any): number {
    const topicKeywords = topic.displayName.toLowerCase().split(' ');
    const videoText = `${videoData.title} ${videoData.description}`.toLowerCase();
    
    const matchingKeywords = topicKeywords.filter(keyword => videoText.includes(keyword));
    return matchingKeywords.length / topicKeywords.length;
  }

  private calculateEducationalValue(videoData: YouTubeVideoData): number {
    let score = 0;

    // Check for educational indicators
    if (this.hasEducationalKeywords(videoData.title, videoData.description)) score += 0.3;
    if (this.isEducationalChannel(videoData.channelName)) score += 0.3;
    if (videoData.closedCaptions) score += 0.2;
    if (videoData.duration >= 3 && videoData.duration <= 20) score += 0.2; // Appropriate length

    return Math.min(score, 1.0);
  }

  private isAgeAppropriate(videoData: YouTubeVideoData, minAge: number, maxAge: number): boolean {
    // Simple age appropriateness check based on content indicators
    const text = `${videoData.title} ${videoData.description}`.toLowerCase();
    
    // Check for inappropriate content indicators
    const inappropriateKeywords = ['violent', 'scary', 'adult', 'mature', 'explicit'];
    if (inappropriateKeywords.some(keyword => text.includes(keyword))) {
      return false;
    }

    // Check for age-appropriate indicators
    if (minAge <= 8) {
      const youngKeywords = ['kids', 'children', 'preschool', 'kindergarten', 'elementary'];
      return youngKeywords.some(keyword => text.includes(keyword));
    }

    return true; // Default to appropriate for older children
  }

  private generateRecommendationReason(relevanceScore: number, educationalValue: number): string {
    if (relevanceScore >= 0.8 && educationalValue >= 0.8) {
      return 'Highly relevant educational content from trusted source';
    } else if (relevanceScore >= 0.7) {
      return 'Good topic match with educational value';
    } else if (educationalValue >= 0.7) {
      return 'Quality educational content';
    } else {
      return 'Relevant learning material';
    }
  }
}