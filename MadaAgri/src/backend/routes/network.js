const express = require('express');
const pool = require('../db');
const { randomUUID } = require('crypto');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const router = express.Router();

// Rate limiting simple en mémoire
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 30;

const rateLimit = (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();
  
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  next();
};

// ============================================
// ROUTES D'INVITATIONS COLLABORATEURS
// ============================================

// POST /api/network/invitations/send - Envoyer une invitation
router.post('/invitations/send', authMiddleware, rateLimit, asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { recipientId, message } = req.body;
  
  if (!recipientId) {
    return res.status(400).json({ error: 'recipientId is required' });
  }
  
  if (senderId === recipientId) {
    return res.status(400).json({ error: 'Cannot invite yourself' });
  }

  // Vérifier que le destinataire existe
  const [recipient] = await pool.query('SELECT id FROM users WHERE id = ?', [recipientId]);
  if (recipient.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Vérifier si une invitation existe déjà
  const [existing] = await pool.query(
    'SELECT id, status FROM collaboration_invitations WHERE sender_id = ? AND recipient_id = ?',
    [senderId, recipientId]
  );

  if (existing.length > 0) {
    if (existing[0].status === 'accepted') {
      return res.status(400).json({ error: 'Already collaborators' });
    }
    if (existing[0].status === 'pending') {
      return res.status(400).json({ error: 'Invitation already sent' });
    }
    // Si déclinée, mettre à jour
    await pool.query(
      'UPDATE collaboration_invitations SET status = "pending", message = ?, updated_at = NOW() WHERE id = ?',
      [message || null, existing[0].id]
    );
    return res.status(200).json({ id: existing[0].id, ok: true, message: 'Invitation resent' });
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
  const status = req.query.status || 'pending';
  
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
    WHERE ci.recipient_id = ? AND ci.status = ?
    ORDER BY ci.created_at DESC`,
    [userId, status]
  );
  
  res.json({ invitations });
}));

// GET /api/network/invitations/sent - Récupérer les invitations envoyées
router.get('/invitations/sent', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const status = req.query.status || 'pending';
  
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
    WHERE ci.sender_id = ? AND ci.status = ?
    ORDER BY ci.created_at DESC`,
    [userId, status]
  );
  
  res.json({ invitations });
}));

// PUT /api/network/invitations/:invitationId/accept - Accepter une invitation
router.put('/invitations/:invitationId/accept', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;
  
  const [invitation] = await pool.query(
    'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ? AND status = "pending"',
    [invitationId, userId]
  );
  
  if (invitation.length === 0) {
    return res.status(404).json({ error: 'Invitation not found or already processed' });
  }

  const senderId = invitation[0].sender_id;
  
  // Update invitation status
  await pool.query(
    'UPDATE collaboration_invitations SET status = "accepted", updated_at = NOW() WHERE id = ?',
    [invitationId]
  );

  // Créer suivi mutuel automatique
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW()), (?, ?, "following", NOW())',
    [userId, senderId, senderId, userId]
  );

  res.json({ ok: true, message: 'Invitation accepted' });
}));

// PUT /api/network/invitations/:invitationId/decline - Refuser une invitation
router.put('/invitations/:invitationId/decline', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;
  
  const [invitation] = await pool.query(
    'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ? AND status = "pending"',
    [invitationId, userId]
  );
  
  if (invitation.length === 0) {
    return res.status(404).json({ error: 'Invitation not found or already processed' });
  }

  await pool.query(
    'UPDATE collaboration_invitations SET status = "declined", updated_at = NOW() WHERE id = ?',
    [invitationId]
  );

  res.json({ ok: true, message: 'Invitation declined' });
}));

