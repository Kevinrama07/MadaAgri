import { dataApi } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'farmer';
  profilePicture?: string;
  bio?: string;
  region_id?: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  created_at: string;
}

export interface Suggestion {
  id: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  reason: string;
  followers_count: number;
}

export interface Invitation {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_image?: string;
  recipient_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

class NetworkService {
  /**
   * Suivre un utilisateur
   */
  async followUser(userId: string) {
    try {
      const result = await dataApi.followUser(userId);
      return result;
    } catch (error) {
      console.error('[NetworkService] Erreur followUser:', error);
      throw error;
    }
  }

  /**
   * Arrêter de suivre un utilisateur
   */
  async unfollowUser(userId: string) {
    try {
      const result = await dataApi.unfollowUser(userId);
      return result;
    } catch (error) {
      console.error('[NetworkService] Erreur unfollowUser:', error);
      throw error;
    }
  }

  /**
   * Récupérer les suggestions de suivi
   */
  async fetchNetworkSuggestions(): Promise<Suggestion[]> {
    try {
      const suggestions = await (dataApi as any).fetchNetworkSuggestions?.() || [];
      return suggestions;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchNetworkSuggestions:', error);
      throw error;
    }
  }

  /**
   * Récupérer les followers d'un utilisateur
   */
  async fetchFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const followers = await dataApi.fetchFollowers(userId);
      return followers;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchFollowers:', error);
      throw error;
    }
  }

  /**
   * Récupérer les utilisateurs suivis
   */
  async fetchFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const following = await dataApi.fetchFollowing(userId);
      return following;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchFollowing:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut de suivi avec un utilisateur
   */
  async fetchFollowStatus(userId: string) {
    try {
      const status = await (dataApi as any).fetchFollowStatus?.(userId) || false;
      return status;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchFollowStatus:', error);
      throw error;
    }
  }

  /**
   * Envoyer une invitation de collaboration
   */
  async sendCollaborationInvitation(recipientId: string, message: string) {
    try {
      const result = await (dataApi as any).sendCollaborationInvitation?.(recipientId, message) || {};
      return result;
    } catch (error) {
      console.error('[NetworkService] Erreur sendCollaborationInvitation:', error);
      throw error;
    }
  }

  /**
   * Récupérer les invitations reçues
   */
  async fetchReceivedInvitations(): Promise<Invitation[]> {
    try {
      const invitations = await (dataApi as any).fetchReceivedInvitations?.() || [];
      return invitations;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchReceivedInvitations:', error);
      throw error;
    }
  }

  /**
   * Récupérer les invitations envoyées
   */
  async fetchSentInvitations(): Promise<Invitation[]> {
    try {
      const invitations = await (dataApi as any).fetchSentInvitations?.() || [];
      return invitations;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchSentInvitations:', error);
      throw error;
    }
  }

  /**
   * Accepter une invitation
   */
  async acceptInvitation(invitationId: string) {
    try {
      const result = await (dataApi as any).acceptInvitation?.(invitationId) || {};
      return result;
    } catch (error) {
      console.error('[NetworkService] Erreur acceptInvitation:', error);
      throw error;
    }
  }

  /**
   * Refuser une invitation
   */
  async declineInvitation(invitationId: string) {
    try {
      const result = await (dataApi as any).declineInvitation?.(invitationId) || {};
      return result;
    } catch (error) {
      console.error('[NetworkService] Erreur declineInvitation:', error);
      throw error;
    }
  }

  /**
   * Récupérer le profil d'un utilisateur
   */
  async fetchUserProfile(userId: string): Promise<UserProfile> {
    try {
      const profile = await (dataApi as any).fetchUserProfile?.(userId) || {};
      return profile;
    } catch (error) {
      console.error('[NetworkService] Erreur fetchUserProfile:', error);
      throw error;
    }
  }

  /**
   * Rechercher des utilisateurs
   */
  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const users = await (dataApi as any).searchUsers?.(query) || [];
      return users;
    } catch (error) {
      console.error('[NetworkService] Erreur searchUsers:', error);
      throw error;
    }
  }
}

export const networkService = new NetworkService();
export default networkService;
