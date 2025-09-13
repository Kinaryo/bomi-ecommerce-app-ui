"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPasswordTip, setShowPasswordTip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // cek tiap kriteria password
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const minLength = password.length >= 8;

  const validatePassword = () => hasLowerCase && hasUpperCase && hasNumber && hasSymbol && minLength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Silakan pilih jenis akun terlebih dahulu!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (!validatePassword()) {
      Swal.fire({
        icon: "warning",
        title: "Password Lemah",
        text: "Pastikan semua kriteria password terpenuhi!",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register/post`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        if (role === "customer") {
          Swal.fire({
            icon: "success",
            title: "Selamat, Anda berhasil mendaftar!",
            text: "Anda akan diarahkan ke halaman utama.",
            showConfirmButton: false,
            timer: 3000,
          }).then(() => router.push("/"));
        } else if (role === "seller") {
          Swal.fire({
            icon: "info",
            title: "Akun Penjual Berhasil Dibuat",
            text: "Silahkan siapkan data toko, rekening, dan produk Anda.",
            showCancelButton: true,
            confirmButtonText: "Siapkan sekarang",
            cancelButtonText: "Nanti saja",
          }).then((result) => {
            if (result.isConfirmed) {
              router.push("/seller/store/add-store");
            } else {
              router.push("/");
            }
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Pendaftaran gagal",
          text: data.message || "Terjadi kesalahan, silakan coba lagi.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Tidak dapat terhubung ke server, silakan coba lagi nanti.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm relative">
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
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Register</h2>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="text"
            placeholder="Nomor HP"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordTip(true)}
              onBlur={() => setShowPasswordTip(false)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            {/* Password Tip Modal */}
            {showPasswordTip && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
                <h3 className="font-semibold mb-2 text-gray-800">Password harus:</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center">
                    {hasLowerCase ? <CheckCircle className="text-green-600 mr-1" /> : <XCircle className="text-gray-400 mr-1" />} Huruf kecil
                  </li>
                  <li className="flex items-center">
                    {hasUpperCase ? <CheckCircle className="text-green-600 mr-1" /> : <XCircle className="text-gray-400 mr-1" />} Huruf besar
                  </li>
                  <li className="flex items-center">
                    {hasNumber ? <CheckCircle className="text-green-600 mr-1" /> : <XCircle className="text-gray-400 mr-1" />} Angka
                  </li>
                  <li className="flex items-center">
                    {hasSymbol ? <CheckCircle className="text-green-600 mr-1" /> : <XCircle className="text-gray-400 mr-1" />} Simbol (@$!%*?&)
                  </li>
                  <li className="flex items-center">
                    {minLength ? <CheckCircle className="text-green-600 mr-1" /> : <XCircle className="text-gray-400 mr-1" />} Minimal 8 karakter
                  </li>
                </ul>
              </div>
            )}
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="" disabled>Pilih Jenis Akun</option>
            <option value="customer">Pembeli</option>
            <option value="seller">Penjual</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold transition duration-200"
          >
            Register
          </button>
        </form>

        <div className="flex flex-col mt-2 space-y-1 text-sm text-gray-700">
          <p>
            Sudah punya akun?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
