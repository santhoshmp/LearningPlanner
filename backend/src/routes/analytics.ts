import express from 'express';
import { body, query, param } from 'express-validator';
import analyticsService from '../services/analyticsService';
import { EnhancedAnalyticsService } from '../services/enhancedAnalyticsService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const enhancedAnalyticsService = new EnhancedAnalyticsService(prisma);
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken, requireParent, requireParentOrChild } from '../middleware/auth';
import logger from '../utils/logger';
import Joi from 'joi';
import * as fs from 'fs';
import * as path from 'path';

// Import csv-writer with proper typing
const csvWriter = require('csv-writer');

const router = express.Router();

// Define schemas for validation
const trackCompletionSchema = Joi.object({
  childId: Joi.string().required(),
  activityId: Joi.string().required(),
  score: Joi.number().required(),
  timeSpent: Joi.number().required()
});

const trackProgressSchema = Joi.object({
  childId: Joi.string().required(),
  activityId: Joi.string().required(),
  timeSpent: Joi.number().required()
});

const trackHelpSchema = Joi.object({
  childId: Joi.string().required(),
  activityId: Joi.string().required(),
  question: Joi.string().required(),
  context: Joi.object().required()
});

const trackEngagementSchema = Joi.object({
  childId: Joi.string().required(),
  sessionDuration: Joi.number().required(),
  interactionCount: Joi.number().required(),
  completedItems: Joi.number().required(),
  timestamp: Joi.date().iso().optional()
});

const progressReportParamsSchema = Joi.object({
  childId: Joi.string().required()
});

const progressReportQuerySchema = Joi.object({
  start: Joi.string().isoDate().optional(),
  end: Joi.string().isoDate().optional()
});

/**
 * Track activity completion
 * POST /api/analytics/track/completion
 */
router.post(
  '/track/completion',
  authenticateToken,
  (req, res, next) => validateRequest(trackCompletionSchema)(req, res, next),
  async (req, res) => {
    try {
      const { childId, activityId, score, timeSpent } = req.body;
      
      // Ensure the user has access to this child's data
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'PARENT') {
        // Check if this child belongs to the parent
        // This check is simplified - in a real app, you'd verify parent-child relationship
      } else if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const result = await analyticsService.trackActivityCompletion(
        childId,
        activityId,
        score,
        timeSpent
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error tracking activity completion:', error);
      res.status(500).json({ error: 'Failed to track activity completion' });
    }
  }
);

/**
 * Track activity progress
 * POST /api/analytics/track/progress
 */
router.post(
  '/track/progress',
  authenticateToken,
  (req, res, next) => validateRequest(trackProgressSchema)(req, res, next),
  async (req, res) => {
    try {
      const { childId, activityId, timeSpent } = req.body;
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const result = await analyticsService.trackActivityProgress(
        childId,
        activityId,
        timeSpent
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error tracking activity progress:', error);
      res.status(500).json({ error: 'Failed to track activity progress' });
    }
  }
);

/**
 * Track help request
 * POST /api/analytics/track/help
 */
router.post(
  '/track/help',
  authenticateToken,
  (req, res, next) => validateRequest(trackHelpSchema)(req, res, next),
  async (req, res) => {
    try {
      const { childId, activityId, question, context } = req.body;
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const result = await analyticsService.trackHelpRequest(
        childId,
        activityId,
        question,
        context
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error tracking help request:', error);
      res.status(500).json({ error: 'Failed to track help request' });
    }
  }
);

/**
 * Track engagement metrics
 * POST /api/analytics/track/engagement
 */
router.post(
  '/track/engagement',
  authenticateToken,
  (req, res, next) => validateRequest(trackEngagementSchema)(req, res, next),
  async (req, res) => {
    try {
      const { childId, activityId, sessionDuration, interactionCount, completedItems } = req.body;
      const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const result = await analyticsService.trackEngagement(
        childId,
        {
          activityId,
          sessionDuration,
          interactionCount,
          completedItems,
          timestamp
        }
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error tracking engagement:', error);
      res.status(500).json({ error: 'Failed to track engagement' });
    }
  }
);

/**
 * Get progress report
 * GET /api/analytics/progress/:childId
 */
router.get(
  '/progress/:childId',
  authenticateToken,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      // Authorization check - parents can view any child's data, children can only view their own
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'PARENT') {
        // In a real app, verify this child belongs to the parent
      } else if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      // Create timeFrame object only if both start and end are provided
      const timeFrame = start && end ? { start, end } : undefined;
      
      const report = await analyticsService.generateProgressReport(
        childId,
        timeFrame
      );
      
      res.status(200).json(report);
    } catch (error) {
      logger.error('Error generating progress report:', error);
      res.status(500).json({ error: 'Failed to generate progress report' });
    }
  }
);

