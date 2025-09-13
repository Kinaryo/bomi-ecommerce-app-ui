"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MapPinHouse,
  Store,
  ChevronDown,
  ChevronUp,
  Truck,
  StickyNote,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CheckoutPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemsParam =
    searchParams.get("items") || searchParams.get("idCartItem");
  const cartItemIds = itemsParam?.split(",").map(Number) || [];

  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState(
    "Memproses data checkout..."
  );
  const [selectedShippingCost, setSelectedShippingCost] = useState<number>(0);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [showShippingOptions, setShowShippingOptions] = useState(false);
  const [noteCustomer, setNoteCustomer] = useState<string>("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const showAlert = (
    title: string,
    text: string,
    icon: "success" | "error" | "warning" | "info",
    callback?: () => void
  ) => {
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
        confirmButton:
          "px-4 py-1.5 swal2-confirmButton-custom rounded-sm bg-blue-600 text-white font-medium hover:bg-blue-700 transition",
      },
      buttonsStyling: false,
    }).then(() => {
      if (callback) callback();
    });
  };

  const showLoading = (message: string) => {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      backdrop: `rgba(0,0,0,0.4)`,
      showConfirmButton: false,
      width: "400px",
      customClass: {
        popup: "rounded-lg text-xs",
        title: "swal2-title-custom font-medium text-gray-700",
      },
    });
  };

  const closeLoading = () => Swal.close();

  const loadSnapScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById("NEXT_PUBLIC_MIDTRANS-script")) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = `${process.env.NEXT_PUBLIC_MIDTRANS_URL}/snap/snap.js`;
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
      );
      script.id = "NEXT_PUBLIC_MIDTRANS-script";
      script.onload = () => resolve(true);
      script.onerror = () => reject("Gagal load Snap JS");
      document.body.appendChild(script);
    });
  };

