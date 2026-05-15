const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const messageSocketService = require('../services/messageSocketService');

const router = express.Router();

// GET /api/messages - Récupérer les messages d'une conversation avec pagination
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { conversationId, limit = 50, offset = 0 } = req.query;
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId query param is required' });
  }

  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);

  // Récupérer les messages avec pagination (ordre DESC pour avoir les plus récents)
  // Exclure les messages supprimés
  const [rows] = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [conversationId, limitNum, offsetNum]
  );

  // Compter le total de messages (non supprimés)
  const [countRows] = await pool.query(
    'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ? AND deleted_at IS NULL',
    [conversationId]
  );

  const total = countRows[0].total;
  const hasMore = (offsetNum + rows.length) < total;
  
  // Inverser l'ordre pour afficher du plus ancien au plus récent
  const messages = rows.reverse();
  
  res.json({ 
    messages,
    total,
    hasMore,
    activeUsers: messageSocketService.getActiveUserCount(conversationId)
  });
}));

// POST /api/messages - Envoyer un message
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { recipient_id, content, attachment_url, attachment_type } = req.body;

  if (!recipient_id || (!content && !attachment_url)) {
    return res.status(400).json({ error: 'recipient_id and (content or attachment_url) required' });
  }

  const conversationId = [senderId, recipient_id].sort().join('_');
  const id = randomUUID();

  // Sauvegarder en base de données
  await pool.query(
    'INSERT INTO messages (id, sender_id, recipient_id, conversation_id, content, attachment_url, attachment_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW())',
    [id, senderId, recipient_id, conversationId, content || '', attachment_url || null, attachment_type || null]
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

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];
  
  // Seul le destinataire peut marquer comme lu
  if (message.recipient_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Marquer comme lu dans la table messages
  await pool.query('UPDATE messages SET is_read = true WHERE id = ?', [messageId]);
  
  // Ajouter dans message_read_status
  await pool.query(
    'INSERT INTO message_read_status (message_id, user_id, read_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE read_at = NOW()',
    [messageId, userId]
  );

  // Notifier via Socket.io
  messageSocketService.emitMessageRead(message.conversation_id, messageId, userId);

  res.json({ 
    success: true,
    message: 'Message marked as read' 
  });
}));

// GET /api/messages/:messageId/read-status - Obtenir le statut de lecture
router.get('/:messageId/read-status', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Récupérer les statuts de lecture
  const [readStatus] = await pool.query(
    `SELECT mrs.user_id, mrs.read_at, u.display_name 
     FROM message_read_status mrs 
     JOIN users u ON mrs.user_id = u.id 
     WHERE mrs.message_id = ?`,
    [messageId]
  );

  res.json({ 
    messageId,
    readBy: readStatus,
    readCount: readStatus.length
  });
}));

// PATCH /api/messages/:messageId - Éditer un message
router.patch('/:messageId', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];
  
  // Seul l'expéditeur peut éditer son message
  if (message.sender_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Mettre à jour le message
  await pool.query(
    'UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?',
    [content.trim(), messageId]
  );

  // Récupérer le message mis à jour
  const [updatedRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  const updatedMessage = updatedRows[0];

  // Notifier via Socket.io
  messageSocketService.emitMessageEdited(message.conversation_id, updatedMessage);

  res.json({ 
    success: true,
    message: updatedMessage
  });
}));

// DELETE /api/messages/:messageId - Supprimer un message
router.delete('/:messageId', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];
  
  // Seul l'expéditeur peut supprimer son message
  if (message.sender_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Soft delete: marquer comme supprimé au lieu de supprimer définitivement
  await pool.query(
    'UPDATE messages SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
    [userId, messageId]
  );

  // Notifier via Socket.io
  messageSocketService.emitMessageDeleted(message.conversation_id, messageId);

  res.json({ 
    success: true,
    message: 'Message deleted' 
  });
}));

// POST /api/messages/:messageId/reactions - Ajouter une réaction
router.post('/:messageId/reactions', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;
  const { emoji } = req.body;

  if (!emoji || !emoji.trim()) {
    return res.status(400).json({ error: 'Emoji is required' });
  }

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];

  // Ajouter la réaction (ou ignorer si déjà existe)
  await pool.query(
    'INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE created_at = NOW()',
    [messageId, userId, emoji.trim()]
  );

  // Récupérer toutes les réactions du message
  const [reactions] = await pool.query(
    `SELECT mr.emoji, COUNT(*) as count, GROUP_CONCAT(u.display_name) as users
     FROM message_reactions mr
     JOIN users u ON mr.user_id = u.id
     WHERE mr.message_id = ?
     GROUP BY mr.emoji`,
    [messageId]
  );

  // Notifier via Socket.io
  messageSocketService.emitReactionAdded(message.conversation_id, messageId, userId, emoji.trim(), reactions);

  res.json({ 
    success: true,
    reactions
  });
}));

// DELETE /api/messages/:messageId/reactions/:emoji - Retirer une réaction
router.delete('/:messageId/reactions/:emoji', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const emoji = decodeURIComponent(req.params.emoji);
  const userId = req.user.id;

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = messageRows[0];

  // Supprimer la réaction
  await pool.query(
    'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
    [messageId, userId, emoji]
  );

  // Récupérer toutes les réactions restantes
  const [reactions] = await pool.query(
    `SELECT mr.emoji, COUNT(*) as count, GROUP_CONCAT(u.display_name) as users
     FROM message_reactions mr
     JOIN users u ON mr.user_id = u.id
     WHERE mr.message_id = ?
     GROUP BY mr.emoji`,
    [messageId]
  );

  // Notifier via Socket.io
  messageSocketService.emitReactionRemoved(message.conversation_id, messageId, userId, emoji, reactions);

  res.json({ 
    success: true,
    reactions
  });
}));

// GET /api/messages/:messageId/reactions - Obtenir les réactions d'un message
router.get('/:messageId/reactions', authMiddleware, asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;

  // Vérifier que le message existe
  const [messageRows] = await pool.query('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (messageRows.length === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Récupérer les réactions
  const [reactions] = await pool.query(
    `SELECT mr.emoji, COUNT(*) as count, GROUP_CONCAT(u.display_name) as users, GROUP_CONCAT(mr.user_id) as user_ids
     FROM message_reactions mr
     JOIN users u ON mr.user_id = u.id
     WHERE mr.message_id = ?
     GROUP BY mr.emoji`,
    [messageId]
  );

  res.json({ 
    messageId,
    reactions
  });
}));

module.exports = router;
