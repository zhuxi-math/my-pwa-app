// sw.js — 作业打卡 PWA 离线缓存

var CACHE_NAME = 'homework-pwa-v1';

// 只缓存确认存在的核心文件，路径全部使用绝对路径
var urlsToCache = [
  '/my-pwa-app/',
  '/my-pwa-app/index.html',
  '/my-pwa-app/manifest.json',
  '/my-pwa-app/css/styles.css'
];

// 安装阶段：缓存核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// 请求拦截：缓存优先，动态缓存未命中资源
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(res) {
        if (res && res.status === 200 && event.request.method === 'GET') {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return res;
      });
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
});