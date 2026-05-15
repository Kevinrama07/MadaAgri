-- ============================================
-- Migration: Ajout d'indexes pour optimisation
-- Date: 2024-01-15
-- Description: Ajouter des indexes sur les colonnes fréquemment utilisées
-- ============================================

USE madaagri;

-- ============================================
-- Table: users
-- ============================================
ALTER TABLE users 
  ADD INDEX idx_email (email),
  ADD INDEX idx_role (role),
  ADD INDEX idx_region_id (region_id),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Table: posts
-- ============================================
ALTER TABLE posts 
  ADD INDEX idx_author_id (author_id),
  ADD INDEX idx_visibility (visibility),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_author_created (author_id, created_at DESC);

-- ============================================
-- Table: post_likes
-- ============================================
ALTER TABLE post_likes 
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Table: post_comments
-- ============================================
ALTER TABLE post_comments 
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_parent_id (parent_id),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Table: products
-- ============================================
ALTER TABLE products 
  ADD INDEX idx_farmer_id (farmer_id),
  ADD INDEX idx_culture_id (culture_id),
  ADD INDEX idx_region_id (region_id),
  ADD INDEX idx_is_available (is_available),
  ADD INDEX idx_visibility (visibility),
  ADD INDEX idx_price (price),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_farmer_available (farmer_id, is_available);

-- ============================================
-- Table: reservations
-- ============================================
-- Indexes déjà présents dans le schéma principal
-- Vérifier s'ils existent
SELECT 'Reservations indexes already exist' AS status;

-- ============================================
-- Table: messages
-- ============================================
ALTER TABLE messages 
  ADD INDEX idx_sender_id (sender_id),
  ADD INDEX idx_recipient_id (recipient_id),
  ADD INDEX idx_conversation_id (conversation_id),
  ADD INDEX idx_is_read (is_read),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_conversation_created (conversation_id, created_at DESC);

-- ============================================
-- Table: notifications
-- ============================================
ALTER TABLE notifications 
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_type (type),
  ADD INDEX idx_is_read (is_read),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_user_unread (user_id, is_read, created_at DESC);

-- ============================================
-- Table: follows
-- ============================================
ALTER TABLE follows 
  ADD INDEX idx_follower_id (follower_id),
  ADD INDEX idx_followee_id (followee_id),
  ADD INDEX idx_status (status),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Table: collaboration_invitations
-- ============================================
ALTER TABLE collaboration_invitations 
  ADD INDEX idx_sender_id (sender_id),
  ADD INDEX idx_recipient_id (recipient_id),
  ADD INDEX idx_status (status),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_recipient_status (recipient_id, status);

-- ============================================
-- Table: deliveries
-- ============================================
ALTER TABLE deliveries 
  ADD INDEX idx_farmer_id (farmer_id),
  ADD INDEX idx_product_id (product_id),
  ADD INDEX idx_destination_region_id (destination_region_id),
  ADD INDEX idx_status (status),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Table: cart_items
-- ============================================
-- Index unique déjà présent
ALTER TABLE cart_items 
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_product_id (product_id),
  ADD INDEX idx_created_at (created_at);

-- ============================================
-- Vérification des indexes créés
-- ============================================
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'madaagri'
  AND TABLE_NAME IN (
    'users', 'posts', 'post_likes', 'post_comments', 
    'products', 'reservations', 'messages', 'notifications',
    'follows', 'collaboration_invitations', 'deliveries', 'cart_items'
  )
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- Analyser les tables pour optimiser les indexes
-- ============================================
ANALYZE TABLE users, posts, post_likes, post_comments, products, 
             reservations, messages, notifications, follows, 
             collaboration_invitations, deliveries, cart_items;

SELECT 'Migration completed successfully' AS status;
