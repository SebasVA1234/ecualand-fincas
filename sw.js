/* Service worker de Ecualand.
   Guarda la app entera en el teléfono: después del primer ingreso funciona sin señal.
   Al publicar una versión nueva hay que subir VERSION: eso borra la caché vieja. */
const VERSION = 'ecualand-v6';
const ARCHIVOS = [
  './', './index.html', './ruta.html', './manifest.webmanifest',
  './iconos/icon-192.png', './iconos/icon-512.png',
  './iconos/maskable-192.png', './iconos/maskable-512.png', './iconos/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // cache:'reload' salta la caché HTTP del teléfono (GitHub Pages la deja 10 min): si no, la versión nueva se armaba con archivos viejos
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

// Solo borra cachés propias: en github.io el dominio lo comparten todas las páginas de la cuenta.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('ecualand-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la red para traer datos nuevos; si no hay señal (o tarda más de 4 s), lo guardado.
// Solo se guardan respuestas buenas, para que un error del servidor no pise la app que ya funciona.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const guardado = () => caches.match(e.request).then(r => r || caches.match('./index.html'));
  // lo propio se pide revalidando con el servidor (no-cache); una petición de navegación no admite opciones, por eso va por URL
  const propio = new URL(e.request.url).origin === location.origin;
  const red = (propio ? fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}) : fetch(e.request)).then(r => {
    if (r.ok && r.type === 'basic') {
      const copia = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copia)).catch(() => {});
    }
    return r;
  });
  const espera = new Promise(ok => setTimeout(ok, 4000));
  e.respondWith(
    Promise.race([red, espera.then(() => guardado().then(r => r || red))])
      .then(r => (r && r.ok) ? r : guardado().then(g => g || r))
      .catch(() => guardado())
  );
});
