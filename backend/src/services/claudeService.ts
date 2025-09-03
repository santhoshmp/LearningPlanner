import axios from 'axios';
import { prisma } from '../utils/database';
import { logger, logSecurityEvent, logAuditEvent } from '../utils/logger';
import { monitoringService } from './monitoringService';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { v4 as uuidv4 } from 'uuid';

// Environment variables for Claude API configuration
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'dummy_api_key';
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
const CLAUDE_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '1024', 10);

// Rate limiting configuration
const RATE_LIMIT_POINTS = parseInt(process.env.CLAUDE_RATE_LIMIT_POINTS || '10', 10); // Number of requests
const RATE_LIMIT_DURATION = parseInt(process.env.CLAUDE_RATE_LIMIT_DURATION || '60', 10); // Per duration in seconds

// Create rate limiters
const userRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_POINTS,
  duration: RATE_LIMIT_DURATION,
});

const globalRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_POINTS * 5, // Higher limit for global usage
  duration: RATE_LIMIT_DURATION,
});

// Content safety configuration
const CONTENT_SAFETY_KEYWORDS = [
  'inappropriate',
  'adult content',
  'violence',
  'weapon',
  'drugs',
  'alcohol',
  'suicide',
  'self-harm',
  'gambling',
  'profanity'
];

// Interface definitions
export interface ClaudeRequestParams {
  question: string;
  activityId: string;
  childId: string;
  childAge: number;
  activityContext: {
    title: string;
    subject: string;
    currentStep?: number;
    currentContent?: any;
  };
}

export interface StudyPlanParams {
  subject: string;
  difficulty: string;
  childAge: number;
  learningStyle: string;
  objectives?: string[];
  duration?: number; // in minutes
}

export interface ActivityGenerationParams {
  planId: string;
  subject: string;
  title: string;
  difficulty: number;
  childAge: number;
  learningStyle: string;
  objectives: string[];
  previousActivities?: string[];
}

export interface ClaudeResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ContentSafetyCheck {
  isAppropriate: boolean;
  ageAppropriate: boolean;
  educationalValue: number;
  concerns: string[];
}

/**
 * Service for interacting with Claude AI API
 */
