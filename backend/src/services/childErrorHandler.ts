import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ChildErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  sessionCorruption?: string[];
  retryCount?: number;
  ipAddress: string;
}

export interface ErrorPattern {
  errorType: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  requiresAttention: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByHour: Array<{ hour: string; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
  sessionCorruptionRate: number;
  networkErrorRate: number;
}

class ChildErrorHandler {
  private readonly ERROR_THRESHOLDS = {
    SESSION_CORRUPTION: 5, // per hour
    AUTHENTICATION_LOOP: 3, // per hour
    NETWORK_ERROR: 10, // per hour
    UNKNOWN_ERROR: 20 // per hour
  };

  async recordError(errorReport: ChildErrorReport): Promise<void> {
    try {
      // Store in database
      await prisma.errorLog.create({
        data: {
          errorId: errorReport.errorId,
          errorType: this.categorizeError(errorReport.message),
          message: errorReport.message,
          stack: errorReport.stack,
          componentStack: errorReport.componentStack,
          userAgent: errorReport.userAgent,
          url: errorReport.url,
          timestamp: errorReport.timestamp,
          sessionCorruption: errorReport.sessionCorruption ? JSON.stringify(errorReport.sessionCorruption) : null,
          retryCount: errorReport.retryCount || 0,
          ipAddress: errorReport.ipAddress,
          severity: this.calculateSeverity(errorReport)
        }
      });

      logger.info('Child error recorded', {
        errorId: errorReport.errorId,
        errorType: this.categorizeError(errorReport.message)
      });
    } catch (error) {
      logger.error('Failed to record child error:', error);
      throw error;
    }
  }

  async analyzeErrorPattern(errorId: string, message: string): Promise<ErrorPattern> {
    try {
      const errorType = this.categorizeError(message);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Count recent errors of the same type
      const recentErrors = await prisma.errorLog.count({
        where: {
          errorType,
          timestamp: {
            gte: oneHourAgo
          }
        }
      });

      // Get first and last occurrence
      const firstError = await prisma.errorLog.findFirst({
        where: { errorType },
        orderBy: { timestamp: 'asc' }
      });

      const lastError = await prisma.errorLog.findFirst({
        where: { errorType },
        orderBy: { timestamp: 'desc' }
      });

      const threshold = this.ERROR_THRESHOLDS[errorType as keyof typeof this.ERROR_THRESHOLDS] || this.ERROR_THRESHOLDS.UNKNOWN_ERROR;
      const requiresAttention = recentErrors >= threshold;

      return {
        errorType,
        count: recentErrors,
        firstOccurrence: firstError?.timestamp || new Date(),
        lastOccurrence: lastError?.timestamp || new Date(),
        requiresAttention,
        severity: this.getSeverityFromCount(recentErrors, threshold)
      };
    } catch (error) {
      logger.error('Failed to analyze error pattern:', error);
      throw error;
    }
  }

  async getErrorStats(timeframe: string): Promise<ErrorStats> {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      // Get total errors
      const totalErrors = await prisma.errorLog.count({
        where: {
          timestamp: { gte: startTime }
        }
      });

      // Get errors by type
      const errorsByTypeRaw = await prisma.errorLog.groupBy({
        by: ['errorType'],
        where: {
          timestamp: { gte: startTime }
        },
        _count: {
          errorType: true
        }
      });

      const errorsByType = errorsByTypeRaw.reduce((acc, item) => {
        acc[item.errorType] = item._count.errorType;
        return acc;
      }, {} as Record<string, number>);

      // Get errors by hour
      const errorsByHour = await this.getErrorsByHour(startTime);

      // Get top errors
      const topErrorsRaw = await prisma.errorLog.groupBy({
        by: ['message'],
        where: {
          timestamp: { gte: startTime }
        },
        _count: {
          message: true
        },
        orderBy: {
          _count: {
            message: 'desc'
          }
        },
        take: 10
      });

      const topErrors = topErrorsRaw.map(item => ({
        message: item.message,
        count: item._count.message
      }));

      // Calculate rates
      const sessionCorruptionErrors = await prisma.errorLog.count({
        where: {
          errorType: 'CORRUPTED_SESSION',
          timestamp: { gte: startTime }
        }
      });

      const networkErrors = await prisma.errorLog.count({
        where: {
          errorType: 'NETWORK_ERROR',
          timestamp: { gte: startTime }
        }
      });

      return {
        totalErrors,
        errorsByType,
        errorsByHour,
        topErrors,
        sessionCorruptionRate: totalErrors > 0 ? (sessionCorruptionErrors / totalErrors) * 100 : 0,
        networkErrorRate: totalErrors > 0 ? (networkErrors / totalErrors) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get error stats:', error);
      throw error;
    }
  }

