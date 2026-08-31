/* Service worker de Tinka.
   Guarda la app en el teléfono para que abra sin internet.
   Si algún día editas index.html, sube el número de VERSION
   para que el teléfono se dé cuenta y descargue la versión nueva. */

const VERSION = 'tinka-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

/* Al instalarse, guarda todo en la memoria del teléfono */
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(VERSION)
      .then(c=> c.addAll(ARCHIVOS))
      .then(()=> self.skipWaiting())
  );
});

/* Al activarse, borra las versiones viejas */
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=> Promise.all(ks.filter(k=> k!==VERSION).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

/* Cada pedido: primero busca en la copia local, y solo sale a
   internet si no la encuentra. Las llamadas a las IA nunca se
   guardan en caché porque siempre necesitan respuesta fresca. */
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);

  if(e.request.method !== 'GET' || url.origin !== location.origin){
    return; // deja pasar las consultas a la IA sin tocarlas
  }

  e.respondWith(
    caches.match(e.request).then(hit=>{
      if(hit) return hit;
      return fetch(e.request)
        .then(res=>{
          if(res && res.ok){
            const copia = res.clone();
            caches.open(VERSION).then(c=> c.put(e.request, copia));
          }
          return res;
        })
        .catch(()=> caches.match('./index.html'));
    })
  );
});
