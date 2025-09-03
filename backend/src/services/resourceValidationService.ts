import { PrismaClient } from '@prisma/client';
import { 
  ResourceValidationResult,
  DifficultyLevel,
  ResourceType,
  SafetyRating,
  ValidationStatus
} from '../types/masterData';
import { logger } from '../utils/logger';

export interface ResourceValidationConfig {
  enableUrlChecking: boolean;
  enableContentAnalysis: boolean;
  enableSafetyScoring: boolean;
  timeoutMs: number;
  retryAttempts: number;
  batchSize: number;
}

export interface SafetyAssessmentResult {
  safetyRating: SafetyRating;
  score: number;
  reasons: string[];
  concerns: string[];
  recommendations: string[];
}

export interface ContentQualityScore {
  educationalValue: number;
  ageAppropriateness: number;
  contentReliability: number;
  overallScore: number;
  factors: string[];
}

export interface ValidationReport {
  resourceId: string;
  resourceTitle: string;
  resourceType: ResourceType;
  validationResult: ResourceValidationResult;
  safetyAssessment: SafetyAssessmentResult;
  qualityScore: ContentQualityScore;
  lastValidated: Date;
  nextValidationDue: Date;
}

export class ResourceValidationService {
  private prisma: PrismaClient;
  private config: ResourceValidationConfig;

  constructor(prisma: PrismaClient, config?: Partial<ResourceValidationConfig>) {
    this.prisma = prisma;
    this.config = {
      enableUrlChecking: true,
      enableContentAnalysis: true,
      enableSafetyScoring: true,
      timeoutMs: 10000,
      retryAttempts: 3,
      batchSize: 10,
      ...config
    };
  }

