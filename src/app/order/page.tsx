'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

declare global {
  interface Window {
    snap: any;
  }
}

const STATUS_TABS = [
  "pending_payment",
  "processing_seller",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  processing_seller: "Diproses Penjual",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700",
  processing_seller: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

// ==================== FETCH DENGAN TOKEN ====================
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Token tidak ada");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function OrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil tab dari query string, default ke "pending_payment"
  const tabFromUrl = searchParams.get("tab") || "pending_payment";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const showAlert = (title: string, text: string, icon: "success" | "error" | "warning" | "info") => {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: "#2563eb",
      confirmButtonText: "OK",
      width: "400px",
      customClass: {
        popup: "rounded-xl shadow-md text-sm",
        title: "swal2-title-custom font-semibold text-gray-800",
        htmlContainer: "swal2-htmlContainer-custom text-gray-600",
        confirmButton: "px-4 py-1.5 swal2-confirmButton-custom rounded-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition",
      },
      buttonsStyling: false,
    });
  };

  // ==================== FETCH ORDERS ====================
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/order`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setOrders(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router, token]);

  // ==================== LOAD NEXT_PUBLIC_MIDTRANS SNAP ====================
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${process.env.NEXT_PUBLIC_MIDTRANS_URL}/snap/snap.js`;
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
    document.body.appendChild(script);
  }, []);

  // Sinkronkan tab ketika URL berubah
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Update URL ketika klik tab
  const handleChangeTab = (status: string) => {
    setActiveTab(status);
    router.push(`/order?tab=${status}`);
  };

  const handlePayNow = (order: any) => {
    if (!window.snap) {
      alert("Snap belum siap, coba lagi beberapa detik.");
      return;
    }
    window.snap.pay(order.paymentToken, {
      onSuccess: () => showAlert("Sukses", "Pembayaran berhasil!", "success"),
      onPending: () => showAlert("Pending", "Pembayaran menunggu konfirmasi.", "info"),
      onError: () => showAlert("Error", "Terjadi kesalahan saat pembayaran.", "error"),
      onClose: () => showAlert("Dibatalkan", "Popup ditutup tanpa menyelesaikan pembayaran.", "warning"),
    });
  };

  // ==================== BUY AGAIN ====================
  const handleBuyAgain = async (order: any) => {
    try {
      if (!token) {
        router.push("/login");
        return;
      }

      const { value: quantities } = await Swal.fire({
        title: "Beli Lagi",
        html: order.items.map((item: any, idx: number) =>
          `<div class="mb-2">
            <label class="block text-left mb-1">${item.productName}</label>
            <input type="number" id="qty-${idx}" class="swal2-input" value="${item.quantity}" min="1">
          </div>`).join(""),
        showCancelButton: true,
        confirmButtonText: "Tambahkan & Checkout",
        cancelButtonText: "Batal",
        preConfirm: () => order.items.map((_: any, idx: number) => {
          const el = document.getElementById(`qty-${idx}`) as HTMLInputElement;
          return Number(el.value) || 1;
        }),
        width: "450px",
      });

      if (!quantities) return;

      const addCartPromises = order.items.map((item: any, idx: number) =>
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/add-cart-item/${item.idProduct}`, {
          method: "POST",
          body: JSON.stringify({ quantity: quantities[idx] }),
        }).then(res => res.json())
      );

      const results = await Promise.all(addCartPromises);

      const failed = results.filter(r => r.status !== "success");
      if (failed.length > 0) {
        showAlert("Error", "Beberapa produk gagal ditambahkan ke cart.", "error");
        return;
      }

      const cartIds = results.map((r: any) => r.data.idCartItem).join(",");
      router.push(`/checkout?items=${cartIds}`);

    } catch (err: any) {
      console.error(err);
      showAlert("Error", err.message || "Terjadi kesalahan", "error");
    }
  };

  const handleGiveReview = (order: any) => {
  router.push(`/order/${order.idOrder}/review?tab=${activeTab}`);
};


  const filteredOrders = orders.filter((order) => order.orderStatus === activeTab);

  useEffect(() => {
    const current = tabRefs.current[activeTab];
    if (current) current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  return (
    <div className="p-6 md:p-10 mt-20 max-w-6xl mx-auto">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-8">
        Order
      </h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-3 mb-8 no-scrollbar pb-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            ref={(el) => (tabRefs.current[status] = el)}
            onClick={() => handleChangeTab(status)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === status ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {STATUS_LABELS[status] ?? status}
          </button>
        ))}
      </div>

      {loading && <p className="text-center mt-20 text-gray-600 animate-pulse">Loading orders...</p>}

      {!loading && filteredOrders.length === 0 && (
        <div className="text-center mt-20 text-gray-500">
          <p className="text-lg font-medium">Tidak ada order dengan status ini</p>
        </div>
      )}

      {!loading &&
        filteredOrders.map((order) => (

          <div key={order.idOrder} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-6 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Store className="text-gray-600" /> {order.storeName}
              </h2>
              <span className={`px-3 py-1 rounded-md text-xs font-medium self-start md:self-auto ${STATUS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              {order.shipping?.airWayBill && (
                <h4 className="font-semibold">Resi: {order.shipping.airWayBill}</h4>
              )}


              {order.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 border-b last:border-0 py-3"
                >
                  {/* Gambar di kiri */}
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />

                  {/* Detail di kanan */}
                  <div className="flex flex-col">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      Harga: Rp {(item.price || 0).toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.quantity} Produk • Rp {(item.totalSubPrice || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 flex flex-wrap gap-3 justify-end">
              <button onClick={() => router.push(`/order/${order.idOrder}`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition">
                Lihat Detail
              </button>

              {order.orderStatus === "pending_payment" && (
                <button onClick={() => handlePayNow(order)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700 transition">
                  Bayar Sekarang
                </button>
              )}

              {(order.orderStatus === "delivered" || order.orderStatus === "cancelled") && (
                <button onClick={() => handleBuyAgain(order)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                  Beli Lagi
                </button>
              )}

              {order.orderStatus === "delivered" && (
                <button onClick={() => handleGiveReview(order)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition">
                  Penilaian
                </button>
              )}
            </div>
          </div>
        ))
      }
    </div >
  );
}
