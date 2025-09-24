// Service Worker for Following Analytics Platform
const CACHE_NAME = 'following-analytics-v1'
const OFFLINE_CACHE_NAME = 'following-offline-v1'

// Cache static assets and API responses
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/creators',
  '/auth/login',
  '/auth/register',
  '/manifest.json'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.analyticsfollowing\.com\/api\/v1\/auth\/dashboard/,
  /^https:\/\/api\.analyticsfollowing\.com\/api\/v1\/auth\/unlocked-profiles/,
  /^https:\/\/api\.analyticsfollowing\.com\/api\/v1\/simple\/creator\/[^/]+$/,
  /^https:\/\/api\.analyticsfollowing\.com\/api\/v1\/system\/stats/,
  /^http:\/\/localhost:8000\/api\/v1\/auth\/dashboard/,
  /^http:\/\/localhost:8000\/api\/v1\/auth\/unlocked-profiles/,
  /^http:\/\/localhost:8000\/api\/v1\/simple\/creator\/[^/]+$/,
  /^http:\/\/localhost:8000\/api\/v1\/system\/stats/
]

// Image caching patterns
const IMAGE_CACHE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|ico|svg)$/i,
  /^https:\/\/.*\.cdninstagram\.com\//,
  /^https:\/\/cdn\.following\.ae\//,
  /^http:\/\/localhost:8000\/api\/v1\/proxy-image\//
]

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request))
  }
})

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/_next/static') ||
         url.pathname === '/manifest.json' ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css')
}

// Check if request is for API endpoints we want to cache
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Check if request is for images
function isImageRequest(request) {
  return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Check if request is for navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Static asset fetch failed', error)
    return new Response('Asset not available offline', { status: 503 })
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    // Fetch from network
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        // Only cache successful responses
        const responseToCache = networkResponse.clone()

        // Add timestamp for TTL tracking
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cached-at', Date.now().toString())

        const responseWithTimestamp = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })

        cache.put(request, responseWithTimestamp)
      }
      return networkResponse
    }).catch((error) => {
      console.warn('Service Worker: API network request failed', error)
      return null
    })

    // Return cached response immediately if available, otherwise wait for network
    if (cachedResponse) {
      // Check if cached response is fresh (5 minutes TTL)
      const cachedAt = cachedResponse.headers.get('sw-cached-at')
      const isStale = !cachedAt || (Date.now() - parseInt(cachedAt)) > 5 * 60 * 1000

      if (!isStale) {
        // Fresh cache - return immediately and update in background
        networkPromise.catch(() => {}) // Ignore errors for background update
        return cachedResponse
      }
    }

    // Wait for network response or return cached if network fails
    const networkResponse = await networkPromise
    return networkResponse || cachedResponse || new Response(
      JSON.stringify({ error: 'Service unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Service Worker: API request handling failed', error)
    return new Response(
      JSON.stringify({ error: 'Request failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle images with cache-first strategy and longer TTL
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      // Check if image cache is fresh (1 hour TTL)
      const cachedAt = cachedResponse.headers.get('sw-cached-at')
      const isStale = !cachedAt || (Date.now() - parseInt(cachedAt)) > 60 * 60 * 1000

      if (!isStale) {
        return cachedResponse
      }
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers)
      headers.set('sw-cached-at', Date.now().toString())

      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      })

      cache.put(request, responseWithTimestamp.clone())
      return responseWithTimestamp
    }

    return cachedResponse || networkResponse
  } catch (error) {
    console.error('Service Worker: Image request failed', error)
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Image not available', { status: 503 })
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.warn('Service Worker: Navigation request failed, serving offline page')

    // Try to serve cached page
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Serve offline fallback
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Following Analytics - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              padding: 50px;
              color: #333;
            }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            .offline-title { font-size: 24px; margin-bottom: 10px; }
            .offline-message { color: #666; margin-bottom: 30px; }
            .retry-btn {
              background: #5100f3;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">📡</div>
          <h1 class="offline-title">You're Offline</h1>
          <p class="offline-message">Check your internet connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered')
    event.waitUntil(syncFailedRequests())
  }
})

async function syncFailedRequests() {
  // Implementation for syncing failed requests when back online
  console.log('Service Worker: Syncing failed requests...')
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('Service Worker: Push notification received', data)

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    )
  }
})