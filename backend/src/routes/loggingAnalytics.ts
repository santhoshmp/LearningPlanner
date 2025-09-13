import express from 'express';
import { authenticateToken, requireParent } from '../middleware/auth';
// Import will be done dynamically to avoid circular dependencies
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schema for analytics query
const analyticsQuerySchema = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  childId: Joi.string().optional()
});

/**
 * GET /api/logging/analytics
 * Get logging analytics for monitoring dashboard
 */
router.get('/analytics', authenticateToken, requireParent, async (req, res) => {
  try {
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString()
        }
      });
    }

    const { startDate, endDate, childId } = value;
    const timeFrame = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    const analytics = await studyPlanLoggingService.getLoggingAnalytics(timeFrame);

    res.json({
      success: true,
      message: 'Logging analytics retrieved successfully',
      analytics,
      filters: {
        timeFrame,
        childId
      }
    });

  } catch (error) {
    logger.error('Error getting logging analytics:', error);
    res.status(500).json({
      error: {
        code: 'ANALYTICS_FETCH_FAILED',
        message: 'Failed to retrieve logging analytics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/logging/performance-summary
 * Get performance summary for the last 24 hours
 */
router.get('/performance-summary', authenticateToken, requireParent, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    const analytics = await studyPlanLoggingService.getLoggingAnalytics({
      start: startDate,
      end: endDate
    });

    // Calculate summary metrics
    const summary = {
      totalRequests: analytics.accessStats.reduce((sum, stat) => sum + stat._count, 0),
      successRate: calculateSuccessRate(analytics.accessStats),
      averageResponseTime: calculateAverageResponseTime(analytics.dashboardStats),
      slowQueries: analytics.performanceStats.filter(stat => stat._avg.executionTime && stat._avg.executionTime > 1000).length,
      errorRate: calculateErrorRate(analytics.accessStats, analytics.progressStats),
      topErrors: getTopErrors(analytics.accessStats, analytics.progressStats),
      performanceAlerts: getPerformanceAlerts(analytics.performanceStats)
    };

    res.json({
      success: true,
      message: 'Performance summary retrieved successfully',
      summary,
      timeFrame: { start: startDate, end: endDate }
    });

  } catch (error) {
    logger.error('Error getting performance summary:', error);
    res.status(500).json({
      error: {
        code: 'PERFORMANCE_SUMMARY_FAILED',
        message: 'Failed to retrieve performance summary',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/logging/health-check
 * Get system health based on recent logging data
 */
router.get('/health-check', authenticateToken, requireParent, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago

    const { studyPlanLoggingService } = require('../services/studyPlanLoggingService');
    const analytics = await studyPlanLoggingService.getLoggingAnalytics({
      start: startDate,
      end: endDate
    });

    // Determine system health
    const totalRequests = analytics.accessStats.reduce((sum, stat) => sum + stat._count, 0);
    const successRate = calculateSuccessRate(analytics.accessStats);
    const averageResponseTime = calculateAverageResponseTime(analytics.dashboardStats);
    const slowQueries = analytics.performanceStats.filter(stat => stat._avg.executionTime && stat._avg.executionTime > 1000).length;

    let healthStatus = 'healthy';
    const issues = [];

    if (successRate < 95) {
      healthStatus = 'degraded';
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
    }

    if (averageResponseTime > 2000) {
      healthStatus = 'degraded';
      issues.push(`High response time: ${averageResponseTime.toFixed(0)}ms`);
    }

    if (slowQueries > 5) {
      healthStatus = 'degraded';
      issues.push(`${slowQueries} slow database queries detected`);
    }

    if (successRate < 90 || averageResponseTime > 5000) {
      healthStatus = 'unhealthy';
    }

    res.json({
      success: true,
      health: {
        status: healthStatus,
        issues,
        metrics: {
          totalRequests,
          successRate,
          averageResponseTime,
          slowQueries
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting health check:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        issues: ['Failed to retrieve health metrics'],
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Helper functions
function calculateSuccessRate(accessStats: any[]): number {
  const total = accessStats.reduce((sum, stat) => sum + stat._count, 0);
  const successful = accessStats.filter(stat => stat.success).reduce((sum, stat) => sum + stat._count, 0);
  return total > 0 ? (successful / total) * 100 : 100;
}

function calculateAverageResponseTime(dashboardStats: any[]): number {
  const totalTime = dashboardStats.reduce((sum, stat) => sum + (stat._avg.responseTime || 0) * stat._count, 0);
  const totalRequests = dashboardStats.reduce((sum, stat) => sum + stat._count, 0);
  return totalRequests > 0 ? totalTime / totalRequests : 0;
}

function calculateErrorRate(accessStats: any[], progressStats: any[]): number {
  const allStats = [...accessStats, ...progressStats];
  const total = allStats.reduce((sum, stat) => sum + stat._count, 0);
  const errors = allStats.filter(stat => !stat.success).reduce((sum, stat) => sum + stat._count, 0);
  return total > 0 ? (errors / total) * 100 : 0;
}

function getTopErrors(accessStats: any[], progressStats: any[]): string[] {
  const errorStats = [...accessStats, ...progressStats].filter(stat => !stat.success);
  return errorStats
    .sort((a, b) => b._count - a._count)
    .slice(0, 5)
    .map(stat => `${stat.action}: ${stat._count} errors`);
}

function getPerformanceAlerts(performanceStats: any[]): string[] {
  const alerts = [];
  
  const slowQueries = performanceStats.filter(stat => stat._avg.executionTime && stat._avg.executionTime > 1000);
  if (slowQueries.length > 0) {
    alerts.push(`${slowQueries.length} operations with slow database queries`);
  }

  const highComplexityQueries = performanceStats.filter(stat => stat.queryComplexity === 'HIGH');
  if (highComplexityQueries.length > 10) {
    alerts.push(`${highComplexityQueries.length} high complexity database operations`);
  }

  return alerts;
}

export default router;