-- Table des notifications (sans contraintes de clés étrangères pour compatibilité)
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('message', 'collaboration', 'follow', 'like', 'comment', 'mention', 'purchase', 'order', 'system') NOT NULL,
  actor_id INT,
  actor_name VARCHAR(255),
  actor_image VARCHAR(500),
  content TEXT,
  related_type VARCHAR(50),
  related_id VARCHAR(36),
  is_read BOOLEAN DEFAULT 0,
  is_archived BOOLEAN DEFAULT 0,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_user_archived (user_id, is_archived),
  INDEX idx_created (created_at),
  INDEX idx_type (type),
  INDEX idx_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des préférences de notifications (sans contraintes de clés étrangères)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INT PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT 1,
  push_enabled BOOLEAN DEFAULT 1,
  sound_enabled BOOLEAN DEFAULT 1,
  types_enabled JSON,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les préférences par défaut pour les utilisateurs existants
INSERT IGNORE INTO notification_preferences (user_id, types_enabled)
SELECT id, '{"message":true,"collaboration":true,"follow":true,"like":true,"comment":true,"mention":true,"purchase":true,"order":true,"system":true}'
FROM users;
