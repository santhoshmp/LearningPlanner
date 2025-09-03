import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthEvent {
  eventType: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'TOKEN_REFRESH' | 'LOGOUT' | 'SESSION_EXPIRED' | 'AUTH_ERROR';
  userType: 'PARENT' | 'CHILD';
  userId?: string;
  childId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AuthPerformanceMetric {
  operation: 'LOGIN' | 'TOKEN_REFRESH' | 'SESSION_VALIDATION' | 'LOGOUT';
  userType: 'PARENT' | 'CHILD';
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AuthDebugService {
  /**
   * Log authentication events for debugging and monitoring
   */
  async logAuthEvent(event: AuthEvent): Promise<void> {
    try {
      // Log to Winston logger
      logger.info('Auth Event', {
        eventType: event.eventType,
        userType: event.userType,
        userId: event.userId,
        childId: event.childId,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        metadata: event.metadata
      });

      // Store in database for analysis
      await prisma.securityLog.create({
        data: {
          eventType: event.eventType,
          userType: event.userType,
          userId: event.userId,
          details: JSON.stringify({
            childId: event.childId,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            errorCode: event.errorCode,
            errorMessage: event.errorMessage,
            metadata: event.metadata
          }),
          timestamp: event.timestamp
        }
      });
    } catch (error) {
      logger.error('Failed to log auth event', { error, event });
    }
  }

  /**
   * Log performance metrics for authentication operations
   */
  async logPerformanceMetric(metric: AuthPerformanceMetric): Promise<void> {
    try {
      logger.info('Auth Performance Metric', {
        operation: metric.operation,
        userType: metric.userType,
        duration: metric.duration,
        success: metric.success,
        timestamp: metric.timestamp,
        metadata: metric.metadata
      });

      // Store performance data
      await prisma.performanceMetrics.create({
        data: {
          operation: `AUTH_${metric.operation}`,
          duration: metric.duration,
          success: metric.success,
          metadata: JSON.stringify({
            userType: metric.userType,
            ...metric.metadata
          }),
          timestamp: metric.timestamp
        }
      });
    } catch (error) {
      logger.error('Failed to log performance metric', { error, metric });
    }
  }

  /**
   * Log child-specific authentication events
   */
  async logChildAuthEvent(
    eventType: AuthEvent['eventType'],
    childId: string,
    sessionId?: string,
    metadata?: Record<string, any>,
    error?: { code: string; message: string }
  ): Promise<void> {
    await this.logAuthEvent({
      eventType,
      userType: 'CHILD',
      childId,
      sessionId,
      errorCode: error?.code,
      errorMessage: error?.message,
      metadata,
      timestamp: new Date()
    });
  }

  /**
   * Get authentication events for debugging
   */
  async getAuthEvents(filters: {
    userType?: 'PARENT' | 'CHILD';
    userId?: string;
    childId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.userType) where.userType = filters.userType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    // Filter by childId in details JSON
    if (filters.childId) {
      where.details = {
        contains: `"childId":"${filters.childId}"`
      };
    }

    return await prisma.securityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100
    });
  }

  /**
   * Get performance metrics for authentication operations
   */
  async getPerformanceMetrics(filters: {
    operation?: string;
    userType?: 'PARENT' | 'CHILD';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.operation) where.operation = `AUTH_${filters.operation}`;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    // Filter by userType in metadata JSON
    if (filters.userType) {
      where.metadata = {
        contains: `"userType":"${filters.userType}"`
      };
    }

    return await prisma.performanceMetrics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100
    });
  }

  /**
   * Get authentication statistics for monitoring dashboard
   */
  async getAuthStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    tokenRefreshes: number;
    childEvents: number;
    parentEvents: number;
    averageLoginDuration: number;
    errorRate: number;
  }> {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
    }

    const events = await prisma.securityLog.findMany({
      where: {
        timestamp: { gte: startDate }
      }
    });

    const metrics = await prisma.performanceMetrics.findMany({
      where: {
        operation: { startsWith: 'AUTH_' },
        timestamp: { gte: startDate }
      }
    });

    const totalEvents = events.length;
    const successfulLogins = events.filter(e => e.eventType === 'LOGIN_SUCCESS').length;
    const failedLogins = events.filter(e => e.eventType === 'LOGIN_FAILURE').length;
    const tokenRefreshes = events.filter(e => e.eventType === 'TOKEN_REFRESH').length;
    const childEvents = events.filter(e => e.userType === 'CHILD').length;
    const parentEvents = events.filter(e => e.userType === 'PARENT').length;

    const loginMetrics = metrics.filter(m => m.operation === 'AUTH_LOGIN');
    const averageLoginDuration = loginMetrics.length > 0 
      ? loginMetrics.reduce((sum, m) => sum + m.duration, 0) / loginMetrics.length 
      : 0;

    const errorEvents = events.filter(e => 
      e.eventType === 'LOGIN_FAILURE' || e.eventType === 'AUTH_ERROR'
    ).length;
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      successfulLogins,
      failedLogins,
      tokenRefreshes,
      childEvents,
      parentEvents,
      averageLoginDuration,
      errorRate
    };
  }

  /**
   * Detect suspicious authentication patterns
   */
  async detectSuspiciousActivity(childId?: string): Promise<{
    rapidFailedAttempts: boolean;
    unusualLoginTimes: boolean;
    multipleDevices: boolean;
    suspiciousPatterns: string[];
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const where: any = {
      timestamp: { gte: oneHourAgo }
    };

    if (childId) {
      where.details = { contains: `"childId":"${childId}"` };
    }

    const recentEvents = await prisma.securityLog.findMany({ where });
    const dailyEvents = await prisma.securityLog.findMany({
      where: {
        ...where,
        timestamp: { gte: oneDayAgo }
      }
    });

    const suspiciousPatterns: string[] = [];

    // Check for rapid failed attempts
    const failedAttempts = recentEvents.filter(e => e.eventType === 'LOGIN_FAILURE');
    const rapidFailedAttempts = failedAttempts.length >= 5;
    if (rapidFailedAttempts) {
      suspiciousPatterns.push(`${failedAttempts.length} failed login attempts in the last hour`);
    }

    // Check for unusual login times (for children)
    const loginEvents = dailyEvents.filter(e => 
      e.eventType === 'LOGIN_SUCCESS' && e.userType === 'CHILD'
    );
    const unusualLoginTimes = loginEvents.some(event => {
      const hour = event.timestamp.getHours();
      return hour < 6 || hour > 22; // Before 6 AM or after 10 PM
    });
    if (unusualLoginTimes) {
      suspiciousPatterns.push('Login attempts during unusual hours');
    }

    // Check for multiple devices (simplified check based on user agents)
    const userAgents = new Set();
    dailyEvents.forEach(event => {
      try {
        const details = JSON.parse(event.details || '{}');
        if (details.userAgent) {
          userAgents.add(details.userAgent);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    const multipleDevices = userAgents.size > 2;
    if (multipleDevices) {
      suspiciousPatterns.push(`Login attempts from ${userAgents.size} different devices`);
    }

    return {
      rapidFailedAttempts,
      unusualLoginTimes,
      multipleDevices,
      suspiciousPatterns
    };
  }
}

export const authDebugService = new AuthDebugService();