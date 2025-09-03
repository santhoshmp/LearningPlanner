import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MasterDataService } from '../services/masterDataService';
import { MasterDataHealthService } from '../services/masterDataHealthService';
import { DatabaseIndexOptimizer } from '../utils/databaseIndexOptimization';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const masterDataService = new MasterDataService(prisma);
const healthService = new MasterDataHealthService(prisma);
const indexOptimizer = new DatabaseIndexOptimizer(prisma);

// Apply authentication to all monitoring routes
router.use(authenticateToken);

// System health overview
router.get('/health', async (req, res) => {
  try {
    const systemStatus = await healthService.getSystemStatus();
    res.json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health status'
    });
  }
});

// Detailed health checks
router.get('/health/detailed', async (req, res) => {
  try {
    const healthChecks = await healthService.performHealthCheck();
    res.json({
      success: true,
      data: {
        checks: healthChecks,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform detailed health check'
    });
  }
});

// Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe as string) || 3600000; // Default 1 hour
    
    const [report, metrics, alerts, queryAnalysis] = await Promise.all([
      masterDataService.getPerformanceReport(timeframe),
      masterDataService.getPerformanceMetrics(),
      masterDataService.getActiveAlerts(),
      masterDataService.analyzeQueryPerformance()
    ]);

    res.json({
      success: true,
      data: {
        report,
        metrics,
        alerts,
        queryAnalysis,
        timeframe: `${timeframe / 60000} minutes`
      }
    });
  } catch (error) {
    console.error('Performance metrics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics'
    });
  }
});

// Cache statistics and management
router.get('/cache', async (req, res) => {
  try {
    const [stats, healthCheck] = await Promise.all([
      masterDataService.getCacheStats(),
      masterDataService.performCacheHealthCheck()
    ]);

    res.json({
      success: true,
      data: {
        statistics: stats,
        health: healthCheck
      }
    });
  } catch (error) {
    console.error('Cache statistics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics'
    });
  }
});

// Cache warming
router.post('/cache/warmup', async (req, res) => {
  try {
    const result = await masterDataService.warmupCache();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Cache warmup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm up cache'
    });
  }
});

// Cache invalidation
router.post('/cache/invalidate', async (req, res) => {
  try {
    const { pattern, type, id } = req.body;

    if (pattern) {
      await masterDataService.clearCache(pattern);
    } else if (type && id) {
      switch (type) {
        case 'grade':
          await masterDataService.invalidateGradeCache(id);
          break;
        case 'subject':
          await masterDataService.invalidateSubjectCache(id);
          break;
        case 'topic':
          await masterDataService.invalidateTopicCache(id);
          break;
        case 'resource':
          await masterDataService.invalidateResourceCache(id);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid cache type'
          });
      }
    } else {
      await masterDataService.clearCache();
    }

    res.json({
      success: true,
      message: 'Cache invalidated successfully'
    });
  } catch (error) {
    console.error('Cache invalidation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache'
    });
  }
});

// Data quality monitoring
router.get('/data-quality', async (req, res) => {
  try {
    const severity = req.query.severity as string;
    const issues = healthService.getDataQualityIssues(severity as any);
    
    res.json({
      success: true,
      data: {
        issues,
        summary: {
          total: issues.length,
          critical: issues.filter(i => i.severity === 'critical').length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Data quality check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data quality information'
    });
  }
});

// Trigger data quality check
router.post('/data-quality/check', async (req, res) => {
  try {
    const issues = await healthService.performDataQualityCheck();
    res.json({
      success: true,
      data: {
        issues,
        message: `Found ${issues.length} data quality issues`
      }
    });
  } catch (error) {
    console.error('Data quality check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform data quality check'
    });
  }
});

// Resource availability monitoring
router.get('/resources/availability', async (req, res) => {
  try {
    const status = req.query.status as string;
    const results = healthService.getResourceCheckResults(status as any);
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          available: results.filter(r => r.status === 'available').length,
          unavailable: results.filter(r => r.status === 'unavailable').length,
          moved: results.filter(r => r.status === 'moved').length,
          restricted: results.filter(r => r.status === 'restricted').length,
          timeout: results.filter(r => r.status === 'timeout').length
        }
      }
    });
  } catch (error) {
    console.error('Resource availability check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resource availability information'
    });
  }
});

