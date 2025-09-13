/* eslint-disable no-undef */
/**
 * Service Worker untuk Firebase Cloud Messaging
 * File ini HARUS disimpan di /public agar dapat diakses di root:
 *    https://yourdomain.com/firebase-messaging-sw.js
 */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// --- Konfigurasi Firebase project kamu ---
firebase.initializeApp({
  apiKey: "AIzaSyCdCAepV26Ei53NXlxFYRnyQlO8scpguvQ",
  authDomain: "bomi-ecommerces.firebaseapp.com",
  projectId: "bomi-ecommerces",
  storageBucket: "bomi-ecommerces.firebasestorage.app",
  messagingSenderId: "974835585341",
  appId: "1:974835585341:web:61a57ce7c7adf7567b7554",
  measurementId: "G-0N0HN5VHPL"
});

// --- Inisialisasi FCM ---
const messaging = firebase.messaging();

/**
 * Listener pesan saat tab sedang di-background
 * Akan menampilkan notifikasi menggunakan Web Notification API
 */
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'Notifikasi';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png', // opsional: ikon notifikasi (letakkan di /public)
    badge: '/icon-72x72.png',  // opsional: badge notifikasi
    data: payload.data || {},  // opsional: data tambahan
  };

  // Tampilkan notifikasi
  self.registration.showNotification(notificationTitle, notificationOptions);
});
