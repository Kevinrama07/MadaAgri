const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const messageSocketService = require('../services/messageSocketService');

const router = express.Router();

// GET /api/messages - Récupérer les messages d'une conversation
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId query param is required' });
  }

  const [rows] = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );
  
  res.json({ 
    messages: rows,
    activeUsers: messageSocketService.getActiveUserCount(conversationId)
  });
}));

// POST /api/messages - Envoyer un message
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { recipient_id, content } = req.body;

  if (!recipient_id || !content) {
    return res.status(400).json({ error: 'recipient_id and content required' });
  }

  const conversationId = [senderId, recipient_id].sort().join('_');
  const id = randomUUID();

  // Sauvegarder en base de données
  await pool.query(
    'INSERT INTO messages (id, sender_id, recipient_id, conversation_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, false, NOW())',
    [id, senderId, recipient_id, conversationId, content]
  );

  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
  const message = rows[0];

  // Émettre en temps réel via WebSocket
  messageSocketService.emitMessageToConversation(conversationId, {
    ...message,
    sender_id: senderId,
    created_at: new Date(),
  });

  res.json({ 
    message,
    success: true 
  });
}));

// GET /api/messages/conversations - Récupérer les conversations de l'utilisateur
router.get('/conversations', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Récupérer les conversations uniques
  const [rows] = await pool.query(
    `SELECT DISTINCT 
      CASE 
        WHEN sender_id = ? THEN recipient_id 
        ELSE sender_id 
      END as other_user_id,
      MAX(created_at) as last_message_time
     FROM messages
     WHERE sender_id = ? OR recipient_id = ?
     GROUP BY other_user_id
     ORDER BY last_message_time DESC`,
    [userId, userId, userId]
  );

  // Enrichir avec les infos utilisateur
  const conversations = await Promise.all(
    rows.map(async (row) => {
      const [userRows] = await pool.query(
        'SELECT id, display_name, profile_image_url FROM users WHERE id = ?',
        [row.other_user_id]
      );
      return {
        userId: row.other_user_id,
        user: userRows[0] || { id: row.other_user_id, display_name: 'Unknown User' },
        lastMessageTime: row.last_message_time,
      };
    })
  );

  res.json({ conversations });
}));

// PUT /api/messages/:messageId/read - Marquer un message comme lu
router.put('/:messageId/read', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;

  // Vérifier que le message existe et appartient à l'utilisateur
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];
  if (message.recipient_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Marquer comme lu
  await pool.query('UPDATE messages SET is_read = true WHERE id = ?', [messageId]);

  res.json({ 
    success: true,
    message: 'Message marked as read' 
  });
}));

module.exports = router;
