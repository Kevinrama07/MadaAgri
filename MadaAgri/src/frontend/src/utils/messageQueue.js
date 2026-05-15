/**
 * Message Queue - Gestion des messages offline
 * Stocke les messages en attente dans localStorage et les renvoie à la reconnexion
 */

const QUEUE_KEY = 'madaagri_message_queue';

class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.listeners = new Set();
    this.load();
  }

  /**
   * Charger la queue depuis localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log('[MessageQueue] Queue chargée:', this.queue.length, 'messages');
      }
    } catch (error) {
      console.error('[MessageQueue] Erreur chargement queue:', error);
      this.queue = [];
    }
  }

  /**
   * Sauvegarder la queue dans localStorage
   */
  save() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[MessageQueue] Erreur sauvegarde queue:', error);
    }
  }

  /**
   * Ajouter un message à la queue
   */
  add(message) {
    const queuedMessage = {
      ...message,
      id: message.id || `temp-${Date.now()}-${Math.random()}`,
      queued_at: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
    };

    this.queue.push(queuedMessage);
    this.save();
    console.log('[MessageQueue] Message ajouté à la queue:', queuedMessage.id);
    return queuedMessage;
  }

  /**
   * Retirer un message de la queue
   */
  remove(messageId) {
    const index = this.queue.findIndex(m => m.id === messageId);
    if (index > -1) {
      this.queue.splice(index, 1);
      this.save();
      console.log('[MessageQueue] Message retiré de la queue:', messageId);
      return true;
    }
    return false;
  }

  /**
   * Obtenir tous les messages en attente
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Obtenir les messages en attente pour une conversation
   */
  getByConversation(conversationId) {
    return this.queue.filter(m => m.conversationId === conversationId);
  }

  /**
   * Marquer un message comme en cours d'envoi
   */
  markAsSending(messageId) {
    const message = this.queue.find(m => m.id === messageId);
    if (message) {
      message.status = 'sending';
      this.save();
    }
  }

  /**
   * Marquer un message comme échoué
   */
  markAsFailed(messageId, error) {
    const message = this.queue.find(m => m.id === messageId);
    if (message) {
      message.status = 'failed';
      message.error = error?.message || 'Unknown error';
      message.retry_count = (message.retry_count || 0) + 1;
      message.last_retry = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Traiter la queue (envoyer tous les messages en attente)
   */
  async processQueue(sendFunction) {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log('[MessageQueue] Traitement de la queue:', this.queue.length, 'messages');

    const messages = [...this.queue];
    const results = {
      success: 0,
      failed: 0,
      total: messages.length,
    };

    for (const message of messages) {
      // Ignorer les messages qui ont échoué trop de fois
      if (message.retry_count >= 3) {
        console.warn('[MessageQueue] Message abandonné après 3 tentatives:', message.id);
        this.remove(message.id);
        results.failed++;
        continue;
      }

      try {
        this.markAsSending(message.id);
        console.log('[MessageQueue] Envoi message:', message.id);

        // Envoyer le message via la fonction fournie
        await sendFunction(message);

        // Succès - retirer de la queue
        this.remove(message.id);
        results.success++;
        console.log('[MessageQueue] Message envoyé avec succès:', message.id);
      } catch (error) {
        console.error('[MessageQueue] Erreur envoi message:', message.id, error);
        this.markAsFailed(message.id, error);
        results.failed++;
      }
    }

    this.processing = false;
    console.log('[MessageQueue] Traitement terminé:', results);
    return results;
  }

  /**
   * Vider la queue
   */
  clear() {
    this.queue = [];
    this.save();
    console.log('[MessageQueue] Queue vidée');
  }

  /**
   * Obtenir le nombre de messages en attente
   */
  getCount() {
    return this.queue.length;
  }

  /**
   * Ajouter un listener pour les changements de queue
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifier les listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.queue);
      } catch (error) {
        console.error('[MessageQueue] Erreur listener:', error);
      }
    });
  }

  /**
   * Obtenir les statistiques de la queue
   */
  getStats() {
    const pending = this.queue.filter(m => m.status === 'pending').length;
    const sending = this.queue.filter(m => m.status === 'sending').length;
    const failed = this.queue.filter(m => m.status === 'failed').length;

    return {
      total: this.queue.length,
      pending,
      sending,
      failed,
      oldestMessage: this.queue.length > 0 ? this.queue[0].queued_at : null,
    };
  }
}

// Exporter une instance unique (singleton)
export const messageQueue = new MessageQueue();
export default messageQueue;