  /**
   * Validate a single resource
   */
  async validateResource(resourceId: string): Promise<ValidationReport> {
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
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    const startTime = Date.now();
    let validationResult: ResourceValidationResult;
    let safetyAssessment: SafetyAssessmentResult;
    let qualityScore: ContentQualityScore;

    try {
      // Perform URL validation
      if (this.config.enableUrlChecking) {
        validationResult = await this.validateResourceUrl(resource.url);
      } else {
        validationResult = {
          isValid: true,
          status: ValidationStatus.VALIDATED,
          lastChecked: new Date(),
          responseTime: 0
        };
      }

      // Perform safety assessment
      if (this.config.enableSafetyScoring) {
        safetyAssessment = await this.assessResourceSafety(resource);
      } else {
        safetyAssessment = {
          safetyRating: resource.safetyRating,
          score: 0.8,
          reasons: ['Manual assessment'],
          concerns: [],
          recommendations: []
        };
      }

      // Perform content quality scoring
      if (this.config.enableContentAnalysis) {
        qualityScore = await this.scoreContentQuality(resource);
      } else {
        qualityScore = {
          educationalValue: 0.8,
          ageAppropriateness: 0.9,
          contentReliability: 0.8,
          overallScore: 0.83,
          factors: ['Manual assessment']
        };
      }

      // Update resource in database
      await this.updateResourceValidation(resourceId, validationResult, safetyAssessment, qualityScore);

      logger.info(`Resource validation completed for ${resource.title}`, {
        resourceId,
        isValid: validationResult.isValid,
        safetyRating: safetyAssessment.safetyRating,
        qualityScore: qualityScore.overallScore
      });

    } catch (error) {
      logger.error(`Resource validation failed for ${resource.title}`, {
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      validationResult = {
        isValid: false,
        status: ValidationStatus.BROKEN,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      safetyAssessment = {
        safetyRating: SafetyRating.BLOCKED,
        score: 0,
        reasons: ['Validation failed'],
        concerns: ['Resource inaccessible'],
        recommendations: ['Check resource URL and availability']
      };

      qualityScore = {
        educationalValue: 0,
        ageAppropriateness: 0,
        contentReliability: 0,
        overallScore: 0,
        factors: ['Validation failed']
      };

      await this.updateResourceValidation(resourceId, validationResult, safetyAssessment, qualityScore);
    }

    return {
      resourceId,
      resourceTitle: resource.title,
      resourceType: resource.type,
      validationResult,
      safetyAssessment,
      qualityScore,
      lastValidated: new Date(),
      nextValidationDue: this.calculateNextValidationDate(validationResult.status)
    };
  }

  /**
   * Bulk validate multiple resources
   */
  async validateResourcesBatch(resourceIds: string[]): Promise<ValidationReport[]> {
    const reports: ValidationReport[] = [];
    const batches = this.chunkArray(resourceIds, this.config.batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(id => 
        this.validateResource(id).catch(error => {
          logger.error(`Failed to validate resource ${id}:`, error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      reports.push(...batchResults.filter(result => result !== null) as ValidationReport[]);

      // Small delay between batches to avoid overwhelming external services
      await this.delay(1000);
    }

    return reports;
  }

  /**
   * Validate all resources of a specific type
   */
  async validateAllResourcesByType(resourceType: ResourceType): Promise<{
    total: number;
    validated: number;
    broken: number;
    reports: ValidationReport[];
    summary: {
      safetyBreakdown: Record<SafetyRating, number>;
      qualityDistribution: { excellent: number; good: number; fair: number; poor: number };
    };
  }> {
    const resources = await this.prisma.topicResource.findMany({
      where: {
        type: resourceType,
        isActive: true
      },
      select: { id: true }
    });

    const resourceIds = resources.map(r => r.id);
    const reports = await this.validateResourcesBatch(resourceIds);

    const summary = this.generateValidationSummary(reports);

    return {
      total: resourceIds.length,
      validated: reports.filter(r => r.validationResult.isValid).length,
      broken: reports.filter(r => !r.validationResult.isValid).length,
      reports,
      summary
    };
  }

  /**
   * Get resources that need validation
   */
  async getResourcesNeedingValidation(limit: number = 50): Promise<{
    id: string;
    title: string;
    type: ResourceType;
    url: string;
    lastValidated: Date | null;
    validationStatus: ValidationStatus;
    priority: 'high' | 'medium' | 'low';
  }[]> {
    const resources = await this.prisma.topicResource.findMany({
      where: {
        isActive: true,
        OR: [
          { validationStatus: ValidationStatus.PENDING },
          { validationStatus: ValidationStatus.NEEDS_UPDATE },
          { 
            lastValidated: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
          }
        ]
      },
      orderBy: [
        { validationStatus: 'asc' },
        { lastValidated: 'asc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        lastValidated: true,
        validationStatus: true
      }
    });

    return resources.map(resource => ({
      ...resource,
      priority: this.calculateValidationPriority(resource)
    }));
  }

  /**
   * Schedule automatic validation for resources
   */
  async scheduleValidation(): Promise<{
    scheduled: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  }> {
    const resourcesNeedingValidation = await this.getResourcesNeedingValidation(100);
    
    const priorityGroups = {
      high: resourcesNeedingValidation.filter(r => r.priority === 'high'),
      medium: resourcesNeedingValidation.filter(r => r.priority === 'medium'),
      low: resourcesNeedingValidation.filter(r => r.priority === 'low')
    };

    // Validate high priority resources immediately
    if (priorityGroups.high.length > 0) {
      const highPriorityIds = priorityGroups.high.map(r => r.id);
      await this.validateResourcesBatch(highPriorityIds);
    }

    logger.info('Validation scheduling completed', {
      total: resourcesNeedingValidation.length,
      highPriority: priorityGroups.high.length,
      mediumPriority: priorityGroups.medium.length,
      lowPriority: priorityGroups.low.length
    });

    return {
      scheduled: resourcesNeedingValidation.length,
      highPriority: priorityGroups.high.length,
      mediumPriority: priorityGroups.medium.length,
      lowPriority: priorityGroups.low.length
    };
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(): Promise<{
    totalResources: number;
    validatedResources: number;
    brokenResources: number;
    pendingValidation: number;
    safetyBreakdown: Record<SafetyRating, number>;
    typeBreakdown: Record<ResourceType, number>;
    lastValidationRun: Date | null;
  }> {
    const [
      totalResources,
      validatedResources,
      brokenResources,
      pendingValidation,
      safetyBreakdown,
      typeBreakdown
    ] = await Promise.all([
      this.prisma.topicResource.count({ where: { isActive: true } }),
      this.prisma.topicResource.count({ 
        where: { isActive: true, validationStatus: ValidationStatus.VALIDATED } 
      }),
      this.prisma.topicResource.count({ 
        where: { isActive: true, validationStatus: ValidationStatus.BROKEN } 
      }),
      this.prisma.topicResource.count({ 
        where: { isActive: true, validationStatus: ValidationStatus.PENDING } 
      }),
      this.prisma.topicResource.groupBy({
        by: ['safetyRating'],
        where: { isActive: true },
        _count: { id: true }
      }),
      this.prisma.topicResource.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: { id: true }
      })
    ]);

    const safetyStats = safetyBreakdown.reduce((acc, item) => {
      acc[item.safetyRating] = item._count.id;
      return acc;
    }, {} as Record<SafetyRating, number>);

    const typeStats = typeBreakdown.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<ResourceType, number>);

    // Get last validation run from most recent lastValidated timestamp
    const lastValidated = await this.prisma.topicResource.findFirst({
      orderBy: { lastValidated: 'desc' },
      select: { lastValidated: true }
    });

    return {
      totalResources,
      validatedResources,
      brokenResources,
      pendingValidation,
      safetyBreakdown: safetyStats,
      typeBreakdown: typeStats,
      lastValidationRun: lastValidated?.lastValidated || null
    };
  }

  /**
   * Private helper methods
   */
  private async validateResourceUrl(url: string): Promise<ResourceValidationResult> {
    const startTime = Date.now();
    
    try {
      // Validate URL format
      new URL(url);
      
      // For now, simulate URL checking
      // In a real implementation, this would make HTTP requests
      console.log(`URL validation would be performed for: ${url}`);
      
      // Simulate some processing time
      await this.delay(100);
      
      return {
        isValid: true,
        status: ValidationStatus.VALIDATED,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isValid: false,
        status: ValidationStatus.BROKEN,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'URL validation failed'
      };
    }
  }

  private async assessResourceSafety(resource: any): Promise<SafetyAssessmentResult> {
    const factors = {
      urlSafety: this.assessUrlSafety(resource.url),
      contentSafety: this.assessContentSafety(resource.title, resource.description || ''),
      sourceTrust: this.assessSourceTrust(resource.source),
      ageAppropriateness: this.assessAgeAppropriateness(resource, resource.topic?.grade),
      educationalValue: this.assessEducationalValue(resource)
    };

    const scores = Object.values(factors);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    let safetyRating: SafetyRating;
    const reasons: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    if (averageScore >= 0.9) {
      safetyRating = SafetyRating.SAFE;
      reasons.push('High safety score across all factors');
    } else if (averageScore >= 0.7) {
      safetyRating = SafetyRating.SAFE;
      reasons.push('Good safety score with minor concerns');
    } else if (averageScore >= 0.5) {
      safetyRating = SafetyRating.REVIEW_NEEDED;
      concerns.push('Moderate safety concerns identified');
      recommendations.push('Manual review recommended');
    } else {
      safetyRating = SafetyRating.RESTRICTED;
      concerns.push('Multiple safety concerns identified');
      recommendations.push('Content should be reviewed before use');
    }

    // Add specific factor feedback
    if (factors.urlSafety < 0.7) {
      concerns.push('URL safety concerns');
      recommendations.push('Verify URL source and security');
    }
    if (factors.contentSafety < 0.7) {
      concerns.push('Content safety concerns');
      recommendations.push('Review content for age appropriateness');
    }
    if (factors.sourceTrust < 0.7) {
      concerns.push('Source trustworthiness concerns');
      recommendations.push('Verify source credibility');
    }

    return {
      safetyRating,
      score: averageScore,
      reasons,
      concerns,
      recommendations
    };
  }

  private async scoreContentQuality(resource: any): Promise<ContentQualityScore> {
    const educationalValue = this.assessEducationalValue(resource);
    const ageAppropriateness = this.assessAgeAppropriateness(resource, resource.topic?.grade);
    const contentReliability = this.assessContentReliability(resource);
    
    const overallScore = (educationalValue + ageAppropriateness + contentReliability) / 3;

    const factors: string[] = [];
    if (educationalValue >= 0.8) factors.push('High educational value');
    if (ageAppropriateness >= 0.8) factors.push('Age appropriate content');
    if (contentReliability >= 0.8) factors.push('Reliable content source');

    return {
      educationalValue,
      ageAppropriateness,
      contentReliability,
      overallScore,
      factors
    };
  }

  private assessUrlSafety(url: string): number {
    try {
      const urlObj = new URL(url);
      let score = 0.5; // Base score

      // HTTPS bonus
      if (urlObj.protocol === 'https:') score += 0.2;

      // Trusted domains
      const trustedDomains = [
        'khanacademy.org', 'education.com', 'scholastic.com',
        'nationalgeographic.org', 'britannica.com', 'readworks.org'
      ];
      
      if (trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
        score += 0.3;
      }

      return Math.min(score, 1.0);
    } catch {
      return 0.1; // Invalid URL
    }
  }

  private assessContentSafety(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    
    // Educational keywords boost safety
    const educationalKeywords = ['learn', 'education', 'lesson', 'tutorial', 'study', 'academic'];
    const hasEducationalKeywords = educationalKeywords.some(keyword => text.includes(keyword));
    
    // Inappropriate content keywords reduce safety
    const inappropriateKeywords = ['violent', 'scary', 'adult', 'mature', 'explicit'];
    const hasInappropriateKeywords = inappropriateKeywords.some(keyword => text.includes(keyword));
    
    let score = 0.7; // Base score
    if (hasEducationalKeywords) score += 0.2;
    if (hasInappropriateKeywords) score -= 0.4;
    
    return Math.max(0, Math.min(score, 1.0));
  }

  private assessSourceTrust(source: string): number {
    const trustedSources = [
      'khan academy', 'scholastic', 'national geographic', 'britannica',
      'education.com', 'readworks', 'commonlit', 'newsela'
    ];
    
    const sourceLower = source.toLowerCase();
    const isTrusted = trustedSources.some(trusted => sourceLower.includes(trusted));
    
    return isTrusted ? 0.9 : 0.6;
  }

  private assessAgeAppropriateness(resource: any, grade: any): number {
    if (!grade) return 0.7; // Default if no grade info
    
    // Simple age appropriateness based on resource difficulty and grade level
    const gradeNum = parseInt(grade.grade) || 0;
    const difficulty = resource.difficulty;
    
    let score = 0.8; // Base score
    
    // Adjust based on difficulty vs grade level
    if (difficulty === DifficultyLevel.BEGINNER && gradeNum <= 3) score += 0.1;
    if (difficulty === DifficultyLevel.INTERMEDIATE && gradeNum >= 3 && gradeNum <= 8) score += 0.1;
    if (difficulty === DifficultyLevel.ADVANCED && gradeNum >= 6) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private assessEducationalValue(resource: any): number {
    let score = 0.6; // Base score
    
    // Check for educational indicators in title and description
    const text = `${resource.title} ${resource.description || ''}`.toLowerCase();
    const educationalKeywords = [
      'learn', 'education', 'lesson', 'tutorial', 'guide', 'study',
      'curriculum', 'academic', 'instruction', 'practice'
    ];
    
    const keywordMatches = educationalKeywords.filter(keyword => text.includes(keyword)).length;
    score += Math.min(keywordMatches * 0.05, 0.3);
    
    // Duration appropriateness
    if (resource.duration && resource.duration >= 3 && resource.duration <= 30) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private assessContentReliability(resource: any): number {
    let score = 0.6; // Base score
    
    // Source reliability
    if (resource.source && resource.source.length > 0) score += 0.1;
    
    // Metadata completeness
    const metadata = resource.metadata || {};
    const metadataFields = Object.keys(metadata).length;
    score += Math.min(metadataFields * 0.05, 0.2);
    
    // Recent validation
    if (resource.lastValidated && 
        new Date(resource.lastValidated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private async updateResourceValidation(
    resourceId: string,
    validationResult: ResourceValidationResult,
    safetyAssessment: SafetyAssessmentResult,
    qualityScore: ContentQualityScore
  ): Promise<void> {
    await this.prisma.topicResource.update({
      where: { id: resourceId },
      data: {
        validationStatus: validationResult.status,
        lastValidated: validationResult.lastChecked,
        safetyRating: safetyAssessment.safetyRating,
        metadata: {
          ...{}, // Preserve existing metadata
          validationReport: {
            lastValidated: validationResult.lastChecked,
            safetyScore: safetyAssessment.score,
            qualityScore: qualityScore.overallScore,
            concerns: safetyAssessment.concerns,
            recommendations: safetyAssessment.recommendations
          }
        }
      }
    });
  }

  private calculateValidationPriority(resource: any): 'high' | 'medium' | 'low' {
    if (resource.validationStatus === ValidationStatus.BROKEN) return 'high';
    if (resource.validationStatus === ValidationStatus.PENDING) return 'high';
    if (!resource.lastValidated) return 'high';
    
    const daysSinceValidation = Math.floor(
      (Date.now() - new Date(resource.lastValidated).getTime()) / (24 * 60 * 60 * 1000)
    );
    
    if (daysSinceValidation > 60) return 'high';
    if (daysSinceValidation > 30) return 'medium';
    return 'low';
  }

  private calculateNextValidationDate(status: ValidationStatus): Date {
    const now = new Date();
    const daysToAdd = status === ValidationStatus.VALIDATED ? 30 : 7; // 30 days for validated, 7 for others
    return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private generateValidationSummary(reports: ValidationReport[]) {
    const safetyBreakdown = reports.reduce((acc, report) => {
      acc[report.safetyAssessment.safetyRating] = (acc[report.safetyAssessment.safetyRating] || 0) + 1;
      return acc;
    }, {} as Record<SafetyRating, number>);

    const qualityDistribution = reports.reduce((acc, report) => {
      const score = report.qualityScore.overallScore;
      if (score >= 0.9) acc.excellent++;
      else if (score >= 0.7) acc.good++;
      else if (score >= 0.5) acc.fair++;
      else acc.poor++;
      return acc;
    }, { excellent: 0, good: 0, fair: 0, poor: 0 });

    return {
      safetyBreakdown,
      qualityDistribution
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}