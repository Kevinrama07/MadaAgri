const db = require('../db');

/**
 * Algorithme de gestion des suivis (Follow)
 * Gère la logique métier du suivi mutuel et collaboration automatique
 */
class FollowAlgorithm {
  
  /**
   * Vérifie si un suivi existe
   */
  static async followExists(followerId, followingId) {
    const [result] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return result.length > 0;
  }

  /**
   * Vérifie si une collaboration existe
   */
  static async collaborationExists(userA, userB) {
    const [result] = await db.query(
      `SELECT id, status FROM collaborations 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       ORDER BY created_at DESC LIMIT 1`,
      [userA, userB, userB, userA]
    );
    return result[0] || null;
  }

  /**
   * Crée un suivi
   */
  static async createFollow(followerId, followingId) {
    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );
  }

  /**
   * Crée une collaboration automatique
   */
  static async createAutoCollaboration(userA, userB) {
    const [result] = await db.query(
      `INSERT INTO collaborations (sender_id, receiver_id, status, level, message, responded_at) 
       VALUES (?, ?, 'accepted', 'collaborateur', 'Collaboration automatique via suivi mutuel', NOW())`,
      [userA, userB]
    );
    return result.insertId;
  }

  /**
   * Envoie une notification
   */
  static async sendNotification(userId, type, actorId, entityType, entityId, content) {
    await db.query(
      `INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id, content) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, actorId, entityType, entityId, content]
    );
  }

  /**
   * Traite le suivi d'un utilisateur
   * Logique:
   * - A suit B -> A devient abonné de B
   * - Si B suit déjà A -> ils deviennent collaborateurs automatiquement
   */
  static async processFollow(followerId, followingId) {
    // Vérifier si le suivi existe déjà
    if (await this.followExists(followerId, followingId)) {
      throw new Error('Vous suivez déjà cet utilisateur');
    }

    // Créer le suivi
    await this.createFollow(followerId, followingId);

    // Vérifier si l'autre utilisateur suit déjà (suivi mutuel)
    const mutualFollowExists = await this.followExists(followingId, followerId);

    let isNowCollaborator = false;
    let collaborationId = null;

    if (mutualFollowExists) {
      // Vérifier si une collaboration existe déjà
      const existingCollab = await this.collaborationExists(followerId, followingId);

      if (!existingCollab || existingCollab.status !== 'accepted') {
        // Créer collaboration automatique
        collaborationId = await this.createAutoCollaboration(followerId, followingId);
        isNowCollaborator = true;

        // Notifications de collaboration pour les deux utilisateurs
        await this.sendNotification(
          followingId, 
          'COLLAB_AUTO', 
          followerId, 
          'collaboration', 
          collaborationId, 
          'Vous êtes maintenant collaborateurs via suivi mutuel'
        );

        await this.sendNotification(
          followerId, 
          'COLLAB_AUTO', 
          followingId, 
          'collaboration', 
          collaborationId, 
          'Vous êtes maintenant collaborateurs via suivi mutuel'
        );
      }
    } else {
      // Simple notification de suivi
      await this.sendNotification(
        followingId, 
        'FOLLOW', 
        followerId, 
        'follow', 
        null, 
        'a commencé à vous suivre'
      );
    }

    return { 
      success: true, 
      isNowCollaborator,
      collaborationId 
    };
  }

  /**
   * Traite l'arrêt du suivi
   * Logique: Si c'était une collaboration automatique, elle est supprimée
   */
  static async processUnfollow(followerId, followingId) {
    // Vérifier si le suivi existe
    if (!await this.followExists(followerId, followingId)) {
      throw new Error('Vous ne suivez pas cet utilisateur');
    }

    // Supprimer le suivi
    await db.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    // Supprimer la collaboration automatique si elle existe
    const [result] = await db.query(
      `DELETE FROM collaborations 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       AND status = 'accepted' 
       AND message = 'Collaboration automatique via suivi mutuel'`,
      [followerId, followingId, followingId, followerId]
    );

    return { 
      success: true, 
      collaborationRemoved: result.affectedRows > 0 
    };
  }

  /**
   * Obtient le statut de relation complet entre deux utilisateurs
   */
  static async getRelationshipStatus(currentUserId, targetUserId) {
    const [status] = await db.query(`
      SELECT 
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = ? AND following_id = ?
        ) as is_following,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = ? AND following_id = ?
        ) as is_followed_by,
        EXISTS(
          SELECT 1 FROM collaborations 
          WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          AND status = 'accepted'
        ) as is_collaborator,
        (
          SELECT status FROM collaborations 
          WHERE sender_id = ? AND receiver_id = ?
          ORDER BY created_at DESC LIMIT 1
        ) as sent_invitation_status,
        (
          SELECT status FROM collaborations 
          WHERE sender_id = ? AND receiver_id = ?
          ORDER BY created_at DESC LIMIT 1
        ) as received_invitation_status
    `, [
      currentUserId, targetUserId,
      targetUserId, currentUserId,
      currentUserId, targetUserId, targetUserId, currentUserId,
      currentUserId, targetUserId,
      targetUserId, currentUserId
    ]);

    return status[0];
  }
}

module.exports = FollowAlgorithm;
