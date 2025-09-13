"use client";

import { Coffee } from "lucide-react"; // Ganti dengan ikon lain sesuai kebutuhan

export default function AboutMe() {
  return (
    <div className="mx-auto p-8 mt-20" id="about">
      {/* Judul */}
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Tentang Kami
      </h1>

      {/* Konten dua kolom */}
      <div className="flex flex-col md:flex-row items-stretch gap-6">
        {/* Kolom kiri: teks */}
        <div className="md:w-1/2 text-gray-700 space-y-4 text-justify">
          <p>
            <strong>Bomi E-Commerce</strong> adalah platform belanja online
            terpercaya yang menyediakan berbagai produk berkualitas dengan harga
            terbaik. Berdiri sejak 2025, kami memiliki visi untuk memudahkan
            masyarakat Indonesia dalam berbelanja tanpa batasan jarak dan waktu.
          </p>
          <p>
            Kami berkomitmen untuk memberikan pelayanan terbaik dengan
            pengiriman cepat, transaksi yang aman, dan dukungan pelanggan yang
            responsif. Kepercayaan Anda adalah prioritas kami.
          </p>
          <p>
            Dengan semangat inovasi dan kerja sama tim yang solid, Bomi
            E-Commerce akan terus berkembang demi menghadirkan pengalaman
            belanja yang nyaman, mudah, dan menyenangkan bagi semua pelanggan.
          </p>
        </div>

        {/* Kolom kanan: container gambar/ikon */}
        <div className="md:w-1/2 flex justify-center md:justify-end">
          <div className="flex items-center justify-center border border-gray-200 rounded-lg p-4 h-full w-48 md:w-64">
            <Coffee className="h-full w-auto text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
