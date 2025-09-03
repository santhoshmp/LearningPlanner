import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { logger, logSecurityEvent } from '../utils/logger';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './geminiService';
import { 
  GeminiStudyPlanResponse, 
  ContentRecommendation, 
  ContentSafetyResult 
} from '../types/gemini';

// Environment variables for content safety API configuration
const CONTENT_SAFETY_API_KEY = process.env.CONTENT_SAFETY_API_KEY || '';
const CONTENT_SAFETY_API_URL = process.env.CONTENT_SAFETY_API_URL || '';

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

// Age-appropriate content thresholds
const AGE_CONTENT_THRESHOLDS = {
  EARLY_CHILDHOOD: { min: 3, max: 6, maxDifficulty: 3, maxDuration: 15 },
  ELEMENTARY: { min: 7, max: 10, maxDifficulty: 5, maxDuration: 30 },
  MIDDLE_SCHOOL: { min: 11, max: 13, maxDifficulty: 7, maxDuration: 45 },
  HIGH_SCHOOL: { min: 14, max: 18, maxDifficulty: 10, maxDuration: 60 }
};

export interface ContentSafetyCheck {
  isAppropriate: boolean;
  ageAppropriate: boolean;
  educationalValue: number;
  concerns: string[];
}

export interface GeminiContentValidation {
  studyPlan: GeminiStudyPlanResponse;
  safetyResults: ContentSafetyResult[];
  filteredContent: ContentRecommendation[];
  parentalApprovalRequired: boolean;
  validationSummary: {
    totalContent: number;
    approvedContent: number;
    flaggedContent: number;
    requiresReview: number;
  };
}

export interface ParentalApprovalRequest {
  id: string;
  childId: string;
  studyPlanId: string;
  contentType: 'study_plan' | 'content_recommendation';
  contentData: any;
  safetyResults: ContentSafetyResult;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  parentNotes?: string;
}

/**
 * Service for content safety monitoring and filtering with Gemini integration
 */
