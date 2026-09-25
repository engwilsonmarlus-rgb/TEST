const CACHE = 'equipdoc-v8';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  // Ignora requisições externas (CDN, fonts, etc)
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Sempre serve do cache se tiver — nunca bloqueia ao voltar ao app
      if(cached) return cached;

      return fetch(e.request).then(response => {
        if(!response || response.status !== 200 || response.type !== 'basic'){
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
