"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

// Lazy-load peta
const ProfileMap = dynamic(() => import("./ProfileMap"), { ssr: false });

// Tipe alamat pengiriman (bisa disesuaikan dengan API)
interface ShippingAddress {
  addressLine?: string;
  street?: string;
  houseNumber?: string;
  subDistricts?: { name?: string };
  districts?: { name?: string };
  cities?: { name?: string };
  provinces?: { name?: string };
  latitude?: number | string;
  longitude?: number | string;
}

export default function ProfileAddress({
  shippingAddress,
}: {
  shippingAddress?: ShippingAddress | null;
}) {
  const [showSheet, setShowSheet] = useState(false);

  // Disable body scroll when sheet open
  useEffect(() => {
    if (showSheet) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showSheet]);

  if (!shippingAddress) {
    return (
      <div className="bg-gray-50 rounded-md border-gray-400 shadow-md p-4 flex flex-col items-center justify-center">
        <p className="text-center">Belum ada alamat utama</p>
        <Link
          href="/profile/address/add-shipping-address"
          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Tambah Alamat
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-100 rounded-xl p-4 relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm mb-2">Alamat Pengiriman</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {[
                shippingAddress.addressLine,
                shippingAddress.street,
                shippingAddress.subDistricts?.name,
                shippingAddress.districts?.name,
                shippingAddress.cities?.name,
                shippingAddress.provinces?.name,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          {/* Tombol > */}
          <button
            onClick={() => setShowSheet(true)}
            className="p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Buka alamat"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {shippingAddress.latitude && shippingAddress.longitude && (
          <div className="h-48 mt-3 rounded-lg overflow-hidden border">
            <ProfileMap
              latitude={shippingAddress.latitude}
              longitude={shippingAddress.longitude}
              street={shippingAddress.street}
              houseNumber={shippingAddress.houseNumber}
            />
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            className="fixed inset-0 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* overlay */}
            <motion.button
              onClick={() => setShowSheet(false)}
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Tutup"
            />

            {/* panel */}
            <motion.div
              className={
                "fixed left-0 right-0 bottom-0 w-full bg-white rounded-t-2xl " +
                "pt-4 px-4 pb-[env(safe-area-inset-bottom,1rem)] z-[9999] " +
                "max-h-[calc(100vh-3.5rem)] overflow-auto"
              }
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setShowSheet(false);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              <div className="space-y-3 mb-5">
                <Link
                  href="/profile/address/edit-shipping-address"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition"
                >
                  Edit Alamat
                </Link>
                <button
                  onClick={() => setShowSheet(false)}
                  className="w-full px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
