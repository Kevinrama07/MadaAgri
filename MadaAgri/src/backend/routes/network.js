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

  // Vérifier si une invitation existe déjà
  const [existing] = await pool.query(
    'SELECT id, status FROM collaboration_invitations WHERE sender_id = ? AND recipient_id = ?',
    [senderId, recipientId]
  );

  if (existing.length > 0) {
    // Si déjà acceptée ou en attente, ne pas recréer
    if (existing[0].status === 'accepted') {
      return res.status(200).json({ id: existing[0].id, ok: true, message: 'Already collaborators' });
    }
    if (existing[0].status === 'pending') {
      return res.status(200).json({ id: existing[0].id, ok: true, message: 'Invitation already sent' });
    }
    // Si déclinée, mettre à jour avec nouveau message
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

  // Create follow relationship: recipient follows the sender
  // (The sender already follows the recipient via the invitation)
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW())',
    [userId, senderId]
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

  // Récupérer tous les utilisateurs sauf soi-même
  const [users] = await pool.query('SELECT id, email, display_name, role, profile_image_url FROM users WHERE id != ?', [userId]);

  // Récupérer les relations de suivi existantes
  const [followRelations] = await pool.query(
    `SELECT
      CASE WHEN follower_id = ? THEN followee_id ELSE follower_id END as other_user_id,
      CASE WHEN follower_id = ? THEN 'following' ELSE 'follower' END as relation_type,
      CASE WHEN follower_id = ? AND followee_id = ? THEN 'mutual' ELSE 'one_way' END as mutual_status
    FROM follows
    WHERE (follower_id = ? OR followee_id = ?) AND status IN ('following', 'friends')`,
    [userId, userId, userId, userId, userId, userId]
  );

  // Créer une map des relations existantes
  const relationsMap = new Map();
  followRelations.forEach(rel => {
    relationsMap.set(rel.other_user_id, {
      type: rel.relation_type,
      mutual: rel.mutual_status === 'mutual'
    });
  });

  // Récupérer les invitations en attente
  const [sentInvitations] = await pool.query(
    'SELECT recipient_id FROM collaboration_invitations WHERE sender_id = ? AND status = "pending"',
    [userId]
  );
  const sentInvitationIds = new Set(sentInvitations.map(inv => inv.recipient_id));

  // Récupérer les invitations reçues en attente
  const [receivedInvitations] = await pool.query(
    'SELECT sender_id FROM collaboration_invitations WHERE recipient_id = ? AND status = "pending"',
    [userId]
  );
  const receivedInvitationIds = new Set(receivedInvitations.map(inv => inv.sender_id));

  // Construire les suggestions avec les relations
  const suggestions = users.map(user => {
    const relation = relationsMap.get(user.id);
    let suggestionType = 'stranger';
    let priority = 3; // 1 = highest priority

    if (relation) {
      if (relation.mutual) {
        suggestionType = 'collaborator';
        priority = 1;
      } else if (relation.type === 'following') {
        suggestionType = 'following';
        priority = 2;
      } else if (relation.type === 'follower') {
        suggestionType = 'follower';
        priority = 1;
      }
    }

    return {
      ...user,
      suggestionType,
      priority,
      invitationSent: sentInvitationIds.has(user.id),
      invitationReceived: receivedInvitationIds.has(user.id),
      isFollowing: relation?.type === 'following' || relation?.mutual,
      isFollowedBy: relation?.type === 'follower' || relation?.mutual,
      isCollaborator: relation?.mutual
    };
  });

  // Trier par priorité puis par nom
  suggestions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.display_name || a.email).localeCompare(b.display_name || b.email);
  });

  // Limiter à 20 suggestions maximum
  const limitedSuggestions = suggestions.slice(0, 20);

  res.json({ suggestions: limitedSuggestions });
}));

// GET /api/network/followers/:userId - Récupérer les followers d'un utilisateur
router.get('/followers/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const [rows] = await pool.query(
    `SELECT f.follower_id, f.created_at, u.display_name, u.email, u.profile_image_url, u.role
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.followee_id = ? AND f.status IN ('following', 'friends')`,
    [targetUserId]
  );
  res.json({ followers: rows });
}));

// GET /api/network/following/:userId - Récupérer les utilisateurs suivis
router.get('/following/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const [rows] = await pool.query(
    `SELECT f.followee_id, f.created_at, u.display_name, u.email, u.profile_image_url, u.role
     FROM follows f
     JOIN users u ON f.followee_id = u.id
     WHERE f.follower_id = ? AND f.status IN ('following', 'friends')`,
    [targetUserId]
  );
  res.json({ following: rows });
}));

// GET /api/network/follow/status/:userId - Vérifier l'état de suivi entre l'utilisateur connecté et un autre utilisateur
router.get('/follow/status/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.userId;
  
  const [following] = await pool.query(
    'SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?',
    [currentUserId, targetUserId]
  );
  
  const [followers] = await pool.query(
    'SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?',
    [targetUserId, currentUserId]
  );
  
  let status = 'none';
  if (following.length > 0 && followers.length > 0) {
    status = 'friends';
  } else if (following.length > 0) {
    status = 'following';
  } else if (followers.length > 0) {
    status = 'followers';
  }
  
  res.json({ status, isFollowing: following.length > 0, isFollowedBy: followers.length > 0 });
}));

module.exports = router;
