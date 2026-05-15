/* eslint-disable no-restricted-globals */

// Service Worker pour les notifications push

const CACHE_NAME = 'madaagri-notifications-v1';

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installation');
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');
  event.waitUntil(self.clients.claim());
});

// Réception des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu:', event);

  let data = {
    title: 'Nouvelle notification',
    body: 'Vous avez une nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'notification',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Erreur parsing push data:', error);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher une fenêtre déjà ouverte
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fermeture de la notification
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event);
});

// Sync en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Synchroniser les notifications avec le serveur
    console.log('[SW] Synchronisation des notifications');
  } catch (error) {
    console.error('[SW] Erreur sync notifications:', error);
  }
}

// Messages du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
