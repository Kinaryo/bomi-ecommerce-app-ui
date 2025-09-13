"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Trash2,
  Loader2,
  LogOut,
  ChevronRight,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

import ProfileAddress from "./componentsProfile/ProfileAddress";
import ResetPasswordModal from "./componentsProfile/ResetPasswordModal";
import EditProfileModal from "./componentsProfile/EditProfileModal";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  profileUrl: string | null;
  createdAt: string;
}

interface ShippingAddress {
  id: string;
  isPrimary?: boolean;
  addressLine?: string;
  street?: string;
  houseNumber?: string;
  subDistricts?: { name: string };
  districts?: { name: string };
  cities?: { name: string };
  provinces?: { name: string };
  latitude?: number;
  longitude?: number;
}

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // === FETCH PROFILE ===
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/show-profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.status === "success") {
        setProfile(data.data as UserProfile);

        const resAddress = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/shipping-address`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const addressData = await resAddress.json();

        if (addressData.status === "success" && addressData.data.length > 0) {
          const primaryAddress =
            addressData.data.find((addr: ShippingAddress) => addr.isPrimary) ||
            addressData.data[0];
          setShippingAddress(primaryAddress);
        }
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // disable body scroll when modal/sheet open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showProfileSheet || showResetModal || showEditProfileModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showProfileSheet, showResetModal, showEditProfileModal]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setProfile(null);
    window.location.href = "/";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update-profile-image`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.status === "success") {
        setProfile((prev) =>
          prev ? { ...prev, profileUrl: data.data.profileUrl } : prev
        );
      } else {
        Swal.fire("Gagal", data.message || "Gagal update foto profil", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan saat upload foto", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfileImage = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/delete-profile-image`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        setProfile((prev) => (prev ? { ...prev, profileUrl: null } : prev));
      } else {
        Swal.fire("Gagal", data.message || "Gagal menghapus foto profil", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan saat hapus foto", "error");
    }
  };

  const handleSwitchToSeller = async () => {
    const token = localStorage.getItem("token");
    setSwitching(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/switch-profile-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newRole: "seller" }),
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        if (data.data.token) {
          localStorage.setItem("token", data.data.token);
        }
        await fetchProfile();

        await Swal.fire({
          title: "Berhasil",
          html: `
            <p>Anda berhasil menjadi seller!</p>
            <p class="mt-2 text-sm text-gray-600">
              Anda akan diarahkan ke halaman toko, silakan lengkapi data toko.
            </p>
          `,
          icon: "success",
          confirmButtonText: "OK",
        });

        window.location.href = "/seller/store/add-store";
      } else {
        Swal.fire("Gagal", data.message || "Gagal switch role", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan saat switch role", "error");
    } finally {
      setSwitching(false);
    }
  };

  // === UI ===
  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!isLoggedIn) {
    return (
      <motion.div
        className="p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Link
          href="/login"
          className="text-blue-600 hover:underline font-medium"
        >
          Masuk untuk melihat profil
        </Link>
      </motion.div>
    );
  }
  if (!profile) return <p className="text-center mt-20">Profil tidak ditemukan</p>;

  return (
    <div className="flex flex-col items-center justify-center max-w-6xl mt-20 mx-auto border-gray-400 shadow-md">
      <div className="w-full">
        <motion.div
          className="p-6 space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Foto Profil */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              {profile.profileUrl ? (
                <>
                  <motion.img
                    whileTap={{ scale: 0.95 }}
                    src={profile.profileUrl}
                    alt={profile.name}
                    onClick={handleUploadClick}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition"
                  />

                  <div className="absolute -bottom-3 left-0 right-0 flex justify-center gap-6">
                    <button
                      onClick={handleDeleteProfileImage}
                      className="p-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                      title="Hapus Foto"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      onClick={handleUploadClick}
                      disabled={uploading}
                      className="p-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 disabled:opacity-50"
                      title="Update Foto"
                    >
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Camera size={20} />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-white cursor-pointer hover:scale-105 transition"
                    onClick={handleUploadClick}
                  >
                    <User className="w-16 h-16 text-gray-300" />
                  </div>

                  <div className="absolute -bottom-3 left-0 right-0 flex justify-center">
                    <button
                      onClick={handleUploadClick}
                      disabled={uploading}
                      className="p-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 disabled:opacity-50"
                      title="Update Foto"
                    >
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Camera size={20} />
                      )}
                    </button>
                  </div>
                </>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Detail Info */}
          <div className="bg-gray-50 rounded-md border-gray-400 shadow-md p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-lg leading-tight">{profile.name}</p>
                <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
              </div>
              <button
                onClick={() => setShowProfileSheet(true)}
                className="p-2 rounded-full hover:bg-gray-200 transition ml-2"
                aria-label="Opsi profil"
                title="Opsi profil"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Email</span>
                <span className="text-right">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">No HP</span>
                <span className="text-right">{profile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tanggal Bergabung</span>
                <span className="text-right">
                  {new Date(profile.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Alamat */}
          <ProfileAddress shippingAddress={shippingAddress} />

          {/* Role Actions */}
          {profile.role === "customer" && (
            <div className="text-center">
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: "Konfirmasi",
                    text: "Apakah kamu ingin bergabung menjadi seller kami?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Ya",
                    cancelButtonText: "Tidak",
                  });
                  if (result.isConfirmed) handleSwitchToSeller();
                }}
                className="px-6 py-3 bg-yellow-500 text-white rounded-full font-medium shadow hover:bg-yellow-600 transition w-full"
              >
                {switching
                  ? "Memproses..."
                  : "Ingin Mulai Berjualan ? Klik Disini"}
              </button>
            </div>
          )}

          {profile.role === "seller" && (
            <div className="mt-2">
              <Link
                href="/dashboard/seller"
                className="flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-md shadow hover:bg-amber-600 transition w-full"
              >
                Pindah Ke Mode Dashboard Seller
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition w-full"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </motion.div>

        {/* Bottom Sheet Opsi Profil */}
        <AnimatePresence>
          {showProfileSheet && (
            <motion.div
              className="fixed inset-0 z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                onClick={() => setShowProfileSheet(false)}
                className="absolute inset-0 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-label="Tutup"
              />
              <motion.div
                className="fixed left-0 right-0 bottom-0 w-full bg-white rounded-t-2xl pt-4 px-4 pb-[env(safe-area-inset-bottom,1rem)] z-[9999] max-h-[calc(100vh-3.5rem)] overflow-auto"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100) setShowProfileSheet(false);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                <div className="space-y-3 mb-5">
                  <button
                    onClick={() => {
                      setShowProfileSheet(false);
                      setShowEditProfileModal(true);
                    }}
                    className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition"
                  >
                    Edit Profil
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileSheet(false);
                      setShowResetModal(true);
                    }}
                    className="w-full px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Ganti Password
                  </button>

                  <button
                    onClick={() => setShowProfileSheet(false)}
                    className="w-full px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          initialData={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
          }}
          onSuccess={(updated) => {
            setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
        />
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        email={profile.email}
      />
    </div>
  );
}
