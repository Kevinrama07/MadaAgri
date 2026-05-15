class WebPushService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker non supporté');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Erreur enregistrement Service Worker:', error);
      return null;
    }
  }

  async subscribe() {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Permission de notification refusée');
        return null;
      }

      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
      }

      if (!this.registration) {
        console.error('Pas de Service Worker enregistré');
        return null;
      }

      // Clé publique VAPID (à générer sur le serveur)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      
      if (!vapidPublicKey) {
        console.warn('Clé VAPID publique non configurée');
        return null;
      }

      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('Souscription push créée:', this.subscription);
      
      // Envoyer la souscription au serveur
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Erreur souscription push:', error);
      return null;
    }
  }

  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        console.log('Désinscription push réussie');
        this.subscription = null;
      }
    } catch (error) {
      console.error('Erreur désinscription push:', error);
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
      
      await fetch(`${API_URL}/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(subscription),
      });

      console.log('Souscription envoyée au serveur');
    } catch (error) {
      console.error('Erreur envoi souscription au serveur:', error);
    }
  }

  async getSubscription() {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  async showNotification(title, options = {}) {
    const granted = await this.requestPermission();
    if (!granted) return;

    if (!this.registration) {
      this.registration = await this.registerServiceWorker();
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new WebPushService();
