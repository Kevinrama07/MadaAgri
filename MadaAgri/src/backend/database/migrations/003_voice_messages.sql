-- Migration: Voice message support for chat

-- Add voice message columns to messages table
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddColumnIfNotExists()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'type'
  ) THEN
    ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text' AFTER content;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'attachment_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(1024) AFTER type;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'attachment_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_type VARCHAR(50) AFTER attachment_url;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'audio_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_url VARCHAR(1024) AFTER attachment_type;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'audio_duration'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_duration INT AFTER audio_url;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'public_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN public_id VARCHAR(255) AFTER audio_duration;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'edited_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN edited_at DATETIME AFTER public_id;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at DATETIME AFTER edited_at;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'deleted_by'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_by VARCHAR(36) AFTER deleted_at;
  END IF;
END$$
DELIMITER ;

CALL AddColumnIfNotExists();
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
