"use client";

import { useState, useEffect } from "react";

interface Order {
  idOrder: number;
  airWayBill?: string;
  orderStatus: string;
  // tambah properti lain jika ada di API
}

type AlertIcon = "success" | "error" | "warning" | "info" | "question";

interface InputResiModalProps {
  order: Order;
  token: string | null;
  onClose: () => void;
  onSaved: (orderId: number, awb: string) => void;
  showAlert: (title: string, text: string, icon: AlertIcon) => void;
}

export default function InputResiModal({
  order,
  token,
  onClose,
  onSaved,
  showAlert,
}: InputResiModalProps) {
  const [awb, setAwb] = useState("");

  useEffect(() => {
    // Prefill jika sudah ada resi
    if (order.airWayBill) {
      setAwb(order.airWayBill);
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!awb.trim()) {
      showAlert("Perhatian", "Nomor resi wajib diisi", "warning");
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
        showAlert("Berhasil", "Nomor resi berhasil disimpan!", "success");
        onSaved(order.idOrder, awb);
        onClose();
      } else {
        showAlert("Gagal", data.message || "Gagal menyimpan resi", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Terjadi kesalahan server", "error");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white/70 rounded-xl shadow-lg p-6 w-full max-w-md backdrop-blur-md">
        <h2 className="text-lg font-bold mb-4">
          {order.orderStatus === "shipped" ? "Edit Nomor Resi" : "Input Nomor Resi"}
        </h2>
        <input
          type="text"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          placeholder="Masukkan nomor resi"
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring focus:ring-blue-200"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
