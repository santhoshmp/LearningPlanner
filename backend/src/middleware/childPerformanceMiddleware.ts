import { Request, Response, NextFunction } from 'express';
import { childPerformanceService } from '../services/childPerformanceService';
import { logger } from '../utils/logger';

interface PerformanceRequest extends Request {
  startTime?: number;
  childId?: string;
}

/**
 * Middleware to track API performance for child-related endpoints
 */
export const childPerformanceMiddleware = (req: PerformanceRequest, res: Response, next: NextFunction) => {
  // Only track child-related endpoints
  if (!req.path.includes('/child') && !req.path.includes('/badge') && !req.path.includes('/progress')) {
    return next();
  }

  req.startTime = Date.now();

  // Extract child ID from various sources
  req.childId = req.params.childId || req.body.childId || req.query.childId as string;

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - (req.startTime || Date.now());
    
    if (req.childId) {
      // Record API response time
      childPerformanceService.recordApiResponse(
        req.childId,
        `${req.method} ${req.path}`,
        duration
      );

      // Log slow requests
      if (duration > 1000) {
        logger.warn(`Slow API request detected: ${req.method} ${req.path} took ${duration}ms for child ${req.childId}`);
      }
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to track cache performance
 */
export const cachePerformanceMiddleware = (cacheKey: string, isHit: boolean) => {
  return (req: PerformanceRequest, res: Response, next: NextFunction) => {
    if (req.childId) {
      const responseTime = Date.now() - (req.startTime || Date.now());
      
      if (isHit) {
        childPerformanceService.recordCacheHit(req.childId, cacheKey, responseTime);
      } else {
        childPerformanceService.recordCacheMiss(req.childId, cacheKey, responseTime);
      }
    }
    
    next();
  };
};

/**
 * Database query performance tracking decorator
 */
export function trackDbPerformance(queryType: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        // Extract child ID from arguments if available
        const childId = args.find(arg => typeof arg === 'string' && arg.length > 10);
        
        if (childId) {
          childPerformanceService.recordDbQuery(childId, queryType, duration);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Database query ${queryType} failed after ${duration}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Performance monitoring for specific child operations
 */
export class ChildOperationMonitor {
  private childId: string;
  private operation: string;
  private startTime: number;

  constructor(childId: string, operation: string) {
    this.childId = childId;
    this.operation = operation;
    this.startTime = Date.now();
  }

  /**
   * Record the completion of the operation
   */
  complete(): void {
    const duration = Date.now() - this.startTime;
    
    childPerformanceService.recordMetric({
      childId: this.childId,
      metricType: 'api_response',
      value: duration,
      metadata: { operation: this.operation }
    });

    logger.debug(`Child operation ${this.operation} completed in ${duration}ms for child ${this.childId}`);
  }

  /**
   * Record an error in the operation
   */
  error(error: Error): void {
    const duration = Date.now() - this.startTime;
    
    logger.error(`Child operation ${this.operation} failed after ${duration}ms for child ${this.childId}:`, error);
    
    childPerformanceService.recordMetric({
      childId: this.childId,
      metricType: 'api_response',
      value: duration,
      metadata: { 
        operation: this.operation,
        error: error.message,
        failed: true
      }
    });
  }
}

/**
 * Express middleware for comprehensive child performance monitoring
 */
export const comprehensiveChildPerformanceMiddleware = (req: PerformanceRequest, res: Response, next: NextFunction) => {
  // Skip non-child endpoints
  if (!req.path.includes('/child') && !req.path.includes('/badge') && !req.path.includes('/progress')) {
    return next();
  }

  const startTime = Date.now();
  req.startTime = startTime;

  // Extract child ID
  const childId = req.params.childId || req.body.childId || req.query.childId as string;
  req.childId = childId;

  if (!childId) {
    return next();
  }

  const monitor = new ChildOperationMonitor(childId, `${req.method} ${req.path}`);

  // Override res.json to capture successful responses
  const originalJson = res.json;
  res.json = function(body?: any) {
    monitor.complete();
    return originalJson.call(this, body);
  };

  // Override res.status for error responses
  const originalStatus = res.status;
  res.status = function(code: number) {
    if (code >= 400) {
      monitor.error(new Error(`HTTP ${code} response`));
    }
    return originalStatus.call(this, code);
  };

  // Handle uncaught errors
  const originalNext = next;
  next = function(error?: any) {
    if (error) {
      monitor.error(error);
    }
    return originalNext.call(this, error);
  };

  next();
};

export default {
  childPerformanceMiddleware,
  cachePerformanceMiddleware,
  trackDbPerformance,
  ChildOperationMonitor,
  comprehensiveChildPerformanceMiddleware
};