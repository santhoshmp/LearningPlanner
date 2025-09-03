import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import winston from 'winston';

type RedisClientType = ReturnType<typeof createClient>;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Prisma Client Configuration
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Prisma logging
prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info', (e) => {
  logger.info('Prisma Info:', e.message);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e.message);
});

// Redis Client Configuration
let redisClient: RedisClientType | null = null;

const createRedisClient = (): RedisClientType => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: Too many reconnection attempts, giving up');
          return new Error('Too many reconnection attempts');
        }
        const delay = Math.min(retries * 50, 2000);
        logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
        return delay;
      },
    },
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis: Connected successfully');
  });

  client.on('reconnecting', () => {
    logger.info('Redis: Reconnecting...');
  });

  client.on('ready', () => {
    logger.info('Redis: Ready to accept commands');
  });

  return client;
};

// Database Connection Functions
export const connectDatabase = async (): Promise<void> => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    logger.info('Database: PostgreSQL connected successfully');

    // Test database with a simple query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database: Connection test successful');

  } catch (error) {
    logger.error('Database: Failed to connect to PostgreSQL:', error);
    throw new Error('Failed to connect to database');
  }
};

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient) {
      redisClient = createRedisClient();
    }

    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Redis: Connected successfully');
    }

    // Test Redis connection
    await redisClient.ping();
    logger.info('Redis: Connection test successful');

  } catch (error) {
    logger.error('Redis: Failed to connect:', error);
    throw new Error('Failed to connect to Redis');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database: PostgreSQL disconnected');
  } catch (error) {
    logger.error('Database: Error disconnecting from PostgreSQL:', error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis: Disconnected');
    }
  } catch (error) {
    logger.error('Redis: Error disconnecting:', error);
  }
};

// Health check functions
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const gracefulShutdown = async (): Promise<void> => {
  logger.info('Initiating graceful shutdown...');
  
  try {
    await Promise.all([
      disconnectDatabase(),
      disconnectRedis()
    ]);
    logger.info('Graceful shutdown completed');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
};

// Export clients
export { prisma };
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Database transaction helper
export const withTransaction = async <T>(
  callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    logger.error('Transaction failed:', error);
    throw error;
  }
};

// Redis session helpers
export const setSession = async (
  key: string, 
  value: any, 
  ttlSeconds: number = 3600
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to set session:', error);
    throw error;
  }
};

export const getSession = async (key: string): Promise<any | null> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Failed to get session:', error);
    return null;
  }
};

export const deleteSession = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Failed to delete session:', error);
    throw error;
  }
};

export const cacheSet = async (
  key: string, 
  value: any, 
  ttlSeconds: number = 300
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to set cache:', error);
    // Don't throw for cache failures, just log
  }
};

export const cacheGet = async (key: string): Promise<any | null> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Failed to get cache:', error);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Failed to delete cache:', error);
    // Don't throw for cache failures, just log
  }
};