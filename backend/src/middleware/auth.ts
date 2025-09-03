import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { Role } from '@prisma/client';
import { redisService } from '../services/redisService';
import logger from '../utils/logger';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        parentId?: string; // For child users, store their parent's ID
        childId?: string;  // For child-specific operations
      };
      id?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT token and attach user info to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }

  try {
    // Verify token validity
    const decoded = authService.verifyAccessToken(token);
    
    // Check if token is blacklisted
    redisService.isTokenBlacklisted(token)
      .then(isBlacklisted => {
        if (isBlacklisted) {
          return res.status(401).json({
            error: {
              code: 'REVOKED_TOKEN',
              message: 'Token has been revoked',
              timestamp: new Date().toISOString(),
              requestId: req.id || 'unknown'
            }
          });
        }
        
        // Token is valid, attach user info to request
        req.user = decoded;
        
        // Log access for security monitoring
        logSecurityEvent('authentication', {
          userId: decoded.userId,
          role: decoded.role,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown'
        });
        
        next();
      })
      .catch(error => {
        logger.error('Redis blacklist check failed', { error, requestId: req.id });
        // Continue even if Redis check fails - token is still valid
        req.user = decoded;
        next();
      });
  } catch (error) {
    logSecurityEvent('authentication_failure', {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
};

/**
 * Middleware to require specific roles for access
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logSecurityEvent('authorization_failure', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        reason: 'No authenticated user',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent('authorization_failure', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        reason: 'Insufficient permissions',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this operation',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Log successful authorization
    logSecurityEvent('authorization_success', {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user.userId,
      role: req.user.role,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    next();
  };
};

/**
 * Middleware to verify parent owns the child profile being accessed
 */
export const requireParentOfChild = (childIdParam: string = 'childId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Only parents can access child profiles
    if (req.user.role !== Role.PARENT) {
      logSecurityEvent('parent_authorization_failure', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user.userId,
        role: req.user.role,
        reason: 'Non-parent role attempted to access child profile',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only parents can access child profiles',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const childId = req.params[childIdParam] || req.body.childId;
    
    if (!childId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CHILD_ID',
          message: 'Child ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    try {
      // Verify parent owns this child profile
      const isParentOfChild = await authService.verifyParentOfChild(req.user.userId, childId);
      
      if (!isParentOfChild) {
        logSecurityEvent('parent_authorization_failure', {
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userId: req.user.userId,
          childId: childId,
          reason: 'Parent does not own this child profile',
          userAgent: req.headers['user-agent'] || 'unknown'
        });
        
        return res.status(403).json({
          error: {
            code: 'PARENT_CHILD_MISMATCH',
            message: 'You do not have permission to access this child profile',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }

      // Add childId to user object for convenience in route handlers
      req.user.childId = childId;
      
      next();
    } catch (error) {
      logger.error('Error verifying parent-child relationship', {
        error,
        parentId: req.user.userId,
        childId,
        requestId: req.id
      });
      
      return res.status(500).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Error verifying permissions',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
  };
};

/**
 * Middleware to verify child is accessing their own data
 */
export const requireSelfChildAccess = (childIdParam: string = 'childId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Only children can access their own data
    if (req.user.role !== Role.CHILD) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only child accounts can access this resource',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const childId = req.params[childIdParam] || req.body.childId;
    
    if (childId && childId !== req.user.userId) {
      logSecurityEvent('child_authorization_failure', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user.userId,
        attemptedChildId: childId,
        reason: 'Child attempted to access another child\'s data',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'You can only access your own data',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    next();
  };
};

/**
 * Log security-related events for monitoring
 */
export const logSecurityEvent = (eventType: string, data: any) => {
  logger.log({
    level: 'info',
    message: `Security event: ${eventType}`,
    eventType,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Common middleware combinations
export const requireParent = requireRole([Role.PARENT]);
export const requireChild = requireRole([Role.CHILD]);
export const requireParentOrChild = requireRole([Role.PARENT, Role.CHILD]);

// Rate limiting middleware for sensitive operations
export const rateLimitSensitiveOps = (maxAttempts: number = 5, windowInSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const endpoint = req.originalUrl;
    const key = `ratelimit:${ip}:${endpoint}`;
    
    try {
      const attempts = await redisService.incrementRateLimit(key, windowInSeconds);
      
      if (attempts > maxAttempts) {
        logSecurityEvent('rate_limit_exceeded', {
          ip,
          endpoint,
          attempts,
          userAgent: req.headers['user-agent'] || 'unknown'
        });
        
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many attempts. Please try again later.',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error', { error, ip, endpoint, requestId: req.id });
      // Continue even if rate limiting fails
      next();
    }
  };
};