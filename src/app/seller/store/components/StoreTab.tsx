"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Trash2, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import Image from "next/image";

import EditStore from "./store/EditStore"; // komponen edit toko
const ProfileMap = dynamic(() => import("./store/Map"), { ssr: false });

interface StoreTabProps {
  token: string | null;
}

export default function StoreTab({ token }: StoreTabProps) {
  const [store, setStore] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [originAddress, setOriginAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [editing, setEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch store
  useEffect(() => {
    if (!token) return setLoadingStore(false);
    const fetchStore = async () => {
      setLoadingStore(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.status?.toLowerCase() === "success" && data.data) setStore(data.data);
        else setStore(null);
      } catch {
        Swal.fire("Error", "Gagal mengambil data store", "error");
        setStore(null);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStore();
  }, [token]);

  // Fetch origin address
  useEffect(() => {
    if (!token) return setLoadingAddress(false);
    const fetchOriginAddress = async () => {
      setLoadingAddress(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/origin-address`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.status?.toLowerCase() === "success" && data.data?.length > 0) {
          const primaryAddress = data.data.find((addr: any) => addr.isPrimary) || data.data[0];
          setOriginAddress(primaryAddress);
        } else setOriginAddress(null);
      } catch {
        setOriginAddress(null);
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchOriginAddress();
  }, [token]);

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    setUpdatingImage(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/update-store-image`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setStore((prev: any) => ({ ...prev, imageUrl: data.data.imageUrl }));
        Swal.fire("Berhasil", "Gambar toko berhasil diperbarui", "success");
      } else {
        Swal.fire("Gagal", data.message || "Gagal memperbarui gambar", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan saat memperbarui gambar", "error");
    } finally {
      setUpdatingImage(false);
    }
  };

  // Handle delete image
  const handleDeleteImage = async () => {
    const confirm = await Swal.fire({
      title: "Hapus gambar?",
      text: "Gambar toko akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setUpdatingImage(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/delete-store-image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setStore((prev: any) => ({ ...prev, imageUrl: null }));
        Swal.fire("Terhapus!", "Gambar toko berhasil dihapus", "success");
      } else {
        Swal.fire("Gagal", data.message || "Gagal menghapus gambar", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan saat menghapus gambar", "error");
    } finally {
      setUpdatingImage(false);
    }
  };

  // akses langsung ke Rekening Bank tanpa verifikasi password
  const handleBankAccess = () => {
    if (!token) {
      Swal.fire("Oops", "Kamu harus login terlebih dahulu", "warning");
      return;
    }
    window.location.href = "/seller/store/bank-account";
  };

  if (loadingStore || loadingAddress) {
    return (
      <div className="text-center py-10">
        <Loader2 className="animate-spin mx-auto mb-2" size={28} />
        <p className="text-gray-600">Memuat data toko dan alamat pengirim...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-700">Kamu belum memiliki toko.</p>
        <button
          onClick={() => Swal.fire("Fitur Tambah Toko belum dibuat")}
          className="mt-3 px-5 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 shadow-md"
        >
          Tambahkan Toko
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <EditStore
        token={token}
        store={store}
        originAddress={originAddress}
        onCancel={() => setEditing(false)}
        onSave={(updatedStore, updatedAddress) => {
          setStore(updatedStore);
          setOriginAddress(updatedAddress);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
      {/* Foto toko */}
      <div className="space-y-4 bg-gray-50 p-4 rounded shadow">
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-gray-100">
            {store.imageUrl ? (
              <Image
                src={store.imageUrl}
                alt={store.storeName}
                className={`w-full h-full object-cover ${updatingImage ? "opacity-50" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada gambar toko
              </div>
            )}
            {updatingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 left-3 bg-white p-2 rounded-full shadow hover:bg-gray-100"
              disabled={updatingImage}
            >
              <Camera size={20} />
            </button>
            {store.imageUrl && (
              <button
                onClick={handleDeleteImage}
                className="absolute bottom-3 right-3 bg-red-500 p-2 rounded-full shadow hover:bg-red-600 text-white"
                disabled={updatingImage}
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageChange}
          disabled={updatingImage}
        />

        {/* Info Toko */}
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold text-gray-800">{store.storeName}</p>
          <p className="text-gray-600">{store.description || "Tidak ada deskripsi toko"}</p>
        </div>

        {/* Alamat Pengirim */}
        {originAddress ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded shadow">
            <h3 className="font-semibold text-gray-800">Alamat Pengirim</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {[
                originAddress.addressLine,
                `${originAddress.street} No. ${originAddress.houseNumber}`,
                `RT ${originAddress.rt}/RW ${originAddress.rw}`,
                originAddress.subDistricts?.name,
                originAddress.districts?.name,
                originAddress.cities?.name,
                originAddress.provinces?.name,
                originAddress.subDistricts?.zipCode,
                originAddress.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {originAddress.latitude && originAddress.longitude && (
              <div className="h-60 rounded-lg overflow-hidden border">
                <ProfileMap
                  latitude={originAddress.latitude}
                  longitude={originAddress.longitude}
                  street={originAddress.street}
                  houseNumber={originAddress.houseNumber}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 italic mb-3">Belum ada alamat pengirim</p>
          </div>
        )}
        <div className="text-right">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-600 shadow"
          >
            Edit Toko
          </button>
        </div>
      </div>

      {/* Akses ke Rekening Bank */}
      <div
        onClick={handleBankAccess}
        className="flex items-center justify-between bg-gray-50 p-4 rounded shadow cursor-pointer hover:bg-gray-100"
      >
        <div>
          <p className="font-semibold text-gray-800">Rekening Bank</p>
          <p className="text-sm text-gray-500">Kelola rekening penerima pembayaran</p>
        </div>
        <ChevronRight className="text-gray-400" />
      </div>
    </div>
  );
}
