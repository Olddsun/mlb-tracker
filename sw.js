/* ============ E-Sport League — Service Worker ============ */
/* 每次 push 有 UI/JS/CSS 改動時，請遞增 CACHE_VERSION */
const CACHE_VERSION = 'esl-v20';

const STATIC = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './submit/',
  './submit/index.html',
];

/* 安裝：快取所有靜態資源，並立即接管（不等舊頁關閉） */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

/* 啟動：刪掉所有舊版快取 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* 攔截請求 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* API 請求：永遠走 network，不快取 */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  /* 其他：cache first，沒有快取再去網路 */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
