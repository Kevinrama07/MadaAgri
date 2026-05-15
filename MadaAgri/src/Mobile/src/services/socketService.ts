import io, { Socket } from 'socket.io-client';
import { getToken } from '../lib/api';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'order' | 'invitation';
  actor_id: string;
  actor_name: string;
  actor_image?: string;
  content: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

export interface UserActivity {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

type MessageListener = (message: Message) => void;
type NotificationListener = (notification: Notification) => void;
type ActivityListener = (activity: UserActivity) => void;
type ConnectionListener = () => void;
type ErrorListener = (error: Error) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private notificationListeners: Set<NotificationListener> = new Set();
  private activityListeners: Set<ActivityListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private disconnectionListeners: Set<ConnectionListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private userId: string | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialiser la connexion Socket.io
   */
  connect(serverUrl: string = 'http://localhost:4000', userId?: string): Promise<void> {
    // Si déjà connecté ou en cours de connexion, retourner la promesse existante
    if (this.socket?.connected) {
      console.log('[SocketService] ✅ Déjà connecté');
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('[SocketService] ⏳ Connexion en cours...');
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = getToken();

        if (!token) {
          console.warn('[SocketService] Pas de token, connexion non établie');
          this.isConnecting = false;
          reject(new Error('No authentication token'));
          return;
        }

        // Stocker le userId
        if (userId) {
          this.userId = userId;
          console.log('[SocketService] 👤 UserId défini:', userId);
        }

        console.log('[SocketService] 🔄 Tentative de connexion à:', serverUrl);

        this.socket = io(serverUrl, {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
          connectTimeout: 15000,
          timeout: 25000,
          upgrade: true,
          autoConnect: true,
        });

        // Timeout global pour la connexion
        this.connectionTimeout = setTimeout(() => {
          if (!this.socket?.connected) {
            console.error('[SocketService] ❌ Timeout connexion après 20s');
            this.isConnecting = false;
            reject(new Error('Connection timeout after 20s'));
          }
        }, 20000);

        // Événements de connexion
        this.socket.on('connect', () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          console.log('[SocketService] ✅ Connecté au serveur');
          
          // Envoyer le userId au serveur si disponible
          if (this.userId) {
            this.socket!.emit('user:connect', this.userId);
            console.log('[SocketService] 📤 UserId envoyé au serveur:', this.userId);
          }
          
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.connectionListeners.forEach((listener) => listener());
          resolve();
        });

        // Événements de déconnexion
        this.socket.on('disconnect', () => {
          console.log('[SocketService] ❌ Déconnecté du serveur');
          this.disconnectionListeners.forEach((listener) => listener());
        });

        // Erreurs de connexion
        this.socket.on('connect_error', (error) => {
          console.error('[SocketService] Erreur de connexion:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (this.connectionTimeout) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
            this.isConnecting = false;
            reject(error);
          }
          this.errorListeners.forEach((listener) => listener(error));
        });

        // Événements de messages
        this.socket.on('message:new', (message: Message) => {
          console.log('[SocketService] Nouveau message reçu (message:new):', message);
          this.messageListeners.forEach((listener) => listener(message));
        });

        // Événement de message reçu en temps réel (depuis le serveur via Socket.io)
        this.socket.on('message:received', (message: any) => {
          console.log('[SocketService] Message reçu en temps réel (message:received):', message);
          this.messageListeners.forEach((listener) => listener(message));
        });

        this.socket.on('message:read', (data: { messageId: string }) => {
          console.log('[SocketService] Message marqué comme lu:', data);
        });

        // Événements de notifications
        this.socket.on('notification:new', (notification: Notification) => {
          console.log('[SocketService] Nouvelle notification:', notification);
          this.notificationListeners.forEach((listener) => listener(notification));
        });

        // Événements d'activité utilisateur
        this.socket.on('user:activity', (activity: UserActivity) => {
          console.log('[SocketService] Activité utilisateur:', activity);
          this.activityListeners.forEach((listener) => listener(activity));
        });

        // Événements de publication
        this.socket.on('post:new', (post: any) => {
          console.log('[SocketService] Nouvelle publication:', post);
        });

        this.socket.on('post:liked', (data: any) => {
          console.log('[SocketService] Publication aimée:', data);
        });

        this.socket.on('post:commented', (data: any) => {
          console.log('[SocketService] Commentaire ajouté:', data);
        });

        // Événements de suivi
        this.socket.on('user:followed', (data: any) => {
          console.log('[SocketService] Utilisateur suivi:', data);
        });

        // Événements de commande
        this.socket.on('order:status', (data: any) => {
          console.log('[SocketService] Statut commande:', data);
        });

        // ============================================
        // 📤 INVITATIONS DE COLLABORATION EN TEMPS RÉEL
        // ============================================
        this.socket.on('collaboration:invited', (invite: any) => {
          console.log('[SocketService] Invitation de collaboration reçue:', invite);
          this.notificationListeners.forEach((listener) =>
            listener({
              ...invite,
              type: 'invitation',
            })
          );
        });

        this.socket.on('collaboration:response', (response: any) => {
          console.log('[SocketService] Réponse collaboration:', response);
          this.notificationListeners.forEach((listener) =>
            listener({
              ...response,
              type: 'invitation',
            })
          );
        });

        // ============================================
        // 👥 DEMANDES DE SUIVI EN TEMPS RÉEL
        // ============================================
        this.socket.on('follow:requested', (request: any) => {
          console.log('[SocketService] Demande de suivi reçue:', request);
          this.notificationListeners.forEach((listener) =>
            listener({
              ...request,
              type: 'follow',
            })
          );
        });

        this.socket.on('follow:response', (response: any) => {
          console.log('[SocketService] Réponse suivi:', response);
          this.notificationListeners.forEach((listener) =>
            listener({
              ...response,
              type: 'follow',
            })
          );
        });
      } catch (error) {
        console.error('[SocketService] Erreur lors de la connexion:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('conversation:join', conversationId);
    console.log('[SocketService] 🚪 Rejoint la conversation:', conversationId);
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('conversation:leave', conversationId);
    console.log('[SocketService] 🚪 Quitté la conversation:', conversationId);
  }

  /**
   * Envoyer un message (avec vérification de connexion)
   */
  async sendMessage(recipientId: string, content: string): Promise<void> {
    if (!recipientId || !content) {
      console.error('[SocketService] Paramètres invalides:', { recipientId, content });
      throw new Error('Invalid parameters: recipientId and content are required');
    }

    // Vérifier la connexion
    if (!this.isConnected()) {
      console.warn('[SocketService] Socket non connecté, tentative d\'attente...');
      try {
        await this.waitForConnection(3000);
      } catch (error) {
        console.error('[SocketService] Impossible de se connecter:', error);
        throw error;
      }
    }

    console.log('[SocketService] 📤 Envoi message à:', recipientId);
    
    this.socket!.emit('message:send', {
      recipient_id: recipientId,
      content,
    });
  }

  /**
   * Marquer un message comme lu
   */
  markMessageAsRead(messageId: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('message:read', { messageId });
  }

  /**
   * Envoyer une notification de saisie
   */
  sendTypingNotification(recipientId: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('user:typing', { recipient_id: recipientId });
  }

  /**
   * Mettre à jour le statut utilisateur
   */
  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('user:status', { status });
  }