/**
 * Get learning patterns
 * GET /api/analytics/patterns/:childId
 */
router.get(
  '/patterns/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const patterns = await analyticsService.detectLearningPatterns(childId);
      
      res.status(200).json(patterns);
    } catch (error) {
      logger.error('Error detecting learning patterns:', error);
      res.status(500).json({ error: 'Failed to detect learning patterns' });
    }
  }
);

/**
 * Get performance trends
 * GET /api/analytics/trends/:childId
 */
router.get(
  '/trends/:childId',
  authenticateToken,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start: string; end: string };
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'PARENT') {
        // In a real app, verify this child belongs to the parent
      } else if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      const trends = await analyticsService.generatePerformanceTrends(
        childId,
        { start, end }
      );
      
      res.status(200).json(trends);
    } catch (error) {
      logger.error('Error generating performance trends:', error);
      res.status(500).json({ error: 'Failed to generate performance trends' });
    }
  }
);

/**
 * Get subject performance
 * GET /api/analytics/subjects/:childId
 */
router.get(
  '/subjects/:childId',
  authenticateToken,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'PARENT') {
        // In a real app, verify this child belongs to the parent
      } else if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      // Create timeFrame object only if both start and end are provided
      const timeFrame = start && end ? { start, end } : undefined;
      
      const subjectPerformance = await analyticsService.generateSubjectPerformance(
        childId,
        timeFrame
      );
      
      res.status(200).json(subjectPerformance);
    } catch (error) {
      logger.error('Error generating subject performance:', error);
      res.status(500).json({ error: 'Failed to generate subject performance' });
    }
  }
);

/**
 * Get alerts
 * GET /api/analytics/alerts/:childId
 */
router.get(
  '/alerts/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const alerts = await analyticsService.generateAlerts(childId);
      
      res.status(200).json(alerts);
    } catch (error) {
      logger.error('Error generating alerts:', error);
      res.status(500).json({ error: 'Failed to generate alerts' });
    }
  }
);

// Enhanced Analytics Endpoints

/**
 * Get detailed progress tracking with advanced metrics
 * GET /api/analytics/detailed-progress/:childId
 */
router.get(
  '/detailed-progress/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start: string; end: string };
      
      const detailedTracking = await analyticsService.getDetailedProgressTracking(
        childId,
        { start, end }
      );
      
      res.status(200).json(detailedTracking);
    } catch (error) {
      logger.error('Error getting detailed progress tracking:', error);
      res.status(500).json({ error: 'Failed to get detailed progress tracking' });
    }
  }
);

/**
 * Get learning pattern recognition analysis
 * GET /api/analytics/learning-patterns/:childId
 */
router.get(
  '/learning-patterns/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const patterns = await analyticsService.recognizeLearningPatterns(childId);
      
      res.status(200).json(patterns);
    } catch (error) {
      logger.error('Error recognizing learning patterns:', error);
      res.status(500).json({ error: 'Failed to recognize learning patterns' });
    }
  }
);

/**
 * Get performance predictions and insights
 * GET /api/analytics/predictions/:childId
 */
