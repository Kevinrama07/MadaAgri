-- Migration: Production-grade AI analysis pipeline
-- Run: mysql -u root madaagri < migrations/ai_analysis_pipeline.sql

-- 1. Create analysis_jobs table for async queue
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  parcel_id VARCHAR(36),
  image_url VARCHAR(1024) NOT NULL,
  image_hash VARCHAR(64),
  status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
  result JSON,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_created (created_at DESC),
  INDEX idx_hash (image_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add ai_source column to crop_analysis_results
SET @dbname = DATABASE();
SET @tablename = 'crop_analysis_results';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'ai_source') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ai_source VARCHAR(50) DEFAULT ''heuristic'' AFTER image_quality')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Add image_hash column for cache lookup
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'image_hash') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN image_hash VARCHAR(64) AFTER image_url')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Add index on image_hash for cache lookups
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_image_hash') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX idx_image_hash (image_hash)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 5. Add analysis_precision column
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'analysis_precision') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN analysis_precision ENUM(\'high\', \'low\') DEFAULT \'low\' AFTER ai_source')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
