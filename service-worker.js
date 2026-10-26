const CACHE_NAME = 'hollow-knight-local-shell-v1';

const APP_SHELL = [
  './',
  './hollowknight.html',
  './TemplateData/style.css',
  './TemplateData/favicon.ico',
  './TemplateData/fullscreen-button.png',
  './TemplateData/webgl-logo.png',
  './TemplateData/unity-logo-dark.png',
  './TemplateData/unity-logo-light.png',
  './TemplateData/progress-bar-empty-dark.png',
  './TemplateData/progress-bar-empty-light.png',
  './TemplateData/progress-bar-full-dark.png',
  './TemplateData/progress-bar-full-light.png',
  './StreamingAssets/BuildMetadata.json'
];

function isUnityBinary(requestUrl) {
  const p = requestUrl.pathname;
  return (
    /\/Build\/.*\.(wasm|data)(\.part\d+)?$/i.test(p) ||
    /\/Build\/hk\.(loader|framework)\.js$/i.test(p) ||
    /\/StreamingAssets\//i.test(p)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== location.origin) {
    return;
  }

  if (isUnityBinary(url)) {
    event.respondWith(fetch(request, { cache: 'no-store', credentials: 'omit' }));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request, { cache: 'no-store', credentials: 'omit' })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('./hollowknight.html'));
    })
  );
});
