// guarda la app en el cel para que funcione sin internet
// cambia la version cuando se suban archivos nuevos, asi se borra lo viejo
const VERSION = 'allez-v1';

const ARCHIVOS = [
  './',
  'index.html',
  'css/estilos.css',
  'js/datos.js',
  'js/voz.js',
  'js/repaso.js',
  'js/app.js',
  'manifest.webmanifest',
  'iconos/icono.svg',
  'iconos/icono-192.png',
  'iconos/icono-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// responde con lo guardado al instante y de paso trae la version nueva para la proxima vez
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuentes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!propio && !fuentes) return;

  ev.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, { ignoreSearch: propio }).then(guardado => {
        const red = fetch(req).then(resp => {
          if (resp.ok || resp.type === 'opaque') cache.put(req, resp.clone());
          return resp;
        }).catch(() => guardado || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
        return guardado || red;
      })
    )
  );
});
