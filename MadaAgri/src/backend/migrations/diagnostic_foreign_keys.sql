-- ============================================
-- SCRIPT DE DIAGNOSTIC - Problèmes de clés étrangères
-- ============================================
-- Exécutez ces requêtes une par une pour diagnostiquer le problème

-- 1. Vérifier que vous êtes dans la bonne base de données
SELECT DATABASE();

-- 2. Lister toutes les tables de la base de données
SHOW TABLES;

-- 3. Vérifier si la table 'users' existe
SELECT 
  TABLE_NAME,
  ENGINE,
  TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users';

-- 4. Si la table users existe, voir sa structure
DESCRIBE users;

-- 5. Vérifier le type de la colonne 'id' dans users
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  IS_NULLABLE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'id';

-- 6. Vérifier que la colonne 'id' est bien une PRIMARY KEY
SELECT 
  CONSTRAINT_NAME,
  CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND CONSTRAINT_TYPE = 'PRIMARY KEY';

-- 7. Vérifier le moteur de stockage de la table users (doit être InnoDB)
SELECT 
  TABLE_NAME,
  ENGINE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users';

-- 8. Si le moteur n'est pas InnoDB, le convertir (ATTENTION : peut prendre du temps)
-- ALTER TABLE users ENGINE=InnoDB;

-- 9. Vérifier les clés étrangères existantes
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 10. Vérifier les variables de clés étrangères
SHOW VARIABLES LIKE 'foreign_key_checks';

-- ============================================
-- SOLUTIONS POSSIBLES
-- ============================================

-- SOLUTION 1 : Si la table users n'existe pas
-- Créez d'abord la table users avant de créer call_logs

-- SOLUTION 2 : Si la table users utilise MyISAM au lieu de InnoDB
-- ALTER TABLE users ENGINE=InnoDB;

-- SOLUTION 3 : Si le type de la colonne id ne correspond pas
-- Vérifiez que users.id est VARCHAR(36) comme call_logs.caller_id

-- SOLUTION 4 : Désactiver temporairement les vérifications de clés étrangères
-- SET FOREIGN_KEY_CHECKS=0;
-- CREATE TABLE call_logs (...);
-- SET FOREIGN_KEY_CHECKS=1;

-- SOLUTION 5 : Créer la table sans clés étrangères d'abord
-- Utilisez le script create_call_logs_table_no_fk.sql

-- ============================================
-- RÉSUMÉ DES PRÉREQUIS POUR LES CLÉS ÉTRANGÈRES
-- ============================================
/*
Pour que les clés étrangères fonctionnent, il faut :

1. Les deux tables doivent utiliser le moteur InnoDB
2. La colonne référencée (users.id) doit être une PRIMARY KEY ou avoir un INDEX UNIQUE
3. Les types de colonnes doivent correspondre exactement :
   - call_logs.caller_id (VARCHAR(36)) = users.id (VARCHAR(36))
   - call_logs.receiver_id (VARCHAR(36)) = users.id (VARCHAR(36))
4. Le charset et la collation doivent être compatibles
5. La table référencée (users) doit exister AVANT la table référençante (call_logs)
*/