export const claudeService = {
  /**
   * Request help from Claude AI with context about the current activity
   * @param params Help request parameters
   * @returns Help response with Claude's answer
   */
  requestHelp: async (params: ClaudeRequestParams) => {
    try {
      // Apply rate limiting
      try {
        await userRateLimiter.consume(params.childId);
        await globalRateLimiter.consume('global');
      } catch (err) {
        const error = err as Error;
        logger.warn(`Rate limit exceeded for help request: ${params.childId}`);
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Generate a request ID for tracking
      const requestId = uuidv4();
      
      // Create a system prompt that instructs Claude how to respond based on child's age
      const systemPrompt = claudeService.createSystemPrompt(params.childAge, params.activityContext);
      
      // Log the request attempt
      logAuditEvent(
        'claude_help_request',
        'system',
        `activity:${params.activityId}`,
        {
          childId: params.childId,
          childAge: params.childAge,
          question: params.question,
          requestId
        },
        true
      );
      
      // Create the request to Claude API
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: params.question
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'x-request-id': requestId
          }
        }
      );

      const claudeResponse = response.data as ClaudeResponse;
      
      // Check content safety
      const safetyCheck = await claudeService.checkContentSafety(
        claudeResponse.content,
        params.childAge
      );
      
      // If content is not appropriate, log and return a safe response
      if (!safetyCheck.isAppropriate || !safetyCheck.ageAppropriate) {
        logSecurityEvent('inappropriate_content_detected', {
          requestId,
          childId: params.childId,
          childAge: params.childAge,
          concerns: safetyCheck.concerns,
          contentType: 'response'
        });
        
        // Return a safe alternative response
        return claudeService.generateSafeResponse(params.childAge, params.activityContext);
      }
      
      // Track Claude API usage for monitoring 
      await monitoringService.trackApiUsage(
        'help_request',
        claudeResponse.usage.input_tokens,
        claudeResponse.usage.output_tokens,
        'system', // System-initiated request
        params.childId,
        true
      );
      
      // Log the help request for parent visibility
      const helpRequest = await prisma.helpRequest.create({
        data: {
          question: params.question,
          response: claudeResponse.content,
          activityId: params.activityId,
          childId: params.childId,
          context: params.activityContext,
          timestamp: new Date(),
          inputTokens: claudeResponse.usage.input_tokens,
          outputTokens: claudeResponse.usage.output_tokens
        }
      });

      return {
        id: helpRequest.id,
        question: helpRequest.question,
        response: helpRequest.response,
        timestamp: helpRequest.timestamp.toISOString()
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Error requesting help from Claude:', error);
      
      // Check if it's a rate limiting error
      if (error.message.includes('Rate limit')) {
        throw error;
      }
      
      // For other errors, provide a generic message
      throw new Error('Failed to get help from Claude. Please try again later.');
    }
  },

  /**
   * Generate a study plan using Claude AI
   * @param params Study plan parameters
   * @returns Generated study plan content
   */
  generateStudyPlan: async (params: StudyPlanParams) => {
    try {
      // Apply rate limiting
      try {
        await globalRateLimiter.consume('global');
      } catch (err) {
        const error = err as Error;
        logger.warn('Rate limit exceeded for study plan generation');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Generate a request ID for tracking
      const requestId = uuidv4();
      
      // Create a system prompt for study plan generation
      const systemPrompt = `You are an educational expert creating a study plan for a ${params.childAge}-year-old child.
      
Subject: ${params.subject}
Difficulty level: ${params.difficulty}
Learning style preference: ${params.learningStyle}

Your task is to create a structured study plan with the following components:
1. A list of 5-8 clear learning objectives appropriate for the child's age
2. A sequence of 5-10 engaging activities that build progressively
3. Each activity should have a difficulty rating (1-5)
4. Activities should match the child's learning style
5. Include a mix of instruction, practice, and assessment activities

IMPORTANT GUIDELINES:
- All content must be age-appropriate for a ${params.childAge}-year-old
- Use language that is accessible but not condescending
- Focus on building foundational understanding and skills
- Ensure educational value in all activities
- Be creative and engaging

Please format your response as a JSON object:
{
  "objectives": ["objective1", "objective2", ...],
  "activities": [
    {
      "title": "Activity Title",
      "description": "Brief description",
      "estimatedDuration": 15, // in minutes
      "difficulty": 2, // 1-5 scale
      "type": "instruction|practice|assessment",
      "content": {
        // Activity-specific structure
      }
    },
    // More activities...
  ]
}`;

      // Log the request attempt
      logAuditEvent(
        'claude_plan_generation',
        'system',
        `subject:${params.subject}`,
        {
          childAge: params.childAge,
          difficulty: params.difficulty,
          learningStyle: params.learningStyle,
          requestId
        },
        true
      );
      
      // Make the request to Claude API
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          temperature: 0.6,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Please create a study plan for ${params.subject}.`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'x-request-id': requestId
          }
        }
      );

      const claudeResponse = response.data as ClaudeResponse;
      
      // Extract JSON from the response
      const jsonMatch = claudeResponse.content.match(/```json\n([\s\S]*?)\n```/) || 
                       [null, claudeResponse.content];
      
      let planContent;
      try {
        planContent = JSON.parse(jsonMatch[1] || claudeResponse.content);
      } catch (err) {
        const error = err as Error;
        logger.error('Error parsing study plan content:', error);
        throw new Error('Failed to parse study plan content');
      }
      
      // Check content safety
      const safetyCheck = await claudeService.checkContentSafety(
        JSON.stringify(planContent),
        params.childAge
      );
      
      // If content is not appropriate, log and throw error
      if (!safetyCheck.isAppropriate || !safetyCheck.ageAppropriate) {
        logSecurityEvent('inappropriate_content_detected', {
          requestId,
          childAge: params.childAge,
          concerns: safetyCheck.concerns,
          contentType: 'plan'
        });
        
        throw new Error('Generated content was flagged as inappropriate');
      }
      
      // Track Claude API usage
      await monitoringService.trackApiUsage(
        'study_plan',
        claudeResponse.usage.input_tokens,
        claudeResponse.usage.output_tokens,
        'system',
        undefined,
        true
      );
      
      return {
        content: planContent,
        usage: {
          inputTokens: claudeResponse.usage.input_tokens,
          outputTokens: claudeResponse.usage.output_tokens,
          totalTokens: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens
        }
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Error generating study plan with Claude:', error);
      
      // Check if it's a rate limiting error
      if (error.message.includes('Rate limit')) {
        throw error;
      }
      
      // For other errors, provide a generic message
      throw new Error('Failed to generate study plan. Please try again later.');
    }
  },

  /**
   * Generate an activity using Claude AI
   * @param params Activity generation parameters
   * @returns Generated activity content
   */
  generateActivity: async (params: ActivityGenerationParams) => {
    try {
      // Apply rate limiting
      try {
        await globalRateLimiter.consume('global');
      } catch (err) {
        const error = err as Error;
        logger.warn('Rate limit exceeded for activity generation');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Generate a request ID for tracking
      const requestId = uuidv4();
      
      // Create a system prompt for activity generation
      const systemPrompt = `You are an educational expert creating an activity for a ${params.childAge}-year-old child.

The activity should be for the subject: ${params.subject}
Activity title: ${params.title}
Difficulty level: ${params.difficulty} (on a scale of 1-5)
Learning style preference: ${params.learningStyle}

Your task is to create an engaging educational activity with these components:
1. A detailed description of the activity
2. Step-by-step instructions
3. Any necessary content or materials
4. Completion criteria that clearly define success

The activity should address these learning objectives:
${params.objectives.map(obj => `- ${obj}`).join('\n')}

IMPORTANT GUIDELINES:
- All content must be age-appropriate for a ${params.childAge}-year-old
- Use language that is accessible but not condescending
- Make the activity engaging and interactive
- Ensure educational value and alignment with objectives
- Make the activity engaging and interactive
- Avoid any inappropriate content

Please format your response as a JSON object:
{
  "description": "Detailed activity description",
  "instructions": ["step1", "step2", ...],
  "content": {
    // Activity-specific content
  },
  "completion": {
    "type": "questions|task|project",
    "requirements": ["requirement1", "requirement2", ...],
    "successThreshold": "criteria for success"
  }
}`;

      // Log the request attempt
      logAuditEvent(
        'claude_activity_generation',
        'system',
        `plan:${params.planId}`,
        {
          subject: params.subject,
          title: params.title,
          difficulty: params.difficulty,
          childAge: params.childAge,
          requestId
        },
        true
      );
      
      // Make the request to Claude API
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS * 1.5, // Allow more tokens for activities
          temperature: 0.6,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Please create a learning activity for ${params.title}.`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'x-request-id': requestId
          }
        }
      );

      const claudeResponse = response.data as ClaudeResponse;
      
      // Extract JSON from the response
      const jsonMatch = claudeResponse.content.match(/```json\n([\s\S]*?)\n```/) || 
                       [null, claudeResponse.content];
      
      let activityContent;
      try {
        activityContent = JSON.parse(jsonMatch[1] || claudeResponse.content);
      } catch (err) {
        const error = err as Error;
        logger.error('Error parsing activity content:', error);
        throw new Error('Failed to parse activity content');
      }
      
      // Check content safety
      const safetyCheck = await claudeService.checkContentSafety(
        JSON.stringify(activityContent),
        params.childAge
      );
      
      // If content is not appropriate, log and throw error
      if (!safetyCheck.isAppropriate || !safetyCheck.ageAppropriate) {
        logSecurityEvent('inappropriate_content_detected', {
          requestId,
          childAge: params.childAge,
          concerns: safetyCheck.concerns,
          contentType: 'activity'
        });
        
        throw new Error('Generated content was flagged as inappropriate');
      }
      
      // Track Claude API usage
      await monitoringService.trackApiUsage(
        'activity_generation',
        claudeResponse.usage.input_tokens,
        claudeResponse.usage.output_tokens,
        'system',
        undefined,
        true
      );
      
      return {
        content: activityContent,
        usage: {
          inputTokens: claudeResponse.usage.input_tokens,
          outputTokens: claudeResponse.usage.output_tokens,
          totalTokens: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens
        }
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Error generating activity with Claude:', error);
      
      // Check if it's a rate limiting error
      if (error.message.includes('Rate limit')) {
        throw error;
      }
      
      // For other errors, provide a generic message
      throw new Error('Failed to generate activity. Please try again later.');
    }
  },

  /**
   * Create a system prompt for Claude based on child's age
   * @param childAge The age of the child
   * @param activityContext Context of the activity
   * @returns System prompt for Claude
   */
  createSystemPrompt: (childAge: number, activityContext: any): string => {
    // Base instructions
    let prompt = `You are an educational assistant helping a ${childAge}-year-old child.
    
The child is currently working on an activity about "${activityContext.title}".

Your goal is to provide helpful, encouraging, and educational assistance.`;

    // Age-specific instructions
    if (childAge <= 7) {
      prompt += `
      
Since the child is ${childAge} years old (quite young):
- Use very simple language and short sentences
- Be extremely encouraging and positive
- Use emojis occasionally to show enthusiasm
- Explain concepts using familiar examples
- Keep your responses brief (2-3 short paragraphs maximum)
- Use exclamation marks to show excitement
- Avoid complex terminology
- If you don't know an answer, say so in a friendly way and suggest asking a teacher`;
    } else if (childAge <= 10) {
      prompt += `
      
Since the child is ${childAge} years old:
- Use clear, straightforward language
- Be encouraging and positive
- Explain concepts step-by-step
- Use examples that are relevant to their age group
- Keep responses concise (3-4 paragraphs maximum)
- Use some educational terminology but explain it
- If you don't know an answer, acknowledge it and suggest how to find the answer`;
    } else {
      prompt += `
      
Since the child is ${childAge} years old:
- Use age-appropriate but more advanced language
- Be supportive but not condescending
- Provide detailed explanations when needed
- Use relevant examples and analogies
- Include educational terminology with explanations
- Encourage critical thinking and problem-solving
- If you don't know an answer, acknowledge it and suggest reliable resources`;
    }

    // Safety and educational focus
    prompt += `

IMPORTANT SAFETY GUIDELINES:
- Never provide harmful, inappropriate, or non-educational content
- Always maintain an educational focus
- Never share personal information or ask for personal details
- Keep all responses age-appropriate
- Focus on being helpful for their learning journey`;

    return prompt;
  },

  /**
   * Check content for safety and age-appropriateness
   * @param content Content to check
   * @param childAge Age of the child
   * @returns Safety check results
   */
  checkContentSafety: async (content: string, childAge: number): Promise<ContentSafetyCheck> => {
    try {
      // Basic keyword check
      const contentLower = content.toLowerCase();
      const foundKeywords = CONTENT_SAFETY_KEYWORDS.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      );
      
      // If we find obvious problematic keywords, return immediately
      if (foundKeywords.length > 0) {
        return {
          isAppropriate: false,
          ageAppropriate: false,
          educationalValue: 0,
          concerns: foundKeywords
        };
      }
      
      // For more advanced checking, we can use Claude itself
      // This is a simplified version - in production, use a dedicated content safety API
      const requestId = uuidv4();
      
      const systemPrompt = `You are a content safety expert evaluating educational content for children.
      
Please evaluate the following content for appropriateness for children.

Evaluate on these criteria:
1. General appropriateness (no harmful content)
2. Age-appropriateness for a ${childAge}-year-old child
3. Educational value (on a scale of 0-10)

Respond with a JSON object only, using this format:
{
  "isAppropriate": true/false,
  "ageAppropriate": true/false,
  "educationalValue": 0-10,
  "concerns": ["concern1", "concern2", ...]
}`;
      
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: 200,
          temperature: 0,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Please evaluate this content: ${content.substring(0, 1000)}` // Limit length
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'x-request-id': requestId
          }
        }
      );

      const claudeResponse = response.data as ClaudeResponse;
      
      // Extract JSON from the response
      let safetyCheck: ContentSafetyCheck;
      try {
        safetyCheck = JSON.parse(claudeResponse.content);
      } catch (err) {
        const error = err as Error;
        logger.error('Error parsing safety check response:', error);
        
        // Default to safe if we can't parse the response
        safetyCheck = {
          isAppropriate: true,
          ageAppropriate: true,
          educationalValue: 5,
          concerns: []
        };
      }
      
      // Track the safety check
      await monitoringService.trackApiUsage(
        'content_safety_check',
        claudeResponse.usage.input_tokens,
        claudeResponse.usage.output_tokens,
        'system',
        undefined,
        true
      );
      
      return safetyCheck;
    } catch (error) {
      logger.error('Error checking content safety:', error);
      
      // Default to safe in case of error
      return {
        isAppropriate: true,
        ageAppropriate: true,
        educationalValue: 5,
        concerns: []
      };
    }
  },

  /**
   * Generate a safe response when content is flagged as inappropriate
   * @param childAge Age of the child
   * @param activityContext Context of the activity
   * @returns Safe response object
   */
  generateSafeResponse: async (childAge: number, activityContext: any) => {
    
    let safeResponse = '';
    
    if (childAge <= 7) {
      safeResponse = `I'm sorry, I can't answer that question right now. Let's talk about your ${activityContext.title} activity instead! What part are you working on? I'm here to help you learn and have fun! 😊`;
    } else if (childAge <= 10) {
      safeResponse = `I'm sorry, I can't answer that question right now. Could you ask me something about the ${activityContext.title} activity you're working with?`;
    } else {
      safeResponse = `I apologize, but I'm not able to respond to that request. I'm here to help with your ${activityContext.title} activity. What specific part of the activity can I help you with?`;
    }
    
    // Create a mock help request record
    const helpRequest = await prisma.helpRequest.create({
      data: {
        question: '[filtered]',
        response: safeResponse,
        activityId: activityContext.id || 'unknown',
        childId: 'system',
        context: activityContext,
        timestamp: new Date(),
        filtered: true
      }
    });
    
    return {
      id: helpRequest.id,
      question: '[filtered]',
      response: safeResponse,
      timestamp: helpRequest.timestamp.toISOString()
    };
  },

  /**
   * Get help requests for a child
   * @param childId The ID of the child
   * @returns Array of help requests
   */
  getHelpRequests: async (childId: string) => {
    try {
      const helpRequests = await prisma.helpRequest.findMany({
        where: {
          childId
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return helpRequests.map(request => ({
        id: request.id,
        question: request.question,
        response: request.response,
        activityId: request.activityId,
        timestamp: request.timestamp.toISOString()
      }));
    } catch (err) {
      const error = err as Error;
      logger.error('Error fetching help requests:', error);
      throw new Error('Failed to fetch help requests');
    }
  },

  /**
   * Get help requests for a child (alias for getHelpRequests)
   * @param childId The ID of the child
   * @returns Array of help requests
   */
  getHelpRequestsByChild: async (childId: string) => {
    return claudeService.getHelpRequests(childId);
  },
  
  /**
   * Get help requests for an activity
   * @param activityId The ID of the activity
   * @returns Array of help requests
   */
  getHelpRequestsByActivity: async (activityId: string) => {
    try {
      const helpRequests = await prisma.helpRequest.findMany({
        where: {
          activityId
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return helpRequests.map(request => ({
        id: request.id,
        childId: request.childId,
        question: request.question,
        response: request.response,
        timestamp: request.timestamp.toISOString()
      }));
    } catch (err) {
      const error = err as Error;
      logger.error('Error fetching help requests by activity:', error);
      throw new Error('Failed to fetch help requests');
    }
  }
};

export default claudeService;