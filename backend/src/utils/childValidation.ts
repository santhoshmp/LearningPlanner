import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { sendChildError } from '../middleware/childErrorHandler';
import { logger } from './logger';

// Enhanced validation schemas with child-friendly error messages
export const childValidationSchemas = {
  activityProgress: Joi.object({
    activityId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Activity ID is required',
        'any.required': 'Which activity are you working on?'
      }),
    timeSpent: Joi.number()
      .min(0)
      .max(7200) // 2 hours max
      .required()
      .messages({
        'number.base': 'Time spent must be a number',
        'number.min': 'Time spent cannot be negative',
        'number.max': 'Wow! That\'s a lot of time. Let\'s take a break!',
        'any.required': 'How much time did you spend?'
      }),
    score: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Score must be a number',
        'number.min': 'Score cannot be negative',
        'number.max': 'Score cannot be more than 100'
      }),
    status: Joi.string()
      .valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')
      .optional()
      .messages({
        'any.only': 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED'
      }),
    sessionData: Joi.object({
      startTime: Joi.string()
        .isoDate()
        .required()
        .messages({
          'string.isoDate': 'Start time must be a valid date',
          'any.required': 'When did you start this activity?'
        }),
      endTime: Joi.string()
        .isoDate()
        .optional()
        .messages({
          'string.isoDate': 'End time must be a valid date'
        }),
      pausedDuration: Joi.number()
        .min(0)
        .default(0)
        .messages({
          'number.min': 'Paused duration cannot be negative'
        }),
      focusEvents: Joi.array()
        .items(Joi.object({
          type: Joi.string().valid('focus', 'blur').required(),
          timestamp: Joi.string().isoDate().required()
        }))
        .default([]),
      difficultyAdjustments: Joi.array()
        .items(Joi.object({
          fromDifficulty: Joi.number().required(),
          toDifficulty: Joi.number().required(),
          reason: Joi.string().required(),
          timestamp: Joi.string().isoDate().required()
        }))
        .default([]),
      helpRequests: Joi.array()
        .items(Joi.object({
          question: Joi.string().required(),
          timestamp: Joi.string().isoDate().required(),
          resolved: Joi.boolean().default(false),
          responseTime: Joi.number().optional()
        }))
        .default([]),
      interactionEvents: Joi.array()
        .items(Joi.object({
          type: Joi.string().valid('click', 'scroll', 'input', 'navigation').required(),
          element: Joi.string().optional(),
          timestamp: Joi.string().isoDate().required(),
          data: Joi.any().optional()
        }))
        .default([])
    }).optional(),
    helpRequestsCount: Joi.number()
      .min(0)
      .max(50)
      .optional()
      .messages({
        'number.min': 'Help requests count cannot be negative',
        'number.max': 'That\'s a lot of help requests! Great job asking questions!'
      }),
    pauseCount: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Pause count cannot be negative',
        'number.max': 'You paused a lot! That\'s okay, take your time!'
      }),
    resumeCount: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Resume count cannot be negative',
        'number.max': 'Great persistence! You kept coming back!'
      })
  }),

  activityCompletion: Joi.object({
    activityId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Activity ID is required',
        'any.required': 'Which activity did you complete?'
      }),
    score: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.base': 'Score must be a number',
        'number.min': 'Score cannot be negative',
        'number.max': 'Score cannot be more than 100',
        'any.required': 'What score did you get?'
      }),
    timeSpent: Joi.number()
      .min(1)
      .max(7200)
      .required()
      .messages({
        'number.base': 'Time spent must be a number',
        'number.min': 'You must spend at least 1 second on an activity',
        'number.max': 'That\'s a really long time! Great dedication!',
        'any.required': 'How long did this take you?'
      }),
    sessionData: Joi.object({
      startTime: Joi.string()
        .isoDate()
        .required()
        .messages({
          'string.isoDate': 'Start time must be a valid date',
          'any.required': 'When did you start?'
        }),
      endTime: Joi.string()
        .isoDate()
        .required()
        .messages({
          'string.isoDate': 'End time must be a valid date',
          'any.required': 'When did you finish?'
        }),
      pausedDuration: Joi.number()
        .min(0)
        .default(0),
      focusEvents: Joi.array().default([]),
      difficultyAdjustments: Joi.array().default([]),
      helpRequests: Joi.array().default([]),
      interactionEvents: Joi.array().default([])
    }).required()
  }),

  celebrationUpdate: Joi.object({
    achievementId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Achievement ID must be valid',
        'any.required': 'Which achievement are you celebrating?'
      })
  }),

  activityUpdate: Joi.object({
    timestamp: Joi.string()
      .isoDate()
      .required()
      .messages({
        'string.isoDate': 'Timestamp must be a valid date',
        'any.required': 'When did this happen?'
      }),
    page: Joi.string()
      .required()
      .messages({
        'string.empty': 'Page is required',
        'any.required': 'Which page are you on?'
      }),
    action: Joi.string()
      .valid('page_view', 'user_activity', 'session_start', 'session_end')
      .required()
      .messages({
        'any.only': 'Action must be page_view, user_activity, session_start, or session_end',
        'any.required': 'What action happened?'
      }),
    data: Joi.any().optional()
  }),

  childId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Child ID is required',
      'any.required': 'We need to know which child this is for'
    }),

  progressQuery: Joi.object({
    timeFrame: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Time frame must be in format YYYY-MM-DD,YYYY-MM-DD'
      }),
    subjects: Joi.string()
      .optional()
      .messages({
        'string.base': 'Subjects must be a comma-separated list'
      }),
    status: Joi.string()
      .optional()
      .messages({
        'string.base': 'Status must be a comma-separated list'
      }),
    minScore: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Minimum score cannot be negative',
        'number.max': 'Minimum score cannot be more than 100'
      }),
    maxScore: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Maximum score cannot be negative',
        'number.max': 'Maximum score cannot be more than 100'
      }),
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(50)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 100'
      }),
    offset: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Offset cannot be negative'
      })
  }),

  achievementQuery: Joi.object({
    type: Joi.string()
      .valid('BADGE', 'MILESTONE', 'ACHIEVEMENT')
      .optional()
      .messages({
        'any.only': 'Type must be BADGE, MILESTONE, or ACHIEVEMENT'
      }),
    limit: Joi.number()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 50'
      }),
    offset: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Offset cannot be negative'
      }),
    celebrationShown: Joi.boolean()
      .optional()
  })
};

