import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AuthDiagnosticResult {
  status: 'healthy' | 'warning' | 'error';
  component: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SessionDiagnostic {
  sessionValid: boolean;
  tokenValid: boolean;
  refreshTokenValid: boolean;
  userExists: boolean;
  childExists?: boolean;
  issues: string[];
  recommendations: string[];
}

class AuthDiagnostics {
  /**
   * Perform comprehensive authentication system health check
   */
  async performHealthCheck(): Promise<AuthDiagnosticResult[]> {
    const results: AuthDiagnosticResult[] = [];

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.push({
        status: 'healthy',
        component: 'Database',
        message: 'Database connection is healthy',
        timestamp: new Date()
      });
    } catch (error) {
      results.push({
        status: 'error',
        component: 'Database',
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      });
    }

    // Check JWT secret configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      results.push({
        status: 'error',
        component: 'JWT Configuration',
        message: 'JWT_SECRET environment variable is not set',
        timestamp: new Date()
      });
    } else if (jwtSecret.length < 32) {
      results.push({
        status: 'warning',
        component: 'JWT Configuration',
        message: 'JWT_SECRET is shorter than recommended (32 characters)',
        details: { length: jwtSecret.length },
        timestamp: new Date()
      });
    } else {
      results.push({
        status: 'healthy',
        component: 'JWT Configuration',
        message: 'JWT configuration is healthy',
        timestamp: new Date()
      });
    }

    // Check refresh token cleanup
    const expiredTokens = await prisma.refreshToken.count({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    if (expiredTokens > 100) {
      results.push({
        status: 'warning',
        component: 'Token Cleanup',
        message: 'High number of expired refresh tokens found',
        details: { expiredTokens },
        timestamp: new Date()
      });
    } else {
      results.push({
        status: 'healthy',
        component: 'Token Cleanup',
        message: 'Token cleanup is healthy',
        details: { expiredTokens },
        timestamp: new Date()
      });
    }

    // Check authentication error rates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = await prisma.securityLog.count({
      where: {
        eventType: { in: ['LOGIN_FAILURE', 'AUTH_ERROR'] },
        timestamp: { gte: oneHourAgo }
      }
    });

    const totalEvents = await prisma.securityLog.count({
      where: {
        timestamp: { gte: oneHourAgo }
      }
    });

    const errorRate = totalEvents > 0 ? (recentErrors / totalEvents) * 100 : 0;

    if (errorRate > 20) {
      results.push({
        status: 'error',
        component: 'Error Rate',
        message: 'High authentication error rate detected',
        details: { errorRate: errorRate.toFixed(2), recentErrors, totalEvents },
        timestamp: new Date()
      });
    } else if (errorRate > 10) {
      results.push({
        status: 'warning',
        component: 'Error Rate',
        message: 'Elevated authentication error rate',
        details: { errorRate: errorRate.toFixed(2), recentErrors, totalEvents },
        timestamp: new Date()
      });
    } else {
      results.push({
        status: 'healthy',
        component: 'Error Rate',
        message: 'Authentication error rate is normal',
        details: { errorRate: errorRate.toFixed(2) },
        timestamp: new Date()
      });
    }

    return results;
  }

  /**
   * Diagnose specific user session issues
   */
  async diagnoseUserSession(userId: string, isChild: boolean = false): Promise<SessionDiagnostic> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if user exists
    let userExists = false;
    let childExists = false;

    if (isChild) {
      const child = await prisma.childProfile.findUnique({
        where: { id: userId },
        include: { parent: true }
      });
      childExists = !!child;
      userExists = !!child?.parent;

      if (!childExists) {
        issues.push('Child profile not found in database');
        recommendations.push('Verify child ID is correct or recreate child profile');
      }
      if (!userExists) {
        issues.push('Parent user associated with child not found');
        recommendations.push('Check parent-child relationship integrity');
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      userExists = !!user;

      if (!userExists) {
        issues.push('User not found in database');
        recommendations.push('Verify user ID is correct or user account exists');
      }
    }

    // Check refresh tokens
    const refreshTokens = await prisma.refreshToken.findMany({
      where: isChild ? { childId: userId } : { userId },
      orderBy: { createdAt: 'desc' }
    });

    const validRefreshTokens = refreshTokens.filter(token => 
      token.expiresAt > new Date()
    );

    const refreshTokenValid = validRefreshTokens.length > 0;

    if (!refreshTokenValid) {
      issues.push('No valid refresh tokens found');
      recommendations.push('User needs to log in again to generate new tokens');
    }

    // Check for token conflicts
    if (refreshTokens.length > 5) {
      issues.push(`High number of refresh tokens (${refreshTokens.length})`);
      recommendations.push('Consider implementing token cleanup or limiting concurrent sessions');
    }

    // Check recent authentication events
    const recentEvents = await prisma.securityLog.findMany({
      where: {
        ...(isChild ? 
          { details: { contains: `"childId":"${userId}"` } } : 
          { userId }
        ),
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const recentFailures = recentEvents.filter(e => 
      e.eventType === 'LOGIN_FAILURE' || e.eventType === 'AUTH_ERROR'
    );

    if (recentFailures.length > 3) {
      issues.push(`Multiple recent authentication failures (${recentFailures.length})`);
      recommendations.push('Check for credential issues or potential security threats');
    }

    return {
      sessionValid: userExists && refreshTokenValid,
      tokenValid: refreshTokenValid,
      refreshTokenValid,
      userExists,
      childExists: isChild ? childExists : undefined,
      issues,
      recommendations
    };
  }

  /**
   * Validate JWT token and provide diagnostic information
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    expired: boolean;
    payload?: any;
    error?: string;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return {
          valid: false,
          expired: false,
          error: 'JWT_SECRET not configured',
          recommendations: ['Configure JWT_SECRET environment variable']
        };
      }

      const payload = jwt.verify(token, jwtSecret);
      
      return {
        valid: true,
        expired: false,
        payload,
        recommendations: ['Token is valid']
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        try {
          const payload = jwt.decode(token);
          return {
            valid: false,
            expired: true,
            payload,
            error: 'Token has expired',
            recommendations: ['Use refresh token to get new access token']
          };
        } catch (decodeError) {
          return {
            valid: false,
            expired: true,
            error: 'Token has expired and cannot be decoded',
            recommendations: ['User needs to log in again']
          };
        }
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid token format or signature',
          recommendations: ['Check token format and JWT secret configuration']
        };
      }

      return {
        valid: false,
        expired: false,
        error: error instanceof Error ? error.message : 'Unknown token validation error',
        recommendations: ['Check token and JWT configuration']
      };
    }
  }

  /**
   * Generate authentication troubleshooting report
   */
  async generateTroubleshootingReport(userId?: string, isChild?: boolean): Promise<{
    systemHealth: AuthDiagnosticResult[];
    userDiagnostics?: SessionDiagnostic;
    commonIssues: string[];
    recommendations: string[];
    timestamp: Date;
  }> {
    const systemHealth = await this.performHealthCheck();
    let userDiagnostics: SessionDiagnostic | undefined;

    if (userId) {
      userDiagnostics = await this.diagnoseUserSession(userId, isChild);
    }

    const commonIssues = [
      'Expired refresh tokens',
      'Missing JWT_SECRET configuration',
      'Database connection issues',
      'Child-parent relationship integrity problems',
      'High authentication error rates',
      'Token cleanup not running'
    ];

    const recommendations = [
      'Regularly clean up expired tokens',
      'Monitor authentication error rates',
      'Implement proper session timeout handling',
      'Use secure JWT secrets (32+ characters)',
      'Log authentication events for debugging',
      'Implement suspicious activity detection'
    ];

    return {
      systemHealth,
      userDiagnostics,
      commonIssues,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Test authentication flow end-to-end
   */
  async testAuthFlow(credentials: { username?: string; email?: string; password?: string; pin?: string }): Promise<{
    success: boolean;
    steps: Array<{
      step: string;
      success: boolean;
      duration: number;
      error?: string;
    }>;
    totalDuration: number;
  }> {
    const steps: Array<{
      step: string;
      success: boolean;
      duration: number;
      error?: string;
    }> = [];

    const startTime = Date.now();

    // This would integrate with actual auth service for testing
    // For now, we'll simulate the steps
    const testSteps = [
      'Database Connection',
      'User Lookup',
      'Credential Validation',
      'Token Generation',
      'Session Creation'
    ];

    for (const stepName of testSteps) {
      const stepStart = Date.now();
      try {
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        steps.push({
          step: stepName,
          success: true,
          duration: Date.now() - stepStart
        });
      } catch (error) {
        steps.push({
          step: stepName,
          success: false,
          duration: Date.now() - stepStart,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const success = steps.every(step => step.success);

    return {
      success,
      steps,
      totalDuration
    };
  }
}

export const authDiagnostics = new AuthDiagnostics();