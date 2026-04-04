const CACHE='dhr-v3';
const SHELL=['/','index.html','/manifest.json'];
const SKIP=['api.anthropic.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(SKIP.some(h=>url.hostname.includes(h))){e.respondWith(fetch(e.request));return;}
  e.respondWith(caches.match(e.request).then(cached=>{
    if(cached)return cached;
    return fetch(e.request).then(res=>{
      if(!res||res.status!==200||e.request.method!=='GET')return res;
      const clone=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return res;
    }).catch(()=>{if(e.request.mode==='navigate')return caches.match('/index.html');});
  }));
});
