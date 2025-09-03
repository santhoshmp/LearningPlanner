import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import crypto from 'crypto';
import { redisService } from './redisService';
import logger from '../utils/logger';
import {
  GeminiStudyPlanRequest,
  GeminiStudyPlanResponse,
  GeminiActivity,
  ContentRecommendation,
  GeminiCacheEntry,
  ContentSafetyResult,
  GeminiServiceConfig
} from '../types/gemini';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiServiceConfig;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.config = {
      apiKey,
      model: 'gemini-pro',
      maxTokens: 4096,
      temperature: 0.7,
      cacheEnabled: true,
      cacheTtlHours: 24
    };

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
  }

  /**
   * Generate a study plan using Gemini Pro API
   */
  async generateStudyPlan(request: GeminiStudyPlanRequest): Promise<GeminiStudyPlanResponse> {
    try {
      logger.info('Generating study plan with Gemini', { 
        subject: request.subject, 
        childAge: request.childAge,
        duration: request.duration 
      });

      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResponse = await this.getCachedResponse(request);
        if (cachedResponse) {
          logger.info('Returning cached study plan response');
          return cachedResponse;
        }
      }

      // Generate the prompt
      const prompt = this.buildStudyPlanPrompt(request);
      
      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const studyPlan = this.parseStudyPlanResponse(text, request);

      // Cache the response
      if (this.config.cacheEnabled) {
        await this.cacheResponse(request, studyPlan);
      }

      logger.info('Successfully generated study plan', { planId: studyPlan.planId });
      return studyPlan;

    } catch (error) {
      logger.error('Error generating study plan with Gemini', { error: (error as Error).message });
      throw new Error(`Failed to generate study plan: ${(error as Error).message}`);
    }
  }

  /**
   * Generate content recommendations for a specific topic
   */
  async generateContentRecommendations(
    subject: string,
    topic: string,
    childAge: number,
    contentTypes: ('video' | 'article' | 'interactive')[] = ['video', 'article']
  ): Promise<ContentRecommendation[]> {
    try {
      logger.info('Generating content recommendations', { subject, topic, childAge });

      const prompt = this.buildContentRecommendationPrompt(subject, topic, childAge, contentTypes);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const recommendations = this.parseContentRecommendations(text, subject, childAge);
      
      logger.info('Successfully generated content recommendations', { 
        count: recommendations.length 
      });
      
      return recommendations;

    } catch (error) {
      logger.error('Error generating content recommendations', { error: (error as Error).message });
      throw new Error(`Failed to generate content recommendations: ${(error as Error).message}`);
    }
  }

  /**
   * Validate content safety using Gemini
   */
  async validateContentSafety(
    content: string,
    childAge: number,
    contentType: 'text' | 'video_description' | 'article_summary'
  ): Promise<ContentSafetyResult> {
    try {
      logger.info('Validating content safety', { contentType, childAge });

      const prompt = this.buildContentSafetyPrompt(content, childAge, contentType);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const safetyResult = this.parseContentSafetyResponse(text, childAge);
      
      logger.info('Content safety validation completed', { 
        isAppropriate: safetyResult.isAppropriate,
        safetyScore: safetyResult.safetyScore 
      });
      
      return safetyResult;

    } catch (error) {
      logger.error('Error validating content safety', { error: (error as Error).message });
      throw new Error(`Failed to validate content safety: ${(error as Error).message}`);
    }
  }

  /**
   * Build the study plan generation prompt
   */
  private buildStudyPlanPrompt(request: GeminiStudyPlanRequest): string {
    const performanceContext = request.previousPerformance 
      ? `Previous Performance:
         - Average Score: ${request.previousPerformance.averageScore}%
         - Completion Rate: ${request.previousPerformance.completionRate}%
         - Struggling Areas: ${request.previousPerformance.strugglingAreas.join(', ')}
         - Strong Areas: ${request.previousPerformance.strongAreas.join(', ')}`
      : '';

    const learningStyleContext = request.learningStyle 
      ? `Learning Style Preferences:
         - Visual: ${Math.round(request.learningStyle.visual * 100)}%
         - Auditory: ${Math.round(request.learningStyle.auditory * 100)}%
         - Kinesthetic: ${Math.round(request.learningStyle.kinesthetic * 100)}%
         - Reading/Writing: ${Math.round(request.learningStyle.readingWriting * 100)}%`
      : `Learning Style: ${request.learningStyle || 'Mixed'}`;

    const selectedTopicsContext = request.selectedTopics && request.selectedTopics.length > 0
      ? `Selected Topics to Focus On:
${request.selectedTopics.map(topic => `- ${topic.name}: ${topic.description} (${topic.difficulty} level, ~${topic.estimatedHours}h)`).join('\n')}`
      : '';

    return `Create a comprehensive study plan for a ${request.childAge}-year-old student in grade ${request.gradeLevel}.

Subject: ${request.subject}
Duration: ${request.duration || 30} minutes per session
Learning Objectives: ${request.objectives?.join(', ') || 'General subject mastery'}

${learningStyleContext}

${selectedTopicsContext}

${performanceContext}

CRITICAL REQUIREMENT: All activities and objectives MUST be directly related to the selected topics listed above. Do not include generic activities that don't match the specific topics. Each activity should:
1. Have a title that clearly indicates which topic it addresses
2. Include the topic ID in the relatedTopics field
3. Be specifically designed for the ${request.subject} subject
4. Match the difficulty level and grade appropriateness

Please create activities and objectives specifically focused on the selected topics above. Each activity should directly address one or more of the selected topics and be appropriate for the grade level and learning style.

Please provide a detailed study plan in the following JSON format:
{
  "title": "Study Plan Title",
  "description": "Brief description of the study plan",
  "activities": [
    {
      "id": "unique_activity_id",
      "title": "Activity Title",
      "description": "Activity description",
      "type": "interactive|quiz|text|video",
      "duration": 15,
      "difficulty": 5,
      "objectives": ["objective1", "objective2"],
      "instructions": "Step-by-step instructions",
      "materials": ["material1", "material2"],
      "assessmentCriteria": ["criteria1", "criteria2"],
      "relatedTopics": ["topic_id_1", "topic_id_2"]
    }
  ],
  "estimatedDuration": ${request.duration || 30},
  "difficultyProgression": [3, 4, 5, 6],
  "contentRecommendations": [
    {
      "type": "video|article|interactive",
      "title": "Content Title",
      "description": "Content description",
      "duration": 10,
      "ageAppropriate": true,
      "safetyScore": 0.95,
      "source": "Educational source",
      "tags": ["tag1", "tag2"],
      "difficulty": 4
    }
  ],
  "learningObjectives": ["objective1", "objective2"],
  "prerequisites": ["prerequisite1", "prerequisite2"]
}

Ensure all content is age-appropriate, educationally sound, and aligns with the specified learning objectives. Focus on the dominant learning style while incorporating variety.`;
  }

  /**
   * Build content recommendation prompt
   */
  private buildContentRecommendationPrompt(
    subject: string,
    topic: string,
    childAge: number,
    contentTypes: string[]
  ): string {
    return `Generate educational content recommendations for a ${childAge}-year-old student.

Subject: ${subject}
Topic: ${topic}
Content Types: ${contentTypes.join(', ')}

Please provide 5-8 content recommendations in the following JSON format:
[
  {
    "type": "video|article|interactive",
    "title": "Content Title",
    "description": "Detailed description of the content",
    "duration": 15,
    "ageAppropriate": true,
    "safetyScore": 0.95,
    "source": "Educational platform or publisher",
    "tags": ["educational", "age-appropriate", "engaging"],
    "difficulty": 5
  }
]

Ensure all recommendations are:
- Age-appropriate for ${childAge}-year-olds
- Educationally valuable
- Engaging and interactive when possible
- From reputable educational sources
- Safe for children`;
  }

  /**
   * Build content safety validation prompt
   */
  private buildContentSafetyPrompt(
    content: string,
    childAge: number,
    contentType: string
  ): string {
    return `Evaluate the safety and appropriateness of the following ${contentType} for a ${childAge}-year-old child:

Content to evaluate:
"${content}"

Please provide a safety assessment in the following JSON format:
{
  "isAppropriate": true|false,
  "safetyScore": 0.95,
  "flaggedContent": ["inappropriate element 1", "inappropriate element 2"],
  "ageAppropriate": true|false,
  "parentalApprovalRequired": false|true,
  "reasons": ["reason 1", "reason 2"]
}

Consider the following safety criteria:
- Age-appropriate language and concepts
- No violent, sexual, or disturbing content
- Educational value
- Positive messaging
- Cultural sensitivity
- Privacy and safety considerations`;
  }

  /**
   * Parse study plan response from Gemini
   */
  private parseStudyPlanResponse(text: string, request: GeminiStudyPlanRequest): GeminiStudyPlanResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Generate unique plan ID
      const planId = crypto.randomUUID();

      // Ensure all required fields are present
      const studyPlan: GeminiStudyPlanResponse = {
        planId,
        title: parsed.title || `${request.subject} Study Plan`,
        description: parsed.description || `Study plan for ${request.subject}`,
        activities: this.validateActivities(parsed.activities || []),
        estimatedDuration: parsed.estimatedDuration || request.duration,
        difficultyProgression: parsed.difficultyProgression || [1, 2, 3, 4, 5],
        contentRecommendations: this.validateContentRecommendations(parsed.contentRecommendations || []),
        learningObjectives: parsed.learningObjectives || request.objectives,
        prerequisites: parsed.prerequisites || []
      };

      return studyPlan;

    } catch (error) {
      logger.error('Error parsing study plan response', { error: (error as Error).message });
      throw new Error(`Failed to parse study plan response: ${(error as Error).message}`);
    }
  }

  /**
   * Parse content recommendations from Gemini response
   */
  private parseContentRecommendations(text: string, subject: string, childAge: number): ContentRecommendation[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in content recommendations response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.validateContentRecommendations(parsed);

    } catch (error) {
      logger.error('Error parsing content recommendations', { error: (error as Error).message });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Parse content safety response from Gemini
   */
  private parseContentSafetyResponse(text: string, childAge: number): ContentSafetyResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in content safety response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        isAppropriate: parsed.isAppropriate ?? true,
        safetyScore: parsed.safetyScore ?? 0.5,
        flaggedContent: parsed.flaggedContent || [],
        ageAppropriate: parsed.ageAppropriate ?? (childAge >= 13),
        parentalApprovalRequired: parsed.parentalApprovalRequired ?? false,
        reasons: parsed.reasons || []
      };

    } catch (error) {
      logger.error('Error parsing content safety response', { error: (error as Error).message });
      // Return conservative safety result on parse error
      return {
        isAppropriate: false,
        safetyScore: 0.0,
        flaggedContent: ['Parse error - manual review required'],
        ageAppropriate: false,
        parentalApprovalRequired: true,
        reasons: ['Failed to parse safety assessment']
      };
    }
  }

  /**
   * Validate and sanitize activities
   */
  private validateActivities(activities: any[]): GeminiActivity[] {
    return activities.map((activity, index) => ({
      id: activity.id || `activity_${index + 1}`,
      title: activity.title || `Activity ${index + 1}`,
      description: activity.description || '',
      type: this.validateActivityType(activity.type),
      duration: Math.max(1, Math.min(120, activity.duration || 15)),
      difficulty: Math.max(1, Math.min(10, activity.difficulty || 5)),
      objectives: Array.isArray(activity.objectives) ? activity.objectives : [],
      instructions: activity.instructions || '',
      materials: Array.isArray(activity.materials) ? activity.materials : [],
      assessmentCriteria: Array.isArray(activity.assessmentCriteria) ? activity.assessmentCriteria : []
    }));
  }

  /**
   * Validate activity type
   */
  private validateActivityType(type: string): 'video' | 'article' | 'interactive' | 'quiz' | 'exercise' {
    const validTypes = ['video', 'article', 'interactive', 'quiz', 'exercise'];
    return validTypes.includes(type) ? type as any : 'article';
  }

  /**
   * Validate and sanitize content recommendations
   */
  private validateContentRecommendations(recommendations: any[]): ContentRecommendation[] {
    return recommendations.map((rec, index) => ({
      type: this.validateContentType(rec.type),
      title: rec.title || `Content ${index + 1}`,
      description: rec.description || '',
      url: rec.url || undefined,
      duration: Math.max(1, Math.min(180, rec.duration || 10)),
      ageAppropriate: rec.ageAppropriate ?? true,
      safetyScore: Math.max(0, Math.min(1, rec.safetyScore || 0.8)),
      source: rec.source || 'Educational Content',
      tags: Array.isArray(rec.tags) ? rec.tags : [],
      difficulty: Math.max(1, Math.min(10, rec.difficulty || 5))
    }));
  }

  /**
   * Validate content type
   */
  private validateContentType(type: string): 'video' | 'article' | 'interactive' {
    const validTypes = ['video', 'article', 'interactive'];
    return validTypes.includes(type) ? type as any : 'article';
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: GeminiStudyPlanRequest): string {
    const requestString = JSON.stringify({
      childAge: request.childAge,
      gradeLevel: request.gradeLevel,
      subject: request.subject,
      learningStyle: request.learningStyle,
      duration: request.duration,
      objectives: request.objectives.sort()
    });
    
    return `gemini:study_plan:${crypto.createHash('md5').update(requestString).digest('hex')}`;
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(request: GeminiStudyPlanRequest): Promise<GeminiStudyPlanResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = await redisService.get(cacheKey);
      
      if (cached) {
        const cacheEntry: GeminiCacheEntry = JSON.parse(cached);
        
        // Check if cache is still valid
        if (new Date() < new Date(cacheEntry.expiresAt)) {
          return cacheEntry.response;
        } else {
          // Remove expired cache
          await redisService.del(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving cached response', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Cache response
   */
  private async cacheResponse(request: GeminiStudyPlanRequest, response: GeminiStudyPlanResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.config.cacheTtlHours);
      
      const cacheEntry: GeminiCacheEntry = {
        key: cacheKey,
        response,
        createdAt: new Date(),
        expiresAt,
        requestHash: crypto.createHash('md5').update(JSON.stringify(request)).digest('hex')
      };
      
      await redisService.set(
        cacheKey, 
        JSON.stringify(cacheEntry),
        this.config.cacheTtlHours * 3600
      );
      
      logger.info('Cached Gemini response', { cacheKey, expiresAt });
    } catch (error) {
      logger.error('Error caching response', { error: (error as Error).message });
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Clear cache for specific request pattern
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern || 'gemini:study_plan:*';
      // Note: Redis KEYS command should be used carefully in production
      // Consider using SCAN for better performance with large datasets
      logger.info('Cache clear requested', { pattern: searchPattern });
      // Implementation would depend on Redis service structure
    } catch (error) {
      logger.error('Error clearing cache', { error: (error as Error).message });
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ status: string; model: string; cacheEnabled: boolean }> {
    try {
      // Test API connectivity with a simple request
      const testResult = await this.model.generateContent('Test connection');
      await testResult.response;
      
      return {
        status: 'healthy',
        model: this.config.model,
        cacheEnabled: this.config.cacheEnabled
      };
    } catch (error) {
      logger.error('Gemini service health check failed', { error: (error as Error).message });
      return {
        status: 'unhealthy',
        model: this.config.model,
        cacheEnabled: this.config.cacheEnabled
      };
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;