router.get(
  '/predictions/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const predictions = await analyticsService.generatePerformancePredictions(childId);
      
      res.status(200).json(predictions);
    } catch (error) {
      logger.error('Error generating performance predictions:', error);
      res.status(500).json({ error: 'Failed to generate performance predictions' });
    }
  }
);

// Export Functionality Endpoints

/**
 * Export detailed analytics report as CSV
 * GET /api/analytics/export/csv/:childId
 */
router.get(
  '/export/csv/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start: string; end: string };
      
      // Get comprehensive analytics data
      const [
        progressReport,
        detailedTracking,
        learningPatterns,
        predictions
      ] = await Promise.all([
        analyticsService.generateProgressReport(childId, { start, end }),
        analyticsService.getDetailedProgressTracking(childId, { start, end }),
        analyticsService.recognizeLearningPatterns(childId),
        analyticsService.generatePerformancePredictions(childId)
      ]);
      
      // Create temporary file path
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const fileName = `analytics_${childId}_${Date.now()}.csv`;
      const filePath = path.join(tempDir, fileName);
      
      // Prepare CSV data
      const csvData = [
        {
          metric: 'Total Activities',
          value: progressReport.totalActivities,
          category: 'Basic Metrics'
        },
        {
          metric: 'Completion Rate',
          value: `${(progressReport.completionRate * 100).toFixed(2)}%`,
          category: 'Basic Metrics'
        },
        {
          metric: 'Average Score',
          value: progressReport.averageScore.toFixed(2),
          category: 'Performance'
        },
        {
          metric: 'Total Time Spent (minutes)',
          value: progressReport.totalTimeSpent,
          category: 'Engagement'
        },
        {
          metric: 'Learning Velocity',
          value: detailedTracking.learningVelocity.velocity.toFixed(3),
          category: 'Advanced Metrics'
        },
        {
          metric: 'Consistency Score',
          value: `${(detailedTracking.detailedMetrics.performance.consistencyScore * 100).toFixed(2)}%`,
          category: 'Advanced Metrics'
        },
        {
          metric: 'Engagement Depth',
          value: `${(detailedTracking.detailedMetrics.engagement.engagementDepth * 100).toFixed(2)}%`,
          category: 'Engagement'
        },
        {
          metric: 'Dominant Learning Style',
          value: learningPatterns.patterns.learningStyle.dominantStyle,
          category: 'Learning Patterns'
        },
        {
          metric: 'Help Seeking Pattern',
          value: learningPatterns.patterns.helpSeeking.pattern,
          category: 'Learning Patterns'
        },
        {
          metric: 'Retention Pattern',
          value: learningPatterns.patterns.retention.pattern,
          category: 'Learning Patterns'
        }
      ];
      
      // Add mastery indicators
      detailedTracking.masteryIndicators.forEach(indicator => {
        csvData.push({
          metric: `${indicator.subject} Mastery Level`,
          value: `${indicator.masteryLevel.toFixed(2)}% (${indicator.status})`,
          category: 'Subject Mastery'
        });
      });
      
      // Add predictions if available
      if (predictions.predictions) {
        csvData.push({
          metric: 'Predicted Next Score',
          value: predictions.predictions.scores.prediction?.toFixed(2) || 'N/A',
          category: 'Predictions'
        });
        
        csvData.push({
          metric: 'Score Trend',
          value: predictions.predictions.scores.trend,
          category: 'Predictions'
        });
        
        csvData.push({
          metric: 'Difficulty Readiness',
          value: predictions.predictions.difficultyReadiness.ready ? 'Ready' : 'Not Ready',
          category: 'Predictions'
        });
      }
      
      // Create CSV writer
      const csvWriterInstance = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'category', title: 'Category' },
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' }
        ]
      });
      
      // Write CSV file
      await csvWriterInstance.writeRecords(csvData);
      
      // Send file as download
      res.download(filePath, `analytics_report_${childId}.csv`, (err) => {
        if (err) {
          logger.error('Error sending CSV file:', err);
        }
        
        // Clean up temporary file
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            logger.error('Error deleting temporary CSV file:', unlinkErr);
          }
        });
      });
      
    } catch (error) {
      logger.error('Error exporting analytics CSV:', error);
      res.status(500).json({ error: 'Failed to export analytics report' });
    }
  }
);

