const CACHE_NAME = 'vpos-v12-pro-cache';

// 1. ตะกร้า VIP: เก็บเฉพาะไฟล์ในเครื่อง (รับประกันว่าโหลดผ่านแน่นอน 100%)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ขั้นตอน Install: ติดตั้งและเก็บไฟล์ VIP ลง Cache ทันที
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching Local VIP Assets');
      return cache.addAll(LOCAL_ASSETS);
    })
  );
  self.skipWaiting(); // บังคับให้ Service Worker ตัวใหม่เข้าทำงานทันทีไม่ต้องรอ
});

// ขั้นตอน Activate: ล้าง Cache เก่าๆ ทิ้งเมื่อมีการอัปเดตเวอร์ชัน
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // ให้ Service Worker เข้าควบคุมหน้าเว็บทันที
});

// ขั้นตอน Fetch: หัวใจหลักของการดักจับไฟล์ตอน Offline และ Runtime Caching
self.addEventListener('fetch', event => {
  // ข้ามการดักจับถ้าไม่ใช่คำสั่งดึงข้อมูลแบบ GET (ป้องกันการรบกวนระบบอื่น)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. ถ้ามีไฟล์ใน Cache อยู่แล้ว ให้คายออกมาเลย (ทำงานออฟไลน์ได้ทันที)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. ถ้ายังไม่มีใน Cache ให้ลองวิ่งไปดึงจากเน็ตดู
      return fetch(event.request).then(networkResponse => {
        // เช็คว่าดึงจากเน็ตสำเร็จสมบูรณ์ไหม
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
          return networkResponse;
        }

        // 3. Runtime Caching: แอบเก็บไฟล์จากเน็ต (เช่น Tailwind, Fonts) ลงถังอัตโนมัติ
        // จำเป็นต้องใช้ clone() เพราะข้อมูล response จะถูกอ่านได้แค่ครั้งเดียว
        if (event.request.url.startsWith('http')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
        }

        return networkResponse;
      }).catch(() => {
        // 4. กรณี Offline เต็มตัว และหาไฟล์ไหนไม่เจอเลยจริงๆ
        // ส่ง Response ว่างๆ กลับไป เพื่อไม่ให้แอปเกิดอาการช็อคตาย (Freeze)
        return new Response('', { status: 404, statusText: 'Offline Fallback' });
      });
    })
  );
});
