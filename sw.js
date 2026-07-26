/* ============================================================
   星屿 Service Worker
   策略：缓存优先、后台静默更新（stale-while-revalidate）。
   改版后把 CACHE 版本号 +1，旧缓存会在 activate 时清掉。
   ============================================================ */
const CACHE = "starisle-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./archive.html",
  "./constellations.html",
  "./friend.html",
  "./about.html",
  "./404.html",
  "./css/style.css",
  "./js/stars.js",
  "./js/music-config.js",
  "./js/music-player.js",
  "./js/posts-data.js",
  "./js/constellations.js",
  "./posts/cloud-gpu.html",
  "./posts/hugo-github.html",
  "./posts/kali-pentest.html",
  "./posts/ai-learning.html",
  "./posts/starlight-train.html",
  "./icon.svg",
  "./manifest.webmanifest",
  "./images/posts/1a.webp",
  "./images/posts/1b.webp",
  "./images/posts/a.png",
  "./images/posts/b.png",
  "./images/posts/cc.webp",
  "./images/posts/d.webp",
  "./images/posts/e.webp",
  "./images/posts/f.png",
  "./images/posts/PyTorch2.jpg",
  "./images/posts/chenxi.webp",
  "./images/covers/cloud-gpu.webp",
  "./images/covers/hugo-github.webp",
  "./images/covers/kali-pentest.avif",
  "./images/covers/ai-learning.avif",
  "./images/covers/starlight-train.jpg",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      const fetched = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || fetched;
    })
  );
});
