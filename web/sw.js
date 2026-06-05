/* Dawood Trader — Service Worker v5
   Fixed: .js substring was matching manifest.json — now uses exact extension match
*/
const CACHE_VER  = 'dt-v7';
const SHELL      = ['/', '/index.html', '/favicon.ico', '/manifest.json'];

/* ── Install ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: delete ALL old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = request.url;

  if (request.method !== 'GET') return;

  // Skip Firebase / external APIs — never cache these
  if (url.includes('firestore.googleapis') || url.includes('firebase') ||
      url.includes('googleapis.com')       || url.includes('identitytoolkit') ||
      url.includes('accounts.google'))  return;

  // Skip manifest.json — always fetch fresh so install prompt works correctly
  if (url.endsWith('/manifest.json') || url.includes('/manifest.json?')) return;

  // JS/CSS bundles: stale-while-revalidate
  // FIX: use endsWith / regex — NOT includes('.js') which matches .json too
  const isBundle = url.includes('/_expo/static/') ||
                   /\.js(\?.*)?$/.test(url)        ||
                   /\.css(\?.*)?$/.test(url);

  if (isBundle) {
    e.respondWith(
      caches.open(CACHE_VER).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(resp => {
            if (resp.ok) cache.put(request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Everything else: network-first, cache fallback, then index.html
  e.respondWith(
    fetch(request)
      .then(resp => {
        if (resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_VER).then(c => c.put(request, clone));
        }
        return resp;
      })
      .catch(() =>
        caches.match(request).then(cached => cached || caches.match('/index.html'))
      )
  );
});
