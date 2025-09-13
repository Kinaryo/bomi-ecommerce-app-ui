"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import OrderDetailPage from "./order/OrderDetailPage";
import OrderReviewPage from "./order/OrderReviewPage";
import InputResiModal from "./order/InputResiModal";

const STATUS_TABS = [
  "pending_payment",
  "processing_seller",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  processing_seller: "Diproses",
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

// tipe item pada order
interface OrderItem {
  productImage: string;
  productName: string;
  price: number;
  quantity: number;
  totalSubPrice: number;
}

// tipe order
interface Order {
  idOrder: number;
  orderStatus: string;
  airWayBill?: string;
  items?: OrderItem[];
}

export default function OrdersTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("pending_payment");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedReviewOrderId, setSelectedReviewOrderId] = useState<
    number | null
  >(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const showAlert = (
    title: string,
    text: string,
    icon: "success" | "error" | "warning" | "info"
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
    });
  };

  // Fetch orders
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/order`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.status === "success") setOrders(data.data || []);
        else setOrders([]);
      } catch (error) {
        console.error(error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router, token]);

  // Sinkronisasi tab & order dari URL saat reload
  useEffect(() => {
    const statusFromUrl = searchParams.get("status") || "pending_payment";
    const orderIdFromUrl = searchParams.get("orderId");
    const showReview = searchParams.get("showReview") === "true";

    setActiveTab(statusFromUrl);
    setSelectedOrderId(orderIdFromUrl && !showReview ? parseInt(orderIdFromUrl) : null);
    setSelectedReviewOrderId(orderIdFromUrl && showReview ? parseInt(orderIdFromUrl) : null);
  }, [searchParams]);

  // Scroll ke tab aktif
  useEffect(() => {
    const current = tabRefs.current[activeTab];
    if (current) {
      requestAnimationFrame(() => {
        current.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
    }
  }, [activeTab, orders]);

  // Handler
  const handleChangeStatus = (status: string) => {
    setActiveTab(status);
    setSelectedOrderId(null);
    setSelectedReviewOrderId(null);
    router.push(`/seller/store?tab=orders&status=${status}`, { shallow: true });
  };

  const handleSelectOrder = (id: number) => {
    setSelectedOrderId(id);
    setSelectedReviewOrderId(null);
    router.push(`/seller/store?tab=orders&status=${activeTab}&orderId=${id}`, {
      shallow: true,
    });
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setSelectedReviewOrderId(null);
    router.push(`/seller/store?tab=orders&status=${activeTab}`, { shallow: true });
  };

  const handleSelectReview = (orderId: number) => {
    setSelectedReviewOrderId(orderId);
    setSelectedOrderId(null);
    router.push(
      `/seller/store?tab=orders&status=${activeTab}&orderId=${orderId}&showReview=true`,
      { shallow: true }
    );
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.idOrder === updatedOrder.idOrder ? updatedOrder : o))
    );
  };

  const handleResiSaved = (orderId: number, awb: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.idOrder === orderId ? { ...o, airWayBill: awb, orderStatus: "shipped" } : o
      )
    );
  };

  const filteredOrders = orders.filter(
    (order) => order.orderStatus === activeTab
  );

  // UI
  if (loading)
    return (
      <p className="text-center mt-20 text-gray-600 animate-pulse">
        Loading orders...
      </p>
    );

  if (!loading && orders.length === 0)
    return (
      <p className="text-center mt-20 text-gray-500">
        Belum ada order ditemukan
      </p>
    );

  return (
    <div className="p-6 max-w-6xl border border-gray-400 shadow-md rounded-md">
      {/* Status Tabs */}
      <div className="flex overflow-x-auto gap-3 mb-4 no-scrollbar pb-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            ref={(el) => (tabRefs.current[status] = el)}
            onClick={() => handleChangeStatus(status)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === status
                ? "bg-purple-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {STATUS_LABELS[status] ?? status}
          </button>
        ))}
      </div>

      {/* List atau Detail / Review */}
      {selectedReviewOrderId ? (
        // REVIEW PAGE
        <div className="mx-auto">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Kembali ke daftar order</span>
          </button>

          <OrderReviewPage
            token={token}
            idOrder={selectedReviewOrderId.toString()}
            onBack={handleBackToList}
          />
        </div>
      ) : selectedOrderId ? (
        // DETAIL PAGE
        <div className="mx-auto">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Kembali ke daftar order</span>
          </button>

          <OrderDetailPage
            token={token}
            idOrder={selectedOrderId.toString()}
            onBack={handleBackToList}
            onUpdate={handleOrderUpdated}
          />
        </div>
      ) : (
        // ORDER LIST
        <>
          {filteredOrders.length === 0 ? (
            <p className="text-center mt-10 text-gray-500">
              Belum ada order untuk status{" "}
              <strong>{STATUS_LABELS[activeTab]}</strong>
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.idOrder}
                className="bg-gray-50 rounded-md shadow-lg hover:shadow-xl transition p-3 mb-3 space-y-4"
              >
                <div className="p-4 rounded-xl">
                  <div className="flex justify-end">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                    </span>
                  </div>

                  {order.airWayBill && (
                    <h4 className="font-semibold">Resi: {order.airWayBill}</h4>
                  )}

                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 border-b last:border-0 py-3"
                    >
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex flex-col">
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Harga: Rp {(item.price || 0).toLocaleString()}
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {item.quantity} Produk • Rp{" "}
                          {(item.totalSubPrice || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() => handleSelectOrder(order.idOrder)}
                    className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-600 transition"
                  >
                    Lihat Detail
                  </button>

                  {(order.orderStatus === "processing_seller" || order.orderStatus === "shipped") && (
                    <button
                      onClick={() => handleOpenModal(order)}
                      className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-600 transition"
                    >
                      {order.orderStatus === "processing_seller" ? "Input Resi" : "Edit Resi"}
                    </button>
                  )}

                  {order.orderStatus === "delivered" && (
                    <button
                      onClick={() => handleSelectReview(order.idOrder)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-700 transition"
                    >
                      Lihat Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Modal input resi */}
      {showModal && selectedOrder && (
        <InputResiModal
          order={selectedOrder}
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={handleResiSaved}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}
