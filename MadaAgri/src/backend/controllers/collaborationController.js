const db = require('../db');
const CollaborationAlgorithm = require('../algos/collaborationAlgo');

// Envoyer une invitation de collaboration
exports.sendCollaborationInvitation = async (req, res) => {
  const senderId = req.user.id;
  const { recipientId, message, level = 'collaborateur' } = req.body;

  if (senderId === recipientId) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer une invitation' });
  }

  try {
    // Vérifier si déjà collaborateurs
    const [existing] = await db.query(
      `SELECT id, status FROM collaboration_invitations 
       WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))`,
      [senderId, recipientId, recipientId, senderId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'accepted') {
        return res.status(400).json({ error: 'Vous êtes déjà collaborateurs' });
      }
      if (existing[0].status === 'pending') {
        return res.status(400).json({ error: 'Une invitation est déjà en attente' });
      }
    }

    // Créer l'invitation
    const [result] = await db.query(
      `INSERT INTO collaboration_invitations (id, sender_id, recipient_id, message, status, created_at, updated_at) 
       VALUES (UUID(), ?, ?, ?, 'pending', NOW(), NOW())`,
      [senderId, recipientId, message || null]
    );

    // Notification
    await db.query(
      `INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id, content) 
       VALUES (?, 'COLLAB_REQUEST', ?, 'collaboration', ?, 'vous a envoyé une invitation de collaboration')`,
      [recipientId, senderId, result.insertId]
    );

    res.json({ 
      success: true, 
      message: 'Invitation envoyée avec succès',
      invitationId: result.insertId
    });
  } catch (error) {
    console.error('Error sending collaboration invitation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'invitation' });
  }
};

// Accepter une invitation
exports.acceptInvitation = async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;

  try {
    const result = await CollaborationAlgorithm.processInvitationAcceptance(invitationId, userId);
    res.json({ 
      success: true, 
      message: 'Invitation acceptée avec succès',
      collaboratorId: result.collaboratorId
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    if (error.message === 'Invitation non trouvée ou déjà traitée') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de l\'acceptation de l\'invitation' });
  }
};

// Refuser une invitation
exports.rejectInvitation = async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;

  try {
    await CollaborationAlgorithm.processInvitationRejection(invitationId, userId);
    res.json({ 
      success: true, 
      message: 'Invitation refusée'
    });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    if (error.message === 'Invitation non trouvée ou déjà traitée') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors du refus de l\'invitation' });
  }
};

// Annuler une invitation envoyée
exports.cancelInvitation = async (req, res) => {
  const userId = req.user.id;
  const invitationId = req.params.invitationId;

  try {
    // Vérifier que c'est bien l'envoyeur
    const [invitation] = await db.query(
      'SELECT * FROM collaboration_invitations WHERE id = ? AND sender_id = ? AND status = \'pending\'',
      [invitationId, userId]
    );

    if (invitation.length === 0) {
      return res.status(404).json({ error: 'Invitation non trouvée ou déjà traitée' });
    }

    // Annuler l'invitation
    await db.query(
      'UPDATE collaboration_invitations SET status = \'cancelled\' WHERE id = ?',
      [invitationId]
    );

    res.json({ 
      success: true, 
      message: 'Invitation annulée'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'invitation' });
  }
};

// Supprimer une collaboration
exports.removeCollaboration = async (req, res) => {
  const userId = req.user.id;
  const collaboratorId = req.params.userId;

  try {
    // Supprimer la collaboration
    const [result] = await db.query(
      `DELETE FROM collaboration_invitations 
       WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
       AND status = 'accepted'`,
      [userId, collaboratorId, collaboratorId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Collaboration non trouvée' });
    }

    // Retirer les suivis mutuels
    await db.query(
      `DELETE FROM follows 
       WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)`,
      [userId, collaboratorId, collaboratorId, userId]
    );

    res.json({ 
      success: true, 
      message: 'Collaboration supprimée'
    });
  } catch (error) {
    console.error('Error removing collaboration:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la collaboration' });
  }
};

// Invitations reçues
exports.getReceivedInvitations = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [invitations] = await db.query(`
      SELECT 
        c.id,
        c.message,
        c.created_at,
        u.id as sender_id,
        u.display_name as sender_name,
        u.email as sender_email,
        u.profile_image_url as sender_avatar
      FROM collaboration_invitations c
      JOIN users u ON c.sender_id = u.id
      WHERE c.recipient_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM collaboration_invitations WHERE recipient_id = ? AND status = \'pending\'',
      [userId]
    );

    res.json({
      invitations,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching received invitations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des invitations' });
  }
};

// Invitations envoyées
exports.getSentInvitations = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [invitations] = await db.query(`
      SELECT 
        c.id,
        c.message,
        c.status,
        c.created_at,
        u.id as recipient_id,
        u.display_name as recipient_name,
        u.email as recipient_email,
        u.profile_image_url as recipient_avatar
      FROM collaboration_invitations c
      JOIN users u ON c.recipient_id = u.id
      WHERE c.sender_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM collaboration_invitations WHERE sender_id = ? AND status = \'pending\'',
      [userId]
    );

    res.json({
      invitations,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sent invitations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des invitations envoyées' });
  }
};

// Liste des collaborateurs actifs
exports.getCollaborators = async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [collaborators] = await db.query(`
      SELECT 
        u.id,
        u.display_name,
        u.email,
        u.profile_image_url,
        u.bio,
        c.created_at as collaboration_since
      FROM collaboration_invitations c
      JOIN users u ON (
        (c.sender_id = ? AND c.recipient_id = u.id) OR
        (c.recipient_id = ? AND c.sender_id = u.id)
      )
      WHERE c.status = 'accepted'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, limit, offset]);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM collaboration_invitations WHERE (sender_id = ? OR recipient_id = ?) AND status = \'accepted\'',
      [userId, userId]
    );

    res.json({
      collaborators,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des collaborateurs' });
  }
};

module.exports = exports;
