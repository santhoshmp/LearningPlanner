# Gemini Integration and Content Safety Guide

## Overview

This guide provides comprehensive documentation for integrating Google's Gemini Pro API for AI-powered study plan generation and implementing content safety features to ensure age-appropriate and educationally valuable content for children.

## Table of Contents

1. [Gemini Pro API Integration](#gemini-pro-api-integration)
2. [Study Plan Generation](#study-plan-generation)
3. [Content Safety System](#content-safety-system)
4. [Content Recommendation Engine](#content-recommendation-engine)
5. [Parental Approval Workflow](#parental-approval-workflow)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Testing and Validation](#testing-and-validation)

---

## Gemini Pro API Integration

### Prerequisites

1. **Google Cloud Setup**
   - Enable Gemini Pro API in Google Cloud Console
   - Create service account with appropriate permissions
   - Generate API key or service account credentials

2. **Required Dependencies**
   ```bash
   npm install @google-ai/generativelanguage
   npm install google-auth-library
   ```

### Configuration

```javascript
const { GenerativeServiceClient } = require('@google-ai/generativelanguage');
const { GoogleAuth } = require('google-auth-library');

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  model: 'models/gemini-pro',
  maxTokens: 2048,
  temperature: 0.7,
  topP: 0.8,
  topK: 40
};

// Initialize client
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/generative-language']
});

const client = new GenerativeServiceClient({
  auth: auth,
  apiKey: geminiConfig.apiKey
});
```

### Basic API Integration

```javascript
class GeminiService {
  constructor() {
    this.client = client;
    this.model = geminiConfig.model;
  }

  async generateContent(prompt, options = {}) {
    try {
      const request = {
        model: this.model,
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: options.maxTokens || geminiConfig.maxTokens,
          temperature: options.temperature || geminiConfig.temperature,
          topP: options.topP || geminiConfig.topP,
          topK: options.topK || geminiConfig.topK
        },
        safetySettings: this.getSafetySettings()
      };

      const response = await this.client.generateContent(request);
      return this.processResponse(response);
    } catch (error) {
      throw new GeminiAPIError('Content generation failed', error);
    }
  }

  getSafetySettings() {
    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];
  }

  processResponse(response) {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No content generated');
    }

    const candidate = response.candidates[0];
    
    // Check for safety issues
    if (candidate.finishReason === 'SAFETY') {
      throw new ContentSafetyError('Content blocked by safety filters');
    }

    return {
      content: candidate.content.parts[0].text,
      safetyRatings: candidate.safetyRatings,
      finishReason: candidate.finishReason
    };
  }
}
```

---

## Study Plan Generation

### Study Plan Prompt Engineering

```javascript
class StudyPlanGenerator {
  constructor(geminiService) {
    this.geminiService = geminiService;
  }

  async generateStudyPlan(request) {
    const prompt = this.buildStudyPlanPrompt(request);
    const response = await this.geminiService.generateContent(prompt, {
      temperature: 0.7,
      maxTokens: 2048
    });

    return this.parseStudyPlanResponse(response.content, request);
  }

  buildStudyPlanPrompt(request) {
    const {
      childAge,
      gradeLevel,
      subject,
      learningStyle,
      duration,
      objectives,
      previousPerformance
    } = request;

    return `
Create a comprehensive study plan for a ${childAge}-year-old student in ${gradeLevel} grade.

REQUIREMENTS:
- Subject: ${subject}
- Duration: ${duration} minutes
- Learning Style: ${learningStyle}
- Objectives: ${objectives.join(', ')}
${previousPerformance ? `- Previous Performance: ${JSON.stringify(previousPerformance)}` : ''}

GUIDELINES:
1. Content must be age-appropriate for ${childAge}-year-old children
2. Activities should be engaging and interactive
3. Include a mix of videos, articles, and interactive exercises
4. Progress from basic to advanced concepts
5. Include assessment opportunities
6. Ensure educational value and curriculum alignment

RESPONSE FORMAT (JSON):
{
  "title": "Study Plan Title",
  "description": "Brief description of the study plan",
  "estimatedDuration": ${duration},
  "difficultyProgression": [1, 2, 3, 4, 5],
  "activities": [
    {
      "id": "activity_1",
      "title": "Activity Title",
      "description": "Activity description",
      "type": "video|article|interactive",
      "duration": 15,
      "objectives": ["objective1", "objective2"],
      "content": {
        "searchTerms": ["term1", "term2"],
        "contentHints": "Specific content suggestions"
      },
      "assessmentQuestions": [
        {
          "question": "Assessment question",
          "type": "multiple_choice|true_false|short_answer",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct_answer"
        }
      ]
    }
  ],
  "learningOutcomes": ["outcome1", "outcome2"],
  "parentNotes": "Notes for parents about this study plan"
}

Generate the study plan now:`;
  }

  parseStudyPlanResponse(content, request) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const studyPlan = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance the study plan
      return this.validateAndEnhanceStudyPlan(studyPlan, request);
    } catch (error) {
      throw new StudyPlanParsingError('Failed to parse study plan', error);
    }
  }

  validateAndEnhanceStudyPlan(studyPlan, request) {
    // Validate required fields
    const requiredFields = ['title', 'description', 'activities'];
    for (const field of requiredFields) {
      if (!studyPlan[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    // Enhance with metadata
    studyPlan.metadata = {
      childAge: request.childAge,
      gradeLevel: request.gradeLevel,
      subject: request.subject,
      learningStyle: request.learningStyle,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Add unique IDs if missing
    studyPlan.activities.forEach((activity, index) => {
      if (!activity.id) {
        activity.id = `activity_${index + 1}`;
      }
    });

    return studyPlan;
  }
}
```

### Content Recommendation Integration

```javascript
class ContentRecommendationService {
  constructor(geminiService) {
    this.geminiService = geminiService;
  }

  async generateContentRecommendations(activity, childProfile) {
    const prompt = this.buildContentRecommendationPrompt(activity, childProfile);
    const response = await this.geminiService.generateContent(prompt);
    
    return this.parseContentRecommendations(response.content);
  }

  buildContentRecommendationPrompt(activity, childProfile) {
    return `
Generate specific content recommendations for this learning activity:

ACTIVITY:
- Title: ${activity.title}
- Type: ${activity.type}
- Duration: ${activity.duration} minutes
- Objectives: ${activity.objectives.join(', ')}
- Search Terms: ${activity.content.searchTerms.join(', ')}

CHILD PROFILE:
- Age: ${childProfile.age}
- Grade: ${childProfile.gradeLevel}
- Learning Style: ${childProfile.learningStyle}
- Interests: ${childProfile.interests.join(', ')}
- Previous Performance: ${JSON.stringify(childProfile.recentPerformance)}

REQUIREMENTS:
1. Find 3-5 specific educational resources (videos, articles, interactive content)
2. Ensure content is age-appropriate and educationally valuable
3. Prioritize high-quality, reputable sources
4. Include diverse content types and perspectives
5. Consider the child's learning style and interests

RESPONSE FORMAT (JSON):
{
  "recommendations": [
    {
      "title": "Content Title",
      "type": "video|article|interactive",
      "description": "Brief description of the content",
      "estimatedDuration": 10,
      "source": "Content source/platform",
      "searchQuery": "Specific search terms to find this content",
      "ageAppropriate": true,
      "educationalValue": "high|medium|low",
      "relevanceScore": 0.95,
      "learningObjectives": ["objective1", "objective2"]
    }
  ]
}

Generate recommendations now:`;
  }

  parseContentRecommendations(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const recommendations = JSON.parse(jsonMatch[0]);
      return this.validateRecommendations(recommendations);
    } catch (error) {
      throw new ContentRecommendationError('Failed to parse recommendations', error);
    }
  }

  validateRecommendations(recommendations) {
    if (!recommendations.recommendations || !Array.isArray(recommendations.recommendations)) {
      throw new ValidationError('Invalid recommendations format');
    }

    // Filter and validate recommendations
    return recommendations.recommendations
      .filter(rec => rec.ageAppropriate && rec.educationalValue !== 'low')
      .map(rec => ({
        ...rec,
        id: this.generateRecommendationId(),
        generatedAt: new Date().toISOString()
      }));
  }

  generateRecommendationId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Content Safety System

### Multi-Layer Safety Architecture

```javascript
class ContentSafetyService {
  constructor(geminiService) {
    this.geminiService = geminiService;
    this.safetyFilters = new SafetyFilters();
    this.ageAppropriatenessChecker = new AgeAppropriatenessChecker();
    this.educationalValueAssessor = new EducationalValueAssessor();
  }

  async validateContent(content, childAge) {
    const results = await Promise.all([
      this.checkContentSafety(content),
      this.checkAgeAppropriateness(content, childAge),
      this.assessEducationalValue(content),
      this.checkForInappropriateContent(content)
    ]);

    return this.aggregateSafetyResults(results, content);
  }

  async checkContentSafety(content) {
    const prompt = `
Analyze this content for safety and appropriateness for children:

CONTENT:
Title: ${content.title}
Description: ${content.description}
Type: ${content.type}
Source: ${content.source || 'Unknown'}

SAFETY CRITERIA:
1. Violence or aggressive content
2. Inappropriate language or themes
3. Sexual or suggestive content
4. Dangerous activities or instructions
5. Discriminatory or hateful content
6. Privacy or personal information risks
7. Commercial or advertising content
8. Misinformation or inaccurate information

RESPONSE FORMAT (JSON):
{
  "safetyRating": "safe|review_needed|unsafe",
  "safetyScore": 0.95,
  "concerns": [
    {
      "category": "violence",
      "severity": "low|medium|high",
      "description": "Specific concern description"
    }
  ],
  "recommendations": [
    "Specific recommendation for improvement"
  ]
}

Analyze the content now:`;

    const response = await this.geminiService.generateContent(prompt);
    return this.parseSafetyResponse(response.content);
  }

  async checkAgeAppropriateness(content, childAge) {
    const prompt = `
Evaluate if this content is appropriate for a ${childAge}-year-old child:

CONTENT:
Title: ${content.title}
Description: ${content.description}
Type: ${content.type}

AGE CONSIDERATIONS:
- Cognitive development level for ${childAge}-year-olds
- Emotional maturity expectations
- Reading/comprehension level
- Attention span capabilities
- Interest alignment

RESPONSE FORMAT (JSON):
{
  "ageAppropriate": true,
  "recommendedAgeRange": {
    "min": 8,
    "max": 12
  },
  "developmentalConsiderations": [
    "Consideration 1",
    "Consideration 2"
  ],
  "adaptationSuggestions": [
    "Suggestion for making more age-appropriate"
  ]
}

Evaluate now:`;

    const response = await this.geminiService.generateContent(prompt);
    return this.parseAgeAppropriatenessResponse(response.content);
  }

  async assessEducationalValue(content) {
    const prompt = `
Assess the educational value of this content:

CONTENT:
Title: ${content.title}
Description: ${content.description}
Type: ${content.type}

EDUCATIONAL CRITERIA:
1. Curriculum alignment
2. Learning objectives clarity
3. Factual accuracy
4. Engagement level
5. Skill development potential
6. Critical thinking promotion
7. Creativity encouragement
8. Real-world application

RESPONSE FORMAT (JSON):
{
  "educationalValue": "high|medium|low",
  "educationalScore": 0.85,
  "learningObjectives": [
    "Objective 1",
    "Objective 2"
  ],
  "skillsAddressed": [
    "Skill 1",
    "Skill 2"
  ],
  "curriculumAlignment": {
    "subjects": ["mathematics", "science"],
    "gradeLevel": "elementary",
    "standards": ["common-core"]
  },
  "improvementSuggestions": [
    "Suggestion for enhancement"
  ]
}

Assess now:`;

    const response = await this.geminiService.generateContent(prompt);
    return this.parseEducationalValueResponse(response.content);
  }

  aggregateSafetyResults(results, content) {
    const [safety, ageAppropriateness, educationalValue, inappropriateContent] = results;

    // Calculate overall safety score
    const overallScore = (
      safety.safetyScore * 0.4 +
      (ageAppropriateness.ageAppropriate ? 1 : 0) * 0.3 +
      this.getEducationalScore(educationalValue.educationalValue) * 0.3
    );

    // Determine final rating
    let finalRating = 'safe';
    if (overallScore < 0.6 || safety.safetyRating === 'unsafe') {
      finalRating = 'blocked';
    } else if (overallScore < 0.8 || safety.safetyRating === 'review_needed') {
      finalRating = 'review_needed';
    }

    return {
      contentId: content.id,
      overallRating: finalRating,
      overallScore: overallScore,
      safety: safety,
      ageAppropriateness: ageAppropriateness,
      educationalValue: educationalValue,
      validatedAt: new Date().toISOString(),
      requiresParentalApproval: finalRating === 'review_needed'
    };
  }

  getEducationalScore(value) {
    const scoreMap = { high: 1, medium: 0.7, low: 0.3 };
    return scoreMap[value] || 0;
  }
}
```

### Real-time Content Monitoring

```javascript
class ContentMonitoringService {
  constructor(contentSafetyService) {
    this.contentSafetyService = contentSafetyService;
    this.monitoringQueue = new Queue('content-monitoring');
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor new content additions
    this.monitoringQueue.process('validate-content', async (job) => {
      const { contentId, childAge } = job.data;
      return await this.validateNewContent(contentId, childAge);
    });

    // Periodic re-validation of existing content
    this.monitoringQueue.process('revalidate-content', async (job) => {
      const { contentId } = job.data;
      return await this.revalidateContent(contentId);
    });
  }

  async validateNewContent(contentId, childAge) {
    try {
      const content = await this.getContentById(contentId);
      const validation = await this.contentSafetyService.validateContent(content, childAge);
      
      await this.updateContentSafetyRating(contentId, validation);
      
      if (validation.requiresParentalApproval) {
        await this.triggerParentalApprovalWorkflow(contentId, validation);
      }

      return validation;
    } catch (error) {
      console.error(`Content validation failed for ${contentId}:`, error);
      throw error;
    }
  }

  async scheduleContentRevalidation(contentId, intervalDays = 30) {
    const delay = intervalDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
    
    await this.monitoringQueue.add('revalidate-content', 
      { contentId }, 
      { delay }
    );
  }
}
```

---

## Content Recommendation Engine

### Personalized Recommendations

```javascript
class PersonalizedRecommendationEngine {
  constructor(geminiService, analyticsService) {
    this.geminiService = geminiService;
    this.analyticsService = analyticsService;
  }

  async generatePersonalizedRecommendations(childId, options = {}) {
    const childProfile = await this.buildChildProfile(childId);
    const learningContext = await this.analyzeLearningContext(childId);
    
    const recommendations = await this.generateRecommendations(
      childProfile, 
      learningContext, 
      options
    );

    return this.rankAndFilterRecommendations(recommendations, childProfile);
  }

  async buildChildProfile(childId) {
    const [profile, preferences, performance, interactions] = await Promise.all([
      this.getChildProfile(childId),
      this.getChildPreferences(childId),
      this.getPerformanceData(childId),
      this.getContentInteractions(childId)
    ]);

    return {
      ...profile,
      preferences,
      performance,
      interactions,
      learningPatterns: this.analyzeLearningPatterns(interactions)
    };
  }

  async generateRecommendations(childProfile, learningContext, options) {
    const prompt = `
Generate personalized content recommendations for this child:

CHILD PROFILE:
- Age: ${childProfile.age}
- Grade: ${childProfile.gradeLevel}
- Learning Style: ${childProfile.learningStyle}
- Interests: ${childProfile.interests.join(', ')}
- Strengths: ${childProfile.performance.strengths.join(', ')}
- Areas for Improvement: ${childProfile.performance.weaknesses.join(', ')}

LEARNING CONTEXT:
- Recent Subjects: ${learningContext.recentSubjects.join(', ')}
- Preferred Content Types: ${learningContext.preferredTypes.join(', ')}
- Average Session Duration: ${learningContext.avgSessionDuration} minutes
- Best Performance Time: ${learningContext.bestPerformanceTime}

LEARNING PATTERNS:
- Engagement Level: ${childProfile.learningPatterns.engagementLevel}
- Completion Rate: ${childProfile.learningPatterns.completionRate}%
- Preferred Difficulty: ${childProfile.learningPatterns.preferredDifficulty}

REQUIREMENTS:
1. Generate 10 personalized content recommendations
2. Mix different content types (videos, articles, interactive)
3. Consider the child's learning patterns and preferences
4. Include both reinforcement and challenge content
5. Ensure age-appropriateness and educational value

RESPONSE FORMAT (JSON):
{
  "recommendations": [
    {
      "title": "Content Title",
      "type": "video|article|interactive",
      "subject": "subject_name",
      "description": "Why this content is recommended",
      "estimatedDuration": 15,
      "difficultyLevel": 3,
      "relevanceScore": 0.95,
      "personalizationFactors": [
        "matches_learning_style",
        "addresses_weakness",
        "builds_on_strength"
      ],
      "searchQuery": "terms to find this content",
      "expectedOutcomes": ["outcome1", "outcome2"]
    }
  ]
}

Generate recommendations now:`;

    const response = await this.geminiService.generateContent(prompt);
    return this.parseRecommendations(response.content);
  }

  rankAndFilterRecommendations(recommendations, childProfile) {
    return recommendations
      .filter(rec => this.isAppropriateForChild(rec, childProfile))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
      .map((rec, index) => ({
        ...rec,
        rank: index + 1,
        recommendedAt: new Date().toISOString()
      }));
  }
}
```

---

## Parental Approval Workflow

### Approval System Implementation

```javascript
class ParentalApprovalService {
  constructor(notificationService, emailService) {
    this.notificationService = notificationService;
    this.emailService = emailService;
  }

  async requestParentalApproval(contentId, childId, validationResults) {
    const approvalRequest = await this.createApprovalRequest(
      contentId, 
      childId, 
      validationResults
    );

    await this.notifyParent(approvalRequest);
    
    return approvalRequest;
  }

  async createApprovalRequest(contentId, childId, validationResults) {
    const content = await this.getContentById(contentId);
    const child = await this.getChildProfile(childId);
    const parent = await this.getParentProfile(child.parentId);

    const approvalRequest = {
      id: this.generateApprovalId(),
      contentId,
      childId,
      parentId: parent.id,
      content: {
        title: content.title,
        description: content.description,
        type: content.type,
        source: content.source,
        duration: content.duration
      },
      validationResults,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    await this.saveApprovalRequest(approvalRequest);
    return approvalRequest;
  }

  async notifyParent(approvalRequest) {
    const parent = await this.getParentProfile(approvalRequest.parentId);
    const child = await this.getChildProfile(approvalRequest.childId);

    // Send in-app notification
    await this.notificationService.sendNotification({
      userId: parent.id,
      type: 'parental_approval_required',
      title: 'Content Approval Required',
      message: `Please review content "${approvalRequest.content.title}" for ${child.name}`,
      data: {
        approvalRequestId: approvalRequest.id,
        contentTitle: approvalRequest.content.title,
        childName: child.name
      }
    });

    // Send email notification if enabled
    if (parent.settings.emailNotifications) {
      await this.emailService.sendEmail({
        to: parent.email,
        subject: 'Content Approval Required - Study Planner',
        template: 'parental-approval-request',
        data: {
          parentName: parent.name,
          childName: child.name,
          contentTitle: approvalRequest.content.title,
          contentDescription: approvalRequest.content.description,
          safetyRating: approvalRequest.validationResults.overallRating,
          approvalUrl: `${process.env.FRONTEND_URL}/parent/approvals/${approvalRequest.id}`
        }
      });
    }
  }

  async processApprovalDecision(approvalRequestId, decision, parentId) {
    const approvalRequest = await this.getApprovalRequest(approvalRequestId);
    
    // Verify parent authorization
    if (approvalRequest.parentId !== parentId) {
      throw new UnauthorizedError('Not authorized to approve this content');
    }

    // Update approval request
    approvalRequest.status = decision; // 'approved' or 'rejected'
    approvalRequest.decidedAt = new Date().toISOString();
    approvalRequest.decidedBy = parentId;

    await this.updateApprovalRequest(approvalRequest);

    // Update content status based on decision
    if (decision === 'approved') {
      await this.approveContent(approvalRequest.contentId, approvalRequest.childId);
    } else {
      await this.blockContent(approvalRequest.contentId, approvalRequest.childId);
    }

    // Notify child if content was approved
    if (decision === 'approved') {
      await this.notifyChildOfApprovedContent(approvalRequest);
    }

    return approvalRequest;
  }
}
```

---

## Performance Optimization

### Caching Strategy

```javascript
class GeminiCacheService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 7 * 24 * 60 * 60; // 7 days
  }

  async getCachedResponse(prompt, options = {}) {
    const cacheKey = this.generateCacheKey(prompt, options);
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  async setCachedResponse(prompt, response, options = {}) {
    const cacheKey = this.generateCacheKey(prompt, options);
    const ttl = options.ttl || this.defaultTTL;
    
    await this.redis.setex(cacheKey, ttl, JSON.stringify({
      response,
      cachedAt: new Date().toISOString()
    }));
  }

  generateCacheKey(prompt, options) {
    const hash = crypto
      .createHash('sha256')
      .update(prompt + JSON.stringify(options))
      .digest('hex');
    
    return `gemini:${hash}`;
  }
}
```

### Request Batching

```javascript
class GeminiBatchProcessor {
  constructor(geminiService) {
    this.geminiService = geminiService;
    this.batchQueue = [];
    this.batchSize = 5;
    this.batchTimeout = 1000; // 1 second
    this.processingBatch = false;
  }

  async addToBatch(request) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.scheduleBatchProcessing();
    });
  }

  scheduleBatchProcessing() {
    if (this.processingBatch) return;

    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch();
    } else {
      setTimeout(() => {
        if (this.batchQueue.length > 0) {
          this.processBatch();
        }
      }, this.batchTimeout);
    }
  }

  async processBatch() {
    if (this.processingBatch || this.batchQueue.length === 0) return;

    this.processingBatch = true;
    const batch = this.batchQueue.splice(0, this.batchSize);

    try {
      const results = await Promise.allSettled(
        batch.map(item => this.geminiService.generateContent(item.request.prompt, item.request.options))
      );

      batch.forEach((item, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          item.resolve(result.value);
        } else {
          item.reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    } finally {
      this.processingBatch = false;
    }
  }
}
```

---

## Error Handling

### Custom Error Classes

```javascript
class GeminiAPIError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'GeminiAPIError';
    this.originalError = originalError;
    this.retryable = this.isRetryable(originalError);
  }

  isRetryable(error) {
    const retryableCodes = [429, 500, 502, 503, 504];
    return retryableCodes.includes(error?.status);
  }
}

class ContentSafetyError extends Error {
  constructor(message, safetyRatings) {
    super(message);
    this.name = 'ContentSafetyError';
    this.safetyRatings = safetyRatings;
  }
}

class StudyPlanParsingError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'StudyPlanParsingError';
    this.originalError = originalError;
  }
}
```

### Retry Logic with Exponential Backoff

```javascript
class RetryHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries || !this.shouldRetry(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  shouldRetry(error) {
    return error instanceof GeminiAPIError && error.retryable;
  }

  calculateDelay(attempt) {
    return this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Testing and Validation

### Unit Tests for Gemini Integration

```javascript
describe('GeminiService', () => {
  let geminiService;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      generateContent: jest.fn()
    };
    geminiService = new GeminiService();
    geminiService.client = mockClient;
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: { parts: [{ text: 'Generated content' }] },
          finishReason: 'STOP',
          safetyRatings: []
        }]
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateContent('Test prompt');

      expect(result.content).toBe('Generated content');
      expect(result.finishReason).toBe('STOP');
    });

    it('should handle safety blocks', async () => {
      const mockResponse = {
        candidates: [{
          finishReason: 'SAFETY',
          safetyRatings: [{ category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH' }]
        }]
      };

      mockClient.generateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.generateContent('Unsafe prompt'))
        .rejects.toThrow(ContentSafetyError);
    });
  });
});
```

### Integration Tests

```javascript
describe('Study Plan Generation Integration', () => {
  let studyPlanGenerator;
  let contentSafetyService;

  beforeEach(() => {
    studyPlanGenerator = new StudyPlanGenerator(mockGeminiService);
    contentSafetyService = new ContentSafetyService(mockGeminiService);
  });

  it('should generate and validate a complete study plan', async () => {
    const request = {
      childAge: 10,
      gradeLevel: '5th',
      subject: 'mathematics',
      learningStyle: 'visual',
      duration: 60,
      objectives: ['Learn fractions', 'Practice multiplication']
    };

    const studyPlan = await studyPlanGenerator.generateStudyPlan(request);
    
    expect(studyPlan.title).toBeDefined();
    expect(studyPlan.activities).toHaveLength(expect.any(Number));
    
    // Validate each activity for safety
    for (const activity of studyPlan.activities) {
      const safetyResult = await contentSafetyService.validateContent(activity, request.childAge);
      expect(safetyResult.overallRating).not.toBe('blocked');
    }
  });
});
```

### Performance Tests

```javascript
describe('Gemini Performance', () => {
  it('should handle concurrent requests efficiently', async () => {
    const requests = Array(10).fill().map((_, i) => 
      geminiService.generateContent(`Test prompt ${i}`)
    );

    const startTime = Date.now();
    const results = await Promise.all(requests);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
  });

  it('should utilize caching effectively', async () => {
    const prompt = 'Repeated test prompt';
    
    // First request
    const start1 = Date.now();
    await geminiService.generateContent(prompt);
    const time1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    await geminiService.generateContent(prompt);
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1 * 0.1); // Cached request should be much faster
  });
});
```

This comprehensive guide provides all the necessary information for implementing Gemini Pro API integration with robust content safety features, ensuring a secure and educational experience for children while providing parents with appropriate oversight and control.