// Trigger resource availability check
router.post('/resources/check', async (req, res) => {
  try {
    const batchSize = parseInt(req.body.batchSize) || 50;
    const results = await healthService.checkResourceAvailability(batchSize);
    
    res.json({
      success: true,
      data: {
        results,
        message: `Checked ${results.length} resources`
      }
    });
  } catch (error) {
    console.error('Resource availability check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check resource availability'
    });
  }
});

// Database optimization analysis
router.get('/database/analysis', async (req, res) => {
  try {
    const [indexAnalysis, queryOptimizations, connectionRecommendations] = await Promise.all([
      indexOptimizer.analyzeIndexUsage(),
      indexOptimizer.getOptimizedQueries(),
      indexOptimizer.getConnectionPoolRecommendations()
    ]);

    res.json({
      success: true,
      data: {
        indexAnalysis,
        queryOptimizations,
        connectionRecommendations
      }
    });
  } catch (error) {
    console.error('Database analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze database performance'
    });
  }
});

// Generate database optimization migration
router.get('/database/migration', async (req, res) => {
  try {
    const migration = await indexOptimizer.generateIndexMigration();
    
    res.json({
      success: true,
      data: {
        migration,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Migration generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate database migration'
    });
  }
});

// Database maintenance
router.post('/database/maintenance', async (req, res) => {
  try {
    const result = await indexOptimizer.performMaintenance();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Database maintenance failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform database maintenance'
    });
  }
});

// System metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await healthService.collectSystemMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('System metrics collection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect system metrics'
    });
  }
});

// Maintenance tasks
router.get('/maintenance/tasks', async (req, res) => {
  try {
    const status = req.query.status as string;
    const tasks = healthService.getMaintenanceTasks(status as any);
    
    res.json({
      success: true,
      data: {
        tasks,
        summary: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          running: tasks.filter(t => t.status === 'running').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          failed: tasks.filter(t => t.status === 'failed').length
        }
      }
    });
  } catch (error) {
    console.error('Maintenance tasks retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve maintenance tasks'
    });
  }
});

// Schedule maintenance task
router.post('/maintenance/schedule', async (req, res) => {
  try {
    const { type, priority, description, scheduledAt } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Task type and description are required'
      });
    }

    const taskId = await healthService.scheduleMaintenanceTask({
      type,
      priority: priority || 'medium',
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
    });
    
    res.json({
      success: true,
      data: {
        taskId,
        message: 'Maintenance task scheduled successfully'
      }
    });
  } catch (error) {
    console.error('Maintenance task scheduling failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule maintenance task'
    });
  }
});

// Performance monitoring queries
router.get('/database/monitoring-queries', async (req, res) => {
  try {
    const queries = indexOptimizer.getPerformanceMonitoringQueries();
    
    res.json({
      success: true,
      data: queries
    });
  } catch (error) {
    console.error('Monitoring queries retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monitoring queries'
    });
  }
});

// Query plan analysis
router.post('/database/analyze-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const analysis = await indexOptimizer.analyzeQueryPlan(query);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Query analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze query plan'
    });
  }
});

// Resource usage monitoring
router.get('/resources/usage', async (req, res) => {
  try {
    const usage = await masterDataService.getResourceUsage();
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Resource usage retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resource usage information'
    });
  }
});

// Export monitoring data
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format as string || 'json';
    const timeframe = parseInt(req.query.timeframe as string) || 86400000; // Default 24 hours
    
    const [systemStatus, performanceReport, dataQualityIssues, resourceChecks] = await Promise.all([
      healthService.getSystemStatus(),
      masterDataService.getPerformanceReport(timeframe),
      healthService.getDataQualityIssues(),
      healthService.getResourceCheckResults()
    ]);

    const exportData = {
      exportedAt: new Date(),
      timeframe: `${timeframe / 60000} minutes`,
      systemStatus,
      performanceReport,
      dataQualityIssues,
      resourceChecks
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=monitoring-report.csv');
      
      // This would need proper CSV conversion
      res.send('CSV export not implemented yet');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=monitoring-report.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export monitoring data'
    });
  }
});

export default router;