/**
 * Export detailed analytics report as JSON
 * GET /api/analytics/export/json/:childId
 */
router.get(
  '/export/json/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  (req, res, next) => validateRequest(progressReportQuerySchema, 'query')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start: string; end: string };
      
      // Get comprehensive analytics data
      const [
        progressReport,
        detailedTracking,
        learningPatterns,
        predictions,
        performanceTrends,
        subjectPerformance,
        alerts
      ] = await Promise.all([
        analyticsService.generateProgressReport(childId, { start, end }),
        analyticsService.getDetailedProgressTracking(childId, { start, end }),
        analyticsService.recognizeLearningPatterns(childId),
        analyticsService.generatePerformancePredictions(childId),
        analyticsService.generatePerformanceTrends(childId, { start, end }),
        analyticsService.generateSubjectPerformance(childId, { start, end }),
        analyticsService.generateAlerts(childId)
      ]);
      
      const comprehensiveReport = {
        childId,
        timeFrame: { start, end },
        generatedAt: new Date().toISOString(),
        basicMetrics: progressReport,
        detailedTracking,
        learningPatterns,
        predictions,
        performanceTrends,
        subjectPerformance,
        alerts,
        summary: {
          totalDataPoints: detailedTracking.totalDataPoints,
          analysisConfidence: learningPatterns.confidence,
          predictionConfidence: predictions.confidence,
          keyInsights: [
            ...learningPatterns.insights.map((i: any) => i.message),
            ...predictions.insights
          ]
        }
      };
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${childId}.json"`);
      
      res.status(200).json(comprehensiveReport);
      
    } catch (error) {
      logger.error('Error exporting analytics JSON:', error);
      res.status(500).json({ error: 'Failed to export analytics report' });
    }
  }
);

// Real-time Analytics Endpoints

/**
 * Get real-time analytics summary
 * GET /api/analytics/realtime/:childId
 */
router.get(
  '/realtime/:childId',
  authenticateToken,
  requireParentOrChild,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Authorization check
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role === 'CHILD' && req.user.userId !== childId) {
        return res.status(403).json({ error: 'Unauthorized access to another child\'s data' });
      }
      
      // Get real-time data (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [
        recentProgress,
        recentAlerts,
        currentSession
      ] = await Promise.all([
        analyticsService.generateProgressReport(childId, {
          start: yesterday.toISOString(),
          end: new Date().toISOString()
        }),
        analyticsService.generateAlerts(childId),
        analyticsService.getDetailedProgressTracking(childId, {
          start: yesterday.toISOString(),
          end: new Date().toISOString()
        })
      ]);
      
      const realtimeData = {
        childId,
        timestamp: new Date().toISOString(),
        todayStats: {
          activitiesCompleted: recentProgress.activitiesCompleted,
          timeSpent: recentProgress.totalTimeSpent,
          averageScore: recentProgress.averageScore,
          completionRate: recentProgress.completionRate
        },
        currentSession: {
          engagementLevel: currentSession.detailedMetrics.engagement.engagementDepth,
          learningVelocity: currentSession.learningVelocity.velocity,
          consistencyScore: currentSession.detailedMetrics.performance.consistencyScore
        },
        alerts: recentAlerts.filter((alert: any) => !alert.read).slice(0, 5), // Latest 5 unread alerts
        status: recentProgress.activitiesCompleted > 0 ? 'active' : 'inactive'
      };
      
      res.status(200).json(realtimeData);
      
    } catch (error) {
      logger.error('Error getting real-time analytics:', error);
      res.status(500).json({ error: 'Failed to get real-time analytics' });
    }
  }
);

/**
 * Get analytics dashboard data with caching
 * GET /api/analytics/dashboard/:childId
 */
