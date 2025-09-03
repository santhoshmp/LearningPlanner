import { PrismaClient } from '@prisma/client';
import { 
  ReadingResourceMetadata,
  ResourceValidationResult,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationStatus
} from '../types/masterData';

export interface ReadingMaterialData {
  title: string;
  description: string;
  url: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  readingLevel: string;
  wordCount?: number;
  language: string;
  format: 'pdf' | 'html' | 'epub' | 'external';
  thumbnailUrl?: string;
  tags: string[];
  estimatedReadingTime: number; // in minutes
}

export interface ReadingMaterialFilters {
  readingLevel?: string;
  format?: 'pdf' | 'html' | 'epub' | 'external';
  language?: string;
  maxReadingTime?: number;
  minReadingTime?: number;
  author?: string;
  publisher?: string;
  difficulty?: DifficultyLevel;
  safetyRating?: SafetyRating;
}

export interface ReadingMaterialRecommendation {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  author?: string;
  readingLevel: string;
  estimatedReadingTime: number;
  format: string;
  difficulty: DifficultyLevel;
  educationalValue: number;
  ageAppropriate: boolean;
  safetyRating: SafetyRating;
  recommendationReason: string;
  relevanceScore: number;
}

export class ReadingMaterialsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create reading material resource in database
   */
  async createReadingMaterial(
    topicId: string,
    materialData: ReadingMaterialData,
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER,
    ageAppropriate: boolean = true
  ) {
    const metadata: ReadingResourceMetadata = {
      author: materialData.author,
      publisher: materialData.publisher,
      isbn: materialData.isbn,
      readingLevel: materialData.readingLevel,
      wordCount: materialData.wordCount,
      language: materialData.language,
      format: materialData.format
    };

    return await this.prisma.topicResource.create({
      data: {
        topicId,
        type: ResourceType.ARTICLE,
        title: materialData.title,
        description: materialData.description,
        url: materialData.url,
        thumbnailUrl: materialData.thumbnailUrl,
        duration: materialData.estimatedReadingTime,
        difficulty,
        ageAppropriate,
        safetyRating: await this.assessMaterialSafety(materialData),
        source: materialData.publisher || 'Educational Website',
        tags: materialData.tags,
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
   * Get reading materials for a specific topic
   */
  async getReadingMaterialsByTopic(topicId: string, filters?: ReadingMaterialFilters) {
    const where: any = {
      topicId,
      type: ResourceType.ARTICLE,
      isActive: true
    };

    if (filters) {
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.safetyRating) where.safetyRating = filters.safetyRating;
      if (filters.maxReadingTime) where.duration = { lte: filters.maxReadingTime };
      if (filters.minReadingTime) {
        where.duration = { ...where.duration, gte: filters.minReadingTime };
      }
    }

    const materials = await this.prisma.topicResource.findMany({
      where,
      orderBy: [
        { safetyRating: 'asc' }, // SAFE first
        { difficulty: 'asc' },   // Easier first
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

    // Apply metadata-based filters
    if (filters) {
      return materials.filter(material => {
        const metadata = material.metadata as unknown as ReadingResourceMetadata;
        
        if (filters.readingLevel && metadata.readingLevel !== filters.readingLevel) {
          return false;
        }
        if (filters.format && metadata.format !== filters.format) {
          return false;
        }
        if (filters.language && metadata.language !== filters.language) {
          return false;
        }
        if (filters.author && metadata.author && !metadata.author.toLowerCase().includes(filters.author.toLowerCase())) {
          return false;
        }
        if (filters.publisher && metadata.publisher && !metadata.publisher.toLowerCase().includes(filters.publisher.toLowerCase())) {
          return false;
        }
        
        return true;
      });
    }

    return materials;
  }

  /**
   * Discover and recommend reading materials for a topic
   */
  async discoverReadingMaterials(
    topicId: string,
    gradeLevel: string,
    subjectName: string,
    readingLevel?: string
  ): Promise<ReadingMaterialRecommendation[]> {
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

    // Get existing materials first
    const existingMaterials = await this.getReadingMaterialsByTopic(topicId);
    
    const recommendations: ReadingMaterialRecommendation[] = existingMaterials.map(material => {
      const metadata = material.metadata as unknown as ReadingResourceMetadata;
      return {
        id: material.id,
        title: material.title,
        description: material.description || '',
        url: material.url,
        thumbnailUrl: material.thumbnailUrl || undefined,
        author: metadata.author,
        readingLevel: metadata.readingLevel,
        estimatedReadingTime: material.duration || 0,
        format: metadata.format,
        difficulty: material.difficulty,
        educationalValue: 0.9, // High for curated content
        ageAppropriate: material.ageAppropriate,
        safetyRating: material.safetyRating,
        recommendationReason: 'Curated educational content',
        relevanceScore: 0.95
      };
    });

    // If we have enough curated content, return it
    if (recommendations.length >= 5) {
      return recommendations.slice(0, 15);
    }

    // Otherwise, we would discover new content from educational websites
    // For now, return the existing curated content
    return recommendations;
  }

  /**
   * Get personalized reading material recommendations
   */
  async getReadingRecommendations(
    topicId: string,
    childAge: number,
    readingLevel?: string,
    preferredFormats?: string[]
  ): Promise<ReadingMaterialRecommendation[]> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        grade: true,
        subject: true,
        resources: {
          where: {
            type: ResourceType.ARTICLE,
            isActive: true,
            safetyRating: SafetyRating.SAFE
          }
        }
      }
    });

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Convert existing resources to recommendations
    let recommendations = topic.resources.map(resource => {
      const metadata = resource.metadata as unknown as ReadingResourceMetadata;
      return {
        id: resource.id,
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        thumbnailUrl: resource.thumbnailUrl || undefined,
        author: metadata.author,
        readingLevel: metadata.readingLevel,
        estimatedReadingTime: resource.duration || 0,
        format: metadata.format,
        difficulty: resource.difficulty,
        educationalValue: this.calculateEducationalValue(resource, metadata),
        ageAppropriate: resource.ageAppropriate,
        safetyRating: resource.safetyRating,
        recommendationReason: this.generateRecommendationReason(resource, metadata, childAge),
        relevanceScore: this.calculateRelevanceScore(resource, topic, childAge)
      };
    });

    // Filter by reading level if specified
    if (readingLevel) {
      recommendations = recommendations.filter(rec => 
        rec.readingLevel === readingLevel || this.isCompatibleReadingLevel(rec.readingLevel, readingLevel)
      );
    }

    // Filter by preferred formats if specified
    if (preferredFormats && preferredFormats.length > 0) {
      recommendations = recommendations.filter(rec => 
        preferredFormats.includes(rec.format)
      );
    }

    // Sort by relevance and educational value
    recommendations.sort((a, b) => 
      (b.relevanceScore + b.educationalValue) - (a.relevanceScore + a.educationalValue)
    );

    return recommendations.slice(0, 15);
  }

  /**
   * Validate reading material resource
   */
  async validateReadingMaterial(resourceId: string): Promise<ResourceValidationResult> {
    const resource = await this.prisma.topicResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    const startTime = Date.now();
    let validationResult: ResourceValidationResult;

    try {
      // Check if URL is accessible
      const isAccessible = await this.checkUrlAccessibility(resource.url);
      
      if (!isAccessible) {
        throw new Error('Resource URL is not accessible');
      }

      // Update resource validation status
      await this.prisma.topicResource.update({
        where: { id: resourceId },
        data: {
          validationStatus: ValidationStatus.VALIDATED,
          lastValidated: new Date()
        }
      });

      validationResult = {
        isValid: true,
        status: ValidationStatus.VALIDATED,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      // Mark resource as broken
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
   * Bulk validate all reading materials
   */
  async validateAllReadingMaterials(): Promise<{
    total: number;
    validated: number;
    broken: number;
    errors: string[];
  }> {
    const readingMaterials = await this.prisma.topicResource.findMany({
      where: {
        type: ResourceType.ARTICLE,
        isActive: true
      }
    });

    const results = {
      total: readingMaterials.length,
      validated: 0,
      broken: 0,
      errors: [] as string[]
    };

    for (const resource of readingMaterials) {
      try {
        const validation = await this.validateReadingMaterial(resource.id);
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
   * Get reading materials statistics
   */
  async getReadingMaterialsStats() {
    const stats = await this.prisma.topicResource.groupBy({
      by: ['safetyRating', 'validationStatus', 'difficulty'],
      where: {
        type: ResourceType.ARTICLE
      },
      _count: {
        id: true
      }
    });

    const totalMaterials = await this.prisma.topicResource.count({
      where: {
        type: ResourceType.ARTICLE
      }
    });

    const activeMaterials = await this.prisma.topicResource.count({
      where: {
        type: ResourceType.ARTICLE,
        isActive: true
      }
    });

    const safeMaterials = await this.prisma.topicResource.count({
      where: {
        type: ResourceType.ARTICLE,
        safetyRating: SafetyRating.SAFE
      }
    });

    return {
      total: totalMaterials,
      active: activeMaterials,
      safe: safeMaterials,
      breakdown: stats,
      safetyPercentage: totalMaterials > 0 ? Math.round((safeMaterials / totalMaterials) * 100) : 0
    };
  }

  /**
   * Private helper methods
   */
  private async assessMaterialSafety(materialData: ReadingMaterialData): Promise<SafetyRating> {
    // Implement safety assessment logic for reading materials
    const safetyIndicators = {
      hasEducationalKeywords: this.hasEducationalKeywords(materialData.title, materialData.description),
      isFromTrustedSource: this.isTrustedEducationalSource(materialData.url, materialData.publisher),
      hasAppropriateLength: this.hasAppropriateLength(materialData.estimatedReadingTime),
      hasAuthorInfo: !!materialData.author,
      hasPublisherInfo: !!materialData.publisher
    };

    const safetyScore = Object.values(safetyIndicators).filter(Boolean).length / Object.keys(safetyIndicators).length;

    if (safetyScore >= 0.8) return SafetyRating.SAFE;
    if (safetyScore >= 0.6) return SafetyRating.REVIEW_NEEDED;
    return SafetyRating.RESTRICTED;
  }

  private hasEducationalKeywords(title: string, description: string): boolean {
    const educationalKeywords = [
      'learn', 'education', 'lesson', 'tutorial', 'guide', 'study', 'textbook',
      'curriculum', 'academic', 'school', 'student', 'teacher', 'instruction'
    ];

    const text = `${title} ${description}`.toLowerCase();
    return educationalKeywords.some(keyword => text.includes(keyword));
  }

  private isTrustedEducationalSource(url: string, publisher?: string): boolean {
    const trustedDomains = [
      'khanacademy.org', 'scholastic.com', 'nationalgeographic.org',
      'smithsonian.org', 'britannica.com', 'education.com', 'readworks.org',
      'commonlit.org', 'newsela.com', 'epic.com', 'raz-kids.com'
    ];

    const trustedPublishers = [
      'scholastic', 'national geographic', 'smithsonian', 'britannica',
      'pearson', 'mcgraw-hill', 'houghton mifflin', 'cambridge'
    ];

    const domain = new URL(url).hostname.toLowerCase();
    const publisherName = publisher?.toLowerCase() || '';

    return trustedDomains.some(trusted => domain.includes(trusted)) ||
           trustedPublishers.some(trusted => publisherName.includes(trusted));
  }

  private hasAppropriateLength(readingTime: number): boolean {
    // Reading materials should be between 2-45 minutes for educational content
    return readingTime >= 2 && readingTime <= 45;
  }

  private calculateEducationalValue(resource: any, metadata: ReadingResourceMetadata): number {
    let score = 0;

    // Check for educational indicators
    if (this.hasEducationalKeywords(resource.title, resource.description || '')) score += 0.3;
    if (this.isTrustedEducationalSource(resource.url, metadata.publisher)) score += 0.3;
    if (metadata.author) score += 0.2;
    if (metadata.publisher) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateRelevanceScore(resource: any, topic: any, childAge: number): number {
    let score = 0.8; // Base score for curated content

    // Age appropriateness
    if (childAge >= topic.grade.ageMin && childAge <= topic.grade.ageMax) {
      score += 0.1;
    }

    // Resource quality indicators
    const metadata = resource.metadata as unknown as ReadingResourceMetadata;
    if (metadata.author) score += 0.05;
    if (metadata.publisher) score += 0.05;

    return Math.min(score, 1.0);
  }

  private generateRecommendationReason(resource: any, metadata: ReadingResourceMetadata, childAge: number): string {
    const reasons: string[] = [];

    if (this.isTrustedEducationalSource(resource.url, metadata.publisher)) {
      reasons.push('from trusted educational source');
    }
    if (metadata.author) {
      reasons.push('authored content');
    }
    if (metadata.readingLevel) {
      reasons.push(`appropriate reading level (${metadata.readingLevel})`);
    }

    if (reasons.length === 0) {
      return 'Educational reading material';
    }

    return `Quality educational content ${reasons.join(', ')}`;
  }

  private isCompatibleReadingLevel(materialLevel: string, targetLevel: string): boolean {
    // Simple reading level compatibility check
    const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced'];
    const materialIndex = levelOrder.indexOf(materialLevel.toLowerCase());
    const targetIndex = levelOrder.indexOf(targetLevel.toLowerCase());

    // Allow materials within 1 level of target
    return Math.abs(materialIndex - targetIndex) <= 1;
  }

  private async checkUrlAccessibility(url: string): Promise<boolean> {
    // This would implement actual URL checking
    // For now, return true for mock implementation
    console.log('URL accessibility check would be performed for:', url);
    return true;
  }
}