// DELETE /api/network/invitations/:invitationId/cancel - Annuler une invitation envoyée
router.delete('/invitations/:invitationId/cancel', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;
  
  const [invitation] = await pool.query(
    'SELECT * FROM collaboration_invitations WHERE id = ? AND sender_id = ? AND status = "pending"',
    [invitationId, userId]
  );
  
  if (invitation.length === 0) {
    return res.status(404).json({ error: 'Invitation not found or already processed' });
  }

  await pool.query(
    'DELETE FROM collaboration_invitations WHERE id = ?',
    [invitationId]
  );

  res.json({ ok: true, message: 'Invitation cancelled' });
}));

// GET /api/network/invitations/status/:targetUserId - État de la collaboration
router.get('/invitations/status/:targetUserId', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.targetUserId; // Accepter string ou int

  const [rows] = await pool.query(
    `SELECT ci.id, ci.sender_id, ci.recipient_id, ci.status, ci.updated_at
     FROM collaboration_invitations ci
     WHERE (
       (ci.sender_id = ? AND ci.recipient_id = ?)
       OR (ci.sender_id = ? AND ci.recipient_id = ?)
     )
     ORDER BY ci.updated_at DESC
     LIMIT 1`,
    [userId, targetUserId, targetUserId, userId]
  );

  if (!rows || rows.length === 0) {
    return res.json({ status: 'none' });
  }

  const inv = rows[0];
  res.json({
    id: inv.id,
    sender_id: inv.sender_id,
    recipient_id: inv.recipient_id,
    status: inv.status
  });
}));

// ============================================
// ROUTES DE SUIVI
// ============================================

// POST /api/network/follows/:userId - Suivre un utilisateur
router.post('/follows/:userId', authMiddleware, rateLimit, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId; // Accepter string ou int
  
  if (!followeeId) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  if (followerId === followeeId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  // Vérifier que l'utilisateur existe
  const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [followeeId]);
  if (user.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Vérifier si déjà suivi
  const [existing] = await pool.query(
    'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
    [followerId, followeeId]
  );

  if (existing.length > 0) {
    return res.status(400).json({ error: 'Already following' });
  }

  // Créer le suivi
  await pool.query(
    'INSERT INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW())',
    [followerId, followeeId]
  );

  res.json({ ok: true });
}));

// DELETE /api/network/follows/:userId - Arrêter de suivre
router.delete('/follows/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId; // Accepter string ou int
  
  if (!followeeId) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  await pool.query(
    'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
    [followerId, followeeId]
  );

  res.json({ ok: true });
}));

// GET /api/network/follows/status/:userId - Vérifier si on suit un utilisateur
router.get('/follows/status/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId; // Accepter string ou int
  
  const [following] = await pool.query(
    'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
    [followerId, followeeId]
  );
  
  const [followedBy] = await pool.query(
    'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
    [followeeId, followerId]
  );
  
  res.json({
    isFollowing: following.length > 0,
    isFollowedBy: followedBy.length > 0,
    isMutual: following.length > 0 && followedBy.length > 0
  });
}));

// GET /api/network/followers - Mes followers
router.get('/followers', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const [rows] = await pool.query(
    `SELECT f.follower_id as id, f.created_at, u.display_name, u.email, u.profile_image_url, u.role
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.followee_id = ? AND f.status = 'following'
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM follows WHERE followee_id = ? AND status = "following"',
    [userId]
  );
  
  res.json({ 
    followers: rows,
    total: countResult[0].total,
    limit,
    offset
  });
}));

// GET /api/network/following - Utilisateurs que je suis
router.get('/following', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const [rows] = await pool.query(
    `SELECT f.followee_id as id, f.created_at, u.display_name, u.email, u.profile_image_url, u.role
     FROM follows f
     JOIN users u ON f.followee_id = u.id
     WHERE f.follower_id = ? AND f.status = 'following'
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM follows WHERE follower_id = ? AND status = "following"',
    [userId]
  );
  
  res.json({ 
    following: rows,
    total: countResult[0].total,
    limit,
    offset
  });
}));

// ============================================
// ROUTES DE SUGGESTIONS
// ============================================

