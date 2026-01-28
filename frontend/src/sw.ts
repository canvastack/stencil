import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute, Route } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);

// Enhanced API caching with intelligence features
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/admin/intelligence/'),
  new NetworkFirst({
    cacheName: 'ai-intelligence-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 10 * 60, // 10 minutes for AI data
      }),
    ],
  })
);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
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
        maxEntries: 300,
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
        maxEntries: 150,
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
        maxEntries: 50,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Enhanced navigation handling for PWA
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
  } else if (event.data && event.data.type === 'CACHE_AI_DATA') {
    // Cache AI intelligence data for offline access
    event.waitUntil(cacheAIData(event.data.payload));
  } else if (event.data && event.data.type === 'SYNC_OFFLINE_ACTIONS') {
    // Trigger background sync for offline actions
    event.waitUntil(syncOfflineActions());
  }
});

// Enhanced background sync for multiple operation types
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'offline-sync':
      event.waitUntil(syncOfflineOperations());
      break;
    case 'ai-insights-sync':
      event.waitUntil(syncAIInsights());
      break;
    case 'analytics-sync':
      event.waitUntil(syncAnalyticsData());
      break;
    case 'order-sync':
      event.waitUntil(syncOrderData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Enhanced push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'You have new updates in CanvaStencil',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image || null,
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      data: {
        ...data,
        timestamp: Date.now(),
        url: data.url || '/admin/dashboard'
      },
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ],
      tag: data.tag || 'default',
      renotify: data.renotify || false
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'CanvaStencil', 
        options
      )
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('CanvaStencil', {
        body: 'You have new updates',
        icon: '/icons/icon-192x192.png'
      })
    );
  }
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const targetUrl = notificationData?.url || '/admin/dashboard';
  
  if (event.action === 'view') {
    event.waitUntil(openOrFocusWindow(targetUrl));
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open or focus app
    event.waitUntil(openOrFocusWindow(targetUrl));
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Track notification dismissal analytics
  const data = event.notification.data;
  if (data && data.trackDismissal) {
    event.waitUntil(
      trackNotificationEvent('dismissed', data)
    );
  }
});

// Helper functions

async function openOrFocusWindow(url: string) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Check if app is already open
  for (const client of clients) {
    if (client.url.includes('/admin') && 'focus' in client) {
      await client.focus();
      if (client.navigate) {
        return client.navigate(url);
      }
      return client;
    }
  }
  
  // Open new window if app is not open
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

async function cacheAIData(data: any) {
  try {
    const cache = await caches.open('ai-intelligence-cache');
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/admin/intelligence/dashboard', response);
    console.log('[SW] AI data cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache AI data:', error);
  }
}

async function syncOfflineOperations() {
  try {
    console.log('[SW] Syncing offline operations...');
    const offlineOps = getOfflineOperations();
    
    for (const operation of offlineOps) {
      try {
        await syncOperation(operation);
        removeOfflineOperation(operation.id);
        console.log('[SW] Operation synced:', operation.type);
      } catch (error) {
        console.error('[SW] Failed to sync operation:', operation, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncAIInsights() {
  try {
    console.log('[SW] Syncing AI insights...');
    
    // Refresh AI dashboard data
    const response = await fetch('/api/admin/intelligence/dashboard');
    if (response.ok) {
      const cache = await caches.open('ai-intelligence-cache');
      await cache.put('/api/admin/intelligence/dashboard', response.clone());
      console.log('[SW] AI insights synced successfully');
    }
  } catch (error) {
    console.error('[SW] Error syncing AI insights:', error);
  }
}

async function syncAnalyticsData() {
  try {
    console.log('[SW] Syncing analytics data...');
    const analyticsData = getOfflineAnalytics();
    
    for (const data of analyticsData) {
      try {
        await fetch('/api/admin/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        removeOfflineAnalytics(data.id);
      } catch (error) {
        console.error('[SW] Failed to sync analytics:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing analytics:', error);
  }
}

async function syncOrderData() {
  try {
    console.log('[SW] Syncing order data...');
    const orderData = getOfflineOrders();
    
    for (const order of orderData) {
      try {
        await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order.data)
        });
        removeOfflineOrder(order.id);
      } catch (error) {
        console.error('[SW] Failed to sync order:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing orders:', error);
  }
}

async function trackNotificationEvent(event: string, data: any) {
  try {
    await fetch('/api/admin/analytics/notification-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        notification_data: data,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('[SW] Failed to track notification event:', error);
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
    console.error('[SW] Failed to remove offline operation:', error);
  }
}

function getOfflineAnalytics() {
  try {
    return JSON.parse(localStorage.getItem('offline_analytics') || '[]');
  } catch {
    return [];
  }
}

function removeOfflineAnalytics(analyticsId: string) {
  try {
    const analytics = getOfflineAnalytics();
    const filtered = analytics.filter((a: any) => a.id !== analyticsId);
    localStorage.setItem('offline_analytics', JSON.stringify(filtered));
  } catch (error) {
    console.error('[SW] Failed to remove offline analytics:', error);
  }
}

function getOfflineOrders() {
  try {
    return JSON.parse(localStorage.getItem('offline_orders') || '[]');
  } catch {
    return [];
  }
}

function removeOfflineOrder(orderId: string) {
  try {
    const orders = getOfflineOrders();
    const filtered = orders.filter((o: any) => o.id !== orderId);
    localStorage.setItem('offline_orders', JSON.stringify(filtered));
  } catch (error) {
    console.error('[SW] Failed to remove offline order:', error);
  }
}

async function syncOperation(operation: any) {
  const { type, data, endpoint, method = 'POST' } = operation;
  
  const response = await fetch(endpoint || `/api/admin/${type.toLowerCase()}`, {
    method,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${operation.token || ''}`
    },
    body: method !== 'DELETE' ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

export {};