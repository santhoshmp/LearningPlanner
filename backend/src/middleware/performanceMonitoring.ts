import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to monitor API endpoint performance
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();
  
  // Add response listener to calculate performance metrics when the response is sent
  res.on('finish', () => {
    const hrTime = process.hrtime(startTime);
    const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Log performance data
    logger.info({
      type: 'performance_metric',
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: responseTimeMs.toFixed(2),
      userAgent: req.headers['user-agent'] || 'unknown',
      userId: req.user?.userId || 'unauthenticated',
      endpoint: req.route?.path || req.originalUrl.split('?')[0]
    });
    
    // Alert on slow responses (over 1000ms)
    if (responseTimeMs > 1000) {
      logger.warn({
        type: 'slow_response',
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        responseTimeMs: responseTimeMs.toFixed(2),
        endpoint: req.route?.path || req.originalUrl.split('?')[0]
      });
    }
  });
  
  next();
};

/**
 * Track memory usage and log if it exceeds thresholds
 */
export const memoryMonitor = () => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024)
  };
  
  // Log memory usage
  logger.info({
    type: 'memory_usage',
    ...memoryUsageMB,
    timestamp: new Date().toISOString()
  });
  
  // Alert if memory usage is high (adjust thresholds as needed)
  if (memoryUsageMB.heapUsed > 500) { // 500MB threshold
    logger.warn({
      type: 'high_memory_usage',
      ...memoryUsageMB,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Setup periodic memory monitoring
 * @param intervalMs Interval in milliseconds
 */
export const setupMemoryMonitoring = (intervalMs = 300000) => { // Default: 5 minutes
  return setInterval(memoryMonitor, intervalMs);
};