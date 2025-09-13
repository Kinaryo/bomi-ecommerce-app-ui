"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import Swal from "sweetalert2";

type Notif = {
  idNotification: number;
  idUser: number;
  message: string;
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // 👉 total & unread global dari backend
  const [totalAll, setTotalAll] = useState(0);
  const [unreadAll, setUnreadAll] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { setUnreadCount } = useNotification();

  const fetchNotifications = async (pageParam = 1, append = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification?page=${pageParam}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        const newData: Notif[] = data.data || [];
        if (append) {
          setNotifications((prev) => [...prev, ...newData]);
        } else {
          setNotifications(newData);
        }
        setPagination(data.pagination);

        // update total & unread global
        setTotalAll(data.stats?.totalAll || 0);
        setUnreadAll(data.stats?.unreadAll || 0);
        setUnreadCount(data.stats?.unreadAll || 0);
      }
    } catch (err) {
      console.error("Gagal fetch notif:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/${id}/read`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        setNotifications((prev) =>
          prev.map((n) =>
            n.idNotification === id ? { ...n, readStatus: true } : n
          )
        );
        setUnreadAll((prev) => Math.max(prev - 1, 0));
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Gagal update notif:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/read-all`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
        setUnreadAll(0);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Gagal update semua notif:", err);
    }
  };

  const deleteAll = async () => {
    if (!token) return;
    const result = await Swal.fire({
      title: "Yakin hapus semua notifikasi?",
      text: "Tindakan ini tidak bisa dibatalkan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus semua",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/all`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        setNotifications([]);
        setSelectedIds([]);
        setPagination(null);
        setTotalAll(0);
        setUnreadAll(0);
        setUnreadCount(0);

        Swal.fire("Berhasil!", "Semua notifikasi dihapus.", "success");
      }
    } catch (err) {
      console.error("Gagal hapus semua notif:", err);
      Swal.fire("Error!", "Gagal menghapus notifikasi.", "error");
    }
  };

  const deleteSelected = async () => {
    if (!token || selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: "Hapus notifikasi terpilih?",
      text: "Notifikasi yang dipilih akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/notification/selected`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        const updated = notifications.filter(
          (n) => !selectedIds.includes(n.idNotification)
        );
        const deletedUnread = notifications.filter(
          (n) => selectedIds.includes(n.idNotification) && !n.readStatus
        ).length;

        setNotifications(updated);
        setSelectedIds([]);
        setTotalAll((prev) => prev - selectedIds.length);
        setUnreadAll((prev) => Math.max(prev - deletedUnread, 0));
        setUnreadCount((prev) => Math.max(prev - deletedUnread, 0));

        setPagination((prev) =>
          prev
            ? { ...prev, totalItems: prev.totalItems - selectedIds.length }
            : null
        );

        Swal.fire("Berhasil!", "Notifikasi terpilih dihapus.", "success");
      }
    } catch (err) {
      console.error("Gagal hapus notifikasi terpilih:", err);
      Swal.fire("Error!", "Gagal menghapus notifikasi.", "error");
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto mt-20">
      <h1 className="flex items-center justify-center text-3xl font-extrabold text-gray-800 mb-8">
        Notifikasi
      </h1>

      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Info jumlah global */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Total:</span> {totalAll} {"  |  "}
            <span className="font-medium text-red-500">
              Belum dibaca: {unreadAll}
            </span>
          </p>
        </div>

        {/* Tombol aksi */}
        <div className="flex flex-wrap gap-2">
          {unreadAll > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium shadow"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Semua Dibaca
            </button>
          )}
          {totalAll > 0 && (
            <>
              <button
                onClick={deleteSelected}
                disabled={selectedIds.length === 0}
                className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Hapus Terpilih
              </button>
              <button
                onClick={deleteAll}
                className="flex items-center px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Hapus Semua
              </button>
            </>
          )}
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <p className="text-gray-500">Memuat notifikasi...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">Tidak ada notifikasi</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.idNotification}
              className={`rounded-lg border p-4 flex justify-between items-center transition shadow-sm hover:shadow-md ${
                notif.readStatus
                  ? "bg-gray-100 text-gray-500"
                  : "bg-white border-l-4 border-blue-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notif.idNotification)}
                  onChange={() => toggleSelect(notif.idNotification)}
                  className="mt-1"
                />
                <div>
                  <p
                    className={`font-medium ${
                      notif.readStatus ? "text-gray-600" : "text-gray-800"
                    }`}
                  >
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!notif.readStatus && (
                <button
                  onClick={() => markAsRead(notif.idNotification)}
                  className="flex items-center px-2 py-1 border rounded-lg text-sm hover:bg-blue-50"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1 text-blue-500" />
                  Dibaca
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && page < pagination.totalPages && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow text-sm"
          >
            {loading ? "Memuat..." : "Lihat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
}
