import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute, Route } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache CSS and JS files with stale-while-revalidate
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Cache fonts with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Handle navigation requests with app shell
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  allowlist: [/^\/admin/, /^\/$/],
  denylist: [/^\/_/, /\/api\//, /\.(?:css|js|json|txt|html|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/],
});
registerRoute(navigationRoute);

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineOperations());
  }
});

async function syncOfflineOperations() {
  try {
    // Get offline operations from IndexedDB or localStorage
    const offlineOps = getOfflineOperations();
    
    for (const operation of offlineOps) {
      try {
        await syncOperation(operation);
        removeOfflineOperation(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function getOfflineOperations() {
  try {
    return JSON.parse(localStorage.getItem('offline_operations') || '[]');
  } catch {
    return [];
  }
}

function removeOfflineOperation(operationId: string) {
  try {
    const operations = getOfflineOperations();
    const filtered = operations.filter((op: any) => op.id !== operationId);
    localStorage.setItem('offline_operations', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove offline operation:', error);
  }
}

async function syncOperation(operation: any) {
  const { type, data } = operation;
  
  switch (type) {
    case 'CREATE_PRODUCT':
      return fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    
    case 'UPDATE_PRODUCT':
      return fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    
    case 'DELETE_PRODUCT':
      return fetch(`/api/products/${data.id}`, {
        method: 'DELETE'
      });
    
    case 'CREATE_ORDER':
      return fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    
    case 'UPDATE_ORDER':
      return fetch(`/api/orders/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    
    default:
      console.warn('Unknown operation type:', type);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: data.actions || [],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'CanvaStack Stencil', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  
  if (event.action === 'view') {
    // Handle view action
    event.waitUntil(
      clients.openWindow(notificationData.url || '/')
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

export {};