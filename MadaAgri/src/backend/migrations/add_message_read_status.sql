-- Migration: Support des indicateurs de lecture (read receipts)
-- Date: 2024
-- Description: Ajoute la table message_read_status pour tracker qui a lu quel message

CREATE TABLE IF NOT EXISTS message_read_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (message_id, user_id),
  INDEX idx_message_read (message_id),
  INDEX idx_user_read (user_id)
);

-- Ajouter une colonne delivered_at pour distinguer "envoyé" vs "délivré"
ALTER TABLE messages 
ADD COLUMN delivered_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

-- Vue pour messages avec statut de lecture
CREATE OR REPLACE VIEW messages_with_read_status AS
SELECT 
  m.*,
  COUNT(DISTINCT mrs.user_id) as read_by_count,
  GROUP_CONCAT(DISTINCT mrs.user_id) as read_by_users,
  MAX(mrs.read_at) as last_read_at
FROM messages m
LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
WHERE m.deleted_at IS NULL
GROUP BY m.id;