router.get(
  '/dashboard/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(schemas.childIdParam, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const timeFrame = req.query.timeFrame as string || '30d';
      
      // Calculate date range based on timeFrame
      let startDate: Date;
      const endDate = new Date();
      
      switch (timeFrame) {
        case '7d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
      }
      
      // Get comprehensive dashboard data
      const [
        progressReport,
        performanceTrends,
        subjectPerformance,
        learningPatterns,
        predictions,
        alerts
      ] = await Promise.all([
        analyticsService.generateProgressReport(childId, {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }),
        analyticsService.generatePerformanceTrends(childId, {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }),
        analyticsService.generateSubjectPerformance(childId, {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }),
        analyticsService.recognizeLearningPatterns(childId),
        analyticsService.generatePerformancePredictions(childId),
        analyticsService.generateAlerts(childId)
      ]);
      
      const dashboardData = {
        childId,
        timeFrame,
        lastUpdated: new Date().toISOString(),
        overview: {
          totalActivities: progressReport.totalActivities,
          completionRate: progressReport.completionRate,
          averageScore: progressReport.averageScore,
          totalTimeSpent: progressReport.totalTimeSpent,
          streak: await calculateCurrentStreak(childId),
          level: calculateLearningLevel(progressReport, learningPatterns)
        },
        trends: performanceTrends,
        subjects: subjectPerformance,
        insights: {
          learningStyle: learningPatterns.patterns.learningStyle.dominantStyle,
          strengths: learningPatterns.insights
            .filter((i: any) => i.type === 'learning_style' || i.confidence > 0.7)
            .slice(0, 3),
          recommendations: predictions.insights.slice(0, 5)
        },
        alerts: alerts.filter((alert: any) => !alert.read).slice(0, 10),
        predictions: predictions.predictions ? {
          nextScore: predictions.predictions.scores.prediction,
          scoreTrend: predictions.predictions.scores.trend,
          difficultyReady: predictions.predictions.difficultyReadiness.ready,
          riskLevel: predictions.predictions.riskAssessment.length > 0 ? 
            Math.max(...predictions.predictions.riskAssessment.map((r: any) => 
              r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1
            )) : 0
        } : null
      };
      
      // Set cache headers (cache for 5 minutes)
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.status(200).json(dashboardData);
      
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      res.status(500).json({ error: 'Failed to get dashboard analytics' });
    }
  }
);

// Helper functions
async function calculateCurrentStreak(childId: string): Promise<number> {
  try {
    // This is a simplified streak calculation
    // In a real implementation, you'd have a more sophisticated streak tracking system
    const recentProgress = await analyticsService.generateProgressReport(childId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    });
    
    // Simple streak based on recent activity
    return recentProgress.activitiesCompleted > 0 ? Math.min(recentProgress.activitiesCompleted, 30) : 0;
  } catch (error) {
    logger.error('Error calculating streak:', error);
    return 0;
  }
}

function calculateLearningLevel(progressReport: any, learningPatterns: any): string {
  const score = progressReport.averageScore;
  const completionRate = progressReport.completionRate;
  const confidence = learningPatterns.confidence;
  
  const overallScore = (score * 0.4) + (completionRate * 100 * 0.4) + (confidence * 100 * 0.2);
  
  if (overallScore >= 85) return 'Expert';
  if (overallScore >= 70) return 'Advanced';
  if (overallScore >= 55) return 'Intermediate';
  if (overallScore >= 40) return 'Beginner';
  return 'Getting Started';
}

// Enhanced Comprehensive Dashboard Endpoints

/**
 * Get comprehensive dashboard data with real data integration
 * GET /api/analytics/comprehensive-dashboard/:childId
 */
router.get(
  '/comprehensive-dashboard/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      const timeFrame = start && end ? { start, end } : undefined;
      
      const dashboardData = await enhancedAnalyticsService.getComprehensiveDashboardData(childId, timeFrame);
      res.status(200).json(dashboardData);
    } catch (error) {
      logger.error('Error getting comprehensive dashboard data:', error);
      res.status(500).json({ error: 'Failed to get comprehensive dashboard data' });
    }
  }
);

