import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logSecurityEvent } from '../utils/logger';

/**
 * Middleware to assign a unique request ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.id || uuidv4();
  res.setHeader('X-Request-ID', req.id || '');
  next();
};

/**
 * Middleware to log all API requests for security monitoring
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  const requestData = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: req.user?.userId || 'unauthenticated',
    role: req.user?.role || 'none'
  };
  
  logSecurityEvent('api_request', requestData);
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body) {
    res.send = originalSend;
    
    // Log response
    const responseTime = Date.now() - startTime;
    const responseData = {
      ...requestData,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    };
    
    // Only log detailed response info for errors
    if (res.statusCode >= 400) {
      logSecurityEvent('api_error_response', responseData);
    } else {
      logSecurityEvent('api_response', responseData);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Middleware to detect and log suspicious activity patterns
 */
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    { pattern: /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, type: 'sql_injection' },
    { pattern: /((\%3C)|<)[^\n]+((\%3E)|>)/i, type: 'xss' },
    { pattern: /\.\.\/|\.\.\\|\.\/|\.\\|\/etc\/passwd|\/etc\/shadow/i, type: 'path_traversal' },
    { pattern: /\.\.|%2e%2e|%252e%252e/i, type: 'directory_traversal' }
  ];
  
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  
  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      logSecurityEvent('suspicious_activity', {
        requestId: req.id,
        type,
        url,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        userId: req.user?.userId || 'unauthenticated'
      });
      
      // Don't block the request, just log it
      break;
    }
  }
  
  next();
};

/**
 * Middleware to enforce secure headers
 */
export const secureHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  next();
};

/**
 * Child-specific security monitoring functions
 */
export const securityMonitoring = {
  /**
   * Log child activity for monitoring and analytics
   */
  async logChildActivity(activityData: {
    childId: string;
    sessionId: string;
    activity: string;
    page: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    additionalData?: any;
  }) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.securityLog.create({
        data: {
          userId: activityData.childId,
          childId: activityData.childId,
          eventType: 'CHILD_ACTIVITY',
          action: activityData.activity,
          ipAddress: activityData.ipAddress,
          userAgent: activityData.userAgent,
          timestamp: activityData.timestamp,
          details: {
            sessionId: activityData.sessionId,
            page: activityData.page,
            ...activityData.additionalData
          }
        }
      });

      await prisma.$disconnect();
    } catch (error) {
      logSecurityEvent('child_activity_log_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        childId: activityData.childId,
        activity: activityData.activity
      });
    }
  },

  /**
   * Log suspicious activity and trigger alerts
   */
  async logSuspiciousActivity(suspiciousData: {
    childId: string;
    activityType: string;
    details: any;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location: string;
    severity: 'low' | 'medium' | 'high';
  }) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Log to security log
      await prisma.securityLog.create({
        data: {
          userId: suspiciousData.childId,
          childId: suspiciousData.childId,
          eventType: 'SUSPICIOUS_ACTIVITY',
          action: suspiciousData.activityType,
          ipAddress: suspiciousData.ipAddress,
          userAgent: suspiciousData.userAgent,
          timestamp: suspiciousData.timestamp,
          details: {
            severity: suspiciousData.severity,
            location: suspiciousData.location,
            ...suspiciousData.details
          }
        }
      });

      // If high severity, immediately disable child sessions
      if (suspiciousData.severity === 'high') {
        await prisma.childLoginSession.updateMany({
          where: {
            childId: suspiciousData.childId,
            logoutTime: null
          },
          data: {
            logoutTime: new Date(),
            sessionDuration: 0 // Mark as terminated
          }
        });
      }

      await prisma.$disconnect();

      // Log to application logs
      logSecurityEvent('suspicious_child_activity', {
        childId: suspiciousData.childId,
        activityType: suspiciousData.activityType,
        severity: suspiciousData.severity,
        location: suspiciousData.location,
        timestamp: suspiciousData.timestamp
      });

    } catch (error) {
      logSecurityEvent('suspicious_activity_log_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        childId: suspiciousData.childId,
        activityType: suspiciousData.activityType
      });
    }
  },

  /**
   * Check for suspicious patterns in child activity
   */
  async detectSuspiciousPatterns(childId: string, sessionId: string) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const patterns = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent activity logs
      const recentLogs = await prisma.securityLog.findMany({
        where: {
          childId,
          timestamp: { gte: oneDayAgo }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Pattern 1: Rapid activity changes
      const recentActivity = recentLogs.filter(log => log.timestamp >= oneHourAgo);
      if (recentActivity.length > 50) {
        patterns.push({
          type: 'excessive_activity',
          severity: 'medium',
          details: { activityCount: recentActivity.length, timeframe: '1 hour' }
        });
      }

      // Pattern 2: Multiple failed authentication attempts
      const failedLogins = recentLogs.filter(log => 
        log.action === 'CHILD_LOGIN_FAILED' && log.timestamp >= oneHourAgo
      );
      if (failedLogins.length > 3) {
        patterns.push({
          type: 'multiple_failed_logins',
          severity: 'high',
          details: { failedAttempts: failedLogins.length, timeframe: '1 hour' }
        });
      }

      // Pattern 3: Unusual session patterns
      const sessions = await prisma.childLoginSession.findMany({
        where: {
          childId,
          loginTime: { gte: oneDayAgo }
        }
      });

      const uniqueIPs = new Set(sessions.map(s => s.ipAddress));
      if (uniqueIPs.size > 2) {
        patterns.push({
          type: 'multiple_locations',
          severity: 'medium',
          details: { uniqueIPs: uniqueIPs.size, timeframe: '24 hours' }
        });
      }

      // Pattern 4: Unusual time patterns
      const currentHour = now.getHours();
      if (currentHour < 6 || currentHour > 22) {
        patterns.push({
          type: 'unusual_hours',
          severity: 'low',
          details: { hour: currentHour, message: 'Activity outside normal hours' }
        });
      }

      await prisma.$disconnect();

      return {
        detected: patterns.length > 0,
        patterns,
        riskLevel: this.calculateRiskLevel(patterns)
      };

    } catch (error) {
      logSecurityEvent('pattern_detection_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        childId,
        sessionId
      });

      return {
        detected: false,
        patterns: [],
        riskLevel: 'unknown'
      };
    }
  },

  /**
   * Calculate overall risk level based on detected patterns
   */
  calculateRiskLevel(patterns: any[]) {
    if (patterns.length === 0) return 'low';
    
    const highSeverityCount = patterns.filter(p => p.severity === 'high').length;
    const mediumSeverityCount = patterns.filter(p => p.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'high';
    if (mediumSeverityCount > 1) return 'high';
    if (mediumSeverityCount > 0) return 'medium';
    
    return 'low';
  }
};