-- Table pour l'historique des appels vocaux
-- IMPORTANT: Assurez-vous que la table 'users' existe avant d'exécuter ce script

-- Vérifier si la table users existe
-- SELECT * FROM information_schema.tables WHERE table_schema = 'madaagri' AND table_name = 'users';

CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR(36) PRIMARY KEY,
  caller_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  call_type ENUM('voice', 'video') DEFAULT 'voice',
  status ENUM('missed', 'answered', 'declined', 'failed', 'cancelled') NOT NULL,
  duration INT DEFAULT 0 COMMENT 'Durée en secondes',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Clés étrangères avec vérification
  CONSTRAINT fk_call_logs_caller 
    FOREIGN KEY (caller_id) REFERENCES users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  CONSTRAINT fk_call_logs_receiver 
    FOREIGN KEY (receiver_id) REFERENCES users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  INDEX idx_caller (caller_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_started (started_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contrôleur pour gérer l'historique des appels
-- Créer src/backend/controllers/callLogsController.js

/*
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class CallLogsController {
  // Créer un log d'appel
  static async createCallLog(req, res, next) {
    try {
      const { receiver_id, call_type = 'voice' } = req.body;
      const caller_id = req.user.id;
      
      const callId = uuidv4();
      
      await db.query(
        `INSERT INTO call_logs (id, caller_id, receiver_id, call_type, status, started_at)
         VALUES (?, ?, ?, ?, 'initiated', NOW())`,
        [callId, caller_id, receiver_id, call_type]
      );
      
      res.status(201).json({
        success: true,
        data: { callId }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mettre à jour le statut d'un appel
  static async updateCallStatus(req, res, next) {
    try {
      const { callId } = req.params;
      const { status, duration } = req.body;
      
      const updates = ['status = ?'];
      const values = [status];
      
      if (status === 'answered' || status === 'ended') {
        updates.push('ended_at = NOW()');
      }
      
      if (duration !== undefined) {
        updates.push('duration = ?');
        values.push(duration);
      }
      
      values.push(callId);
      
      await db.query(
        `UPDATE call_logs SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
  
  // Récupérer l'historique des appels
  static async getCallHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { type = 'all', limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT 
          cl.*,
          caller.display_name as caller_name,
          caller.profile_image_url as caller_image,
          receiver.display_name as receiver_name,
          receiver.profile_image_url as receiver_image
        FROM call_logs cl
        LEFT JOIN users caller ON cl.caller_id = caller.id
        LEFT JOIN users receiver ON cl.receiver_id = receiver.id
        WHERE (cl.caller_id = ? OR cl.receiver_id = ?)
      `;
      
      const params = [userId, userId];
      
      if (type === 'missed') {
        query += ` AND cl.status = 'missed' AND cl.receiver_id = ?`;
        params.push(userId);
      } else if (type === 'outgoing') {
        query += ` AND cl.caller_id = ?`;
        params.push(userId);
      } else if (type === 'incoming') {
        query += ` AND cl.receiver_id = ?`;
        params.push(userId);
      }
      
      query += ` ORDER BY cl.started_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
      
      const [calls] = await db.query(query, params);
      
      res.json({
        success: true,
        data: calls
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Supprimer un appel de l'historique
  static async deleteCallLog(req, res, next) {
    try {
      const { callId } = req.params;
      const userId = req.user.id;
      
      await db.query(
        `DELETE FROM call_logs 
         WHERE id = ? AND (caller_id = ? OR receiver_id = ?)`,
        [callId, userId, userId]
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtenir les statistiques d'appels
  static async getCallStats(req, res, next) {
    try {
      const userId = req.user.id;
      
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_calls,
          SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered_calls,
          SUM(CASE WHEN status = 'missed' AND receiver_id = ? THEN 1 ELSE 0 END) as missed_calls,
          SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined_calls,
          SUM(duration) as total_duration,
          AVG(duration) as avg_duration
        FROM call_logs
        WHERE caller_id = ? OR receiver_id = ?
      `, [userId, userId, userId]);
      
      res.json({
        success: true,
        data: stats[0]
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CallLogsController;
*/

-- Routes pour l'historique des appels
-- Ajouter dans src/backend/routes/calls.js

/*
const express = require('express');
const router = express.Router();
const CallLogsController = require('../controllers/callLogsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, CallLogsController.createCallLog);
router.patch('/:callId', authMiddleware, CallLogsController.updateCallStatus);
router.get('/history', authMiddleware, CallLogsController.getCallHistory);
router.get('/stats', authMiddleware, CallLogsController.getCallStats);
router.delete('/:callId', authMiddleware, CallLogsController.deleteCallLog);

module.exports = router;
*/

-- Ajouter dans src/backend/server.js
-- app.use('/api/calls', require('./routes/calls'));
