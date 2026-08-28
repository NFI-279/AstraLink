const CACHE_NAME = 'astralink-v15';
const TILE_CACHE = 'astralink-map-tiles-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './assets/vendor/leaflet/leaflet.css',
  './assets/vendor/leaflet/leaflet.js',
  './assets/vendor/leaflet/images/marker-icon.png',
  './assets/vendor/leaflet/images/marker-icon-2x.png',
  './assets/vendor/leaflet/images/marker-shadow.png',
  './manifest.json',
  './assets/images/astra-h.png',
  './assets/images/app-icon.svg',
  './assets/icons/home-outline.svg',
  './assets/icons/location-outline.svg',
  './assets/icons/location-sharp.svg',
  './assets/icons/navigate.svg',
  './assets/icons/navigate-outline.svg',
  './assets/icons/share-outline.svg',
  './assets/icons/car-sport-outline.svg',
  './assets/icons/settings-outline.svg',
  './assets/icons/time-outline.svg',
  './assets/icons/calendar-outline.svg',
  './assets/icons/chevron-forward.svg',
  './assets/icons/close.svg',
  './assets/icons/lock-closed-outline.svg',
  './assets/icons/lock-open-outline.svg',
  './assets/icons/bulb-outline.svg',
  './assets/icons/megaphone-outline.svg',
  './assets/icons/flashlight-outline.svg',
  './assets/icons/volume-high-outline.svg',
  './assets/icons/car-light-high.svg',
  './assets/icons/car-windshield-outline.svg',
  './assets/icons/car-back.svg',
  './assets/icons/speedometer-outline.svg',
  './assets/icons/shield-checkmark-outline.svg',
  './assets/icons/notifications-outline.svg',
  './assets/icons/moon-outline.svg',
  './assets/icons/information-circle-outline.svg',
  './assets/icons/trail-sign-outline.svg',
  './assets/icons/albums-outline.svg',
  './assets/icons/cube-outline.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![CACHE_NAME, TILE_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request, { cache:'no-store' }));
    return;
  }
  const isMapTile = ['tile.openstreetmap.org', 'server.arcgisonline.com'].includes(url.hostname);
  if (isMapTile) {
    event.respondWith(caches.open(TILE_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request, { mode:'no-cors' });
      cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  const cacheable = event.request.mode === 'navigate' || ['script', 'style', 'image', 'font'].includes(event.request.destination);
  event.respondWith(fetch(event.request).then(response => {
    if (cacheable && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