/**
 * Get filtered analytics data with advanced filtering
 * POST /api/analytics/filtered-data/:childId
 */
router.post(
  '/filtered-data/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const filters = req.body;
      
      const filteredData = await enhancedAnalyticsService.getFilteredAnalyticsData(childId, filters);
      res.status(200).json(filteredData);
    } catch (error) {
      logger.error('Error getting filtered analytics data:', error);
      res.status(500).json({ error: 'Failed to get filtered analytics data' });
    }
  }
);

/**
 * Get time series data for interactive charts
 * GET /api/analytics/time-series/:childId
 */
router.get(
  '/time-series/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      const timeFrame = start && end ? { start, end } : undefined;
      
      const timeSeriesData = await enhancedAnalyticsService.generateTimeSeriesData(childId, timeFrame);
      res.status(200).json(timeSeriesData);
    } catch (error) {
      logger.error('Error getting time series data:', error);
      res.status(500).json({ error: 'Failed to get time series data' });
    }
  }
);

/**
 * Get subject progress breakdown with master data integration
 * GET /api/analytics/subject-breakdown/:childId
 */
router.get(
  '/subject-breakdown/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      const timeFrame = start && end ? { start, end } : undefined;
      
      const subjectBreakdown = await enhancedAnalyticsService.getSubjectProgressBreakdown(childId, timeFrame);
      res.status(200).json(subjectBreakdown);
    } catch (error) {
      logger.error('Error getting subject progress breakdown:', error);
      res.status(500).json({ error: 'Failed to get subject progress breakdown' });
    }
  }
);

/**
 * Get skill proficiency visualization data
 * GET /api/analytics/skill-visualization/:childId
 */
router.get(
  '/skill-visualization/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const skillVisualization = await enhancedAnalyticsService.getSkillProficiencyVisualization(childId);
      res.status(200).json(skillVisualization);
    } catch (error) {
      logger.error('Error getting skill proficiency visualization:', error);
      res.status(500).json({ error: 'Failed to get skill proficiency visualization' });
    }
  }
);

// Skill Proficiency Visualization Endpoints

/**
 * Get skill proficiency visualization
 * GET /api/analytics/skill-proficiency/:childId
 */
router.get(
  '/skill-proficiency/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      
      const skillVisualization = await enhancedAnalyticsService.getSkillProficiencyVisualization(childId);
      res.status(200).json(skillVisualization);
    } catch (error) {
      logger.error('Error getting skill proficiency visualization:', error);
      res.status(500).json({ 
        error: 'Failed to get skill proficiency visualization',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get subject progress breakdown
 * GET /api/analytics/subject-breakdown/:childId
 */
router.get(
  '/subject-breakdown/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { start, end } = req.query as { start?: string; end?: string };
      
      const timeFrame = start && end ? { start, end } : undefined;
      
      const subjectBreakdown = await enhancedAnalyticsService.getSubjectProgressBreakdown(childId, timeFrame);
      res.status(200).json(subjectBreakdown);
    } catch (error) {
      logger.error('Error getting subject progress breakdown:', error);
      res.status(500).json({ 
        error: 'Failed to get subject progress breakdown',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get topic mastery details
 * GET /api/analytics/topic-mastery/:childId
 */
router.get(
  '/topic-mastery/:childId',
  authenticateToken,
  requireParent,
  (req, res, next) => validateRequest(progressReportParamsSchema, 'params')(req, res, next),
  async (req, res) => {
    try {
      const { childId } = req.params;
      const { subjectId } = req.query as { subjectId?: string };
      
      const topicMastery = await enhancedAnalyticsService.getTopicMasteryDetails(childId, subjectId);
      res.status(200).json(topicMastery);
    } catch (error) {
      logger.error('Error getting topic mastery details:', error);
      res.status(500).json({ 
        error: 'Failed to get topic mastery details',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;