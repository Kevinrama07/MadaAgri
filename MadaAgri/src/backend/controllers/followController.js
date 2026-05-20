const db = require('../db');
const FollowAlgorithm = require('../algos/followAlgo');

// Suivre un utilisateur
exports.followUser = async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (followerId === followingId) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });
  }

  try {
    const result = await FollowAlgorithm.processFollow(followerId, followingId);
    
    res.json({ 
      success: true, 
      message: result.isNowCollaborator 
        ? 'Vous êtes maintenant collaborateurs via suivi mutuel' 
        : 'Utilisateur suivi avec succès',
      isNowCollaborator: result.isNowCollaborator,
      collaborationId: result.collaborationId
    });
  } catch (error) {
    console.error('Error following user:', error);
    if (error.message === 'Vous suivez déjà cet utilisateur') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors du suivi' });
  }
};

// Ne plus suivre
exports.unfollowUser = async (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  try {
    const result = await FollowAlgorithm.processUnfollow(followerId, followingId);
    
    res.json({ 
      success: true, 
      message: 'Vous ne suivez plus cet utilisateur',
      collaborationRemoved: result.collaborationRemoved
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    if (error.message === 'Vous ne suivez pas cet utilisateur') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de l\'arrêt du suivi' });
  }
};

// Liste des abonnés
exports.getFollowers = async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [followers] = await db.query(`
      SELECT 
        u.id,
        u.display_name,
        u.email,
        u.profile_image_url,
        u.bio,
        f.created_at as followed_at,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = ? AND followee_id = u.id
        ) as is_following_back,
        EXISTS(
          SELECT 1 FROM collaboration_invitations 
          WHERE ((sender_id = ? AND recipient_id = u.id) OR (sender_id = u.id AND recipient_id = ?))
          AND status = 'accepted'
        ) as is_collaborator
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.followee_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, req.user.id, userId, limit, offset]);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE followee_id = ?',
      [userId]
    );

    res.json({
      followers,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
  }
};

// Liste des suivis
exports.getFollowing = async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [following] = await db.query(`
      SELECT 
        u.id,
        u.display_name,
        u.email,
        u.profile_image_url,
        u.bio,
        f.created_at as followed_at,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = u.id AND followee_id = ?
        ) as is_following_back,
        EXISTS(
          SELECT 1 FROM collaboration_invitations 
          WHERE ((sender_id = ? AND recipient_id = u.id) OR (sender_id = u.id AND recipient_id = ?))
          AND status = 'accepted'
        ) as is_collaborator
      FROM follows f
      JOIN users u ON f.followee_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, req.user.id, userId, limit, offset]);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [userId]
    );

    res.json({
      following,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des suivis' });
  }
};

// Statut de relation avec un utilisateur
exports.getRelationshipStatus = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  try {
    const status = await FollowAlgorithm.getRelationshipStatus(currentUserId, targetUserId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching relationship status:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
};

module.exports = exports;
