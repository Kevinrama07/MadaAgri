-- Migration: Support des réactions aux messages
-- Date: 2024
-- Description: Ajoute la table message_reactions pour permettre aux utilisateurs de réagir avec des emojis

CREATE TABLE IF NOT EXISTS message_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_reaction (message_id, user_id, emoji),
  INDEX idx_message_reactions (message_id),
  INDEX idx_user_reactions (user_id)
);

-- Vue pour messages avec compteur de réactions
CREATE OR REPLACE VIEW messages_with_reactions AS
SELECT 
  m.*,
  COUNT(DISTINCT mr.id) as reaction_count,
  GROUP_CONCAT(DISTINCT CONCAT(mr.emoji, ':', mr.user_id) SEPARATOR ',') as reactions_detail
FROM messages m
LEFT JOIN message_reactions mr ON m.id = mr.message_id
WHERE m.deleted_at IS NULL
GROUP BY m.id;

-- Vue pour statistiques de réactions par emoji
CREATE OR REPLACE VIEW reaction_stats AS
SELECT 
  message_id,
  emoji,
  COUNT(*) as count,
  GROUP_CONCAT(user_id) as user_ids
FROM message_reactions
GROUP BY message_id, emoji;
