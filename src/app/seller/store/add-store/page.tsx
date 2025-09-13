"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import Swal from "sweetalert2";

// MapPicker (Leaflet)
const MapPicker = dynamic(() => import("../components/store/mapPicker"), { ssr: false });

export default function CreateStore() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);

  const [storeForm, setStoreForm] = useState({
    storeName: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  const [addressForm, setAddressForm] = useState({
    country: "Indonesia",
    provinceId: "",
    cityId: "",
    districtId: "",
    subDistrictId: "",
    street: "",
    houseNumber: "",
    rt: "",
    rw: "",
    addressLine: "",
    longitude: "",
    latitude: "",
    isPrimary: true,
  });

  const [storeImage, setStoreImage] = useState<File | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isAddressValid =
    addressForm.provinceId &&
    addressForm.cityId &&
    addressForm.districtId &&
    addressForm.subDistrictId &&
    addressForm.street &&
    addressForm.houseNumber &&
    addressForm.rt &&
    addressForm.rw &&
    addressForm.addressLine &&
    addressForm.latitude &&
    addressForm.longitude;

  // ===== Fetch Data Wilayah =====
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/province`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data.data) ? data.data : []))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    if (!addressForm.provinceId) return;
    setLoadingCities(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cities/${addressForm.provinceId}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setCities(Array.isArray(data.cities) ? data.cities : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [addressForm.provinceId]);

  useEffect(() => {
    if (!addressForm.cityId) return;
    setLoadingDistricts(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/district/${addressForm.cityId}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setDistricts(Array.isArray(data.districts) ? data.districts : []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [addressForm.cityId]);

  useEffect(() => {
    if (!addressForm.districtId) return;
    setLoadingSubDistricts(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/sub-district/${addressForm.districtId}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setSubDistricts(Array.isArray(data.subDistricts) ? data.subDistricts : []))
      .catch(() => setSubDistricts([]))
      .finally(() => setLoadingSubDistricts(false));
  }, [addressForm.districtId]);

  // ===== Handler =====
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStoreForm({ ...storeForm, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStoreImage(e.target.files[0]);
    }
  };

  // Helper delay 1 detik
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!storeForm.storeName || !storeForm.description) {
    Swal.fire({
      icon: "warning",
      title: "Oops...",
      text: "Lengkapi nama dan deskripsi toko!",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  if (!isAddressValid) {
    Swal.fire({
      icon: "warning",
      title: "Oops...",
      text: "Lengkapi semua field alamat dan pilih lokasi di peta!",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  try {
    Swal.fire({
      title: "Sedang diproses...",
      html: `
        <div style="width:100%; background:#eee; border-radius:6px; overflow:hidden; margin-top:10px;">
          <div id="progress-bar" style="height:10px; width:0%; background:#3b82f6; transition: width 0.3s;"></div>
        </div>
        <p id="progress-text" style="margin-top:8px;">Menyimpan data alamat pengiriman...</p>
      `,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const updateProgress = (percent: number, text: string) => {
      const progressBar = document.getElementById("progress-bar");
      const progressText = document.getElementById("progress-text");
      if (progressBar) progressBar.style.width = percent + "%";
      if (progressText) progressText.innerText = text;
    };

    // 1. Buat origin address
    updateProgress(10, "Menyimpan data alamat pengiriman...");
    const addressRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/origin-address/create`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(addressForm),
    });
    const addressData = await addressRes.json();
    if (!addressRes.ok) throw new Error(addressData.message || "Gagal membuat origin address");
    await delay(1000);

    // 2. Buat store
    updateProgress(50, "Menyimpan data toko...");
    const storeRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/post`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        storeName: storeForm.storeName,
        description: storeForm.description,
        latitude: addressForm.latitude,
        longitude: addressForm.longitude,
      }),
    });
    const storeData = await storeRes.json();
    if (!storeRes.ok) throw new Error(storeData.message || "Gagal membuat store");
    await delay(1000);

    // 3. Upload foto (opsional)
    if (storeImage) {
      updateProgress(80, "Mengunggah gambar toko...");
      const formData = new FormData();
      formData.append("image", storeImage);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/update-store-image`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Gagal upload foto store");
      await delay(1000);
    }

    updateProgress(100, "Selesai!");

    // 4. Cek apakah sudah punya rekening bank
    const bankCheckRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/bank-check`, {
      headers: authHeaders,
    });
    const bankCheckData = await bankCheckRes.json();

    if (!bankCheckData.hasBankAccount) {
      Swal.fire({
        icon: "info",
        title: "Tambah Rekening Bank",
        text: "Toko berhasil dibuat, tapi Anda belum menambahkan rekening bank. Silakan tambahkan sekarang.",
        confirmButtonColor: "#2563eb",
      }).then(() => {
        window.location.href = "/store/bank-account";
      });
      return;
    }

    // Jika sudah ada rekening
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Toko berhasil dibuat dan rekening bank sudah ada.",
      confirmButtonColor: "#2563eb",
    }).then(() => {
      window.location.href = "/store"; // atau halaman dashboard toko
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: (err as Error).message || "Silakan coba lagi nanti.",
      confirmButtonColor: "#dc2626",
    });
  }
};


  return (
    <motion.div
      className="max-w-6xl mx-auto p-4 mt-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="flex items-center justify-center text-3xl font-extrabold text-gray-800 mb-8">
        Tambah Toko
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KIRI: Input Form */}
        <div className="space-y-3">
          <input
            type="text"
            name="storeName"
            placeholder="Nama Toko"
            value={storeForm.storeName}
            onChange={handleStoreChange}
            className="w-full p-2 border rounded"
            required
          />

          <textarea
            name="description"
            placeholder="Deskripsi Toko"
            value={storeForm.description}
            onChange={handleStoreChange}
            className="w-full p-2 border rounded"
            required
          />

          {/* Alamat */}
          <select
            name="provinceId"
            value={addressForm.provinceId}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">{loadingProvinces ? "Loading provinsi..." : "Pilih Provinsi"}</option>
            {provinces.map((p) => (
              <option key={p.provinceId} value={p.provinceId}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="cityId"
            value={addressForm.cityId}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
            disabled={!addressForm.provinceId}
          >
            <option value="">
              {!addressForm.provinceId ? "Pilih provinsi dulu" : loadingCities ? "Loading kota..." : "Pilih Kota"}
            </option>
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="districtId"
            value={addressForm.districtId}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
            disabled={!addressForm.cityId}
          >
            <option value="">
              {!addressForm.cityId ? "Pilih kota dulu" : loadingDistricts ? "Loading kecamatan..." : "Pilih Kecamatan"}
            </option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            name="subDistrictId"
            value={addressForm.subDistrictId}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
            disabled={!addressForm.districtId}
          >
            <option value="">
              {!addressForm.districtId
                ? "Pilih kecamatan dulu"
                : loadingSubDistricts
                  ? "Loading kelurahan..."
                  : "Pilih Kelurahan/Desa"}
            </option>
            {subDistricts.map((s) => (
              <option key={s.subDistrictId} value={s.subDistrictId}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="street"
            placeholder="Jalan"
            value={addressForm.street}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            name="houseNumber"
            placeholder="Nomor Rumah"
            value={addressForm.houseNumber}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
          />

          <div className="flex gap-2">
            <input
              type="text"
              name="rt"
              placeholder="RT"
              value={addressForm.rt}
              onChange={handleAddressChange}
              className="w-1/2 p-2 border rounded"
              required
            />
            <input
              type="text"
              name="rw"
              placeholder="RW"
              value={addressForm.rw}
              onChange={handleAddressChange}
              className="w-1/2 p-2 border rounded"
              required
            />
          </div>

          <input
            type="text"
            name="addressLine"
            placeholder="Detail Alamat"
            value={addressForm.addressLine}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* KANAN: Map & Koordinat */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPin className="text-blue-600 w-5 h-5" />
            <p className="text-sm text-blue-700">Klik lokasi pada peta untuk mengisi koordinat.</p>
          </div>

          <MapPicker
            lat={addressForm.latitude}
            lng={addressForm.longitude}
            onChange={(lat, lng) => {
              setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
              setStoreForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            }}
          />

          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={addressForm.latitude}
                readOnly
                className="w-full p-2 border rounded text-sm bg-gray-50"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={addressForm.longitude}
                readOnly
                className="w-full p-2 border rounded text-sm bg-gray-50"
              />
            </div>
          </div>
          {/* Upload Gambar */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Foto Toko</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border p-2 rounded cursor-pointer bg-white"
            />
          </div>
        </div>
      </form>

      <div className="mt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg text-white font-medium transition bg-blue-600 hover:bg-blue-700"
        >
          Buat Toko
        </button>
      </div>
    </motion.div>
  );
}