  async getErrorPatterns(limit: number): Promise<ErrorPattern[]> {
    try {
      const errorTypes = await prisma.errorLog.groupBy({
        by: ['errorType'],
        _count: {
          errorType: true
        },
        orderBy: {
          _count: {
            errorType: 'desc'
          }
        },
        take: limit
      });

      const patterns: ErrorPattern[] = [];

      for (const errorType of errorTypes) {
        const firstError = await prisma.errorLog.findFirst({
          where: { errorType: errorType.errorType },
          orderBy: { timestamp: 'asc' }
        });

        const lastError = await prisma.errorLog.findFirst({
          where: { errorType: errorType.errorType },
          orderBy: { timestamp: 'desc' }
        });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await prisma.errorLog.count({
          where: {
            errorType: errorType.errorType,
            timestamp: { gte: oneHourAgo }
          }
        });

        const threshold = this.ERROR_THRESHOLDS[errorType.errorType as keyof typeof this.ERROR_THRESHOLDS] || this.ERROR_THRESHOLDS.UNKNOWN_ERROR;

        patterns.push({
          errorType: errorType.errorType,
          count: errorType._count.errorType,
          firstOccurrence: firstError?.timestamp || new Date(),
          lastOccurrence: lastError?.timestamp || new Date(),
          requiresAttention: recentCount >= threshold,
          severity: this.getSeverityFromCount(recentCount, threshold)
        });
      }

      return patterns;
    } catch (error) {
      logger.error('Failed to get error patterns:', error);
      throw error;
    }
  }

  private categorizeError(message: string): string {
    if (message.includes('INVALID_CREDENTIALS') || message.includes('Invalid username or PIN')) {
      return 'INVALID_CREDENTIALS';
    }
    if (message.includes('SESSION_EXPIRED') || message.includes('Session has expired')) {
      return 'SESSION_EXPIRED';
    }
    if (message.includes('NETWORK_ERROR') || message.includes('Network Error') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('TOKEN_REFRESH_FAILED') || message.includes('refresh')) {
      return 'TOKEN_REFRESH_FAILED';
    }
    if (message.includes('AUTHENTICATION_LOOP') || message.includes('loop')) {
      return 'AUTHENTICATION_LOOP';
    }
    if (message.includes('CORRUPTED_SESSION') || message.includes('corrupted') || message.includes('corruption')) {
      return 'CORRUPTED_SESSION';
    }
    if (message.includes('PERMISSION_DENIED') || message.includes('permission')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('SERVER_ERROR') || message.includes('500')) {
      return 'SERVER_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  private calculateSeverity(errorReport: ChildErrorReport): string {
    const errorType = this.categorizeError(errorReport.message);
    
    if (errorType === 'AUTHENTICATION_LOOP' || errorType === 'CORRUPTED_SESSION') {
      return 'critical';
    }
    if (errorType === 'SERVER_ERROR' || errorType === 'NETWORK_ERROR') {
      return 'high';
    }
    if (errorType === 'TOKEN_REFRESH_FAILED' || errorType === 'SESSION_EXPIRED') {
      return 'medium';
    }
    return 'low';
  }

  private getSeverityFromCount(count: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (count >= threshold * 2) return 'critical';
    if (count >= threshold) return 'high';
    if (count >= threshold * 0.5) return 'medium';
    return 'low';
  }

  private parseTimeframe(timeframe: string): number {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }

  private async getErrorsByHour(startTime: Date): Promise<Array<{ hour: string; count: number }>> {
    const errors = await prisma.errorLog.findMany({
      where: {
        timestamp: { gte: startTime }
      },
      select: {
        timestamp: true
      }
    });

    const hourCounts: Record<string, number> = {};
    
    errors.forEach(error => {
      const hour = error.timestamp.toISOString().slice(0, 13) + ':00:00.000Z';
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour,
      count
    })).sort((a, b) => a.hour.localeCompare(b.hour));
  }
}

export const childErrorHandler = new ChildErrorHandler();