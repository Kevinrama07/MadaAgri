const db = require('../db');
const { randomUUID } = require('crypto');

/**
 * Algorithme de gestion des collaborations
 * Gère la logique métier des invitations et collaborations
 */
class CollaborationAlgorithm {
  
  /**
   * Vérifie l'état de la relation entre deux utilisateurs
   * @returns {Object} État complet de la relation
   */
  static async checkRelationshipState(userA, userB) {
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND followee_id = ?) as a_follows_b,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND followee_id = ?) as b_follows_a,
        (SELECT id, status FROM collaboration_invitations 
         WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
         ORDER BY created_at DESC LIMIT 1) as collaboration
    `, [userA, userB, userB, userA, userA, userB, userB, userA]);

    const [collab] = await db.query(`
      SELECT id, status, sender_id FROM collaboration_invitations 
      WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
      ORDER BY created_at DESC LIMIT 1
    `, [userA, userB, userB, userA]);

    return {
      aFollowsB: result[0].a_follows_b > 0,
      bFollowsA: result[0].b_follows_a > 0,
      collaboration: collab[0] || null
    };
  }

  /**
   * Crée une collaboration acceptée entre deux utilisateurs
   */
  static async createAcceptedCollaboration(userA, userB, reason = 'Suivi mutuel') {
    const collabId = randomUUID();
    await db.query(
      `INSERT INTO collaboration_invitations (id, sender_id, recipient_id, message, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'accepted', NOW(), NOW())`,
      [collabId, userA, userB, reason]
    );
    return collabId;
  }

  /**
   * Crée les suivis mutuels entre deux utilisateurs
   */
  static async createMutualFollows(userA, userB) {
    await db.query(
      'INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?), (?, ?)',
      [userA, userB, userB, userA]
    );
  }

  /**
   * Envoie une notification à un utilisateur
   */
  static async sendNotification(userId, type, actorId, actorName, actorImage, relatedType, relatedId, content) {
    await db.query(
      `INSERT INTO notifications (id, user_id, type, actor_id, actor_name, actor_image, related_type, related_id, content, priority, created_at) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'normal', NOW())`,
      [userId, type, actorId, actorName || 'Utilisateur', actorImage || null, relatedType, relatedId, content]
    );
  }

  /**
   * Traite l'acceptation d'une invitation
   * Logique: B accepte l'invitation de A -> ils deviennent collaborateurs
   */
  static async processInvitationAcceptance(invitationId, acceptorId) {
    const [invitation] = await db.query(
      'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ? AND status = "pending"',
      [invitationId, acceptorId]
    );

    if (!invitation[0]) {
      throw new Error('Invitation non trouvée ou déjà traitée');
    }

    const senderId = invitation[0].sender_id;

    // Accepter l'invitation
    await db.query(
      'UPDATE collaboration_invitations SET status = "accepted", updated_at = NOW() WHERE id = ?',
      [invitationId]
    );

    // Créer les suivis mutuels
    await this.createMutualFollows(acceptorId, senderId);

    // Notification d'acceptation
    await this.sendNotification(
      senderId, 
      'COLLAB_ACCEPTED', 
      acceptorId, 
      null,
      null,
      'collaboration', 
      invitationId, 
      'a accepté votre invitation de collaboration'
    );

    return { success: true, collaboratorId: senderId };
  }

  /**
   * Traite le refus d'une invitation
   * Logique: B refuse l'invitation de A -> A reçoit une notification
   */
  static async processInvitationRejection(invitationId, rejectorId) {
    const [invitation] = await db.query(
      'SELECT * FROM collaboration_invitations WHERE id = ? AND recipient_id = ? AND status = "pending"',
      [invitationId, rejectorId]
    );

    if (!invitation[0]) {
      throw new Error('Invitation non trouvée ou déjà traitée');
    }

    const senderId = invitation[0].sender_id;

    // Refuser l'invitation
    await db.query(
      'UPDATE collaboration_invitations SET status = "declined", updated_at = NOW() WHERE id = ?',
      [invitationId]
    );

    // Notification de refus
    await this.sendNotification(
      senderId, 
      'COLLAB_REJECTED', 
      rejectorId, 
      null,
      null,
      'collaboration', 
      invitationId, 
      'a refusé votre invitation de collaboration'
    );

    return { success: true };
  }
}

module.exports = CollaborationAlgorithm;
