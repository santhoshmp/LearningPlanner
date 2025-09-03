import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { childSessionMonitoringService } from '../services/childSessionMonitoringService';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
  sessionId?: string;
}

interface TokenPayload {
  userId?: string;
  childId?: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Enhanced authentication middleware with session monitoring
 */
export const enhancedAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
    
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Handle child authentication with session monitoring
    if (decoded.childId && decoded.role === 'CHILD') {
      const childAuth = await handleChildAuthentication(req, decoded);
      if (!childAuth.success) {
        return res.status(401).json({
          error: childAuth.error,
          code: childAuth.code
        });
      }
      req.user = childAuth.user;
      req.sessionId = decoded.sessionId;
    }
    // Handle parent authentication
    else if (decoded.userId && decoded.role === 'PARENT') {
      const parentAuth = await handleParentAuthentication(decoded);
      if (!parentAuth.success) {
        return res.status(401).json({
          error: parentAuth.error,
          code: parentAuth.code
        });
      }
      req.user = parentAuth.user;
      req.sessionId = decoded.sessionId;
    }
    else {
      return res.status(401).json({ 
        error: 'Invalid token payload',
        code: 'TOKEN_INVALID_PAYLOAD'
      });
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Handle child authentication with session monitoring
 */
async function handleChildAuthentication(req: AuthenticatedRequest, decoded: TokenPayload): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  code?: string;
}> {
  try {
    // Find child in database
    const child = await prisma.childProfile.findUnique({
      where: { id: decoded.childId },
      include: { parent: true }
    });

    if (!child) {
      logger.warn('Child authentication failed - child not found', { childId: decoded.childId });
      return {
        success: false,
        error: 'Child not found',
        code: 'CHILD_NOT_FOUND'
      };
    }

    if (!child.isActive) {
      logger.warn('Child authentication failed - child inactive', { childId: decoded.childId });
      return {
        success: false,
        error: 'Child account is inactive',
        code: 'CHILD_INACTIVE'
      };
    }

    // Validate session if sessionId is present
    if (decoded.sessionId) {
      const ipAddress = getClientIpAddress(req);
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const isValidSession = await childSessionMonitoringService.validateSession(
        decoded.sessionId,
        ipAddress,
        userAgent
      );

      if (!isValidSession) {
        logger.warn('Child authentication failed - invalid session', { 
          childId: decoded.childId,
          sessionId: decoded.sessionId,
          ipAddress,
          userAgent
        });
        return {
          success: false,
          error: 'Invalid session',
          code: 'SESSION_INVALID'
        };
      }

      // Update session activity
      await childSessionMonitoringService.updateActivity(decoded.sessionId);
    }

    return {
      success: true,
      user: {
        id: child.id,
        username: child.username,
        name: child.name,
        parentId: child.parentId,
        age: child.age,
        grade: child.grade,
        role: 'CHILD',
        isActive: child.isActive
      }
    };
  } catch (error) {
    logger.error('Child authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    };
  }
}

/**
 * Handle parent authentication
 */
async function handleParentAuthentication(decoded: TokenPayload): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  code?: string;
}> {
  try {
    // Find parent in database
    const parent = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!parent) {
      logger.warn('Parent authentication failed - parent not found', { userId: decoded.userId });
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      };
    }

    if (!parent.isEmailVerified) {
      logger.warn('Parent authentication failed - email not verified', { userId: decoded.userId });
      return {
        success: false,
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED'
      };
    }

    return {
      success: true,
      user: {
        id: parent.id,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
        role: 'PARENT',
        isEmailVerified: parent.isEmailVerified
      }
    };
  } catch (error) {
    logger.error('Parent authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    };
  }
}

/**
 * Extract token from request headers
 */
function extractToken(req: Request): string | null {
  const authHeader = req.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Get client IP address from request
 */
function getClientIpAddress(req: Request): string {
  const forwarded = req.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }
  
  return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

/**
 * Middleware to require child role
 */
export const requireChildRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'CHILD') {
    return res.status(403).json({
      error: 'Child access required',
      code: 'CHILD_ACCESS_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to require parent role
 */
export const requireParentRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'PARENT') {
    return res.status(403).json({
      error: 'Parent access required',
      code: 'PARENT_ACCESS_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to allow both parent and child roles
 */
export const requireAnyRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['PARENT', 'CHILD'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Valid user role required',
      code: 'VALID_ROLE_REQUIRED'
    });
  }
  next();
};