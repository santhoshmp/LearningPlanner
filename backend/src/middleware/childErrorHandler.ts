import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { childErrorHandler } from '../services/childErrorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface ChildFriendlyError {
  code: string;
  message: string;
  friendlyMessage: string;
  statusCode: number;
  timestamp: string;
  requestId: string;
  retryable: boolean;
  helpText?: string;
}

export interface ErrorContext {
  childId?: string;
  activityId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
}

class ChildErrorHandlerMiddleware {
  private readonly CHILD_FRIENDLY_MESSAGES = {
    // Authentication Errors
    'CHILD_AUTH_REQUIRED': {
      message: 'Child authentication is required',
      friendlyMessage: "Let's log you in again! 🔑",
      statusCode: 401,
      retryable: true,
      helpText: 'Try logging in with your username and PIN'
    },
    'ACCESS_DENIED': {
      message: 'Access denied',
      friendlyMessage: "Oops! You can't access that right now 🚫",
      statusCode: 403,
      retryable: false,
      helpText: 'Ask a parent for help if you need to access this'
    },
    'SESSION_EXPIRED': {
      message: 'Session has expired',
      friendlyMessage: "Time to log in again! Your session timed out ⏰",
      statusCode: 401,
      retryable: true,
      helpText: 'Just enter your username and PIN again'
    },
    'NO_ACTIVE_SESSION': {
      message: 'No active session found',
      friendlyMessage: "Let's get you logged in! 🚪",
      statusCode: 401,
      retryable: true,
      helpText: 'Click the login button to start'
    },
    'SESSION_TOO_LONG': {
      message: 'Session has been active too long',
      friendlyMessage: "Great job studying! Time for a break 🌟",
      statusCode: 400,
      retryable: true,
      helpText: 'Take a 10-minute break, then log in again'
    },

    // Data Not Found Errors
    'CHILD_NOT_FOUND': {
      message: 'Child profile not found',
      friendlyMessage: "We can't find your profile 👤",
      statusCode: 404,
      retryable: false,
      helpText: 'Ask a parent to check your account settings'
    },
    'ACTIVITY_NOT_FOUND': {
      message: 'Activity not found',
      friendlyMessage: "That activity isn't available right now 📚",
      statusCode: 404,
      retryable: false,
      helpText: 'Try choosing a different activity from your study plan'
    },
    'ACHIEVEMENT_NOT_FOUND': {
      message: 'Achievement not found',
      friendlyMessage: "We can't find that badge 🏆",
      statusCode: 404,
      retryable: false,
      helpText: 'Check your badge collection for available badges'
    },
    'STUDY_PLAN_NOT_FOUND': {
      message: 'Study plan not found',
      friendlyMessage: "That study plan isn't available 📋",
      statusCode: 404,
      retryable: false,
      helpText: 'Ask a parent to create a new study plan for you'
    },

    // Validation Errors
    'VALIDATION_ERROR': {
      message: 'Validation failed',
      friendlyMessage: "Something doesn't look right with your answer 🤔",
      statusCode: 400,
      retryable: true,
      helpText: 'Double-check your work and try again'
    },
    'COMPLETION_VALIDATION_FAILED': {
      message: 'Activity completion validation failed',
      friendlyMessage: "Let's make sure you completed everything! ✅",
      statusCode: 400,
      retryable: true,
      helpText: 'Review the activity and make sure all parts are done'
    },
    'INVALID_PROGRESS_DATA': {
      message: 'Invalid progress data',
      friendlyMessage: "There's a problem saving your progress 💾",
      statusCode: 400,
      retryable: true,
      helpText: 'Try completing the activity again'
    },

    // Server Errors
    'DASHBOARD_FETCH_FAILED': {
      message: 'Failed to retrieve dashboard data',
      friendlyMessage: "Having trouble loading your dashboard 📊",
      statusCode: 500,
      retryable: true,
      helpText: 'Wait a moment and refresh the page'
    },
    'PROGRESS_UPDATE_FAILED': {
      message: 'Failed to update progress',
      friendlyMessage: "Your progress is safe! Just a tiny hiccup 💾",
      statusCode: 500,
      retryable: true,
      helpText: 'Your work is saved. Try again in a moment'
    },
    'COMPLETION_FAILED': {
      message: 'Failed to complete activity',
      friendlyMessage: "Almost there! Let's try finishing again 🎯",
      statusCode: 500,
      retryable: true,
      helpText: 'Your progress is saved. Click complete again'
    },
    'BADGES_FETCH_FAILED': {
      message: 'Failed to retrieve badges',
      friendlyMessage: "Can't load your badges right now 🏆",
      statusCode: 500,
      retryable: true,
      helpText: 'Your badges are safe! Try refreshing the page'
    },

    // Network Errors
    'NETWORK_ERROR': {
      message: 'Network connection error',
      friendlyMessage: "Having trouble connecting 🌐",
      statusCode: 503,
      retryable: true,
      helpText: 'Check your internet connection and try again'
    },
    'TIMEOUT_ERROR': {
      message: 'Request timeout',
      friendlyMessage: "That's taking too long! Let's try again ⏱️",
      statusCode: 408,
      retryable: true,
      helpText: 'Wait a moment and try again'
    },

    // Rate Limiting
    'RATE_LIMIT_EXCEEDED': {
      message: 'Too many requests',
      friendlyMessage: "Slow down there, speedy! 🏃‍♂️",
      statusCode: 429,
      retryable: true,
      helpText: 'Wait a few seconds before trying again'
    },

    // Default Error
    'UNKNOWN_ERROR': {
      message: 'An unexpected error occurred',
      friendlyMessage: "Something went wrong, but we're fixing it! 🛠️",
      statusCode: 500,
      retryable: true,
      helpText: 'Try again in a moment, or ask a parent for help'
    }
  };

