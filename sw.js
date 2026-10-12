/* Service worker de retiro de la app Ecualand.
   Reemplaza al anterior: borra las cachés propias, se da de baja y recarga las pestañas abiertas.
   Sin manejador de fetch: a partir de acá todo va a la red. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ecualand-')) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({type: 'window'})) c.navigate(c.url);
})()));
