const pool = require('../db');
const logger = require('../utils/logger');

const COST_PER_ANALYSIS = 0.05;
const USER_DAILY_BUDGET_USD = 0.25;
const GLOBAL_DAILY_BUDGET_USD = 50;
const ALERT_THRESHOLD_PERCENT = 80;
const MAX_MEMORY_ENTRIES = 5000;

const memoryBudgets = new Map();

class BudgetManagementService {
  constructor() {
    this.useDb = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      await pool.query('SELECT 1');
      this.useDb = true;
      logger.info('[BudgetManagementService] Using DB-backed budget tracking');
    } catch {
      this.useDb = false;
      logger.warn('[BudgetManagementService] DB unavailable, using memory budget tracking');
    }
    this.initialized = true;
    setInterval(() => this.cleanupMemory(), 300000);
  }

  _now() { return Math.floor(Date.now() / 1000); }

  _getMemoryBudget(userId) {
    const key = `budget:${userId}`;
    if (!memoryBudgets.has(key)) {
      memoryBudgets.set(key, { spent: 0, resetAt: this._now() + 86400 });
    }
    return memoryBudgets.get(key);
  }

  _getGlobalMemoryBudget() {
    const key = 'budget:global';
    if (!memoryBudgets.has(key)) {
      memoryBudgets.set(key, { spent: 0, resetAt: this._now() + 86400 });
    }
    return memoryBudgets.get(key);
  }

  async checkBudget(userId, isGlobal = true) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [userRows] = await pool.query(
          `SELECT COALESCE(SUM(cost_usd), 0) as spent FROM analysis_costs WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
          [userId]
        );
        const userSpent = parseFloat(userRows[0]?.spent || 0);
        const userRemaining = USER_DAILY_BUDGET_USD - userSpent;

        if (userRemaining < COST_PER_ANALYSIS) {
          return { allowed: false, reason: 'user_budget_exceeded', spent: userSpent, limit: USER_DAILY_BUDGET_USD, remaining: 0 };
        }

        if (isGlobal) {
          const [globalRows] = await pool.query(
            `SELECT COALESCE(SUM(cost_usd), 0) as spent FROM analysis_costs WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
          );
          const globalSpent = parseFloat(globalRows[0]?.spent || 0);
          const globalRemaining = GLOBAL_DAILY_BUDGET_USD - globalSpent;

          if (globalRemaining < COST_PER_ANALYSIS) {
            return { allowed: false, reason: 'global_budget_exceeded', spent: globalSpent, limit: GLOBAL_DAILY_BUDGET_USD, remaining: 0 };
          }

          const alertThreshold = (globalSpent / GLOBAL_DAILY_BUDGET_USD) * 100 >= ALERT_THRESHOLD_PERCENT;
          return { allowed: true, spent: userSpent, remaining: userRemaining, globalSpent, globalRemaining, alert: alertThreshold };
        }

        return { allowed: true, spent: userSpent, remaining: userRemaining };
      } catch (error) {
        logger.warn('[BudgetManagementService] DB check failed, using memory', { error: error.message });
        this.useDb = false;
      }
    }

    const userBudget = this._getMemoryBudget(userId);
    const globalBudget = this._getGlobalMemoryBudget();
    const now = this._now();

    if (now >= userBudget.resetAt) { userBudget.spent = 0; userBudget.resetAt = now + 86400; }
    if (now >= globalBudget.resetAt) { globalBudget.spent = 0; globalBudget.resetAt = now + 86400; }

    const userRemaining = USER_DAILY_BUDGET_USD - userBudget.spent;
    if (userRemaining < COST_PER_ANALYSIS) {
      return { allowed: false, reason: 'user_budget_exceeded', spent: userBudget.spent, limit: USER_DAILY_BUDGET_USD, remaining: 0 };
    }

    if (isGlobal) {
      const globalRemaining = GLOBAL_DAILY_BUDGET_USD - globalBudget.spent;
      if (globalRemaining < COST_PER_ANALYSIS) {
        return { allowed: false, reason: 'global_budget_exceeded', spent: globalBudget.spent, limit: GLOBAL_DAILY_BUDGET_USD, remaining: 0 };
      }
      const alertThreshold = (globalBudget.spent / GLOBAL_DAILY_BUDGET_USD) * 100 >= ALERT_THRESHOLD_PERCENT;
      return { allowed: true, spent: userBudget.spent, remaining: userRemaining, globalSpent: globalBudget.spent, globalRemaining, alert: alertThreshold };
    }

    return { allowed: true, spent: userBudget.spent, remaining: userRemaining };
  }

  async recordCost(userId, costUsd) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        await pool.query(
          `INSERT INTO analysis_costs (user_id, cost_usd, created_at) VALUES (?, ?, NOW())`,
          [userId, costUsd]
        );
        return;
      } catch (error) {
        logger.warn('[BudgetManagementService] DB record failed, using memory', { error: error.message });
        this.useDb = false;
      }
    }

    const userBudget = this._getMemoryBudget(userId);
    const globalBudget = this._getGlobalMemoryBudget();
    const now = this._now();

    if (now >= userBudget.resetAt) { userBudget.spent = 0; userBudget.resetAt = now + 86400; }
    if (now >= globalBudget.resetAt) { globalBudget.spent = 0; globalBudget.resetAt = now + 86400; }

    userBudget.spent += costUsd;
    globalBudget.spent += costUsd;
  }

  async getUserDailySpent(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [rows] = await pool.query(
          `SELECT COALESCE(SUM(cost_usd), 0) as spent FROM analysis_costs WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
          [userId]
        );
        return parseFloat(rows[0]?.spent || 0);
      } catch {
        this.useDb = false;
      }
    }

    const budget = this._getMemoryBudget(userId);
    if (this._now() >= budget.resetAt) { budget.spent = 0; budget.resetAt = this._now() + 86400; }
    return budget.spent;
  }

  async getGlobalDailySpent() {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        const [rows] = await pool.query(
          `SELECT COALESCE(SUM(cost_usd), 0) as spent FROM analysis_costs WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );
        return parseFloat(rows[0]?.spent || 0);
      } catch {
        this.useDb = false;
      }
    }

    const budget = this._getGlobalMemoryBudget();
    if (this._now() >= budget.resetAt) { budget.spent = 0; budget.resetAt = this._now() + 86400; }
    return budget.spent;
  }

  async resetUserBudget(userId) {
    if (!this.initialized) await this.init();

    if (this.useDb) {
      try {
        await pool.query(`DELETE FROM analysis_costs WHERE user_id = ?`, [userId]);
        return true;
      } catch {
        this.useDb = false;
      }
    }

    memoryBudgets.delete(`budget:${userId}`);
    return true;
  }

  cleanupMemory() {
    const now = this._now();
    for (const [key, budget] of memoryBudgets.entries()) {
      if (now > budget.resetAt + 3600) {
        memoryBudgets.delete(key);
      }
    }
    if (memoryBudgets.size > MAX_MEMORY_ENTRIES) {
      const keys = [...memoryBudgets.keys()];
      for (let i = 0; i < keys.length / 2; i++) {
        memoryBudgets.delete(keys[i]);
      }
    }
  }
}

module.exports = new BudgetManagementService();
