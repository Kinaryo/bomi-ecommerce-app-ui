"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";

type ResetStep = "request" | "otp" | "newpass" | null;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    email?: string;
}

export default function ResetPasswordModal({ isOpen, onClose, email }: Props) {
    const [step, setStep] = useState<ResetStep>(null);
    const [resetEmail, setResetEmail] = useState(email || "");
    const [otp, setOtp] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    // kalau modal dibuka dengan email dari parent
    useEffect(() => {
        if (isOpen) {
            if (email) {
                setResetEmail(email);
                handleSendEmail(email); // langsung kirim OTP
            } else {
                setStep("request"); // kalau tidak ada email → step request
            }
        }
    }, [isOpen, email]);

    const handleSendEmail = async (targetEmail: string) => {
        Swal.fire({
            title: "Mengirim OTP...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: targetEmail }),
            });
            const data = await res.json();
            Swal.close();

            if (data.status === "success") {
                Swal.fire("Berhasil", data.message, "success");
                setStep("otp");
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        } catch {
            Swal.close();
            Swal.fire("Error", "Server tidak merespon", "error");
        }
    };

    const handleVerifyOtp = async () => {
        Swal.fire({
            title: "Memverifikasi OTP...",
            text: "Harap tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, otp }),
            });
            const data = await res.json();
            Swal.close();

            if (data.status === "success") {
                Swal.fire("OTP Valid", data.message, "success");
                setStep("newpass");
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        } catch {
            Swal.close();
            Swal.fire("Error", "Server tidak merespon", "error");
        }
    };

    const handleResetPassword = async () => {
        if (newPass !== confirmPass) {
            Swal.fire("Error", "Password tidak sama", "error");
            return;
        }

        Swal.fire({
            title: "Menyimpan password baru...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    otp,
                    newPassword: newPass,
                    confirmPassword: confirmPass,
                }),
            });
            const data = await res.json();
            Swal.close();

            if (data.status === "success") {
                Swal.fire("Berhasil", "Password berhasil direset", "success");
                onClose();
                setStep(null);
                setOtp("");
                setNewPass("");
                setConfirmPass("");
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        } catch {
            Swal.close();
            Swal.fire("Error", "Server tidak merespon", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[2000]">
            <div className="bg-white rounded-xl shadow-lg p-6 w-80 space-y-4 relative">
                <button
                    className="absolute top-2 right-2 text-red-500"
                    onClick={onClose}
                >
                    <X />
                </button>

                {/* Step request OTP */}
                {step === "request" && (
                    <>
                        <h2 className="text-lg font-bold">Reset Password</h2>
                        <p className="text-xs text-gray-500 mb-2">
                            Masukkan email untuk menerima kode OTP
                        </p>
                        <input
                            type="email"
                            placeholder="Email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <button
                            onClick={() => handleSendEmail(resetEmail)}
                            disabled={!resetEmail}
                            className="w-full py-2 bg-blue-500 text-white rounded"
                        >
                            Kirim OTP
                        </button>
                    </>
                )}

                {/* Step OTP */}
                {step === "otp" && (
                    <>
                        <h2 className="text-lg font-bold">Verifikasi OTP</h2>
                        <p className="text-xs text-gray-500 mb-2">
                            Kode OTP sudah dikirim ke email anda
                        </p>
                        <input
                            type="text"
                            placeholder="Masukkan OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <button
                            onClick={handleVerifyOtp}
                            className="w-full py-2 bg-green-500 text-white rounded"
                        >
                            Verifikasi
                        </button>
                    </>
                )}

                {/* Step new password */}
                {step === "newpass" && (
                    <>
                        <h2 className="text-lg font-bold">Password Baru</h2>
                        <input
                            type="password"
                            placeholder="Password Baru"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <input
                            type="password"
                            placeholder="Konfirmasi Password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <button
                            onClick={handleResetPassword}
                            className="w-full py-2 bg-blue-600 text-white rounded"
                        >
                            Simpan Password
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