  /**
   * Envoyer une invitation de collaboration
   */
  sendCollaborationInvite(recipientId: string, projectId: string, message?: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('collaboration:invite', {
      recipientId,
      projectId,
      message,
    });
    console.log('[SocketService] Invitation collaboration envoyée à:', recipientId);
  }

  /**
   * Répondre à une invitation de collaboration
   */
  respondCollaborationInvite(inviteId: string, accepted: boolean): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('collaboration:respond', {
      inviteId,
      accepted,
    });
    console.log('[SocketService] Réponse collaboration:', accepted ? 'acceptée' : 'refusée');
  }

  /**
   * Envoyer une demande de suivi
   */
  sendFollowRequest(recipientId: string): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('follow:request', {
      recipientId,
    });
    console.log('[SocketService] Demande de suivi envoyée à:', recipientId);
  }

  /**
   * Répondre à une demande de suivi
   */
  respondFollowRequest(requestId: string, accepted: boolean): void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }

    this.socket.emit('follow:respond', {
      requestId,
      accepted,
    });
    console.log('[SocketService] Réponse suivi:', accepted ? 'acceptée' : 'refusée');
  }

  /**
   * Ajouter un listener pour les messages
   */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour les notifications
   */
  onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour l'activité utilisateur
   */
  onActivity(listener: ActivityListener): () => void {
    this.activityListeners.add(listener);
    return () => this.activityListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour la connexion
   */
  onConnect(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour la déconnexion
   */
  onDisconnect(listener: ConnectionListener): () => void {
    this.disconnectionListeners.add(listener);
    return () => this.disconnectionListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour les erreurs
   */
  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Ajouter un listener pour un événement personnalisé
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return () => {};
    }

    this.socket.on(event, callback);
    console.log('[SocketService] Listener ajouté pour:', event);

    // Retourner une fonction de désabonnement
    return () => {
      if (this.socket) {
        this.socket.off(event, callback);
        console.log('[SocketService] Listener supprimé pour:', event);
      }
    };
  }

  /**
   * Vérifier si connecté
   */
  isConnected(): boolean {
    const connected = this.socket?.connected ?? false;
    if (!connected) {
      console.log('[SocketService] 🔴 Socket non connecté:', {
        socketExists: !!this.socket,
        connected: this.socket?.connected,
        userId: this.userId,
      });
    }
    return connected;
  }

  /**
   * Attendre la connexion (utility method)
   */
  async waitForConnection(timeout = 5000): Promise<void> {
    const startTime = Date.now();
    console.log('[SocketService] ⏳ En attente de connexion...');
    
    while (!this.isConnected()) {
      if (Date.now() - startTime > timeout) {
        console.error('[SocketService] ❌ Timeout de connexion après', timeout, 'ms');
        throw new Error(`Socket connection timeout après ${timeout}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    console.log('[SocketService] ✅ Connexion établie et vérifiée');
  }

  /**
   * Déconnecter
   */
  disconnect(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Déconnecté');
    }
  }

  /**
   * Reconnecter
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Nettoyer tous les listeners
   */
  cleanup(): void {
    this.messageListeners.clear();
    this.notificationListeners.clear();
    this.activityListeners.clear();
    this.connectionListeners.clear();
    this.disconnectionListeners.clear();
    this.errorListeners.clear();
    this.disconnect();
  }
}

export const socketService = new SocketService();
export default socketService;
