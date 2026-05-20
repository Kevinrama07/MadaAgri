-- Migration 002: Add user preferences and 2FA columns
USE madaagri;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Indian/Antananarivo',
  ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS privacy_settings JSON,
  ADD COLUMN IF NOT EXISTS notification_settings JSON,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS token_version VARCHAR(36) DEFAULT NULL;
