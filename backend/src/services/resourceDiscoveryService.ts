import { PrismaClient } from '@prisma/client';
import { redisService } from './redisService';
import {
  MasterDataResource,
  ResourceFilters,
  ResourceType,
  DifficultyLevel,
  SafetyRating,
  ResourceRecommendation,
  ResourceMetadata,
  ResourceUsageAnalytics,
  LearningPattern,
  UserPreferences
} from '../types/masterData';

export class ResourceDiscoveryService {
  private prisma: PrismaClient;
  private cacheConfig = {
    resourceTTL: 900, // 15 minutes
    recommendationTTL: 1800, // 30 minutes
    analyticsTTL: 3600 // 1 hour
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Resource Retrieval with Advanced Filtering
  async getResourcesByFilters(filters: ResourceFilters): Promise<MasterDataResource[]> {
    const cacheKey = this.getCacheKey('resources-filtered', JSON.stringify(filters));
    
    // Try cache first
    const cached = await this.getCachedData<MasterDataResource[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build dynamic where clause
    const where: any = {
      isActive: true
    };

    if (filters.grade) {
      where.topic = {
        grade: {
          grade: filters.grade
        }
      };
    }

    if (filters.subject) {
      where.topic = {
        ...where.topic,
        subjectId: filters.subject
      };
    }

    if (filters.resourceType) {
      where.type = filters.resourceType;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.safetyRating) {
      where.safetyRating = filters.safetyRating;
    }

    if (filters.minDuration || filters.maxDuration) {
      where.duration = {};
      if (filters.minDuration) where.duration.gte = filters.minDuration;
      if (filters.maxDuration) where.duration.lte = filters.maxDuration;
    }

    if (filters.source) {
      where.source = {
        contains: filters.source,
        mode: 'insensitive'
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    // Fetch from database
    const resources = await this.prisma.topicResource.findMany({
      where,
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

    // Cache the result
    await this.setCachedData(cacheKey, resources, this.cacheConfig.resourceTTL);
    
    return resources;
  }

  // Resource Recommendation Engine
  async getResourceRecommendations(
    childId: string,
    topicId: string,
    limit: number = 10
  ): Promise<ResourceRecommendation[]> {
    const cacheKey = this.getCacheKey('recommendations', `${childId}-${topicId}-${limit}`);
    
    // Try cache first
    const cached = await this.getCachedData<ResourceRecommendation[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get child's learning patterns and preferences
    const learningPattern = await this.getLearningPattern(childId);
    const preferences = await this.getUserPreferences(childId);
    
    // Get topic resources
    const resources = await this.prisma.topicResource.findMany({
      where: {
        topicId,
        isActive: true,
        safetyRating: SafetyRating.SAFE
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

    // Score and rank resources
    const recommendations = await this.scoreResources(resources, learningPattern, preferences);
    
    // Sort by score and limit results
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache the result
    await this.setCachedData(cacheKey, sortedRecommendations, this.cacheConfig.recommendationTTL);
    
    return sortedRecommendations;
  }

  // Resource Metadata Enrichment
  async enrichResourceMetadata(resourceId: string): Promise<ResourceMetadata> {
    const cacheKey = this.getCacheKey('metadata', resourceId);
    
    // Try cache first
    const cached = await this.getCachedData<ResourceMetadata>(cacheKey);
    if (cached) {
      return cached;
    }

    const resource = await this.prisma.topicResource.findUnique({
      where: { id: resourceId },
      include: {
        topic: {
          include: {
            grade: true,
            subject: true
          }
        }
      }
    });

    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Enrich metadata based on resource type
    let enrichedMetadata: ResourceMetadata = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      difficulty: resource.difficulty,
      safetyRating: resource.safetyRating,
      tags: resource.tags,
      source: resource.source,
      lastValidated: resource.lastValidated,
      topic: {
        id: resource.topic.id,
        name: resource.topic.name,
        grade: resource.topic.grade.grade,
        subject: resource.topic.subject.name
      }
    };

    // Add type-specific metadata
    if (resource.type === ResourceType.VIDEO) {
      enrichedMetadata = await this.enrichVideoMetadata(enrichedMetadata, resource);
    } else if (resource.type === ResourceType.ARTICLE) {
      enrichedMetadata = await this.enrichReadingMetadata(enrichedMetadata, resource);
    }

    // Add usage analytics
    enrichedMetadata.analytics = await this.getResourceAnalytics(resourceId);

    // Cache the result
    await this.setCachedData(cacheKey, enrichedMetadata, this.cacheConfig.resourceTTL);
    
    return enrichedMetadata;
  }

  // Resource Usage Tracking
  async trackResourceUsage(
    childId: string,
    resourceId: string,
    action: 'view' | 'complete' | 'bookmark' | 'share',
    duration?: number
  ): Promise<void> {
    // Record usage in database
    await this.prisma.resourceUsage.create({
      data: {
        childId,
        resourceId,
        action,
        duration,
        timestamp: new Date()
      }
    });

    // Update cached analytics
    await this.invalidateResourceAnalytics(resourceId);
    
    // Update learning pattern
    await this.updateLearningPattern(childId, resourceId, action, duration);
  }

  // Resource Analytics
  async getResourceAnalytics(resourceId: string): Promise<ResourceUsageAnalytics> {
    const cacheKey = this.getCacheKey('analytics', resourceId);
    
    // Try cache first
    const cached = await this.getCachedData<ResourceUsageAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate analytics from database
    const [totalViews, totalCompletions, averageDuration, uniqueUsers] = await Promise.all([
      this.prisma.resourceUsage.count({
        where: { resourceId, action: 'view' }
      }),
      this.prisma.resourceUsage.count({
        where: { resourceId, action: 'complete' }
      }),
      this.prisma.resourceUsage.aggregate({
        where: { resourceId, duration: { not: null } },
        _avg: { duration: true }
      }),
      this.prisma.resourceUsage.findMany({
        where: { resourceId },
        distinct: ['childId'],
        select: { childId: true }
      })
    ]);

    const analytics: ResourceUsageAnalytics = {
      resourceId,
      totalViews,
      totalCompletions,
      completionRate: totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0,
      averageDuration: averageDuration._avg.duration || 0,
      uniqueUsers: uniqueUsers.length,
      lastUpdated: new Date()
    };

    // Cache the result
    await this.setCachedData(cacheKey, analytics, this.cacheConfig.analyticsTTL);
    
    return analytics;
  }

  // Private helper methods
  private async getLearningPattern(childId: string): Promise<LearningPattern> {
    // Get child's historical learning data
    const usageHistory = await this.prisma.resourceUsage.findMany({
      where: { childId },
      include: {
        resource: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100 // Last 100 interactions
    });

    // Analyze patterns
    const resourceTypePreferences = this.analyzeResourceTypePreferences(usageHistory);
    const difficultyPreferences = this.analyzeDifficultyPreferences(usageHistory);
    const subjectEngagement = this.analyzeSubjectEngagement(usageHistory);
    const timePatterns = this.analyzeTimePatterns(usageHistory);

    return {
      childId,
      resourceTypePreferences,
      difficultyPreferences,
      subjectEngagement,
      timePatterns,
      lastUpdated: new Date()
    };
  }

  private async getUserPreferences(childId: string): Promise<UserPreferences> {
    // Get explicit preferences from child settings
    const childSettings = await this.prisma.childSettings.findUnique({
      where: { childId }
    });

    return {
      childId,
      preferredResourceTypes: childSettings?.preferredResourceTypes || [],
      preferredDifficulty: childSettings?.preferredDifficulty || DifficultyLevel.BEGINNER,
      maxDuration: childSettings?.maxResourceDuration || 30,
      safetyLevel: childSettings?.safetyLevel || SafetyRating.SAFE,
      languages: childSettings?.preferredLanguages || ['en'],
      lastUpdated: new Date()
    };
  }

  private async scoreResources(
    resources: any[],
    learningPattern: LearningPattern,
    preferences: UserPreferences
  ): Promise<ResourceRecommendation[]> {
    return resources.map(resource => {
      let score = 0;

      // Base score
      score += 50;

      // Resource type preference
      const typePreference = learningPattern.resourceTypePreferences[resource.type] || 0;
      score += typePreference * 20;

      // Difficulty matching
      if (resource.difficulty === preferences.preferredDifficulty) {
        score += 15;
      } else {
        // Penalize if too far from preferred difficulty
        const difficultyGap = Math.abs(
          this.getDifficultyLevel(resource.difficulty) - 
          this.getDifficultyLevel(preferences.preferredDifficulty)
        );
        score -= difficultyGap * 5;
      }

      // Duration preference
      if (resource.duration && resource.duration <= preferences.maxDuration) {
        score += 10;
      } else if (resource.duration && resource.duration > preferences.maxDuration * 1.5) {
        score -= 15;
      }

      // Safety rating
      if (resource.safetyRating === preferences.safetyLevel) {
        score += 10;
      }

      // Subject engagement
      const subjectEngagement = learningPattern.subjectEngagement[resource.topic.subject.name] || 0;
      score += subjectEngagement * 10;

      // Recency bonus for newer resources
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated < 30) {
        score += Math.max(0, 10 - daysSinceCreated / 3);
      }

      return {
        resource,
        score: Math.max(0, Math.min(100, score)),
        reasons: this.generateRecommendationReasons(resource, learningPattern, preferences)
      };
    });
  }

  private getDifficultyLevel(difficulty: DifficultyLevel): number {
    const levels = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 4
    };
    return levels[difficulty] || 1;
  }

  private analyzeResourceTypePreferences(usageHistory: any[]): Record<ResourceType, number> {
    const typeCounts: Record<string, number> = {};
    const totalUsage = usageHistory.length;

    usageHistory.forEach(usage => {
      const type = usage.resource.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Convert to preferences (0-1 scale)
    const preferences: Record<ResourceType, number> = {} as any;
    Object.keys(typeCounts).forEach(type => {
      preferences[type as ResourceType] = typeCounts[type] / totalUsage;
    });

    return preferences;
  }

  private analyzeDifficultyPreferences(usageHistory: any[]): Record<DifficultyLevel, number> {
    const difficultyCounts: Record<string, number> = {};
    const totalUsage = usageHistory.length;

    usageHistory.forEach(usage => {
      const difficulty = usage.resource.difficulty;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });

    // Convert to preferences (0-1 scale)
    const preferences: Record<DifficultyLevel, number> = {} as any;
    Object.keys(difficultyCounts).forEach(difficulty => {
      preferences[difficulty as DifficultyLevel] = difficultyCounts[difficulty] / totalUsage;
    });

    return preferences;
  }

  private analyzeSubjectEngagement(usageHistory: any[]): Record<string, number> {
    const subjectCounts: Record<string, number> = {};
    const totalUsage = usageHistory.length;

    usageHistory.forEach(usage => {
      const subject = usage.resource.topic.subject.name;
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    // Convert to engagement scores (0-1 scale)
    const engagement: Record<string, number> = {};
    Object.keys(subjectCounts).forEach(subject => {
      engagement[subject] = subjectCounts[subject] / totalUsage;
    });

    return engagement;
  }

  private analyzeTimePatterns(usageHistory: any[]): any {
    // Analyze when the child is most active
    const hourCounts: Record<number, number> = {};
    
    usageHistory.forEach(usage => {
      const hour = new Date(usage.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return {
      peakHours: Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour)),
      totalSessions: usageHistory.length
    };
  }

  private generateRecommendationReasons(
    resource: any,
    learningPattern: LearningPattern,
    preferences: UserPreferences
  ): string[] {
    const reasons: string[] = [];

    // Check resource type preference
    const typePreference = learningPattern.resourceTypePreferences[resource.type];
    if (typePreference > 0.3) {
      reasons.push(`You enjoy ${resource.type.toLowerCase()} resources`);
    }

    // Check difficulty match
    if (resource.difficulty === preferences.preferredDifficulty) {
      reasons.push(`Matches your preferred difficulty level`);
    }

    // Check duration
    if (resource.duration && resource.duration <= preferences.maxDuration) {
      reasons.push(`Perfect length for your attention span`);
    }

    // Check subject engagement
    const subjectEngagement = learningPattern.subjectEngagement[resource.topic.subject.name];
    if (subjectEngagement > 0.2) {
      reasons.push(`You're engaged with ${resource.topic.subject.name}`);
    }

    // Check if it's new content
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated < 7) {
      reasons.push('Recently added content');
    }

    return reasons;
  }

  private async enrichVideoMetadata(metadata: ResourceMetadata, resource: any): Promise<ResourceMetadata> {
    // Extract video ID from URL if it's a YouTube video
    if (resource.url.includes('youtube.com') || resource.url.includes('youtu.be')) {
      const videoId = this.extractYouTubeVideoId(resource.url);
      if (videoId) {
        metadata.videoMetadata = {
          videoId,
          platform: 'youtube',
          hasClosedCaptions: resource.closedCaptions || false
        };
      }
    }

    return metadata;
  }

  private async enrichReadingMetadata(metadata: ResourceMetadata, resource: any): Promise<ResourceMetadata> {
    // Add reading-specific metadata
    metadata.readingMetadata = {
      estimatedReadingTime: this.calculateReadingTime(resource.description),
      readingLevel: resource.readingLevel || 'grade-appropriate'
    };

    return metadata;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private calculateReadingTime(text: string): number {
    // Assume average reading speed of 200 words per minute
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  private async updateLearningPattern(
    childId: string,
    resourceId: string,
    action: string,
    duration?: number
  ): Promise<void> {
    // Invalidate cached learning pattern to force refresh
    const cacheKey = this.getCacheKey('learning-pattern', childId);
    await redisService.del(cacheKey);
  }

  private async invalidateResourceAnalytics(resourceId: string): Promise<void> {
    const cacheKey = this.getCacheKey('analytics', resourceId);
    await redisService.del(cacheKey);
  }

  // Cache utilities
  private getCacheKey(type: string, identifier?: string): string {
    return identifier ? `resource-discovery:${type}:${identifier}` : `resource-discovery:${type}:all`;
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      return await redisService.getCacheObject<T>(key);
    } catch (error) {
      console.warn(`Cache retrieval failed for key ${key}:`, error);
      return null;
    }
  }

  private async setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await redisService.setCacheObject(key, data, ttl);
    } catch (error) {
      console.warn(`Cache storage failed for key ${key}:`, error);
    }
  }
}