  createChildFriendlyError(
    code: string,
    originalMessage?: string,
    context?: ErrorContext
  ): ChildFriendlyError {
    const errorDef = this.CHILD_FRIENDLY_MESSAGES[code] || this.CHILD_FRIENDLY_MESSAGES['UNKNOWN_ERROR'];
    const requestId = uuidv4();

    return {
      code,
      message: originalMessage || errorDef.message,
      friendlyMessage: errorDef.friendlyMessage,
      statusCode: errorDef.statusCode,
      timestamp: new Date().toISOString(),
      requestId,
      retryable: errorDef.retryable,
      helpText: errorDef.helpText
    };
  }

  async logError(
    error: Error | ChildFriendlyError,
    context: ErrorContext,
    req: Request
  ): Promise<void> {
    try {
      const errorId = uuidv4();
      const timestamp = new Date();

      // Log to application logger
      logger.error('Child route error', {
        errorId,
        code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack,
        context,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        timestamp
      });

      // Record in child error handler for pattern analysis
      if (context.childId) {
        await childErrorHandler.recordError({
          errorId,
          message: error.message,
          stack: error.stack,
          userAgent: req.get('User-Agent') || '',
          url: req.originalUrl,
          timestamp,
          ipAddress: req.ip,
          retryCount: 0
        });
      }
    } catch (logError) {
      // Don't let logging errors break the response
      logger.error('Failed to log child error:', logError);
    }
  }

  handleError = async (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context: ErrorContext = {
        childId: req.user?.userId,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        url: req.originalUrl
      };

      // Determine error code from error message or type
      const errorCode = this.determineErrorCode(error);
      const childFriendlyError = this.createChildFriendlyError(errorCode, error.message, context);

      // Log the error
      await this.logError(error, context, req);

      // Send child-friendly response
      res.status(childFriendlyError.statusCode).json({
        error: childFriendlyError,
        success: false
      });
    } catch (handlerError) {
      // Fallback error response
      logger.error('Error in child error handler:', handlerError);
      res.status(500).json({
        error: this.createChildFriendlyError('UNKNOWN_ERROR'),
        success: false
      });
    }
  };

  private determineErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('child authentication') || message.includes('child auth')) {
      return 'CHILD_AUTH_REQUIRED';
    }
    if (message.includes('access denied') || message.includes('forbidden')) {
      return 'ACCESS_DENIED';
    }
    if (message.includes('session expired') || message.includes('token expired')) {
      return 'SESSION_EXPIRED';
    }
    if (message.includes('no active session')) {
      return 'NO_ACTIVE_SESSION';
    }
    if (message.includes('session too long')) {
      return 'SESSION_TOO_LONG';
    }

    // Not found errors
    if (message.includes('child not found') || message.includes('child profile not found')) {
      return 'CHILD_NOT_FOUND';
    }
    if (message.includes('activity not found')) {
      return 'ACTIVITY_NOT_FOUND';
    }
    if (message.includes('achievement not found')) {
      return 'ACHIEVEMENT_NOT_FOUND';
    }
    if (message.includes('study plan not found')) {
      return 'STUDY_PLAN_NOT_FOUND';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('completion validation')) {
      return 'COMPLETION_VALIDATION_FAILED';
    }

    // Server errors
    if (message.includes('dashboard') && message.includes('failed')) {
      return 'DASHBOARD_FETCH_FAILED';
    }
    if (message.includes('progress') && message.includes('failed')) {
      return 'PROGRESS_UPDATE_FAILED';
    }
    if (message.includes('completion failed')) {
      return 'COMPLETION_FAILED';
    }
    if (message.includes('badges') && message.includes('failed')) {
      return 'BADGES_FETCH_FAILED';
    }

    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT_EXCEEDED';
    }

    return 'UNKNOWN_ERROR';
  }
}

export const childErrorHandlerMiddleware = new ChildErrorHandlerMiddleware();

// Express error handling middleware
export const childErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  childErrorHandlerMiddleware.handleError(error, req, res, next);
};

// Async wrapper for route handlers to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper function to create and send child-friendly error responses
export const sendChildError = (
  res: Response,
  code: string,
  message?: string,
  context?: ErrorContext
): void => {
  const error = childErrorHandlerMiddleware.createChildFriendlyError(code, message, context);
  res.status(error.statusCode).json({
    error,
    success: false
  });
};