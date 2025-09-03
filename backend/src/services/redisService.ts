import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    await this.ensureConnected();
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnected();
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    await this.ensureConnected();
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    await this.ensureConnected();
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    await this.ensureConnected();
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    return await this.client.ttl(key);
  }

  // Session-specific methods
  async setSession(sessionId: string, sessionData: any, expireInSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    const value = JSON.stringify(sessionData);
    await this.set(key, value, expireInSeconds);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    const result = await this.del(key);
    return result > 0;
  }

  async refreshSession(sessionId: string, expireInSeconds: number = 3600): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.expire(key, expireInSeconds);
  }

  // Blacklist methods for token invalidation
  async blacklistToken(tokenId: string, expireInSeconds: number): Promise<void> {
    const key = `blacklist:${tokenId}`;
    await this.set(key, 'revoked', expireInSeconds);
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = `blacklist:${tokenId}`;
    const exists = await this.exists(key);
    return exists > 0;
  }

  // Rate limiting methods
  async incrementRateLimit(key: string, windowInSeconds: number): Promise<number> {
    await this.ensureConnected();
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, windowInSeconds);
    }
    return current;
  }

  async getRateLimit(key: string): Promise<number> {
    await this.ensureConnected();
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Enhanced caching methods for performance optimization
  async setJSON(key: string, value: any, expireInSeconds?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.set(key, jsonValue, expireInSeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  // Cache with automatic serialization and compression for large objects
  async setCacheObject(key: string, value: any, expireInSeconds: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      // For large objects, consider compression
      if (serialized.length > 1024) {
        const compressed = await this.compressString(serialized);
        await this.set(`${key}:compressed`, compressed, expireInSeconds);
      } else {
        await this.set(key, serialized, expireInSeconds);
      }
    } catch (error) {
      console.error('Error setting cache object:', error);
      throw error;
    }
  }

  async getCacheObject<T>(key: string): Promise<T | null> {
    try {
      // Try compressed version first
      const compressed = await this.get(`${key}:compressed`);
      if (compressed) {
        const decompressed = await this.decompressString(compressed);
        return JSON.parse(decompressed);
      }

      // Fall back to regular version
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting cache object:', error);
      return null;
    }
  }

  // Analytics caching methods
  async cacheAnalyticsData(childId: string, timeframe: string, data: any, expireInSeconds: number = 3600): Promise<void> {
    const key = `analytics:${childId}:${timeframe}`;
    await this.setCacheObject(key, data, expireInSeconds);
  }

  async getCachedAnalyticsData<T>(childId: string, timeframe: string): Promise<T | null> {
    const key = `analytics:${childId}:${timeframe}`;
    return await this.getCacheObject<T>(key);
  }

  // Content caching methods
  async cacheContent(contentId: string, content: any, expireInSeconds: number = 7 * 24 * 3600): Promise<void> {
    const key = `content:${contentId}`;
    await this.setCacheObject(key, content, expireInSeconds);
  }

  async getCachedContent<T>(contentId: string): Promise<T | null> {
    const key = `content:${contentId}`;
    return await this.getCacheObject<T>(key);
  }

  // Gemini API response caching
  async cacheGeminiResponse(requestHash: string, response: any, expireInSeconds: number = 7 * 24 * 3600): Promise<void> {
    const key = `gemini:${requestHash}`;
    await this.setCacheObject(key, response, expireInSeconds);
  }

  async getCachedGeminiResponse<T>(requestHash: string): Promise<T | null> {
    const key = `gemini:${requestHash}`;
    return await this.getCacheObject<T>(key);
  }

  // User settings caching
  async cacheUserSettings(userId: string, settings: any, expireInSeconds: number = 24 * 3600): Promise<void> {
    const key = `settings:user:${userId}`;
    await this.setCacheObject(key, settings, expireInSeconds);
  }

  async getCachedUserSettings<T>(userId: string): Promise<T | null> {
    const key = `settings:user:${userId}`;
    return await this.getCacheObject<T>(key);
  }

  async invalidateUserSettings(userId: string): Promise<void> {
    const key = `settings:user:${userId}`;
    await this.del(key);
  }

  // Child settings caching
  async cacheChildSettings(childId: string, settings: any, expireInSeconds: number = 24 * 3600): Promise<void> {
    const key = `settings:child:${childId}`;
    await this.setCacheObject(key, settings, expireInSeconds);
  }

  async getCachedChildSettings<T>(childId: string): Promise<T | null> {
    const key = `settings:child:${childId}`;
    return await this.getCacheObject<T>(key);
  }

  async invalidateChildSettings(childId: string): Promise<void> {
    const key = `settings:child:${childId}`;
    await this.del(key);
  }

  // Bulk operations for performance
  async mget(keys: string[]): Promise<(string | null)[]> {
    await this.ensureConnected();
    return await this.client.mGet(keys);
  }

  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    await this.ensureConnected();
    await this.client.mSet(keyValuePairs);
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<number> {
    await this.ensureConnected();
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      return await this.client.del(keys);
    }
    return 0;
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    await this.ensureConnected();
    return await this.client.keys(pattern);
  }

  // Cache invalidation methods
  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`*:${userId}:*`);
    await this.deletePattern(`*:user:${userId}`);
  }

  async invalidateChildCache(childId: string): Promise<void> {
    await this.deletePattern(`*:${childId}:*`);
    await this.deletePattern(`*:child:${childId}`);
  }

  // Cache warming methods
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      const exists = await this.exists(key);
      if (!exists) {
        try {
          const data = await fetcher(key);
          await this.setCacheObject(key, data);
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    missRate: number;
  }> {
    await this.ensureConnected();
    const info = await this.client.info('memory');
    const keyspace = await this.client.info('keyspace');
    
    // Parse memory usage
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

    // Count total keys
    const keys = await this.client.keys('*');
    const totalKeys = keys.length;

    // Note: Hit/miss rates would need to be tracked separately
    return {
      totalKeys,
      memoryUsage,
      hitRate: 0, // Would need separate tracking
      missRate: 0  // Would need separate tracking
    };
  }

  // Compression utilities for large objects
  private async compressString(str: string): Promise<string> {
    // Simple base64 encoding for now - in production, use actual compression
    return Buffer.from(str).toString('base64');
  }

  private async decompressString(compressed: string): Promise<string> {
    // Simple base64 decoding for now - in production, use actual decompression
    return Buffer.from(compressed, 'base64').toString('utf8');
  }

  // Health check
  async ping(): Promise<string> {
    await this.ensureConnected();
    return await this.client.ping();
  }

  // Get client for advanced operations
  getClient(): RedisClientType {
    return this.client;
  }
}

export const redisService = new RedisService();