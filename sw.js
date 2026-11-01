/* Service worker: la app funciona sin conexión */
const CACHE = 'viajapp-v24';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/styles.css',
  './js/firebase-config.js', './js/data.js', './js/recipes.js', './js/diets.js', './js/store.js', './js/export.js', './js/sync.js', './js/group.js', './js/boletas.js', './js/cuentas.js', './js/trips.js', './js/clima.js', './js/app.js',
  './vendor/html2canvas.min.js', './vendor/jspdf.umd.min.js', './vendor/jspdf.plugin.autotable.min.js', './vendor/qrcode.min.js',
  './vendor/xlsx.mini.min.js', './vendor/jszip.min.js', './vendor/pdfjs/pdf.min.js', './vendor/pdfjs/pdf.worker.min.js',
  './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-firestore-compat.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/logo-badge.png', './icons/perro-guino.webp', './icons/favicon-64.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // cache: 'reload' evita guardar copias viejas que el navegador tenga en su caché HTTP
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes de Google: caché primero
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      c.put(req, res.clone());
      return res;
    }).catch(() => caches.match(req)));
    return;
  }

  if (url.origin !== location.origin) return;

  // Archivos propios: red primero, siempre revalidando con el servidor (no la caché HTTP); caché si no hay conexión.
  // Si la red falla un instante se reintenta una vez; la página de inicio solo se usa como respaldo al ABRIR la app
  // (nunca en lugar de un .js o .css: eso dejaba la app a medio cargar).
  const net = () => fetch(req, { cache: 'no-cache' });
  e.respondWith(
    net().catch(() => net()).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
