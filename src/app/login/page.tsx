"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getFcmToken } from "../../../firebaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Login ke backend (endpoint lama)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login/post`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        alert("Terjadi kesalahan format respons server.");
        return;
      }

      if (!response.ok) {
        alert(data.message || "Login gagal. Silakan coba lagi.");
        return;
      }

      // Simpan token JWT backend (untuk API selanjutnya)
      localStorage.setItem("token", data.token);

      // Ambil token FCM dari browser
      const fcmToken = await getFcmToken();
      if (!fcmToken) {
        console.warn("Tidak bisa mendapatkan FCM token");
      } else {
        // Kirim FCM token ke backend supaya disimpan
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ fcmToken }),
        });
      }

      // Arahkan ke halaman utama
      router.push("/");

    } catch (error) {
      alert("Terjadi kesalahan jaringan. Silakan coba lagi nanti.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm transform transition-all hover:scale-[1.01]">
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
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold transition duration-200"
          >
            Login
          </button>
        </form>

        <div className="flex flex-col mt-2 space-y-1 text-sm text-gray-700">
          <p>
            Anda belum punya akun?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Daftar
            </Link>
          </p>
          <Link
            href="/forgotPassword"
            className="text-blue-600 hover:underline"
          >
            Lupa Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
