/**
 * Service Worker for Offline Support
 * Provides caching and offline functionality for the SPA operations dashboard
 */

const CACHE_NAME = 'spa-ops-dashboard-v1';
const STATIC_CACHE_NAME = 'spa-ops-static-v1';
const DYNAMIC_CACHE_NAME = 'spa-ops-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/output.css',
  '/vite.svg'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/roster/,
  /\/api\/sessions/,
  /\/api\/therapists/,
  /\/api\/rooms/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Check if it's an API request
    if (isApiRequest(url)) {
      return await handleApiRequest(request);
    }
    
    // Check if it's a static asset
    if (isStaticAsset(url)) {
      return await handleStaticAsset(request);
    }
    
    // For all other requests, try cache first, then network
    return await handleGenericRequest(request);
    
  } catch (error) {
    console.error('Service Worker: Error handling request', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/index.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first for static assets
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Return a fallback for missing static assets
    return new Response('Asset not available offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

async function handleGenericRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // For navigation requests, return the main page
    if (request.mode === 'navigate') {
      return await caches.match('/index.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // This could sync offline data when connection is restored
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/vite.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/vite.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SPA Operations Dashboard', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
