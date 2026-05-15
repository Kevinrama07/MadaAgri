-- Migration: Support de suppression de messages (soft delete)
-- Date: 2024
-- Description: Ajoute la colonne deleted_at pour soft delete

ALTER TABLE messages 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN deleted_by INT NULL,
ADD CONSTRAINT fk_messages_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);

-- Vue pour messages non supprimés (optionnel)
CREATE OR REPLACE VIEW active_messages AS
SELECT * FROM messages WHERE deleted_at IS NULL;
