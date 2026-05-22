-- Migration: Ajouter le support vidéo aux publications
-- Compatible MySQL (n'utilise pas IF NOT EXISTS, non supporté par MySQL)

-- Ajout des colonnes vidéo à la table posts
DELIMITER //
DROP PROCEDURE IF EXISTS add_video_columns//
CREATE PROCEDURE add_video_columns()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;

  ALTER TABLE posts
    ADD COLUMN video_url VARCHAR(500) NULL AFTER image_url,
    ADD COLUMN video_thumbnail VARCHAR(500) NULL AFTER video_url,
    ADD COLUMN video_duration INT NULL AFTER video_thumbnail,
    ADD COLUMN video_views INT DEFAULT 0 AFTER video_duration;
END//
DELIMITER ;

CALL add_video_columns();
DROP PROCEDURE IF EXISTS add_video_columns;

-- Table de suivi des vues vidéo
CREATE TABLE IF NOT EXISTS video_views (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_video_views_post ON video_views (post_id);
CREATE INDEX idx_video_views_user ON video_views (user_id);
