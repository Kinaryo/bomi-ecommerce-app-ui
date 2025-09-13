'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, Store } from "lucide-react";
import Image from "next/image";
declare global {
  interface Window {
    snap: any;
  }
}

const CANCELABLE_STATUSES = ["pending_payment"];

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

// Helper fetch dengan token
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { idOrder } = params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

  // Load NEXT_PUBLIC_MIDTRANS Snap JS
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.NEXT_PUBLIC_MIDTRANS.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch order detail
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/order/${idOrder}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.status === "success") setOrder(data.data);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Gagal mengambil data order", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [idOrder, router]);

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Batalkan Order",
      text: "Apakah Anda yakin ingin membatalkan order ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setCancelling(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/order/${idOrder}/cancel`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        Swal.fire("Berhasil", "Order berhasil dibatalkan", "success");
        setOrder((prev: any) => ({ ...prev, orderStatus: "cancelled" }));
      } else {
        Swal.fire("Gagal", data.message || "Gagal membatalkan order", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Terjadi kesalahan saat membatalkan order", "error");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = () => {
    if (!order?.paymentToken) {
      Swal.fire("Error", "Token pembayaran tidak tersedia", "error");
      return;
    }
    if (!window.snap) {
      Swal.fire("Error", "Snap belum siap, coba beberapa detik lagi", "error");
      return;
    }

    setPaying(true);

    window.snap.pay(order.paymentToken, {
      onSuccess: () => {
        Swal.fire("Sukses", "Pembayaran berhasil!", "success");
        setOrder((prev: any) => ({ ...prev, paymentStatus: "paid" }));
        setPaying(false);
      },
      onPending: () => {
        Swal.fire("Pending", "Pembayaran menunggu konfirmasi.", "info");
        setPaying(false);
      },
      onError: () => {
        Swal.fire("Error", "Terjadi kesalahan saat pembayaran.", "error");
        setPaying(false);
      },
      onClose: () => {
        Swal.fire("Info", "Popup ditutup tanpa menyelesaikan pembayaran.", "info");
        setPaying(false);
      },
    });
  };

  const handleBuyAgain = async () => {
    if (!order?.items || order.items.length === 0) return;

    try {
      const { value: quantities } = await Swal.fire({
        title: "Beli Lagi",
        html: order.items.map((item: any, idx: number) =>
          `<div class="mb-2">
            <label class="block text-left mb-1 font-medium">${item.productName}</label>
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
        Swal.fire("Error", "Beberapa produk gagal ditambahkan ke cart.", "error");
        return;
      }

      const cartIds = results.map((r: any) => r.data.idCartItem).join(",");
      router.push(`/checkout?items=${cartIds}`);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold animate-pulse">Loading...</p>
      </div>
    );

  if (!order)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Order tidak ditemukan</p>
      </div>
    );

  const canCancel = CANCELABLE_STATUSES.includes(order.orderStatus);
  const canPay = CANCELABLE_STATUSES.includes(order.orderStatus) && !!order.paymentToken;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 mt-20">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-8">
        Rincian Order
      </h1>

      {/* Tombol Kembali */}
      <button
        onClick={() => router.push(`/order?tab=${order.orderStatus}`)}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Kembali ke Daftar Order</span>
      </button>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
        {/* Status & Toko */}
        <div className="space-y-2">
          <div className="flex justify-end">
            <span className={`px-3 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Store />
            <p className="text-sm font-bold text-gray-800">{order.storeName}</p>
          </div>

          {order.shipping?.airWayBill && (
            <p className="text-sm text-gray-700">No Resi: {order.shipping.airWayBill}</p>
          )}
        </div>

        {/* Informasi Order */}
        <div className="border-gray-400 shadow-md p-4 rounded-md space-y-2">
          <h4 className="text-sm text-gray-800 font-bold">Informasi Order</h4>
          <div className="mt-1">
            <p className="text-sm text-gray-700">Catatan Pembeli: {order.noteCustomer || "-"}</p>
            <p className="text-sm text-gray-700">Informasi: {order.informationOrder || "-"}</p>
            <p className="text-sm text-gray-700">Total Produk: {order.totalProduct}</p>
            <p className="text-sm text-gray-700">Total Qty Produk: {order.totalQuantity}</p>
          </div>
        </div>

        {/* Produk */}
        <div className="border-gray-400 shadow-md p-4 rounded-md">
          <h4 className="text-sm text-gray-800 font-bold">Produk</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 pb-2 hover:bg-gray-50 rounded-lg transition">
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} x Rp {item.price.toLocaleString()}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    Subtotal: Rp {item.totalSubPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pengiriman */}
        {order.shipping && (
          <div className="border-gray-400 shadow-md p-4 rounded-md">
            <h4 className="text-sm text-gray-800 font-bold">Pengiriman</h4>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-700">Ekspedisi: {order.shipping.expeditionName}</p>
              <p className="text-sm text-gray-700">Estimasi: {order.shipping.etd}</p>
              <p className="text-sm text-gray-700">Biaya: Rp {order.shipping.expeditionCost.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Pembayaran */}
        <div className="border-gray-400 shadow-md p-4 rounded-md">
          <h4 className="text-sm text-gray-800 font-bold">Pembayaran</h4>
          <div className="mt-1 space-y-1">
            <p className="text-sm font-semibold text-black">
              Rp {order.paymentAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-3 justify-end">
          {canPay && (
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {paying ? "Memproses..." : "Bayar Sekarang"}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {cancelling ? "Membatalkan..." : "Batalkan Order"}
            </button>
          )}

          {(order.orderStatus === "delivered" || order.orderStatus === "cancelled") && (
            <button
              onClick={handleBuyAgain}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Beli Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
