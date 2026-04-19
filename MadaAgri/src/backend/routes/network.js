const express = require('express');
const pool = require('../db');
const { randomUUID } = require('crypto');
const { buildAdjacency, bfsReachable } = require('../algos/graph');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// ============================================
// ROUTES D'INVITATIONS COLLABORATEURS
// ============================================

// POST /api/network/invitations/send - Envoyer une invitation
router.post('/invitations/send', authMiddleware, asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { recipientId, message } = req.body;
  
  if (!recipientId) {
    return res.status(400).json({ error: 'recipientId is required' });
  }
  
  if (senderId === recipientId) {
    return res.status(400).json({ error: 'cannot invite yourself' });
  }

  const invitationId = randomUUID();
  await pool.query(
    'INSERT INTO collaboration_invitations (id, sender_id, recipient_id, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, "pending", NOW(), NOW())',
    [invitationId, senderId, recipientId, message || null]
  );

  res.status(201).json({ id: invitationId, ok: true });
}));

// GET /api/network/invitations/received - Récupérer les invitations reçues
router.get('/invitations/received', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [invitations] = await pool.query(
    `SELECT 
      ci.id, 
      ci.sender_id, 
      ci.message, 
      ci.status, 
      ci.created_at,
      u.email,
      u.display_name,
      u.profile_image_url,
      u.role
    FROM collaboration_invitations ci
    JOIN users u ON ci.sender_id = u.id
    WHERE ci.recipient_id = ? AND ci.status = 'pending'
    ORDER BY ci.created_at DESC`,
    [userId]
  );
  
  res.json({ invitations });
}));

// GET /api/network/invitations/sent - Récupérer les invitations envoyées
router.get('/invitations/sent', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [invitations] = await pool.query(
    `SELECT 
      ci.id, 
      ci.recipient_id, 
      ci.message, 
      ci.status, 
      ci.created_at,
      u.email,
      u.display_name,
      u.profile_image_url,
      u.role
    FROM collaboration_invitations ci
    JOIN users u ON ci.recipient_id = u.id
    WHERE ci.sender_id = ? AND ci.status = 'pending'
    ORDER BY ci.created_at DESC`,
    [userId]
  );
  
  res.json({ invitations });
}));

// PUT /api/network/invitations/:invitationId/accept - Accepter une invitation
router.put('/invitations/:invitationId/accept', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;
  
  const [invitation] = await pool.query(
    'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ?',
    [invitationId, userId]
  );
  
  if (invitation.length === 0) {
    return res.status(404).json({ error: 'Invitation not found' });
  }

  const senderId = invitation[0].sender_id;
  
  // Update invitation status
  await pool.query(
    'UPDATE collaboration_invitations SET status = "accepted", updated_at = NOW() WHERE id = ?',
    [invitationId]
  );

  // Create mutual follow relationship
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "friends", NOW())',
    [userId, senderId]
  );
  
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "friends", NOW())',
    [senderId, userId]
  );

  res.json({ ok: true, message: 'Invitation accepted' });
}));

// PUT /api/network/invitations/:invitationId/decline - Refuser une invitation
router.put('/invitations/:invitationId/decline', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;
  
  const [invitation] = await pool.query(
    'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ?',
    [invitationId, userId]
  );
  
  if (invitation.length === 0) {
    return res.status(404).json({ error: 'Invitation not found' });
  }

  await pool.query(
    'UPDATE collaboration_invitations SET status = "declined", updated_at = NOW() WHERE id = ?',
    [invitationId]
  );

  res.json({ ok: true, message: 'Invitation declined' });
}));

// ============================================
// ROUTES DE SUIVI (ANCIENNES ET NOUVELLES)
// ============================================

// POST /api/network/follows/:userId ou /api/follows/:userId - Suivre un utilisateur
router.post('/follows/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  if (followerId === followeeId) return res.status(400).json({ error: 'cannot follow self' });

  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW())',
    [followerId, followeeId]
  );
  res.json({ ok: true });
}));

// DELETE /api/network/follows/:userId ou /api/follows/:userId - Arrêter de suivre
router.delete('/follows/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  await pool.query('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [followerId, followeeId]);
  res.json({ ok: true });
}));

// Routes sans préfixe pour la compatibilité avec /api/follows
router.post('/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  if (followerId === followeeId) return res.status(400).json({ error: 'cannot follow self' });

  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW())',
    [followerId, followeeId]
  );
  res.json({ ok: true });
}));

router.delete('/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  await pool.query('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [followerId, followeeId]);
  res.json({ ok: true });
}));

// GET /api/network/suggestions ou /api/follows/suggestions - Suggester des utilisateurs avec état d'invitation
router.get('/suggestions', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [followRows] = await pool.query('SELECT follower_id, followee_id FROM follows');
  const adj = buildAdjacency(followRows);
  const reachable = bfsReachable(adj, userId, 2);

  const [users] = await pool.query('SELECT id, email, display_name, role, profile_image_url FROM users WHERE id != ?', [userId]);
  
  // Get pending invitations
  const [sentInvitations] = await pool.query(
    'SELECT recipient_id FROM collaboration_invitations WHERE sender_id = ? AND status = "pending"',
    [userId]
  );
  
  const sentInvitationIds = new Set(sentInvitations.map(inv => inv.recipient_id));
  
  const suggestions = users
    .filter((u) => reachable.has(u.id))
    .map((u) => ({
      ...u,
      invitationSent: sentInvitationIds.has(u.id)
    }))
    .sort((a, b) => reachable.get(a.id) - reachable.get(b.id))
    .slice(0, 10);

  res.json({ suggestions });
}));

module.exports = router;