export const contentSafetyService = {
  /**
   * Check content for safety and age-appropriateness
   * @param content Content to check
   * @param childAge Age of the child
   * @returns Safety check results
   */
  checkContentSafety: async (content: string, childAge: number): Promise<ContentSafetyCheck> => {
    try {
      // Basic keyword filtering
      const contentLower = content.toLowerCase();
      const foundKeywords = CONTENT_SAFETY_KEYWORDS.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      );
      
      // If any keywords are found, flag as inappropriate
      if (foundKeywords.length > 0) {
        // Log the safety concern
        logSecurityEvent('content_safety_flag', {
          concerns: foundKeywords,
          contentType: 'text',
          childAge,
          timestamp: new Date().toISOString()
        });
        
        return {
          isAppropriate: false,
          ageAppropriate: false,
          educationalValue: 0,
          concerns: foundKeywords
        };
      }
      
      // If an external content safety API is configured, use it for more advanced checking
      if (CONTENT_SAFETY_API_KEY && CONTENT_SAFETY_API_URL) {
        try {
          const response = await axios.post(
            CONTENT_SAFETY_API_URL,
            {
              text: content,
              childAge
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONTENT_SAFETY_API_KEY
              }
            }
          );
          
          const safetyCheck = response.data as ContentSafetyCheck;
          
          // If content is flagged, log the safety concern
          if (!safetyCheck.isAppropriate || !safetyCheck.ageAppropriate) {
            logSecurityEvent('content_safety_flag', {
              concerns: safetyCheck.concerns,
              contentType: 'text',
              childAge,
              timestamp: new Date().toISOString()
            });
          }
          
          return safetyCheck;
        } catch (error) {
          logger.error('Error calling content safety API:', error);
          // Fall back to default safe response if API call fails
        }
      }
      
      // Default to safe if no external API is configured or API call fails
      return {
        isAppropriate: true,
        ageAppropriate: true,
        educationalValue: 5,
        concerns: []
      };
    } catch (error) {
      logger.error('Error checking content safety:', error);
      
      // Default to safe if the check fails
      return {
        isAppropriate: true,
        ageAppropriate: true,
        educationalValue: 5,
        concerns: []
      };
    }
  },
  
  /**
   * Log a conversation for monitoring and safety review
   * @param childId Child ID
   * @param question Child's question
   * @param response AI response
   * @param activityId Activity ID
   * @param safetyCheck Safety check results
   */
  logConversation: async (
    childId: string,
    question: string,
    response: string,
    activityId: string,
    safetyCheck: ContentSafetyCheck
  ) => {
    try {
      // Create conversation log entry
      await prisma.conversationLog.create({
        data: {
          childId,
          question,
          response,
          activityId,
          flagged: !safetyCheck.isAppropriate || !safetyCheck.ageAppropriate,
          concerns: safetyCheck.concerns as any,
          timestamp: new Date()
        }
      });
      
      // If content is flagged, log a security event
      if (!safetyCheck.isAppropriate || !safetyCheck.ageAppropriate) {
        logSecurityEvent('inappropriate_conversation', {
          childId,
          activityId,
          concerns: safetyCheck.concerns,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Error logging conversation:', error);
      // Don't throw error to prevent disrupting the main application flow
    }
  },
  
  /**
   * Get flagged conversations for review
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @returns Flagged conversations
   */
  getFlaggedConversations: async (startDate: Date, endDate: Date) => {
    try {
      const flaggedConversations = await prisma.conversationLog.findMany({
        where: {
          flagged: true,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              age: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      return flaggedConversations;
    } catch (error) {
      logger.error('Error getting flagged conversations:', error);
      throw new Error('Failed to retrieve flagged conversations');
    }
  },
  
  /**
   * Generate a safe response when content is flagged as inappropriate
   * @param childAge Age of the child
   * @param activityContext Context of the activity
   * @returns Safe response
   */
  generateSafeResponse: (childAge: number, activityContext: any): string => {
    // Create a safe, generic response based on child's age
    let safeResponse = '';
    
    if (childAge <= 7) {
      safeResponse = `I'm sorry, I can't help with that question right now. Let's focus on your activity about ${activityContext.subject} called "${activityContext.title}"! Can you ask me something else about this activity? I'm here to help you learn! 😊`;
    } else if (childAge <= 10) {
      safeResponse = `I'm sorry, I can't answer that question right now. Let's get back to your activity about ${activityContext.subject}. Is there something specific about "${activityContext.title}" that you need help with?`;
    } else {
      safeResponse = `I apologize, but I'm unable to provide assistance with that question. Let's refocus on your current activity about ${activityContext.subject} titled "${activityContext.title}". What specific aspect of this activity would you like help with?`;
    }
    
    return safeResponse;
  },

  /**
   * Validate Gemini-generated study plan and content recommendations
   * @param studyPlan Generated study plan from Gemini
   * @param childAge Age of the child
   * @returns Validation results with safety assessment
   */
  validateGeminiContent: async (
    studyPlan: GeminiStudyPlanResponse,
    childAge: number
  ): Promise<GeminiContentValidation> => {
    try {
      logger.info('Validating Gemini content for safety', { 
        planId: studyPlan.planId, 
        childAge,
        contentCount: studyPlan.contentRecommendations.length 
      });

      const safetyResults: ContentSafetyResult[] = [];
      const filteredContent: ContentRecommendation[] = [];
      let parentalApprovalRequired = false;

      // Validate each content recommendation
      for (const content of studyPlan.contentRecommendations) {
        const contentText = `${content.title} ${content.description}`;
        const safetyResult = await geminiService.validateContentSafety(
          contentText,
          childAge,
          'text'
        );

        safetyResults.push(safetyResult);

        // Apply age-appropriate filtering
        const ageAppropriate = contentSafetyService.isAgeAppropriate(content, childAge);
        
        if (safetyResult.isAppropriate && ageAppropriate) {
          filteredContent.push(content);
        }

        if (safetyResult.parentalApprovalRequired) {
          parentalApprovalRequired = true;
        }
      }

      // Validate study plan activities
      for (const activity of studyPlan.activities) {
        const activityText = `${activity.title} ${activity.description} ${activity.instructions}`;
        const safetyResult = await geminiService.validateContentSafety(
          activityText,
          childAge,
          'text'
        );

        safetyResults.push(safetyResult);

        if (safetyResult.parentalApprovalRequired) {
          parentalApprovalRequired = true;
        }
      }

      const validationSummary = {
        totalContent: studyPlan.contentRecommendations.length,
        approvedContent: filteredContent.length,
        flaggedContent: safetyResults.filter(r => !r.isAppropriate).length,
        requiresReview: safetyResults.filter(r => r.parentalApprovalRequired).length
      };

      logger.info('Gemini content validation completed', validationSummary);

      return {
        studyPlan: {
          ...studyPlan,
          contentRecommendations: filteredContent
        },
        safetyResults,
        filteredContent,
        parentalApprovalRequired,
        validationSummary
      };

    } catch (error) {
      logger.error('Error validating Gemini content', { error: (error as Error).message });
      throw new Error(`Failed to validate Gemini content: ${(error as Error).message}`);
    }
  },

  /**
   * Check if content is age-appropriate based on difficulty and duration
   * @param content Content recommendation to check
   * @param childAge Age of the child
   * @returns Whether content is age-appropriate
   */
  isAgeAppropriate: (content: ContentRecommendation, childAge: number): boolean => {
    const threshold = contentSafetyService.getAgeThreshold(childAge);
    
    // Check difficulty level
    if (content.difficulty > threshold.maxDifficulty) {
      return false;
    }

    // Check duration
    if (content.duration > threshold.maxDuration) {
      return false;
    }

    // Check safety score
    if (content.safetyScore < 0.8) {
      return false;
    }

    return content.ageAppropriate;
  },

  /**
   * Get age-appropriate thresholds for content
   * @param childAge Age of the child
   * @returns Age threshold configuration
   */
  getAgeThreshold: (childAge: number) => {
    if (childAge >= AGE_CONTENT_THRESHOLDS.EARLY_CHILDHOOD.min && 
        childAge <= AGE_CONTENT_THRESHOLDS.EARLY_CHILDHOOD.max) {
      return AGE_CONTENT_THRESHOLDS.EARLY_CHILDHOOD;
    } else if (childAge >= AGE_CONTENT_THRESHOLDS.ELEMENTARY.min && 
               childAge <= AGE_CONTENT_THRESHOLDS.ELEMENTARY.max) {
      return AGE_CONTENT_THRESHOLDS.ELEMENTARY;
    } else if (childAge >= AGE_CONTENT_THRESHOLDS.MIDDLE_SCHOOL.min && 
               childAge <= AGE_CONTENT_THRESHOLDS.MIDDLE_SCHOOL.max) {
      return AGE_CONTENT_THRESHOLDS.MIDDLE_SCHOOL;
    } else {
      return AGE_CONTENT_THRESHOLDS.HIGH_SCHOOL;
    }
  },

  /**
   * Create parental approval request for flagged content
   * @param childId Child ID
   * @param studyPlanId Study plan ID
   * @param contentType Type of content requiring approval
   * @param contentData Content data
   * @param safetyResults Safety assessment results
   * @returns Approval request ID
   */
  createParentalApprovalRequest: async (
    childId: string,
    studyPlanId: string,
    contentType: 'study_plan' | 'content_recommendation',
    contentData: any,
    safetyResults: ContentSafetyResult
  ): Promise<string> => {
    try {
      const approvalId = uuidv4();
      
      // Store approval request in database
      await prisma.parentalApprovalRequest.create({
        data: {
          id: approvalId,
          childId,
          studyPlanId,
          contentType: contentType === 'study_plan' ? 'STUDY_PLAN' : 'CONTENT_RECOMMENDATION',
          contentData: JSON.stringify(contentData),
          safetyResults: JSON.stringify(safetyResults),
          requestedAt: new Date(),
          status: 'PENDING'
        }
      });

      // Log security event for parental approval requirement
      logSecurityEvent('parental_approval_required', {
        approvalId,
        childId,
        studyPlanId,
        contentType,
        concerns: safetyResults.reasons,
        timestamp: new Date().toISOString()
      });

      logger.info('Parental approval request created', { 
        approvalId, 
        childId, 
        contentType 
      });

      return approvalId;

    } catch (error) {
      logger.error('Error creating parental approval request', { error: (error as Error).message });
      throw new Error(`Failed to create parental approval request: ${(error as Error).message}`);
    }
  },

  /**
   * Process parental approval response
   * @param approvalId Approval request ID
   * @param parentId Parent ID
   * @param approved Whether content is approved
   * @param notes Optional parent notes
   * @returns Updated approval request
   */
  processParentalApproval: async (
    approvalId: string,
    parentId: string,
    approved: boolean,
    notes?: string
  ) => {
    try {
      const approvalRequest = await prisma.parentalApprovalRequest.findUnique({
        where: { id: approvalId },
        include: {
          child: {
            select: {
              parentId: true
            }
          }
        }
      });

      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      // Verify parent has permission to approve
      if (approvalRequest.child.parentId !== parentId) {
        throw new Error('Unauthorized to approve this request');
      }

      // Update approval status
      const updatedRequest = await prisma.parentalApprovalRequest.update({
        where: { id: approvalId },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          parentNotes: notes,
          processedAt: new Date()
        }
      });

      // Log the approval decision
      logSecurityEvent('parental_approval_processed', {
        approvalId,
        parentId,
        approved,
        childId: approvalRequest.childId,
        timestamp: new Date().toISOString()
      });

      logger.info('Parental approval processed', { 
        approvalId, 
        approved, 
        parentId 
      });

      return updatedRequest;

    } catch (error) {
      logger.error('Error processing parental approval', { error: (error as Error).message });
      throw new Error(`Failed to process parental approval: ${(error as Error).message}`);
    }
  },

  /**
   * Get pending parental approval requests for a parent
   * @param parentId Parent ID
   * @returns Pending approval requests
   */
  getPendingApprovalRequests: async (parentId: string) => {
    try {
      const pendingRequests = await prisma.parentalApprovalRequest.findMany({
        where: {
          status: 'PENDING',
          child: {
            parentId
          }
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              age: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      return pendingRequests.map(request => ({
        ...request,
        contentData: JSON.parse(request.contentData),
        safetyResults: JSON.parse(request.safetyResults)
      }));

    } catch (error) {
      logger.error('Error getting pending approval requests', { error: (error as Error).message });
      throw new Error('Failed to retrieve pending approval requests');
    }
  }
};

export default contentSafetyService;