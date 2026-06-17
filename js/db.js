// db.js — IndexedDB 封装（照片存储）

const DB_NAME = 'HomeworkPhotos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let db = null;

function openDB() {
  return new Promise(function(resolve, reject) {
    if (db) return resolve(db);
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      var d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_NAME)) {
        d.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = function(e) {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = function(e) {
      reject(e.target.error);
    };
  });
}

function savePhoto(id, blob) {
  return openDB().then(function(database) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() {
        var tx = database.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.put({
          id: id,
          data: reader.result,
          mimeType: blob.type || 'image/jpeg',
          createdAt: new Date().toISOString(),
          size: blob.size
        });
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      };
      reader.readAsArrayBuffer(blob);
    });
  });
}

function getPhoto(id) {
  return openDB().then(function(database) {
    return new Promise(function(resolve, reject) {
      var tx = database.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.get(id);
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function getPhotoURL(id) {
  return getPhoto(id).then(function(record) {
    if (!record || !record.data) return null;
    var blob = new Blob([record.data], { type: record.mimeType });
    return URL.createObjectURL(blob);
  });
}

function deletePhoto(id) {
  return openDB().then(function(database) {
    return new Promise(function(resolve, reject) {
      var tx = database.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

function deletePhotos(ids) {
  return openDB().then(function(database) {
    return new Promise(function(resolve, reject) {
      var tx = database.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      ids.forEach(function(id) { store.delete(id); });
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

function getAllPhotos() {
  return openDB().then(function(database) {
    return new Promise(function(resolve, reject) {
      var tx = database.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.getAll();
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function createThumbnail(blob, maxWidth) {
  maxWidth = maxWidth || 200;
  return new Promise(function(resolve) {
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function() {
      URL.revokeObjectURL(url);
      var ratio = maxWidth / img.width;
      if (ratio >= 1) {
        resolve(blob);
        return;
      }
      var canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * ratio);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function(thumbBlob) {
        resolve(thumbBlob);
      }, 'image/jpeg', 0.7);
    };
    img.src = url;
  });
}