const fetchCheckout = async () => {
  if (!token) {
    showAlert("Belum Login", "Silakan login terlebih dahulu.", "warning", () =>
      router.push("/login")
    );
    return;
  }

  showLoading("Mengambil Data Checkout...");

  try {
    const payload = {
      cartItems: cartItemIds.map((id) => ({ idCartItem: id })),
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    closeLoading();

    // ✅ Cek hanya apakah alamat pengiriman benar-benar ada
    const hasShippingAddress =
      data?.shippingAddress?.addressCustomer?.trim().length > 0;

    if (!hasShippingAddress) {
      showAlert(
        "Alamat Pengiriman Kosong",
        "Silakan tambahkan alamat pengiriman terlebih dahulu.",
        "warning",
        () => router.push("/profile/address/add-shipping-address")
      );
      return;
    }

    if (!res.ok || data.status !== "success") {
      showAlert("Checkout Gagal", data.message || "Checkout gagal", "error");
      return;
    }

    setCheckoutData(data);
  } catch (err: any) {
    closeLoading();
    console.error(err);
    showAlert("Error", err.message || "Gagal fetch checkout", "error");
  }
};



  useEffect(() => {
    if (cartItemIds.length > 0) fetchCheckout();
    else {
      showAlert(
        "Tidak ada produk",
        "Tidak ada produk untuk checkout.",
        "warning"
      );
    }
  }, []);

  const allShippingOptions =
    checkoutData?.ongkir?.flatMap((o: any) => {
      if (o?.data?.data) {
        return o.data.data.map((service: any) => ({
          ...service,
          courier: o.courier,
        }));
      }
      return [];
    }) || [];

  const totalFinal = checkoutData
    ? checkoutData.payment.totalAllPriceFinal + (selectedShippingCost || 0)
    : 0;

  const handlePayment = async () => {
    if (!selectedCourier) {
      showAlert(
        "Kurir Belum Dipilih",
        "Silakan pilih pengiriman terlebih dahulu.",
        "warning"
      );
      return;
    }

    showLoading("Menyiapkan pembayaran...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/checkout/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cartItems: checkoutData.products.map((p: any) => ({
              idCartItem: p.idCartItem,
              quantity: p.quantity,
            })),
            courier: selectedCourier,
            noteCustomer: noteCustomer.trim() || null,
          }),
        }
      );

      const data = await res.json();
      closeLoading();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "Gagal membuat order");
      }

      await loadSnapScript();

      if (window.snap) {
        showLoading("Membuka Popup Pembayaran...");
        window.snap.pay(data.paymentToken, {
          onSuccess: () => {
            closeLoading();
            showAlert("Sukses", "Pembayaran berhasil!", "success", () =>
              (window.location.href = "/order")
            );
          },
          onPending: () => {
            closeLoading();
            showAlert(
              "Pending",
              "Pembayaran menunggu konfirmasi.",
              "info",
              () => (window.location.href = "/order")
            );
          },
          onError: () => {
            closeLoading();
            showAlert("Error", "Pembayaran gagal.", "error", () =>
              (window.location.href = "/order")
            );
          },
          onClose: () => {
            closeLoading();
            showAlert(
              "Dibatalkan",
              "User menutup popup pembayaran.",
              "warning",
              () => (window.location.href = "/order")
            );
          },
        });
      }
    } catch (err: any) {
      closeLoading();
      showAlert("Error", err.message, "error");
    }
  };

  if (!checkoutData) return null;

  const { products, payment, shippingAddress, storeName, shortAddressStore } =
    checkoutData;

  return (
    <div className="mx-auto p-8 mt-20 space-y-6 pb-28 border-gray-400">
      <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        Checkout
      </h1>

      {/* Alamat Pengiriman */}
      <div className="bg-white shadow-md rounded-2xl p-5 border-gray-200">
        <h2 className="font-semibold text-lg pb-1 flex items-center gap-2">
          <MapPinHouse /> Alamat Pengiriman
        </h2>
        <div className="px-8">
          <p className="text-gray-600 text-sm leading-snug">
            {shippingAddress?.addressCustomer}
          </p>
        </div>
      </div>

      {/* Produk */}
      <div className="bg-white shadow-md rounded-2xl p-5 border-gray-100">
        <div>
          <h2 className="font-semibold text-lg pb-1 flex items-center gap-2">
            <Store /> {storeName}
          </h2>
          <div className="px-8">
            <p className="text-gray-600 text-sm leading-snug">
              {shortAddressStore}
            </p>
          </div>
        </div>
        <div className="px-8 pt-2 space-y-2">
          {products.map((p: any) => (
            <div
              key={p.idProduct}
              className="flex items-center py-3 border-gray-400 shadow-md rounded-b-sm p-4"
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-16 h-16 rounded-lg object-cover mr-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">x{p.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-black">
                Rp{p.totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Catatan Customer */}
      <div className="bg-white shadow-md rounded-2xl p-5 border-gray-200">
        <h2 className="font-semibold text-lg pb-2 flex items-center gap-2">
          <StickyNote /> Catatan untuk Penjual
        </h2>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400"
          placeholder="Tulis catatan untuk penjual (opsional)..."
          rows={3}
          value={noteCustomer}
          onChange={(e) => setNoteCustomer(e.target.value)}
        />
      </div>

      {/* Opsi Kurir */}
      <div className="bg-white shadow-md rounded-2xl p-5 border-gray-200">
        <button
          onClick={() => setShowShippingOptions(!showShippingOptions)}
          className="w-full flex justify-between items-center font-semibold text-lg border-b pb-2"
        >
          <div className="">
            <h2 className="font-semibold text-lg pb-1 flex items-center gap-2">
              <Truck /> Pengiriman
            </h2>
          </div>
          {showShippingOptions ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {selectedCourier && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-gray-700">
              Kurir dipilih:{" "}
              <span className="font-semibold text-black">{selectedCourier.name}</span>
            </p>
            <p className="text-xs text-gray-500">Estimasi: {selectedCourier.etd}</p>
            <p className="text-sm font-semibold text-gray-800">
              Rp{selectedCourier.cost.toLocaleString("id-ID")}
            </p>
          </div>
        )}

        {showShippingOptions && (
          <div className="space-y-2 mt-3">
            {allShippingOptions.length === 0 ? (
              <p className="text-red-500 text-sm">
                Tidak ada opsi ongkir tersedia. Coba lagi nanti.
              </p>
            ) : (
              allShippingOptions.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex justify-between items-center py-2 px-3 rounded-xl border cursor-pointer ${
                    selectedCourier?.cost === opt.cost
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  } ${!opt.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div>
                    <p className="font-medium text-sm">{opt.name}</p>
                    <p className="text-xs text-gray-500">{opt.etd}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm text-gray-800">
                      Rp{opt.cost.toLocaleString("id-ID")}
                    </p>
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.cost}
                      disabled={!opt.isActive}
                      checked={selectedCourier?.cost === opt.cost}
                      onChange={() => {
                        setSelectedShippingCost(opt.cost);
                        setSelectedCourier(opt);
                        setShowShippingOptions(false);
                      }}
                    />
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Rincian Biaya */}
      <div className="bg-white shadow-md rounded-2xl p-5 border-gray-200 space-y-2">
        <h2 className="font-semibold text-lg border-b pb-2">Rincian Pembayaran</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal Produk</span>
          <span>Rp{payment.totalPriceProduct.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Diskon</span>
          <span className="text-green-600">
            - Rp{payment.totalDiscount.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Pajak</span>
          <span>Rp{payment.totalTax.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Service</span>
          <span>Rp{payment.service.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Ongkir</span>
          <span>
            {selectedShippingCost > 0
              ? `Rp${selectedShippingCost.toLocaleString("id-ID")}`
              : "-"}
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg text-blue-600 mt-2 pt-2 border-t">
          <span>Total Pembayaran</span>
          <span>Rp{totalFinal.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Total Pembayaran</p>
          <p className="text-xl font-bold text-blue-600">
            Rp{totalFinal.toLocaleString("id-ID")}
          </p>
        </div>
        <button
          onClick={handlePayment}
          className="px-6 py-3 rounded-xl font-semibold transition bg-blue-300 text-white hover:bg-blue-600"
        >
          Buat Pesanan
        </button>
      </div>
    </div>
  );
}
