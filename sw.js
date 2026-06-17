// sw.js — 更健壮的离线缓存策略

var CACHE_NAME = 'homework-pwa-v1';

// 安装时只缓存最关键的文件，避免因个别文件失败导致整体失效
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // 只缓存入口页面和清单文件，其他资源在请求时动态缓存
      return cache.addAll([
        '/my-pwa-app/',
        '/my-pwa-app/index.html',
        '/my-pwa-app/manifest.json'
      ]);
    })
  );
});

// 拦截请求，优先返回缓存，若没有则请求网络并动态缓存
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response; // 命中缓存，直接返回
      }
      // 否则请求网络
      return fetch(event.request).then(function(res) {
        // 只缓存成功的、且是 GET 请求的资源
        if (res && res.status === 200 && event.request.method === 'GET') {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return res;
      }).catch(function() {
        // 网络请求失败时，可返回一个自定义的离线页面（可选）
        // return caches.match('/my-pwa-app/offline.html');
      });
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
});