const express = require('express');
const pool = require('../db');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/conversations - Récupérer la liste des conversations
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Récupérer toutes les conversations distinctes
  const [conversations] = await pool.query(`
    SELECT DISTINCT conversation_id
    FROM messages
    WHERE sender_id = ? OR recipient_id = ?
  `, [userId, userId]);

  // Pour chaque conversation, récupérer les détails
  const conversationDetails = await Promise.all(
    conversations.map(async (conv) => {
      const conversationId = conv.conversation_id;

      // Récupérer le dernier message
      const [lastMessages] = await pool.query(`
        SELECT content, created_at, sender_id, recipient_id
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [conversationId]);

      if (lastMessages.length === 0) return null;

      const lastMessage = lastMessages[0];

      // Déterminer l'autre utilisateur
      const otherUserId = lastMessage.sender_id === userId 
        ? lastMessage.recipient_id 
        : lastMessage.sender_id;

      // Récupérer les infos de l'autre utilisateur
      const [users] = await pool.query(`
        SELECT id, display_name, profile_image_url
        FROM users
        WHERE id = ?
      `, [otherUserId]);

      if (users.length === 0) return null;

      const otherUser = users[0];

      // Compter les messages non lus
      const [unreadCount] = await pool.query(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE conversation_id = ? 
          AND recipient_id = ? 
          AND is_read = 0
      `, [conversationId, userId]);

      return {
        id: conversationId,
        other_user_id: otherUser.id,
        other_user_name: otherUser.display_name || 'Utilisateur',
        other_user_image: otherUser.profile_image_url,
        other_user_online: false,
        last_message: lastMessage.content || '',
        last_message_at: lastMessage.created_at,
        unread_count: parseInt(unreadCount[0].count) || 0,
      };
    })
  );

  // Filtrer les conversations nulles et trier par date
  const validConversations = conversationDetails
    .filter(conv => conv !== null)
    .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

  res.json(validConversations);
}));

module.exports = router;
