const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis connection refused');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('Redis client disconnected gracefully');
    }
  }

  // Helper: Cache wrapper pour fonctions
  async wrap(key, fn, ttl = 3600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  // Helper: Générer clé de cache
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Singleton
const cacheService = new CacheService();

module.exports = cacheService;
