"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import Swal from "sweetalert2";

// 🗺️ Import MapPicker (Leaflet) pakai dynamic biar gak kena SSR
const MapPicker = dynamic(() => import("../components/mapPicker"), {
  ssr: false,
});

export default function AddShippingAddress() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);

  const [form, setForm] = useState({
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

  const isFormValid =
    form.provinceId &&
    form.cityId &&
    form.districtId &&
    form.subDistrictId &&
    form.street &&
    form.houseNumber &&
    form.rt &&
    form.rw &&
    form.addressLine &&
    form.latitude &&
    form.longitude;

  // 🔑 Ambil token JWT dari localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 🔹 Ambil provinsi
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/province`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then((data) => {
        setProvinces(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // 🔹 Ambil kota sesuai provinsi
  useEffect(() => {
    if (!form.provinceId) return;
    setLoadingCities(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cities/${form.provinceId}`,
      { headers: authHeaders }
    )
      .then((res) => res.json())
      .then((data) => {
        setCities(Array.isArray(data.cities) ? data.cities : []);
      })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.provinceId]);

  // 🔹 Ambil kecamatan sesuai kota
  useEffect(() => {
    if (!form.cityId) return;
    setLoadingDistricts(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/district/${form.cityId}`,
      { headers: authHeaders }
    )
      .then((res) => res.json())
      .then((data) => {
        setDistricts(Array.isArray(data.districts) ? data.districts : []);
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [form.cityId]);

  // 🔹 Ambil kelurahan sesuai kecamatan
  useEffect(() => {
    if (!form.districtId) return;
    setLoadingSubDistricts(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/sub-district/${form.districtId}`,
      { headers: authHeaders }
    )
      .then((res) => res.json())
      .then((data) => {
        setSubDistricts(
          Array.isArray(data.subDistricts) ? data.subDistricts : []
        );
      })
      .catch(() => setSubDistricts([]))
      .finally(() => setLoadingSubDistricts(false));
  }, [form.districtId]);

  // 🔹 Handler input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Lengkapi semua field dan pilih lokasi di peta!",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/shipping-address/create`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Alamat berhasil ditambahkan.",
          confirmButtonColor: "#2563eb",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: result.message || "Gagal menambah alamat.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: "Silakan coba lagi nanti.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto p-4  mt-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
         <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        Tambah Alamat Pengiriman
      </h1>

      <form
        onSubmit={handleSubmit}
        id="address-form"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Bagian Kiri: Input */}
        <div className="space-y-3">
          {/* Province */}
          <select
            name="provinceId"
            value={form.provinceId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">
              {loadingProvinces
                ? "Loading provinsi..."
                : provinces.length === 0
                ? "Data provinsi tidak ditemukan"
                : "Pilih Provinsi"}
            </option>
            {provinces.map((p) => (
              <option key={p.provinceId} value={p.provinceId}>
                {p.name}
              </option>
            ))}
          </select>

          {/* City */}
          <select
            name="cityId"
            value={form.cityId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={!form.provinceId}
          >
            <option value="">
              {!form.provinceId
                ? "Pilih provinsi dulu"
                : loadingCities
                ? "Loading kota..."
                : cities.length === 0
                ? "Data kota tidak ditemukan"
                : "Pilih Kota"}
            </option>
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>
                {c.name}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            name="districtId"
            value={form.districtId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={!form.cityId}
          >
            <option value="">
              {!form.cityId
                ? "Pilih kota dulu"
                : loadingDistricts
                ? "Loading kecamatan..."
                : districts.length === 0
                ? "Data kecamatan tidak ditemukan"
                : "Pilih Kecamatan"}
            </option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Sub District */}
          <select
            name="subDistrictId"
            value={form.subDistrictId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={!form.districtId}
          >
            <option value="">
              {!form.districtId
                ? "Pilih kecamatan dulu"
                : loadingSubDistricts
                ? "Loading kelurahan/desa..."
                : subDistricts.length === 0
                ? "Data kelurahan/desa tidak ditemukan"
                : "Pilih Kelurahan/Desa"}
            </option>
            {subDistricts.map((s) => (
              <option key={s.subDistrictId} value={s.subDistrictId}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Street */}
          <input
            type="text"
            name="street"
            placeholder="Jalan"
            value={form.street}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          {/* House number */}
          <input
            type="text"
            name="houseNumber"
            placeholder="Nomor Rumah"
            value={form.houseNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          {/* RT RW */}
          <div className="flex gap-2">
            <input
              type="text"
              name="rt"
              placeholder="RT"
              value={form.rt}
              onChange={handleChange}
              className="w-1/2 p-2 border rounded"
              required
            />
            <input
              type="text"
              name="rw"
              placeholder="RW"
              value={form.rw}
              onChange={handleChange}
              className="w-1/2 p-2 border rounded"
              required
            />
          </div>

          {/* Address Line */}
          <input
            type="text"
            name="addressLine"
            placeholder="Detail Alamat"
            value={form.addressLine}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Bagian Kanan: Map */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPin className="text-blue-600 w-5 h-5" />
            <p className="text-sm text-blue-700">
              Klik lokasi pada peta atau gunakan pencarian untuk mengisi
              koordinat alamat Anda.
            </p>
          </div>

          <div className="h-64 w-full border rounded-lg overflow-hidden shadow-sm relative">
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) =>
                setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
              }
            />
          </div>

          {/* Latitude & Longitude */}
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">
                Latitude
              </label>
              <input
                type="text"
                name="latitude"
                value={form.latitude}
                className="w-full p-2 border rounded text-sm bg-gray-50"
                readOnly
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">
                Longitude
              </label>
              <input
                type="text"
                name="longitude"
                value={form.longitude}
                className="w-full p-2 border rounded text-sm bg-gray-50"
                readOnly
              />
            </div>
          </div>
        </div>
      </form>

      {/* Tombol submit terpisah */}
      <div className="mt-6">
        <button
          type="submit"
          form="address-form"
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg text-white font-medium transition bg-blue-600 hover:bg-blue-700"
        >
          Simpan Alamat
        </button>
      </div>
    </motion.div>
  );
}
