-- Migration: Ajouter le support de l'édition de messages
-- Date: 2024

USE madaagri;

-- Ajouter la colonne edited_at pour tracker les modifications
ALTER TABLE messages 
ADD COLUMN edited_at DATETIME DEFAULT NULL AFTER created_at;

-- Ajouter un index sur conversation_id pour améliorer les performances
ALTER TABLE messages 
ADD INDEX idx_conversation_id (conversation_id);

-- Ajouter un index sur created_at pour le tri
ALTER TABLE messages 
ADD INDEX idx_created_at (created_at);

-- Ajouter un index composite pour les requêtes de pagination
ALTER TABLE messages 
ADD INDEX idx_conversation_created (conversation_id, created_at);
