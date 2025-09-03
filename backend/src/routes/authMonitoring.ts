import express from 'express';
import { authDebugService } from '../services/authDebugService';
import { authDiagnostics } from '../utils/authDiagnostics';
import { auth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get authentication statistics for monitoring dashboard
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { timeframe = 'day' } = req.query;
    
    if (!['hour', 'day', 'week'].includes(timeframe as string)) {
      return res.status(400).json({ error: 'Invalid timeframe. Use: hour, day, or week' });
    }

    const stats = await authDebugService.getAuthStats(timeframe as 'hour' | 'day' | 'week');
    
    res.json({
      success: true,
      data: stats,
      timeframe
    });
  } catch (error) {
    logger.error('Failed to get auth stats', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve authentication statistics' 
    });
  }
});

/**
 * Get authentication events with filtering
 */
router.get('/events', auth, async (req, res) => {
  try {
    const {
      userType,
      userId,
      childId,
      eventType,
      startDate,
      endDate,
      limit = '100'
    } = req.query;

    const filters: any = {};
    
    if (userType) filters.userType = userType as 'PARENT' | 'CHILD';
    if (userId) filters.userId = userId as string;
    if (childId) filters.childId = childId as string;
    if (eventType) filters.eventType = eventType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    filters.limit = parseInt(limit as string, 10);

    const events = await authDebugService.getAuthEvents(filters);
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    logger.error('Failed to get auth events', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve authentication events' 
    });
  }
});

/**
 * Get performance metrics for authentication operations
 */
router.get('/performance', auth, async (req, res) => {
  try {
    const {
      operation,
      userType,
      startDate,
      endDate,
      limit = '100'
    } = req.query;

    const filters: any = {};
    
    if (operation) filters.operation = operation as string;
    if (userType) filters.userType = userType as 'PARENT' | 'CHILD';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    filters.limit = parseInt(limit as string, 10);

    const metrics = await authDebugService.getPerformanceMetrics(filters);
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve performance metrics' 
    });
  }
});

/**
 * Perform system health check
 */
router.get('/health', auth, async (req, res) => {
  try {
    const healthCheck = await authDiagnostics.performHealthCheck();
    
    const overallStatus = healthCheck.some(result => result.status === 'error') 
      ? 'error' 
      : healthCheck.some(result => result.status === 'warning') 
        ? 'warning' 
        : 'healthy';

    res.json({
      success: true,
      overallStatus,
      checks: healthCheck,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to perform health check', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform health check' 
    });
  }
});

/**
 * Diagnose specific user session
 */
router.get('/diagnose/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isChild = 'false' } = req.query;

    const diagnosis = await authDiagnostics.diagnoseUserSession(
      userId, 
      isChild === 'true'
    );
    
    res.json({
      success: true,
      data: diagnosis,
      userId,
      isChild: isChild === 'true'
    });
  } catch (error) {
    logger.error('Failed to diagnose user session', { error, userId: req.params.userId });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to diagnose user session' 
    });
  }
});

/**
 * Validate JWT token
 */
router.post('/validate-token', auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token is required' 
      });
    }

    const validation = await authDiagnostics.validateToken(token);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Failed to validate token', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate token' 
    });
  }
});

/**
 * Generate comprehensive troubleshooting report
 */
router.get('/troubleshoot', auth, async (req, res) => {
  try {
    const { userId, isChild = 'false' } = req.query;

    const report = await authDiagnostics.generateTroubleshootingReport(
      userId as string | undefined,
      isChild === 'true'
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate troubleshooting report', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate troubleshooting report' 
    });
  }
});

/**
 * Detect suspicious authentication activity
 */
router.get('/suspicious-activity', auth, async (req, res) => {
  try {
    const { childId } = req.query;

    const suspiciousActivity = await authDebugService.detectSuspiciousActivity(
      childId as string | undefined
    );
    
    res.json({
      success: true,
      data: suspiciousActivity,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to detect suspicious activity', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to detect suspicious activity' 
    });
  }
});

/**
 * Test authentication flow (development only)
 */
router.post('/test-flow', auth, async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Test endpoints not available in production' 
      });
    }

    const { credentials } = req.body;

    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        error: 'Credentials are required for testing' 
      });
    }

    const testResult = await authDiagnostics.testAuthFlow(credentials);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    logger.error('Failed to test auth flow', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test authentication flow' 
    });
  }
});

export default router;