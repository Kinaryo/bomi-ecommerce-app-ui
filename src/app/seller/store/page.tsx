"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import StoreTab from "./components/StoreTab";
import OrdersTab from "./components/OrdersTab";
import ProductsTab from "./components/ProductsTab";

const STORE_TABS: Array<"store" | "products" | "orders"> = ["store", "products", "orders"];
const TAB_LABELS: Record<"store" | "products" | "orders", string> = {
  store: "Store",
  products: "Product Saya",
  orders: "Orders Customer Saya",
};

export default function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = (searchParams.get("tab") as "store" | "products" | "orders") || "store";
  const [activeTab, setActiveTab] = useState<"store" | "products" | "orders">(tabFromUrl);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const localToken = localStorage.getItem("token");
    setToken(localToken);
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login untuk mengakses halaman store.",
        confirmButtonText: "Login",
      }).then(() => {
        router.push("/login");
      });
    }
  }, [hydrated, token, router]);

  // sinkronkan tab dengan query string
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // scroll ke tab aktif
  useEffect(() => {
    const current = tabRefs.current[activeTab];
    if (current) current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  const handleChangeTab = (tab: "store" | "products" | "orders") => {
    setActiveTab(tab);
    router.push(`/seller/store?tab=${tab}`);
  };

  if (!hydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Memeriksa login...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 mt-20 max-w-6xl mx-auto">
      <h1 className="flex items-center justify-center text-3xl font-extrabold text-gray-800 mb-8">
        Toko
      </h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-3 mb-2 no-scrollbar pb-2">
        {STORE_TABS.map((tab) => (
          <button
            key={tab}
            ref={(el) => (tabRefs.current[tab] = el)}
            onClick={() => handleChangeTab(tab)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
        {/* >>> Tombol Bank Account dihapus di sini <<< */}
      </div>

      {/* Content */}
      <div>
        {activeTab === "store" && <StoreTab token={token} />}
        {activeTab === "products" && <ProductsTab token={token} />}
        {activeTab === "orders" && <OrdersTab token={token} />}
      </div>
    </div>
  );
}
