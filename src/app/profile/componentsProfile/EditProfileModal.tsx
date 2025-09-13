"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    initialData: { name?: string; email?: string; phone?: string };
    onSuccess?: (updated: any) => void;
};

export default function EditProfileModal({
    isOpen,
    onClose,
    initialData,
    onSuccess,
}: Props) {
    const [name, setName] = useState(initialData?.name || "");
    const [email, setEmail] = useState(initialData?.email || "");
    const [phone, setPhone] = useState(initialData?.phone || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setEmail(initialData?.email || "");
            setPhone(initialData?.phone || "");
        }
    }, [isOpen, initialData]);

    const validate = () => {
        if (!name.trim()) return "Nama wajib diisi";
        if (!email.trim()) return "Email wajib diisi";
        // simple email regex
        const re = /^\S+@\S+\.\S+$/;
        if (!re.test(email)) return "Email tidak valid";
        if (!phone.trim()) return "Phone wajib diisi";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            Swal.fire("Validasi", err, "warning");
            return;
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            Swal.fire("Error", "Token tidak ditemukan. Silakan login ulang.", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Gagal update profil");
            }

            Swal.fire("Berhasil", "Profil berhasil diperbarui", "success");
            if (onSuccess) onSuccess(data.data || { name, email, phone });
            onClose();
        } catch (err: any) {
            console.error(err);
            Swal.fire("Error", err.message || "Terjadi kesalahan", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.button
                        className="absolute inset-0 bg-black/40"
                        onClick={onClose}
                        aria-label="Tutup modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.form
                        onSubmit={handleSubmit}
                        className={
                            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-xl bg-white rounded-2xl p-5 shadow-lg z-[10000]"
                        }
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-3">Edit Profil</h3>

                        <label className="block text-sm mb-2">
                            <span className="font-medium">Nama</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50 p-2"
                                placeholder="Nama lengkap"
                            />
                        </label>

                        <label className="block text-sm mb-2">
                            <span className="font-medium">Email</span>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50 p-2"
                                placeholder="email@contoh.com"
                            />
                        </label>

                        <label className="block text-sm mb-4">
                            <span className="font-medium">Phone</span>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50 p-2"
                                placeholder="0812xxxx"
                            />
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" /> Menyimpan...
                                    </span>
                                ) : (
                                    "Simpan"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Batal
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
