"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFcmToken, onForegroundMessage } from "../../firebaseClient";

// ===== Types =====
type NotificationToast = { id: number; message: string };

type Ctx = {
  messages: NotificationToast[];
  removeNotif: (id: number) => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  markAllAsRead: () => void; // ✅ baru
};

const NotificationContext = createContext<Ctx | null>(null);

// ===== Provider =====
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<NotificationToast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tokenUser = localStorage.getItem("token");
    if (!tokenUser || !("Notification" in window)) return;

    // --- 1️⃣ ambil jumlah unread dari API saat pertama kali load
    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/unread-count`,
          { headers: { Authorization: `Bearer ${tokenUser}` } }
        );
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      } catch (err) {
        console.error("Gagal ambil unread count:", err);
      }
    };

    const askPermissionAndRegister = async () => {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;

      const token = await getFcmToken();
      if (!token) return;

      // kirim fcmToken user ke backend
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenUser}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      // --- 2️⃣ setiap kali ada push baru, tampilkan toast + tambah unread
      onForegroundMessage((payload) => {
        const text =
          payload.notification?.body ||
          payload.data?.message ||
          "Notifikasi baru";

        setMessages((prev) => [{ id: Date.now(), message: text }, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    };

    fetchUnread();
    askPermissionAndRegister();
  }, []);

  // --- menutup popup saja
  const removeNotif = (id: number) =>
    setMessages((prev) => prev.filter((m) => m.id !== id));

  // --- tandai semua notif sebagai sudah dibaca
  const markAllAsRead = async () => {
    const tokenUser = localStorage.getItem("token");
    if (!tokenUser) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/mark-all-read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${tokenUser}` },
        }
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Gagal update status notifikasi:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ messages, removeNotif, unreadCount, setUnreadCount, markAllAsRead }}
    >
      {children}

      {/* === Popup toast FCM === */}
      <div className="fixed top-4 right-4 space-y-3 z-50">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-blue-200 shadow-lg rounded-xl p-4 flex items-start gap-3 max-w-xs"
            >
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{msg.message}</p>
              </div>
              <button
                onClick={() => removeNotif(msg.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

// ===== Hook untuk konsumsi context =====
export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
};
