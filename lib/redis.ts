/**
 * Redis Cache Client
 * Simple caching utility for document storage and caching
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

// Get Redis connection URL from environment
function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

// Check if Redis is enabled
function isRedisEnabled(): boolean {
  return process.env.CACHE_ENABLED === '1' || process.env.CACHE_ENABLED === 'true';
}

// Initialize Redis client (singleton)
export function getRedisClient(): Redis | null {
  if (!isRedisEnabled()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('error', () => {
      // Silent fail for Redis connection errors
    });

    redisClient.on('connect', () => {
      // Redis connected silently
    });
  }

  return redisClient;
}

// Connect to Redis
export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client) {
    await client.connect();
  }
}

// Disconnect from Redis
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Cache Operations
export const cache = {
  // Set a value with optional expiration (seconds)
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  },

  // Get a value
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;
    return await client.get(key);
  },

  // Delete a key
  async delete(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    await client.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;
    return (await client.exists(key)) === 1;
  },

  // Set hash field
  async hset(key: string, field: string, value: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    await client.hset(key, field, value);
  },

  // Get hash field
  async hget(key: string, field: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;
    return await client.hget(key, field);
  },

  // Get all hash fields
  async hgetall(key: string): Promise<Record<string, string>> {
    const client = getRedisClient();
    if (!client) return {};
    return await client.hgetall(key);
  },

  // Delete hash field
  async hdel(key: string, field: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    await client.hdel(key, field);
  },

  // Add to set
  async sadd(key: string, ...members: string[]): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    await client.sadd(key, ...members);
  },

  // Get set members
  async smembers(key: string): Promise<string[]> {
    const client = getRedisClient();
    if (!client) return [];
    return await client.smembers(key);
  },

  // Check set membership
  async sismember(key: string, member: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;
    return await client.sismember(key, member);
  },

  // Set expiration (seconds)
  async expire(key: string, ttl: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    await client.expire(key, ttl);
  },

  // Clear all keys matching a pattern
  async clearPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  },
};

// Document Cache Keys
export const documentCache = {
  // Document content cache (1 hour)
  contentKey: (docId: string) => `doc:${docId}:content`,
  // Document metadata cache (24 hours)
  metadataKey: (docId: string) => `doc:${docId}:meta`,
  // User session cache (24 hours)
  sessionKey: (userId: string) => `session:${userId}`,
  // AI response cache (1 hour)
  aiResponseKey: (key: string) => `ai:${key}`,

  // Get document content
  async getContent(docId: string): Promise<string | null> {
    return await cache.get(this.contentKey(docId));
  },

  // Set document content
  async setContent(docId: string, content: string): Promise<void> {
    await cache.set(this.contentKey(docId), content, 3600);
  },

  // Invalidate document cache
  async invalidate(docId: string): Promise<void> {
    await cache.delete(this.contentKey(docId));
    await cache.delete(this.metadataKey(docId));
  },
};

export default {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  cache,
  documentCache,
};
