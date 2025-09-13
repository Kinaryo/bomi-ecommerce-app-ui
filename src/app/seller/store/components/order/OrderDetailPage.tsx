'use client';

import { useEffect, useState } from "react";
import OrderReviewPage from "./OrderReviewPage"; 
import Image from "next/image";

declare global {
  interface Window {
    snap: any;
  }
}

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

interface OrderDetailPageProps {
  token: string | null;
  idOrder: string;
  onBack?: () => void;
  onUpdate?: (order: any) => void;
}

export default function OrderDetailPage({ token, idOrder, onBack, onUpdate }: OrderDetailPageProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [awb, setAwb] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/order/${idOrder}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") setOrder(data.data);
        else setOrder(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [idOrder, token]);

  const handleSubmitAwb = async () => {
    if (!awb.trim()) {
      alert("Nomor resi wajib diisi");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/order/${order.idOrder}/airway-bill`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ airWayBill: awb }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        alert("Nomor resi berhasil disimpan!");
        const updated = { ...order, orderStatus: "shipped", shipping: { ...order.shipping, airWayBill: awb } };
        setOrder(updated);
        setShowModal(false);
        if (onUpdate) onUpdate(updated);
      } else {
        alert(data.message || "Gagal menyimpan resi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan server");
    }
  };

  if (loading)
    return <p className="text-center py-10">Loading...</p>;
  if (!order)
    return <p className="text-center py-10">Order tidak ditemukan</p>;

  return (
    <div className="p-2">
      <div className="bg-white rounded-2xl shadow-md p-4 space-y-6">

        {/* Status & Toko */}
        <div className="space-y-2">
          <div className="flex justify-end">
            <span className={`px-3 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
            {order.shipping?.airWayBill && (
              <p className="text-sm text-gray-700">No Resi: {order.shipping.airWayBill}</p>
            )}
          </div>
        </div>

        {/* Informasi Order */}
        <div className="border border-gray-200 shadow-sm p-4 rounded-md space-y-2">
          <h4 className="text-sm text-gray-800 font-bold">Informasi Order</h4>
          <div className="pt-1 space-y-1 text-sm text-gray-700">
            <p>Catatan: {order.noteCustomer || "-"}</p>
            <p>Informasi: {order.informationOrder || "-"}</p>
            <p>Total Produk: {order.totalProduct}</p>
            <p>Total Qty Produk: {order.totalQuantity}</p>
          </div>
        </div>

        {/* Produk */}
        <div className="border border-gray-200 shadow-sm p-4 rounded-md">
          <h4 className="text-sm text-gray-800 font-bold">Produk</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition">
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1 w-full">
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} x Rp {Number(item.price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    Subtotal: Rp {Number(item.totalSubPrice).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pengiriman */}
        {order.shipping && (
          <div className="border border-gray-200 shadow-sm p-4 rounded-md">
            <h4 className="text-sm text-gray-800 font-bold">Pengiriman</h4>
            <div className="pt-1 space-y-1 text-sm text-gray-700">
              <p>Ekspedisi: {order.shipping.expeditionName}</p>
              <p>Estimasi: {order.shipping.etd}</p>
              <p>Biaya: Rp {Number(order.shipping.expeditionCost).toLocaleString("id-ID")}</p>
            </div>
          </div>
        )}

        {/* Pembayaran */}
        <div className="border border-gray-200 shadow-sm p-4 rounded-md">
          <h4 className="text-sm text-gray-800 font-bold">Pembayaran</h4>
          <div className="pt-1">
            <p className="text-sm font-semibold text-black">
              Rp {Number(order.paymentAmount).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-3 justify-end">
          {order.orderStatus === "processing_seller" && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex-1 sm:flex-none text-center"
            >
              Input Resi
            </button>
          )}
        </div>
      </div>

      {/* Modal Input Resi */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Input Nomor Resi</h2>
            <input
              type="text"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              placeholder="Masukkan nomor resi"
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitAwb}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 Komponen Review */}
      {order.orderStatus === "delivered" && (
        <OrderReviewPage token={token} idOrder={idOrder} />
      )}
    </div>
  );
}
