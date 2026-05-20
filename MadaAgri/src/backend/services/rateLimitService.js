const pool = require('../db');
const logger = require('../utils/logger');

const MAX_ANALYSES_PER_DAY = 5;
const ANALYSIS_WINDOW_HOURS = 24;
const BURST_LIMIT = 2;
const BURST_WINDOW_MINUTES = 5;

const memoryCounters = new Map();
const MAX_MEMORY_ENTRIES = 5000;
const MEMORY_CLEANUP_INTERVAL = 300000; // 5 min

class RateLimitService {
  constructor() {
    this.useDb = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      await pool.query('SELECT 1');
      this.useDb = true;
      logger.info('[RateLimitService] Using DB-backed rate limiting');
    } catch {
      this.useDb = false;
      logger.warn('[RateLimitService] DB unavailable, using memory rate limiting');
    }
    this.initialized = true;
    setInterval(() => this.cleanupMemory(), MEMORY_CLEANUP_INTERVAL);
  }

  _now() { return Math.floor(Date.now() / 1000); }

  _memoryKey(userId, type) { return `${type}:${userId}`; }

  _getMemoryCounters(userId) {
    const key = this._memoryKey(userId, 'rl');
    if (!memoryCounters.has(key)) {
      memoryCounters.set(key, { daily: 0, dailyReset: this._now() + ANALYSIS_WINDOW_HOURS * 3600, burst: 0, burstReset: this._now() + BURST_WINDOW_MINUTES * 60 });
    }
    return memoryCounters.get(key);
  }

  _checkMemoryExpiry(counters) {
    const now = this._now();
    if (now >= counters.dailyReset) { counters.daily = 0; counters.dailyReset = now + ANALYSIS_WINDOW_HOURS * 3600; }
    if (now >= counters.burstReset) { counters.burst = 0; counters.burstReset = now + BURST_WINDOW_MINUTES * 60; }
  }

  async checkDailyLimit(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [rows] = await pool.query(
          `SELECT COUNT(*) as count FROM analysis_rate_limits WHERE user_id = ? AND type = 'daily' AND expires_at > NOW()`,
          [userId]
        );
        const count = rows[0]?.count || 0;
        if (count >= MAX_ANALYSES_PER_DAY) {
          return { allowed: false, reason: 'daily_limit_exceeded', remaining: 0, resetIn: 0 };
        }
        return { allowed: true, remaining: MAX_ANALYSES_PER_DAY - count };
      } catch (error) {
        logger.warn('[RateLimitService] DB check failed, using memory', { error: error.message });
        this.useDb = false;
      }
    }

    const counters = this._getMemoryCounters(userId);
    this._checkMemoryExpiry(counters);
    if (counters.daily >= MAX_ANALYSES_PER_DAY) {
      return { allowed: false, reason: 'daily_limit_exceeded', remaining: 0, resetIn: counters.dailyReset - this._now() };
    }
    return { allowed: true, remaining: MAX_ANALYSES_PER_DAY - counters.daily };
  }

  async checkBurstLimit(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [rows] = await pool.query(
          `SELECT COUNT(*) as count FROM analysis_rate_limits WHERE user_id = ? AND type = 'burst' AND expires_at > NOW()`,
          [userId]
        );
        const count = rows[0]?.count || 0;
        if (count >= BURST_LIMIT) {
          return { allowed: false, reason: 'burst_limit_exceeded', retryAfter: 0 };
        }
        return { allowed: true };
      } catch {
        this.useDb = false;
      }
    }

    const counters = this._getMemoryCounters(userId);
    this._checkMemoryExpiry(counters);
    if (counters.burst >= BURST_LIMIT) {
      return { allowed: false, reason: 'burst_limit_exceeded', retryAfter: counters.burstReset - this._now() };
    }
    return { allowed: true };
  }

  async recordAnalysis(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        await pool.query(
          `INSERT INTO analysis_rate_limits (user_id, type, expires_at) VALUES (?, 'daily', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
          [userId, ANALYSIS_WINDOW_HOURS]
        );
        await pool.query(
          `INSERT INTO analysis_rate_limits (user_id, type, expires_at) VALUES (?, 'burst', DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
          [userId, BURST_WINDOW_MINUTES]
        );
        return;
      } catch (error) {
        logger.warn('[RateLimitService] DB record failed, using memory', { error: error.message });
        this.useDb = false;
      }
    }

    const counters = this._getMemoryCounters(userId);
    this._checkMemoryExpiry(counters);
    counters.daily++;
    counters.burst++;
  }

  async getUserUsageStats(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [rows] = await pool.query(
          `SELECT type, COUNT(*) as count, MIN(expires_at) as expires_at
           FROM analysis_rate_limits WHERE user_id = ? AND expires_at > NOW()
           GROUP BY type`,
          [userId]
        );
        const daily = rows.find(r => r.type === 'daily');
        const burst = rows.find(r => r.type === 'burst');
        return {
          daily: { used: daily?.count || 0, limit: MAX_ANALYSES_PER_DAY, remaining: Math.max(0, MAX_ANALYSES_PER_DAY - (daily?.count || 0)), resetIn: daily ? Math.floor((new Date(daily.expires_at) - new Date()) / 1000) : null },
          burst: { used: burst?.count || 0, limit: BURST_LIMIT, remaining: Math.max(0, BURST_LIMIT - (burst?.count || 0)), resetIn: burst ? Math.floor((new Date(burst.expires_at) - new Date()) / 1000) : null },
        };
      } catch {
        this.useDb = false;
      }
    }

    const counters = this._getMemoryCounters(userId);
    this._checkMemoryExpiry(counters);
    return {
      daily: { used: counters.daily, limit: MAX_ANALYSES_PER_DAY, remaining: Math.max(0, MAX_ANALYSES_PER_DAY - counters.daily), resetIn: counters.dailyReset - this._now() },
      burst: { used: counters.burst, limit: BURST_LIMIT, remaining: Math.max(0, BURST_LIMIT - counters.burst), resetIn: counters.burstReset - this._now() },
    };
  }

  async resetUserLimits(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        await pool.query(`DELETE FROM analysis_rate_limits WHERE user_id = ?`, [userId]);
        return true;
      } catch {
        this.useDb = false;
      }
    }

    memoryCounters.delete(this._memoryKey(userId, 'rl'));
    return true;
  }

  cleanupMemory() {
    const now = this._now();
    for (const [key, counters] of memoryCounters.entries()) {
      if (now > counters.dailyReset && now > counters.burstReset) {
        memoryCounters.delete(key);
      }
    }
    if (memoryCounters.size > MAX_MEMORY_ENTRIES) {
      const keys = [...memoryCounters.keys()];
      for (let i = 0; i < keys.length / 2; i++) {
        memoryCounters.delete(keys[i]);
      }
    }
  }
}

module.exports = new RateLimitService();
