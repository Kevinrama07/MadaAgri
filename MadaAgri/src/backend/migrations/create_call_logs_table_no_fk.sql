-- ============================================
-- SCRIPT ALTERNATIF : Table call_logs SANS clés étrangères
-- ============================================
-- Utilisez ce script si vous avez des problèmes avec les clés étrangères
-- ou si votre table users a un nom différent

-- Étape 1 : Vérifier le nom exact de votre table users
-- Exécutez cette requête pour voir toutes vos tables :
-- SHOW TABLES;

-- Étape 2 : Vérifier la structure de la table users
-- Exécutez cette requête pour voir la structure :
-- DESCRIBE users;

-- Étape 3 : Créer la table call_logs SANS clés étrangères
CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR(36) PRIMARY KEY,
  caller_id VARCHAR(36) NOT NULL COMMENT 'ID de l\'appelant',
  receiver_id VARCHAR(36) NOT NULL COMMENT 'ID du destinataire',
  call_type ENUM('voice', 'video') DEFAULT 'voice' COMMENT 'Type d\'appel',
  status ENUM('missed', 'answered', 'declined', 'failed', 'cancelled') NOT NULL COMMENT 'Statut de l\'appel',
  duration INT DEFAULT 0 COMMENT 'Durée en secondes',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de début',
  ended_at TIMESTAMP NULL COMMENT 'Date de fin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  
  -- Index pour améliorer les performances
  INDEX idx_caller (caller_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_started (started_at),
  INDEX idx_status (status),
  INDEX idx_caller_receiver (caller_id, receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des appels vocaux et vidéo';

-- Étape 4 (OPTIONNEL) : Ajouter les clés étrangères APRÈS avoir vérifié que la table users existe
-- Décommentez et exécutez ces lignes UNIQUEMENT si votre table s'appelle bien "users" :

/*
ALTER TABLE call_logs
ADD CONSTRAINT fk_call_logs_caller 
  FOREIGN KEY (caller_id) REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE call_logs
ADD CONSTRAINT fk_call_logs_receiver 
  FOREIGN KEY (receiver_id) REFERENCES users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
*/

-- Étape 5 : Vérifier que la table a été créée
-- SELECT * FROM call_logs LIMIT 1;

-- ============================================
-- REQUÊTES UTILES POUR DÉBOGUER
-- ============================================

-- Voir toutes les tables de la base de données
-- SHOW TABLES;

-- Voir la structure de la table call_logs
-- DESCRIBE call_logs;

-- Voir les clés étrangères de la table call_logs
-- SELECT 
--   CONSTRAINT_NAME,
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_NAME = 'call_logs' 
--   AND CONSTRAINT_SCHEMA = 'madaagri';

-- Supprimer la table si besoin (ATTENTION : supprime toutes les données)
-- DROP TABLE IF EXISTS call_logs;
