"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Password criteria
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[\W_]/.test(newPassword);
  const minLength = newPassword.length >= 8;
  const isPasswordValid =
    hasLowerCase && hasUpperCase && hasNumber && hasSymbol && minLength;

  // Step 1: Kirim OTP
  const handleSendOTP = async () => {
    if (!email) {
      Swal.fire({ icon: "warning", text: "Masukkan email terlebih dahulu" });
      return;
    }
    Swal.fire({ title: "Mengirim OTP...", didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      Swal.close();
      if (res.ok) {
        Swal.fire({ icon: "success", text: data.message });
        setStep(2);
      } else {
        Swal.fire({ icon: "error", text: data.message });
      }
    } catch {
      Swal.close();
      Swal.fire({ icon: "error", text: "Terjadi kesalahan jaringan" });
    }
  };

  // Step 2: Verifikasi OTP
  const handleVerifyOTP = async () => {
    if (!otp) {
      Swal.fire({ icon: "warning", text: "Masukkan OTP terlebih dahulu" });
      return;
    }
    Swal.fire({ title: "Memverifikasi OTP...", didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp }),
        }
      );
      const data = await res.json();
      Swal.close();
      if (res.ok) {
        Swal.fire({ icon: "success", text: data.message });
        setStep(3);
      } else {
        Swal.fire({ icon: "error", text: data.message });
      }
    } catch {
      Swal.close();
      Swal.fire({ icon: "error", text: "Terjadi kesalahan jaringan" });
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        text: "Masukkan password dan konfirmasi password",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: "error", text: "Password dan konfirmasi tidak cocok" });
      return;
    }
    if (!isPasswordValid) {
      Swal.fire({ icon: "error", text: "Password tidak memenuhi kriteria" });
      return;
    }

    Swal.fire({ title: "Memproses...", didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp, newPassword }),
        }
      );
      const data = await res.json();
      Swal.close();
      if (res.ok) {
        Swal.fire({ icon: "success", text: data.message });
        router.push("/login");
      } else {
        Swal.fire({ icon: "error", text: data.message });
      }
    } catch {
      Swal.close();
      Swal.fire({ icon: "error", text: "Terjadi kesalahan jaringan" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Link href="/">
            <Image
              src="/rootImage/icon.png"
              alt="Bomi E-commerce"
              width={80}
              height={80}
              className="cursor-pointer border-gray-800 shadow-sm rounded-md bg-gray-100"
            />
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Lupa Password</h2>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSendOTP}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              Kirim OTP
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Masukkan OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              Verifikasi OTP
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4 relative">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password Baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              />
              <div
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </div>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi Password Baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              />
              <div
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </div>
            </div>

            {/* Password Tip */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2 text-sm">
              <p className="font-semibold mb-1">Password harus memenuhi:</p>
              <ul className="space-y-1">
                <li className="flex items-center">
                  {hasLowerCase ? (
                    <CheckCircle className="text-green-600 mr-1" />
                  ) : (
                    <XCircle className="text-gray-400 mr-1" />
                  )}{" "}
                  Huruf kecil
                </li>
                <li className="flex items-center">
                  {hasUpperCase ? (
                    <CheckCircle className="text-green-600 mr-1" />
                  ) : (
                    <XCircle className="text-gray-400 mr-1" />
                  )}{" "}
                  Huruf besar
                </li>
                <li className="flex items-center">
                  {hasNumber ? (
                    <CheckCircle className="text-green-600 mr-1" />
                  ) : (
                    <XCircle className="text-gray-400 mr-1" />
                  )}{" "}
                  Angka
                </li>
                <li className="flex items-center">
                  {hasSymbol ? (
                    <CheckCircle className="text-green-600 mr-1" />
                  ) : (
                    <XCircle className="text-gray-400 mr-1" />
                  )}{" "}
                  Simbol
                </li>
                <li className="flex items-center">
                  {minLength ? (
                    <CheckCircle className="text-green-600 mr-1" />
                  ) : (
                    <XCircle className="text-gray-400 mr-1" />
                  )}{" "}
                  Minimal 8 karakter
                </li>
              </ul>
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              Reset Password
            </button>
          </div>
        )}

        <div className="flex flex-col mt-4 space-y-1 text-sm text-gray-700">
          <p>
            Kembali ke halaman{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
