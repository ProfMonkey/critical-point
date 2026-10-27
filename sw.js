const CACHE='critical-point-v25-static';
const FILES=['./','./index.html','./manifest.webmanifest','./assets/critical-logo.svg','./assets/critical-192.png','./assets/critical-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('critical-point-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
 e.respondWith(fetch(req).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE).then(cache=>cache.put(req,cloned)).catch(()=>{});}return response;}).catch(async()=>{const cached=await caches.match(req);if(cached)return cached;if(req.mode==='navigate'){const fallback=await caches.match('./index.html');if(fallback)return fallback;}return Response.error();}));
});