// Enhanced validation middleware with child-friendly error handling
export const validateChild = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // Get all validation errors
        stripUnknown: true, // Remove unknown fields
        convert: true // Convert types when possible
      });

      if (error) {
        const childFriendlyErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Child validation failed', {
          childId: req.user?.userId,
          url: req.originalUrl,
          errors: childFriendlyErrors
        });

        return sendChildError(res, 'VALIDATION_ERROR', 
          `Please check: ${childFriendlyErrors.map(e => e.message).join(', ')}`, {
          childId: req.user?.userId,
          url: req.originalUrl
        });
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (validationError) {
      logger.error('Validation middleware error:', validationError);
      return sendChildError(res, 'VALIDATION_ERROR', 'Something went wrong checking your input');
    }
  };
};

// Validate URL parameters
export const validateChildParams = (paramSchema: Record<string, Joi.Schema>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      for (const [paramName, schema] of Object.entries(paramSchema)) {
        const { error } = schema.validate(req.params[paramName]);
        if (error) {
          errors.push(`${paramName}: ${error.details[0].message}`);
        }
      }

      if (errors.length > 0) {
        logger.warn('Child parameter validation failed', {
          childId: req.user?.userId,
          url: req.originalUrl,
          errors
        });

        return sendChildError(res, 'VALIDATION_ERROR', 
          `Please check: ${errors.join(', ')}`, {
          childId: req.user?.userId,
          url: req.originalUrl
        });
      }

      next();
    } catch (validationError) {
      logger.error('Parameter validation middleware error:', validationError);
      return sendChildError(res, 'VALIDATION_ERROR', 'Something went wrong checking the request');
    }
  };
};

// Validate query parameters
export const validateChildQuery = (querySchema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const childFriendlyErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Child query validation failed', {
          childId: req.user?.userId,
          url: req.originalUrl,
          errors: childFriendlyErrors
        });

        return sendChildError(res, 'VALIDATION_ERROR', 
          `Please check: ${childFriendlyErrors.map(e => e.message).join(', ')}`, {
          childId: req.user?.userId,
          url: req.originalUrl
        });
      }

      // Replace query with validated data
      req.query = value;
      next();
    } catch (validationError) {
      logger.error('Query validation middleware error:', validationError);
      return sendChildError(res, 'VALIDATION_ERROR', 'Something went wrong checking the query');
    }
  };
};

// Sanitize input to prevent XSS and injection attacks
export const sanitizeChildInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic sanitization - remove potentially dangerous characters
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return str;
      
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (sanitizeError) {
    logger.error('Input sanitization error:', sanitizeError);
    return sendChildError(res, 'VALIDATION_ERROR', 'Something went wrong processing your input');
  }
};

// Rate limiting for child routes
export const childRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const childId = req.user?.userId;
      if (!childId) {
        return next(); // Let auth middleware handle this
      }

      const now = Date.now();
      const key = `${childId}:${req.route?.path || req.path}`;
      const requestData = requests.get(key);

      if (!requestData || now > requestData.resetTime) {
        // Reset or initialize
        requests.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (requestData.count >= maxRequests) {
        logger.warn('Child rate limit exceeded', {
          childId,
          path: req.path,
          count: requestData.count,
          maxRequests
        });

        return sendChildError(res, 'RATE_LIMIT_EXCEEDED', 
          'You\'re going too fast! Please wait a moment.', {
          childId,
          url: req.originalUrl
        });
      }

      requestData.count++;
      next();
    } catch (rateLimitError) {
      logger.error('Rate limiting error:', rateLimitError);
      next(); // Don't block on rate limiting errors
    }
  };
};