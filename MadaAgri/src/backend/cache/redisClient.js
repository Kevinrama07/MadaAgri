const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Redis client for rate limiting, budget management, and caching
 * Uses redis v4+ with promise-based API
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (process.env.DISABLE_REDIS === 'true') {
      logger.info('Redis is disabled (DISABLE_REDIS=true), skipping connection');
      this.isConnected = false;
      return;
    }

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 retries');
              return new Error('Redis reconnection exhausted');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      // Don't throw - allow app to continue without Redis
    }
  }

  /**
   * Get value from Redis
   * Returns string or null (does NOT deserialize JSON)
   */
  async get(key) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, returning null for key: ${key}`);
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in Redis (string only, no JSON serialization)
   */
  async set(key, value, ttlSeconds = null) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, cannot SET key: ${key}`);
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, String(value));
      } else {
        await this.client.set(key, String(value));
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Increment a counter in Redis
   */
  async incr(key) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, cannot INCR key: ${key}`);
      return null;
    }

    try {
      const value = await this.client.incr(key);
      return value;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set expiration time on a key (in seconds)
   */
  async expire(key, seconds) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, cannot EXPIRE key: ${key}`);
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get TTL of a key (in seconds, -2 if not exists, -1 if no expiry)
   */
  async ttl(key) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, returning -1 for TTL of key: ${key}`);
      return -1;
    }

    try {
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error.message);
      return -1;
    }
  }

  /**
   * Delete a key
   */
  async del(key) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, cannot DEL key: ${key}`);
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, returning false for EXISTS key: ${key}`);
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get multiple keys matching a pattern (use with caution in production)
   */
  async keys(pattern) {
    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, returning empty array for KEYS ${pattern}`);
      return [];
    }

    try {
      const keys = await this.client.keys(pattern);
      return keys || [];
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
      return [];
    }
  }

  /**
   * Delete multiple keys
   */
  async mDel(keys) {
    if (!keys || keys.length === 0) {
      return true;
    }

    if (!this.client || !this.isConnected) {
      logger.warn(`Redis not connected, cannot DEL ${keys.length} keys`);
      return false;
    }

    try {
      await this.client.del(keys);
      return true;
    } catch (error) {
      logger.error(`Redis MDEL error for ${keys.length} keys:`, error.message);
      return false;
    }
  }

  /**
   * Flush all data (use with caution)
   */
  async flushAll() {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected, cannot FLUSHALL');
      return false;
    }

    try {
      await this.client.flushAll();
      logger.info('Redis flushed all data');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error.message);
      return false;
    }
  }

  /**
   * Gracefully disconnect
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
        this.isConnected = false;
      } catch (error) {
        logger.error('Redis disconnect error:', error.message);
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    };
  }
}

// Create and export singleton instance
const redisClient = new RedisClient();

// Initialize connection on module load
redisClient.connect().catch((error) => {
  logger.error('Failed to initialize Redis client:', error.message);
});

module.exports = redisClient;
