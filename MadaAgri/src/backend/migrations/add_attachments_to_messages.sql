-- Migration: Ajouter le support des pièces jointes aux messages
-- Date: 2024

ALTER TABLE messages 
ADD COLUMN attachment_url VARCHAR(500) NULL AFTER content,
ADD COLUMN attachment_type VARCHAR(50) NULL AFTER attachment_url;

-- Types possibles: 'image', 'video', 'audio', 'document', 'location'
