const { createClient } = require('redis');
const logger = require('../utils/logger');

const CACHE_TTL = 86400 * 7; // 7 days
const CACHE_PREFIX = 'ai:analysis:';

class CacheService {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.useRedis = process.env.DISABLE_REDIS !== 'true' && process.env.REDIS_URL;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    if (!this.useRedis) {
      logger.info('[CacheService] Using in-memory cache (Redis disabled)');
      this.initialized = true;
      return;
    }

    try {
      this.redis = createClient({ url: process.env.REDIS_URL });
      this.redis.on('error', (err) => logger.error('[CacheService] Redis error', { error: err.message }));
      this.redis.on('connect', () => logger.info('[CacheService] Redis connected'));
      await this.redis.connect();
      logger.info('[CacheService] Redis cache initialized');
    } catch (error) {
      logger.warn('[CacheService] Redis unavailable, using in-memory cache', { error: error.message });
      this.redis = null;
      this.useRedis = false;
    }

    this.initialized = true;
  }

  _makeKey(hash) {
    return `${CACHE_PREFIX}${hash}`;
  }

  async get(hash) {
    if (!this.initialized) await this.init();

    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(this._makeKey(hash));
        if (data) {
          logger.info('[CacheService] Redis cache hit', { hash: hash.substring(0, 12) });
          return JSON.parse(data);
        }
      } catch (error) {
        logger.warn('[CacheService] Redis get failed', { error: error.message });
      }
    }

    const entry = this.memoryCache.get(hash);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        logger.info('[CacheService] Memory cache hit', { hash: hash.substring(0, 12) });
        return entry.data;
      }
      this.memoryCache.delete(hash);
    }

    return null;
  }

  async set(hash, data) {
    if (!this.initialized) await this.init();

    if (this.useRedis && this.redis) {
      try {
        await this.redis.set(this._makeKey(hash), JSON.stringify(data), { EX: CACHE_TTL });
      } catch (error) {
        logger.warn('[CacheService] Redis set failed', { error: error.message });
      }
    }

    this.memoryCache.set(hash, {
      data,
      expiresAt: Date.now() + CACHE_TTL * 1000,
    });

    if (this.memoryCache.size > 1000) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
  }

  async invalidate(hash) {
    if (!this.initialized) await this.init();

    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(this._makeKey(hash));
      } catch (error) {
        logger.warn('[CacheService] Redis del failed', { error: error.message });
      }
    }

    this.memoryCache.delete(hash);
  }

  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      useRedis: this.useRedis,
      redisConnected: this.redis?.isOpen || false,
    };
  }
}

module.exports = new CacheService();
