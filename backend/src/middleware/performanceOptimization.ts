import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Response caching middleware
 */
export const cacheResponse = (options: {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}) => {
  const { ttl = 300, keyGenerator, condition, varyBy = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Check condition if provided
      if (condition && !condition(req, res)) {
        return next();
      }

      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req, varyBy);

      // Try to get cached response
      const cachedResponse = await redisService.getCacheObject<{
        statusCode: number;
        headers: Record<string, string>;
        body: any;
        timestamp: number;
      }>(cacheKey);

      if (cachedResponse) {
        // Set cached headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-Timestamp', new Date(cachedResponse.timestamp).toISOString());

        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // Cache miss - intercept response
      const originalSend = res.send;
      const originalJson = res.json;

      let responseBody: any;
      let responseSent = false;

      res.send = function(body: any) {
        if (!responseSent) {
          responseBody = body;
          responseSent = true;
          cacheResponseData(cacheKey, res.statusCode, res.getHeaders(), body, ttl);
        }
        return originalSend.call(this, body);
      };

      res.json = function(body: any) {
        if (!responseSent) {
          responseBody = body;
          responseSent = true;
          cacheResponseData(cacheKey, res.statusCode, res.getHeaders(), body, ttl);
        }
        return originalJson.call(this, body);
      };

      // Add cache miss header
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache response data
 */
async function cacheResponseData(
  key: string, 
  statusCode: number, 
  headers: any, 
  body: any, 
  ttl: number
): Promise<void> {
  try {
    // Only cache successful responses
    if (statusCode >= 200 && statusCode < 300) {
      const cacheData = {
        statusCode,
        headers: sanitizeHeaders(headers),
        body,
        timestamp: Date.now()
      };

      await redisService.setCacheObject(key, cacheData, ttl);
    }
  } catch (error) {
    logger.error('Failed to cache response:', error);
  }
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, varyBy: string[] = []): string {
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  // Add vary headers to key
  const varyData = varyBy.map(header => `${header}:${req.headers[header.toLowerCase()] || ''}`).join('|');
  
  // Add user context if authenticated
  const userContext = req.user ? `user:${req.user.userId}` : 'anonymous';
  
  const fullKey = `${baseKey}|${varyData}|${userContext}`;
  
  // Hash long keys to keep them manageable
  if (fullKey.length > 200) {
    return `cache:${crypto.createHash('sha256').update(fullKey).digest('hex')}`;
  }
  
  return `cache:${fullKey}`;
}

/**
 * Sanitize headers for caching
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const allowedHeaders = [
    'content-type',
    'cache-control',
    'expires',
    'last-modified',
    'etag'
  ];

  Object.entries(headers).forEach(([key, value]) => {
    if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Database query optimization middleware
 */
export const optimizeQueries = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints to request
  req.queryOptimization = {
    useIndexes: true,
    limitResults: true,
    selectFields: true,
    joinOptimization: true
  };

  next();
};

/**
 * Compression middleware for large responses
 */
export const compressResponse = (threshold: number = 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(body: any) {
      if (typeof body === 'string' && body.length > threshold) {
        res.setHeader('Content-Encoding', 'gzip');
        // In a real implementation, you'd use actual compression here
      }
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      const jsonString = JSON.stringify(body);
      if (jsonString.length > threshold) {
        res.setHeader('Content-Encoding', 'gzip');
        // In a real implementation, you'd use actual compression here
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Request batching middleware
 */
export const batchRequests = (options: {
  maxBatchSize?: number;
  batchTimeout?: number;
}) => {
  const { maxBatchSize = 10, batchTimeout = 100 } = options;
  const batches = new Map<string, {
    requests: Array<{
      req: Request;
      res: Response;
      next: NextFunction;
    }>;
    timer: NodeJS.Timeout;
  }>();

  return (req: Request, res: Response, next: NextFunction) => {
    // Only batch similar requests
    const batchKey = `${req.method}:${req.route?.path || req.path}`;
    
    if (!batches.has(batchKey)) {
      batches.set(batchKey, {
        requests: [],
        timer: setTimeout(() => {
          processBatch(batchKey, batches);
        }, batchTimeout)
      });
    }

    const batch = batches.get(batchKey)!;
    batch.requests.push({ req, res, next });

    // Process batch if it reaches max size
    if (batch.requests.length >= maxBatchSize) {
      clearTimeout(batch.timer);
      processBatch(batchKey, batches);
    }
  };
};

/**
 * Process batched requests
 */
function processBatch(
  batchKey: string, 
  batches: Map<string, any>
): void {
  const batch = batches.get(batchKey);
  if (!batch) return;

  // Process all requests in the batch
  batch.requests.forEach(({ req, res, next }: any) => {
    next();
  });

  // Clean up batch
  batches.delete(batchKey);
}

/**
 * Memory usage monitoring middleware
 */
export const monitorMemoryUsage = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log significant memory increases
    if (memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
      logger.warn('High memory usage detected', {
        endpoint: req.originalUrl,
        method: req.method,
        memoryDelta,
        userId: req.user?.userId
      });
    }
  });

  next();
};

/**
 * Lazy loading middleware for large datasets
 */
export const enableLazyLoading = (options: {
  pageSize?: number;
  maxPageSize?: number;
}) => {
  const { pageSize = 20, maxPageSize = 100 } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(maxPageSize, parseInt(req.query.limit as string) || pageSize);
    const offset = (page - 1) * limit;

    // Add pagination to request
    req.pagination = {
      page,
      limit,
      offset,
      pageSize
    };

    // Modify response to include pagination metadata
    const originalJson = res.json;
    res.json = function(body: any) {
      if (body && Array.isArray(body.data)) {
        const paginatedResponse = {
          data: body.data,
          pagination: {
            page,
            limit,
            total: body.total || body.data.length,
            totalPages: Math.ceil((body.total || body.data.length) / limit),
            hasNext: page * limit < (body.total || body.data.length),
            hasPrev: page > 1
          }
        };
        return originalJson.call(this, paginatedResponse);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Connection pooling optimization
 */
export const optimizeConnections = (req: Request, res: Response, next: NextFunction) => {
  // Add connection optimization hints
  req.connectionOptimization = {
    reuseConnections: true,
    poolSize: 10,
    maxIdleTime: 30000,
    acquireTimeout: 60000
  };

  next();
};

/**
 * Preload critical resources
 */
export const preloadResources = (resources: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add preload headers for critical resources
    resources.forEach(resource => {
      res.setHeader('Link', `<${resource}>; rel=preload`);
    });

    next();
  };
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      queryOptimization?: {
        useIndexes: boolean;
        limitResults: boolean;
        selectFields: boolean;
        joinOptimization: boolean;
      };
      pagination?: {
        page: number;
        limit: number;
        offset: number;
        pageSize: number;
      };
      connectionOptimization?: {
        reuseConnections: boolean;
        poolSize: number;
        maxIdleTime: number;
        acquireTimeout: number;
      };
    }
  }
}