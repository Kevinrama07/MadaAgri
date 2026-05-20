-- Migration: Rate limiting and budget tracking tables (Redis-free)
-- Run: Get-Content "path\to\file.sql" | mysql -u root madaagri

-- Rate limits table
CREATE TABLE IF NOT EXISTS analysis_rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('daily', 'burst') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_user_type (user_id, type),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Budget/cost tracking table
CREATE TABLE IF NOT EXISTS analysis_costs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auto-cleanup old rate limits (older than 24h)
DELETE FROM analysis_rate_limits WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Auto-cleanup old costs (older than 48h)
DELETE FROM analysis_costs WHERE created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR);
