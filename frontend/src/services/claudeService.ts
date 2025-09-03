import { claudeApi } from './api';
import { HelpRequest } from '../types/activity';

interface ClaudeHelpRequest {
  question: string;
  activityId: string;
  childAge: number;
  activityContext: {
    title: string;
    subject: string;
    currentStep?: number;
    currentContent?: any;
  };
}

export interface ClaudeErrorResponse {
  status: number;
  message: string;
  errorType: 'network' | 'server' | 'timeout' | 'unknown';
}

export const claudeService = {
  /**
   * Request help from Claude AI with context about the current activity
   * @param request Help request with question and context
   * @returns Help request with Claude's response
   */
  requestHelp: async (request: ClaudeHelpRequest): Promise<HelpRequest> => {
    try {
      // Add a timeout to the request
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });

      // Race the actual request against the timeout
      const response = await Promise.race([
        claudeApi.requestHelp(request),
        timeoutPromise
      ]);

      return response;
    } catch (error) {
      console.error('Error requesting help from Claude:', error);

      // Determine error type for better user feedback
      let errorResponse: ClaudeErrorResponse = {
        status: 500,
        message: 'An unknown error occurred',
        errorType: 'unknown'
      };

      if (error instanceof Error) {
        if (error.message === 'Request timed out') {
          errorResponse = {
            status: 408,
            message: 'The request took too long to complete. Please try again.',
            errorType: 'timeout'
          };
        } else if (error.message.includes('Network') || error.message.includes('connection')) {
          errorResponse = {
            status: 503,
            message: 'Network connection issue. Please check your internet connection.',
            errorType: 'network'
          };
        } else if (error.message.includes('500') || error.message.includes('server')) {
          errorResponse = {
            status: 500,
            message: 'The server encountered an error. Please try again later.',
            errorType: 'server'
          };
        }
      }

      // Create a fallback help request with error information
      const fallbackResponse: HelpRequest = {
        id: `error-${Date.now()}`,
        question: request.question,
        timestamp: new Date().toISOString(),
        response: claudeService.getErrorMessage(errorResponse, request.childAge)
      };

      return fallbackResponse;
    }
  },

  /**
   * Format a response for a specific child age
   * @param response The response text to format
   * @param childAge The age of the child
   * @returns Formatted response appropriate for the child's age
   */
  formatResponseForAge: (response: string, childAge: number): string => {
    // For younger children (5-7)
    if (childAge <= 7) {
      return response
        .replace(/\b(difficult|challenging)\b/gi, 'tricky')
        .replace(/\b(attempt|try)\b/gi, 'give it a go')
        .replace(/\.$/, '! 😊')
        .replace(/\b(however|nevertheless|furthermore)\b/gi, 'and')
        .replace(/\b(utilize|employ)\b/gi, 'use')
        .split('. ').join('! ')
        .replace(/!!/g, '!');
    }

    // For middle age range (8-10)
    if (childAge <= 10) {
      return response
        .replace(/\b(utilize|employ)\b/gi, 'use')
        .replace(/\b(however|nevertheless)\b/gi, 'but')
        .replace(/\b(furthermore)\b/gi, 'also');
    }

    // For older children (11+), keep the original response
    return response;
  },

  /**
   * Get a welcome message appropriate for the child's age
   * @param childAge The age of the child
   * @param context The activity context
   * @returns Age-appropriate welcome message
   */
  getWelcomeMessage: (childAge: number, context: any): string => {
    if (childAge <= 7) {
      return `Hi there! 👋 I'm Claude, your friendly helper! I can see you're working on "${context.title}". If you need any help, just ask me! I'm here to help you learn and have fun!`;
    } else if (childAge <= 10) {
      return `Hello! 👋 I'm Claude, your learning assistant. I'm here to help you with "${context.title}". What questions do you have about this activity?`;
    } else {
      return `Hi there! 👋 I'm Claude, your AI learning assistant. I can help you with "${context.title}". Feel free to ask me any questions about this activity!`;
    }
  },

  /**
   * Get subject-specific help suggestions based on the activity context
   * @param subject The subject of the activity
   * @returns Array of subject-specific help suggestions
   */
  getSubjectSpecificSuggestions: (subject: string): string[] => {
    const suggestions: string[] = [];

    switch (subject.toLowerCase()) {
      case 'math':
        suggestions.push(
          'How do I solve this math problem?',
          'Can you explain this formula?',
          'What does this math symbol mean?',
          'How do I start solving this?'
        );
        break;
      case 'science':
        suggestions.push(
          'Can you explain this science concept?',
          'What does this scientific term mean?',
          'How does this experiment work?',
          'Why does this happen in science?'
        );
        break;
      case 'reading':
        suggestions.push(
          'What does this word mean?',
          'Can you help me understand this paragraph?',
          'Whats the main idea of this text?',
          'How do I find the theme?'
        );
        break;
      case 'writing':
        suggestions.push(
          'How do I start my essay?',
          'Can you help me with grammar?',
          'How do I make this sentence better?',
          'What should I include in my conclusion?'
        );
        break;
      case 'history':
        suggestions.push(
          'Why is this historical event important?',
          'Who was this historical figure?',
          'What happened during this time period?',
          'How did this event change history?'
        );
        break;
      default:
        suggestions.push(
          'Can you explain this in more detail?',
          'How do I approach this problem?',
          'What are the key points I should remember?'
        );
    }

    return suggestions;
  },

  /**
   * Get an age-appropriate error message
   * @param error The error response
   * @param childAge The age of the child
   * @returns Age-appropriate error message
   */
  getErrorMessage: (error: ClaudeErrorResponse, childAge: number): string => {
    // For younger children (5-7)
    if (childAge <= 7) {
      switch (error.errorType) {
        case 'network':
          return "Oops! 😮 I can't talk right now because the internet is having a little nap. Please check if you're connected to the internet and try again!";
        case 'timeout':
          return "Hmm, I'm thinking too hard and need a little break! 🤔 Can you ask me again? Sometimes I need to restart my brain!";
        case 'server':
          return "Oh no! My robot brain is a bit tired right now. 😴 Let's try again in a little bit!";
        default:
          return "Something went a bit silly! 🙃 Let's try asking again or maybe ask a different question!";
      }
    }

    // For middle age range (8-10)
    if (childAge <= 10) {
      switch (error.errorType) {
        case 'network':
          return "I can't connect right now. 🌐 Please check your internet connection and try again!";
        case 'timeout':
          return "It's taking me too long to think of an answer. 🕒 Can you try asking me again?";
        case 'server':
          return "My brain is having a little trouble right now. 🤖 Let's try again soon!";
        default:
          return "Something went wrong with your question. 🤔 Can you try asking in a different way?";
      }
    }

    // For older children (11+)
    return error.message;
  },

  /**
   * Get a response for when Claude doesn't know the answer
   * @param childAge The age of the child
   * @returns Age-appropriate "I don't know" response
   */
  getUncertaintyResponse: (childAge: number): string => {
    if (childAge <= 7) {
      return "Hmm, I'm not sure about that! 🤔 But let's figure it out together! Can you tell me more about what you're trying to do?";
    } else if (childAge <= 10) {
      return "I don't know the exact answer to that question, but I can help you figure it out! What part are you having trouble with?";
    } else {
      return "I'm not certain about the answer to your question. Let's approach this step by step. Could you provide more details about what you're trying to understand?";
    }
  }
};

export default claudeService;