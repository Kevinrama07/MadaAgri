const pool = require('../db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Audit logging service for tracking all analysis requests
 * Used for monitoring, debugging, cost tracking, and abuse detection
 */
class AuditLogService {
  /**
   * Log an analysis attempt
   */
  static async logAnalysisAttempt(data) {
    const {
      userId,
      parcelId,
      imageUrl,
      status,           // 'started', 'completed', 'failed', 'fallback'
      aiResult = null,
      error = null,
      costUsd = null,
      responseTimeMs = null,
      modelUsed = null,  // 'gemini-2.0-flash', 'fallback', etc.
    } = data;

    const logId = uuidv4();

    try {
      await pool.query(
        `INSERT INTO analysis_audit_logs (
          id, user_id, parcel_id, image_url, status, ai_result,
          error_message, cost_usd, response_time_ms, model_used, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          logId,
          userId,
          parcelId || null,
          imageUrl,
          status,
          aiResult ? JSON.stringify(aiResult) : null,
          error,
          costUsd || null,
          responseTimeMs || null,
          modelUsed,
        ]
      );

      logger.info('[AuditLog] Analysis logged', {
        logId,
        userId,
        status,
        cost: costUsd,
        responseTime: responseTimeMs,
      });

      return logId;
    } catch (error) {
      logger.error('[AuditLog] Failed to log analysis', {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Log a rate limit violation
   */
  static async logRateLimitViolation(userId, violation) {
    const {
      type,              // 'daily_limit', 'burst_limit', 'budget_exceeded'
      limit,
      current,
    } = violation;

    try {
      await pool.query(
        `INSERT INTO rate_limit_violations (
          user_id, violation_type, limit_value, current_value, created_at
        ) VALUES (?, ?, ?, ?, NOW())`,
        [userId, type, limit, current]
      );

      logger.warn('[AuditLog] Rate limit violation', {
        userId,
        type,
        limit,
        current,
      });

      return true;
    } catch (error) {
      logger.error('[AuditLog] Failed to log rate limit violation', {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get analysis history for user
   */
  static async getUserAnalysisHistory(userId, limit = 50, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id, parcel_id, status, model_used, cost_usd, response_time_ms,
          created_at
        FROM analysis_audit_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return rows;
    } catch (error) {
      logger.error('[AuditLog] Get history error', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get analysis statistics for user
   */
  static async getUserAnalysisStats(userId, days = 7) {
    try {
      const [rows] = await pool.query(
        `SELECT
          COUNT(*) as total_analyses,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'fallback' THEN 1 ELSE 0 END) as fallback_used,
          SUM(CASE WHEN cost_usd IS NOT NULL THEN cost_usd ELSE 0 END) as total_cost_usd,
          AVG(response_time_ms) as avg_response_time_ms,
          MAX(response_time_ms) as max_response_time_ms
        FROM analysis_audit_logs
        WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, days]
      );

      return rows[0] || {
        total_analyses: 0,
        successful: 0,
        failed: 0,
        fallback_used: 0,
        total_cost_usd: 0,
        avg_response_time_ms: 0,
        max_response_time_ms: 0,
      };
    } catch (error) {
      logger.error('[AuditLog] Get stats error', {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get global analysis statistics
   */
  static async getGlobalAnalysisStats(days = 7) {
    try {
      const [rows] = await pool.query(
        `SELECT
          COUNT(*) as total_analyses,
          COUNT(DISTINCT user_id) as unique_users,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'fallback' THEN 1 ELSE 0 END) as fallback_used,
          SUM(CASE WHEN cost_usd IS NOT NULL THEN cost_usd ELSE 0 END) as total_cost_usd,
          AVG(response_time_ms) as avg_response_time_ms
        FROM analysis_audit_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      return rows[0] || {
        total_analyses: 0,
        unique_users: 0,
        successful: 0,
        failed: 0,
        fallback_used: 0,
        total_cost_usd: 0,
        avg_response_time_ms: 0,
      };
    } catch (error) {
      logger.error('[AuditLog] Get global stats error', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(userId) {
    try {
      const [violations] = await pool.query(
        `SELECT COUNT(*) as count
        FROM rate_limit_violations
        WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [userId]
      );

      const violationCount = violations[0]?.count || 0;

      if (violationCount > 5) {
        logger.warn('[AuditLog] Suspicious activity detected', {
          userId,
          violations: violationCount,
          timeWindow: '1 hour',
        });
        return {
          suspicious: true,
          reason: 'multiple_rate_limit_violations',
          violationCount,
        };
      }

      return { suspicious: false };
    } catch (error) {
      logger.error('[AuditLog] Suspicious activity detection error', {
        userId,
        error: error.message,
      });
      return { suspicious: false };
    }
  }

  /**
   * Cleanup old logs (should run periodically)
   */
  static async cleanupOldLogs(retentionDays = 90) {
    try {
      const [result] = await pool.query(
        `DELETE FROM analysis_audit_logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [retentionDays]
      );

      logger.info('[AuditLog] Old logs cleaned up', {
        deletedRows: result.affectedRows,
        retentionDays,
      });

      return result.affectedRows;
    } catch (error) {
      logger.error('[AuditLog] Cleanup error', {
        error: error.message,
      });
      return 0;
    }
  }
}

module.exports = AuditLogService;
