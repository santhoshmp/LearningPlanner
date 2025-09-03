import express from 'express';
import { childErrorHandler } from '../services/childErrorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Report child authentication errors
router.post('/report', async (req, res) => {
  try {
    const {
      errorId,
      message,
      stack,
      componentStack,
      userAgent,
      url,
      timestamp,
      sessionCorruption,
      retryCount
    } = req.body;

    // Log the error for monitoring
    logger.error('Child authentication error reported', {
      errorId,
      message,
      stack,
      componentStack,
      userAgent,
      url,
      timestamp,
      sessionCorruption,
      retryCount,
      ip: req.ip,
      headers: req.headers
    });

    // Store error in database for analysis
    await childErrorHandler.recordError({
      errorId,
      message,
      stack,
      componentStack,
      userAgent,
      url,
      timestamp: new Date(timestamp),
      sessionCorruption,
      retryCount,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    });

    // Check if this indicates a pattern that needs attention
    const errorPattern = await childErrorHandler.analyzeErrorPattern(errorId, message);
    if (errorPattern.requiresAttention) {
      logger.warn('Child authentication error pattern detected', {
        pattern: errorPattern,
        errorId
      });
    }

    res.status(200).json({
      success: true,
      errorId,
      message: 'Error reported successfully'
    });
  } catch (error) {
    logger.error('Failed to report child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report error'
    });
  }
});

// Get error statistics (for monitoring dashboard)
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const stats = await childErrorHandler.getErrorStats(timeframe as string);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get error stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error statistics'
    });
  }
});

// Get error patterns (for analysis)
router.get('/patterns', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const patterns = await childErrorHandler.getErrorPatterns(Number(limit));
    
    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    logger.error('Failed to get error patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error patterns'
    });
  }
});

export default router;