// GET /api/network/suggestions - Suggérer des utilisateurs
router.get('/suggestions', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';

  // Requête optimisée avec LEFT JOIN
  let query = `
    SELECT DISTINCT
      u.id,
      u.email,
      u.display_name,
      u.role,
      u.profile_image_url,
      f1.follower_id IS NOT NULL as isFollowing,
      f2.follower_id IS NOT NULL as isFollowedBy,
      ci_sent.id IS NOT NULL as invitationSent,
      ci_received.id IS NOT NULL as invitationReceived,
      ci_accepted.id IS NOT NULL as isCollaborator
    FROM users u
    LEFT JOIN follows f1 ON f1.follower_id = ? AND f1.followee_id = u.id AND f1.status = 'following'
    LEFT JOIN follows f2 ON f2.follower_id = u.id AND f2.followee_id = ? AND f2.status = 'following'
    LEFT JOIN collaboration_invitations ci_sent ON ci_sent.sender_id = ? AND ci_sent.recipient_id = u.id AND ci_sent.status = 'pending'
    LEFT JOIN collaboration_invitations ci_received ON ci_received.sender_id = u.id AND ci_received.recipient_id = ? AND ci_received.status = 'pending'
    LEFT JOIN collaboration_invitations ci_accepted ON 
      ((ci_accepted.sender_id = ? AND ci_accepted.recipient_id = u.id) OR 
       (ci_accepted.sender_id = u.id AND ci_accepted.recipient_id = ?))
      AND ci_accepted.status = 'accepted'
    WHERE u.id != ?
  `;
  
  const params = [userId, userId, userId, userId, userId, userId, userId];
  
  if (search) {
    query += ` AND (u.display_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY 
    CASE 
      WHEN ci_accepted.id IS NOT NULL THEN 1
      WHEN f2.follower_id IS NOT NULL THEN 2
      ELSE 3
    END,
    u.display_name
    LIMIT ?`;
  
  params.push(limit);
  
  const [users] = await pool.query(query, params);
  
  const suggestions = users.map(user => ({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role,
    profile_image_url: user.profile_image_url,
    isFollowing: !!user.isFollowing,
    isFollowedBy: !!user.isFollowedBy,
    invitationSent: !!user.invitationSent,
    invitationReceived: !!user.invitationReceived,
    isCollaborator: !!user.isCollaborator,
    suggestionType: user.isCollaborator ? 'collaborator' : 
                    user.isFollowedBy ? 'follower' : 
                    user.isFollowing ? 'following' : 'stranger'
  }));

  res.json({ suggestions });
}));

// GET /api/network/collaborators - Mes collaborateurs
router.get('/collaborators', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const [rows] = await pool.query(
    `SELECT DISTINCT
      CASE 
        WHEN ci.sender_id = ? THEN ci.recipient_id
        ELSE ci.sender_id
      END as id,
      u.email,
      u.display_name,
      u.profile_image_url,
      u.role,
      ci.created_at
    FROM collaboration_invitations ci
    JOIN users u ON (
      CASE 
        WHEN ci.sender_id = ? THEN u.id = ci.recipient_id
        ELSE u.id = ci.sender_id
      END
    )
    WHERE (ci.sender_id = ? OR ci.recipient_id = ?)
      AND ci.status = 'accepted'
    ORDER BY ci.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, userId, userId, userId, limit, offset]
  );
  
  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT 
       CASE 
         WHEN ci.sender_id = ? THEN ci.recipient_id
         ELSE ci.sender_id
       END
     ) as total
     FROM collaboration_invitations ci
     WHERE (ci.sender_id = ? OR ci.recipient_id = ?)
       AND ci.status = 'accepted'`,
    [userId, userId, userId]
  );
  
  res.json({ 
    collaborators: rows,
    total: countResult[0].total,
    limit,
    offset
  });
}));

module.exports = router;
