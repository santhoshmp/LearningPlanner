import { default as api } from './api';

export interface ContentSafetyCheck {
  isAppropriate: boolean;
  ageAppropriate: boolean;
  educationalValue: number;
  concerns: string[];
}

export interface FlaggedConversation {
  id: string;
  childId: string;
  question: string;
  response: string;
  activityId: string;
  flagged: boolean;
  concerns: string[];
  timestamp: string;
  child: {
    id: string;
    name: string;
    age: number;
  };
}

/**
 * Service for content safety monitoring and filtering
 */
const contentSafetyService = {
  /**
   * Check content for safety and age-appropriateness
   * @param content Content to check
   * @param childAge Age of the child
   * @returns Safety check results
   */
  checkContentSafety: async (content: string, childAge: number): Promise<ContentSafetyCheck> => {
    try {
      const response = await api.post('/content-safety/check', { content, childAge });
      return response.data.data;
    } catch (error) {
      console.error('Error checking content safety:', error);
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
   * Get flagged conversations for review
   * @param startDate Start date for the report (optional)
   * @param endDate End date for the report (optional)
   * @returns Flagged conversations
   */
  getFlaggedConversations: async (
    startDate?: Date,
    endDate?: Date
  ): Promise<FlaggedConversation[]> => {
    try {
      const params: Record<string, string> = {};
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        params.endDate = endDate.toISOString();
      }
      
      const response = await api.get('/content-safety/flagged', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error getting flagged conversations:', error);
      throw new Error('Failed to retrieve flagged conversations');
    }
  },
  
  /**
   * Filter content for child safety
   * @param content Content to filter
   * @param childAge Age of the child
   * @returns Filtered content or original if safe
   */
  filterContent: async (content: string, childAge: number): Promise<string> => {
    try {
      // Check content safety
      const safetyCheck = await contentSafetyService.checkContentSafety(content, childAge);
      
      // If content is appropriate, return it unchanged
      if (safetyCheck.isAppropriate && safetyCheck.ageAppropriate) {
        return content;
      }
      
      // Otherwise, return a generic safe message
      return contentSafetyService.generateSafeResponse(childAge);
    } catch (error) {
      console.error('Error filtering content:', error);
      return content; // Return original content if filtering fails
    }
  },
  
  /**
   * Generate a safe response when content is flagged as inappropriate
   * @param childAge Age of the child
   * @returns Safe response
   */
  generateSafeResponse: (childAge: number): string => {
    // Create a safe, generic response based on child's age
    if (childAge <= 7) {
      return "I'm sorry, I can't show that content right now. Let's focus on your learning activities instead! 😊";
    } else if (childAge <= 10) {
      return "I'm sorry, that content isn't available right now. Let's get back to your learning activities.";
    } else {
      return "I apologize, but that content isn't appropriate for this educational platform. Let's focus on your learning activities instead.";
    }
  }
};

export default contentSafetyService;