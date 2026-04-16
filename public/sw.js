const CACHE_NAME = 'pokedex-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/cubopoke.svg'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Error en inst', err);
      })
  );
  self.skipWaiting();
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de cache mejorada para Single Page App (PWA offline real)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. Manejo de navegaciï¿½n (HTML) - Single Page Application
  // (Cargar la app sin internet sin importar la URL)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Peticiones a la API: network-first, fallback to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Archivos estï¿½ticos (JS, CSS, Imï¿½genes): cache-first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => new Response('', { status: 404, statusText: 'Not Found' }));
      })
  );
});

// IndexedDB helper (similar to front-end) para procesar la cola desde el SW
const DB_NAME = 'outbox-db';
const STORE_NAME = 'requests';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllRequests() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result || []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function deleteRequest(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      db.close();
      resolve();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function processQueue() {
  const entries = await getAllRequests();
  if (entries.length === 0) return;

  let count = 0;
  for (const entry of entries) {
    try {
      const headers = entry.headers || {};
      const options = {
        method: entry.method.toUpperCase(),
        headers: headers
      };
      if (entry.body) {
        options.body = entry.body;
      }

      const response = await fetch(entry.url, options);
      
      // Si la respuesta fue exitosa (200-299)
      if (response.ok) {
        await deleteRequest(entry.id);
        count++;
      } else {
        // Si el backend lo rechaza porque faltan datos (ej: viejo formato) lo borramos para que no se atore la cola
        if (response.status >= 400 && response.status < 500) {
          await deleteRequest(entry.id);
        }
        console.error('Sync request failed with status:', response.status);
      }
    } catch (e) {
      // network still failing; keep the entry
    }
  }

  if (count > 0 && self.registration && self.registration.showNotification) {
    self.registration.showNotification("Sincronización Completada", {
      body: `Se enviaron ${count} actualizaciones que hiciste sin conexión a la base de datos.`,
      icon: "/cubopoke.svg"
    });
    // Notificamos a la aplicación cliente por si desea recargar los datos
    self.clients.matchAll().then((clients) => {
      clients.forEach((c) => c.postMessage({ action: 'queueProcessed', count }));
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(processQueue());
  }
});

// Permitir mensajes desde la pï¿½gina para operaciones administrativas
self.addEventListener('message', (event) => {
  if (!event.data) return;
  const action = event.data.action;
  if (action === 'clearCaches') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((c) => c.postMessage({ action: 'cachesCleared' }));
        });
      })
    );
  }
  if (action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (action === 'processQueue') {
    event.waitUntil(processQueue());
  }
});

// Push event listener for Web Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notificaciï¿½n', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
