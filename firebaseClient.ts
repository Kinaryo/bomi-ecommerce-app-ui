"use client";

import { initializeApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

// ❗ jangan import getMessaging, getToken, onMessage di top-level
// karena saat import mereka langsung akses navigator

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export async function getFcmToken() {
  if (typeof window === "undefined") return null;   // ⬅ penting
  const { getMessaging, getToken } = await import("firebase/messaging"); // ⬅ dynamic import
  const messaging: Messaging = getMessaging(app);
  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });
}

export async function onForegroundMessage(cb: (payload: any) => void) {
  if (typeof window === "undefined") return;
  const { getMessaging, onMessage } = await import("firebase/messaging"); // ⬅ dynamic import
  const messaging: Messaging = getMessaging(app);
  return onMessage(messaging, cb);
}
