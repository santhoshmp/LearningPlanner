import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Use the global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

const getPrisma = () => globalThis.__prisma || new PrismaClient();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ? config.keyGenerator(req) : getDefaultKey(req);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Clean up expired entries
      cleanupExpiredEntries(windowStart);

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs
        };
      }

      // Check if limit exceeded
      if (entry.count >= config.maxRequests) {
        // Log rate limit violation
        await logRateLimitViolation(req, key, entry.count, config.maxRequests);

        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: config.message || 'Too many requests, please try again later',
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            limit: config.maxRequests,
            windowMs: config.windowMs
          }
        });
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Don't block requests on rate limiting errors
      next();
    }
  };
};

/**
 * Generate default rate limit key based on IP and user
 */
function getDefaultKey(req: Request): string {
  const ip = req.ip || 'unknown';
  const userId = req.user?.userId || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(windowStart: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= windowStart) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Log rate limit violations for security monitoring
 */
async function logRateLimitViolation(
  req: Request, 
  key: string, 
  currentCount: number, 
  maxRequests: number
): Promise<void> {
  try {
    await getPrisma().securityLog.create({
      data: {
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: req.user?.userId || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        details: {
          type: 'rate_limit_exceeded',
          endpoint: req.originalUrl,
          method: req.method,
          rateLimitKey: key,
          currentCount,
          maxRequests,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to log rate limit violation:', error);
  }
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later'
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    message: 'Too many authentication attempts, please try again later'
  },

  // OAuth endpoints (moderate)
  oauth: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    message: 'Too many OAuth requests, please try again later'
  },

  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    message: 'Too many password reset attempts, please try again in an hour'
  },

  // AI/Gemini endpoints (moderate due to cost)
  ai: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyGenerator: (req: Request) => req.user?.userId || req.ip || 'unknown',
    message: 'Too many AI requests, please try again later'
  },

  // File upload endpoints
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20,
    keyGenerator: (req: Request) => req.user?.userId || req.ip || 'unknown',
    message: 'Too many upload requests, please try again later'
  }
};

/**
 * Create rate limiter for specific endpoint types
 */
export const createRateLimiter = (type: keyof typeof rateLimitConfigs) => {
  return rateLimit(rateLimitConfigs[type]);
};

/**
 * Advanced rate limiting with sliding window
 */
export class SlidingWindowRateLimit {
  private windows = new Map<string, number[]>();
  private windowSize: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowSize = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get or create window for this key
    let window = this.windows.get(key) || [];
    
    // Remove old timestamps
    window = window.filter(timestamp => timestamp > windowStart);
    
    // Check if we can add another request
    if (window.length >= this.maxRequests) {
      this.windows.set(key, window);
      return false;
    }

    // Add current timestamp and update window
    window.push(now);
    this.windows.set(key, window);
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      const filteredWindow = window.filter(timestamp => timestamp > now - this.windowSize);
      if (filteredWindow.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filteredWindow);
      }
    }
  }
}

/**
 * Distributed rate limiting using database (for multi-instance deployments)
 */
export const distributedRateLimit = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ? config.keyGenerator(req) : getDefaultKey(req);
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Clean up old entries
      await getPrisma().rateLimitEntry.deleteMany({
        where: {
          createdAt: {
            lt: windowStart
          }
        }
      });

      // Count current requests in window
      const currentCount = await getPrisma().rateLimitEntry.count({
        where: {
          key,
          createdAt: {
            gte: windowStart
          }
        }
      });

      if (currentCount >= config.maxRequests) {
        await logRateLimitViolation(req, key, currentCount, config.maxRequests);

        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: config.message || 'Too many requests, please try again later',
            retryAfter: Math.ceil(config.windowMs / 1000),
            limit: config.maxRequests,
            windowMs: config.windowMs
          }
        });
      }

      // Record this request
      await getPrisma().rateLimitEntry.create({
        data: {
          key,
          createdAt: now
        }
      });

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - currentCount - 1));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now.getTime() + config.windowMs) / 1000));

      next();
    } catch (error) {
      logger.error('Distributed rate limiting error:', error);
      // Don't block requests on rate limiting errors
      next();
    }
  };
};