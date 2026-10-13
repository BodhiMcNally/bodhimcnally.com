const CACHE = 'bodhi-academic-v5';
const CORE = ['/', '/resources/', '/resources/notebook/', '/resources/lab/', '/offline.html', '/favicon.svg', '/site.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Editor sessions and deployment status always use the network.
  // Editor code updates bypass offline storage too.
  if (['/api/editor', '/editor-build.json', '/admin'].includes(new URL(event.request.url).pathname) || new URL(event.request.url).pathname.startsWith('/admin/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Live CV requests bypass offline storage.
  if (new URL(event.request.url).pathname === '/api/cv') {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response; }).catch(async()=>await caches.match(event.request) || await caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response; })));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter(url => typeof url === 'string' && url.startsWith('/') && new URL(url, self.location.origin).pathname !== '/api/cv');
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const assets = new Set();
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        await cache.put(url, response.clone());
        if ((response.headers.get('content-type') || '').includes('text/html')) {
          const html = await response.text();
          for (const match of html.matchAll(/(?:src|href)=["'](\/[^"'#?]+)["']/g)) assets.add(match[1]);
        }
      } catch { /* keep caching the remaining pages */ }
    }
    await Promise.allSettled([...assets].filter(url => new URL(url, self.location.origin).pathname !== '/api/cv').map(url => cache.add(url)));
    event.ports[0]?.postMessage({ type: 'CACHE_COMPLETE', count: urls.length });
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const requests = await cache.keys();
    await Promise.all(requests.filter(request => new URL(request.url).pathname === '/api/cv').map(request => cache.delete(request)));
  })());
});

// Discard any editor files saved by an earlier offline worker.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const requests = await cache.keys();
    await Promise.all(requests.filter(request => {
      const pathname = new URL(request.url).pathname;
      return ['/api/editor', '/editor-build.json', '/admin'].includes(pathname) || pathname.startsWith('/admin/');
    }).map(request => cache.delete(request)));
  })());
});
