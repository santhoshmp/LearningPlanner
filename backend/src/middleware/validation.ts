import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Use the global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

const getPrisma = () => globalThis.__prisma || new PrismaClient();

/**
 * Enhanced middleware factory for validating request data against a Joi schema
 * @param schema Joi validation schema
 * @param property Request property to validate ('body', 'query', 'params')
 * @param options Additional validation options
 */
export const validateRequest = (
  schema: Joi.ObjectSchema, 
  property: 'body' | 'query' | 'params' = 'body',
  options: {
    sanitize?: boolean;
    logFailures?: boolean;
    allowUnknown?: boolean;
  } = {}
) => {
  const { sanitize = true, logFailures = true, allowUnknown = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pre-sanitize input if enabled
      if (sanitize) {
        req[property] = sanitizeObject(req[property]);
      }

      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: !allowUnknown,
        allowUnknown
      });

      if (error) {
        if (logFailures) {
          // Log validation failures for security monitoring
          await logValidationFailure(req, error);
        }

        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })),
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (validationError) {
      logger.error('Validation middleware error:', validationError);
      return res.status(500).json({
        error: {
          code: 'VALIDATION_SYSTEM_ERROR',
          message: 'Internal validation error',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
  };
};

/**
 * Log validation failures for security monitoring
 */
async function logValidationFailure(req: Request, error: Joi.ValidationError): Promise<void> {
  try {
    await getPrisma().securityLog.create({
      data: {
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: req.user?.userId || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        details: {
          type: 'validation_failure',
          endpoint: req.originalUrl,
          method: req.method,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          })),
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      }
    });
  } catch (logError) {
    logger.error('Failed to log validation failure:', logError);
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Parent authentication schemas
  parentRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
  }),

  parentLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  passwordReset: Joi.object({
    email: Joi.string().email().required()
  }),

  passwordUpdate: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  // Child profile schemas
  childProfileCreate: Joi.object({
    name: Joi.string().required(),
    age: Joi.number().integer().min(4).max(18).required(),
    gradeLevel: Joi.string().required(),
    learningStyle: Joi.string().valid('VISUAL', 'AUDITORY', 'KINESTHETIC', 'MIXED').default('MIXED'),
    username: Joi.string().alphanum().min(3).max(20).required(),
    pin: Joi.string().pattern(/^\d{4,6}$/).required(),
    preferences: Joi.object().default({})
  }),

  childProfileUpdate: Joi.object({
    name: Joi.string(),
    age: Joi.number().integer().min(4).max(18),
    gradeLevel: Joi.string(),
    learningStyle: Joi.string().valid('VISUAL', 'AUDITORY', 'KINESTHETIC', 'MIXED'),
    preferences: Joi.object()
  }),

  childCredentialsUpdate: Joi.object({
    username: Joi.string().alphanum().min(3).max(20),
    pin: Joi.string().pattern(/^\d{4,6}$/)
  }).min(1),

  // Child authentication schemas
  childLogin: Joi.object({
    username: Joi.string().required(),
    pin: Joi.string().required()
  }),

  // Study plan schemas
  studyPlanCreate: Joi.object({
    childId: Joi.string().required(),
    subject: Joi.string().required(),
    difficulty: Joi.string().required(),
    objectives: Joi.array().items(Joi.object()).default([])
  }),

  studyPlanUpdate: Joi.object({
    subject: Joi.string(),
    difficulty: Joi.string(),
    objectives: Joi.array().items(Joi.object()),
    status: Joi.string().valid('DRAFT', 'ACTIVE', 'COMPLETED', 'PAUSED')
  }).min(1),

  // Activity schemas
  activityComplete: Joi.object({
    score: Joi.number().min(0).max(100).required(),
    timeSpent: Joi.number().integer().min(0).required()
  }),

  // Help request schemas
  helpRequest: Joi.object({
    activityId: Joi.string().required(),
    question: Joi.string().required(),
    context: Joi.object().default({})
  }),

  // Security and access control schemas
  idParam: Joi.object({
    id: Joi.string().required()
  }),

  childIdParam: Joi.object({
    childId: Joi.string().required()
  }),

  planIdParam: Joi.object({
    planId: Joi.string().required()
  }),

  activityIdParam: Joi.object({
    activityId: Joi.string().required()
  })
};

/**
 * Enhanced sanitization function using DOMPurify
 */
export const sanitizeObject = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    Object.keys(obj).forEach(key => {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    });
    return sanitized;
  }
  
  return obj;
};

/**
 * Sanitize individual strings with multiple layers of protection
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  // Use DOMPurify for HTML sanitization
  let sanitized = DOMPurify.sanitize(str, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
  
  // Additional XSS protection
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  
  // SQL injection protection
  sanitized = sanitized
    .replace(/(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, '')
    .replace(/((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi, '')
    .replace(/\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, '');
  
  // Path traversal protection
  sanitized = sanitized
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/%2e%2e%2f/gi, '')
    .replace(/%2e%2e%5c/gi, '');
  
  // Command injection protection
  sanitized = sanitized
    .replace(/[;&|`$(){}[\]]/g, '')
    .replace(/\$\([^)]*\)/g, '')
    .replace(/`[^`]*`/g, '');
  
  return sanitized.trim();
};

/**
 * Enhanced middleware to sanitize user input
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body, query, and params
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    return res.status(500).json({
      error: {
        code: 'SANITIZATION_ERROR',
        message: 'Input sanitization failed',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
};

/**
 * Content Security Policy middleware
 */
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://appleid.cdn-apple.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com",
    "frame-src 'self' https://accounts.google.com https://appleid.apple.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
} = {}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxFiles = 1 } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    if (files.length > maxFiles) {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_FILES',
          message: `Maximum ${maxFiles} files allowed`,
          maxFiles
        }
      });
    }

    for (const file of files) {
      if (!file) continue;

      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds ${maxSize} bytes`,
            maxSize,
            fileSize: file.size
          }
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `File type ${file.mimetype} not allowed`,
            allowedTypes
          }
        });
      }

      // Check for malicious file names
      if (file.originalname && /[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILENAME',
            message: 'Filename contains invalid characters'
          }
        });
      }
    }

    next();
  };
};