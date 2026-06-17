// sw.js — Service Worker（离线缓存）

var CACHE_NAME = 'homework-pwa-v1';
var urlsToCache = [
  './',
  'index.html',
  'css/styles.css',
  'manifest.json',
  'js/storage.js',
  'js/db.js',
  'js/subjects.js',
  'js/tasks.js',
  'js/checkin.js',
  'js/calendar.js',
  'js/rewards.js',
  'js/errorbook.js',
  'js/weekly.js',
  'js/ui.js',
  'js/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(res) {
        if (res && res.status === 200) {
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
