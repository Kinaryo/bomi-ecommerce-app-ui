"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const MapPicker = dynamic(() => import("../components/store/mapPicker"), { ssr: false });

export default function EditStore() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false);

  const [submitting, setSubmitting] = useState(false); // ⬅️ loading submit

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
  const [previewImage, setPreviewImage] = useState<string>("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isAddressValid =
    addressForm.provinceId &&
    addressForm.cityId &&
    addressForm.districtId &&
    addressForm.street &&
    addressForm.houseNumber &&
    addressForm.rt &&
    addressForm.rw &&
    addressForm.addressLine &&
    addressForm.latitude &&
    addressForm.longitude;

  // ==== Fetch Store & Address ====
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store`, { headers: authHeaders });
        const data = await res.json();
        if (res.ok && data.data) {
          setStoreForm({
            storeName: data.data.storeName || "",
            description: data.data.description || "",
            latitude: data.data.latitude || "",
            longitude: data.data.longitude || "",
          });
          if (data.data.imageUrl) setPreviewImage(data.data.imageUrl);
        }
      } catch (err) {
        console.error("Gagal ambil store:", err);
      }
    };

    const fetchAddress = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/origin-address`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (res.ok && data.data && data.data.length > 0) {
          const addr = data.data[0];
          setAddressForm({
            country: addr.country || "Indonesia",
            provinceId: addr.provinces?.provinceId || "",
            cityId: addr.cities?.cityId || "",
            districtId: addr.districts?.districtId || "",
            subDistrictId: addr.subDistricts?.subDistrictId || "",
            street: addr.street || "",
            houseNumber: addr.houseNumber || "",
            rt: addr.rt || "",
            rw: addr.rw || "",
            addressLine: addr.addressLine || "",
            longitude: addr.longitude || "",
            latitude: addr.latitude || "",
            isPrimary: addr.isPrimary ?? true,
          });
        }
      } catch (err) {
        console.error("Gagal ambil alamat:", err);
      }
    };

    fetchStore();
    fetchAddress();
  }, []);

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
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Helper delay
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    if (!storeForm.storeName || !storeForm.description) {
      Swal.fire({ icon: "warning", title: "Oops...", text: "Nama & deskripsi toko wajib diisi!" });
      setSubmitting(false);
      return;
    }
    if (!isAddressValid) {
      Swal.fire({ icon: "warning", title: "Oops...", text: "Lengkapi alamat & pilih lokasi di peta!" });
      setSubmitting(false);
      return;
    }

    try {
      Swal.fire({
        title: "Menyimpan perubahan...",
        html: `
          <div style="width:100%; background:#eee; border-radius:6px; overflow:hidden; margin-top:10px;">
            <div id="progress-bar" style="height:10px; width:0%; background:#3b82f6; transition: width 0.3s;"></div>
          </div>
          <p id="progress-text" style="margin-top:8px;">Memproses data...</p>
        `,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const updateProgress = (percent: number, text: string) => {
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");
        if (progressBar) progressBar.style.width = percent + "%";
        if (progressText) progressText.innerText = text;
      };

      // Update alamat
      updateProgress(30, "Menyimpan data alamat...");
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/origin-address/update`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(addressForm),
      });
      await delay(800);

      // Update store
      updateProgress(60, "Menyimpan data toko...");
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/update`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(storeForm),
      });
      await delay(800);

      // Update image (opsional)
      if (storeImage) {
        updateProgress(90, "Mengunggah gambar toko...");
        const formData = new FormData();
        formData.append("image", storeImage);
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/store/update-store-image`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        await delay(800);
      }

      updateProgress(100, "Selesai!");

      Swal.fire({ icon: "success", title: "Berhasil!", text: "Data toko berhasil diperbarui." });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal!", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="max-w-6xl mx-auto p-4 mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="flex items-center justify-center text-3xl font-extrabold text-gray-800 mb-8">
        Edit Toko
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kiri */}
        <div className="space-y-3">
          <input
            type="text"
            name="storeName"
            placeholder="Nama Toko"
            value={storeForm.storeName}
            onChange={handleStoreChange}
            className="w-full p-2 border rounded"
          />
          <textarea
            name="description"
            placeholder="Deskripsi Toko"
            value={storeForm.description}
            onChange={handleStoreChange}
            className="w-full p-2 border rounded"
          />

          {/* alamat select sama seperti CreateStore */}
          <select
            name="provinceId"
            value={addressForm.provinceId}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
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
          />
          <input
            type="text"
            name="houseNumber"
            placeholder="Nomor Rumah"
            value={addressForm.houseNumber}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-2">
            <input
              type="text"
              name="rt"
              placeholder="RT"
              value={addressForm.rt}
              onChange={handleAddressChange}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="text"
              name="rw"
              placeholder="RW"
              value={addressForm.rw}
              onChange={handleAddressChange}
              className="w-1/2 p-2 border rounded"
            />
          </div>

          <input
            type="text"
            name="addressLine"
            placeholder="Detail Alamat"
            value={addressForm.addressLine}
            onChange={handleAddressChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Kanan */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border rounded">
            <MapPin className="text-blue-600 w-5 h-5" />
            <p className="text-sm text-blue-700">Klik lokasi di peta untuk mengisi koordinat.</p>
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
            <input type="text" value={addressForm.latitude} readOnly className="w-1/2 p-2 border rounded bg-gray-50" />
            <input type="text" value={addressForm.longitude} readOnly className="w-1/2 p-2 border rounded bg-gray-50" />
          </div>

          {/* Upload foto */}
          <div>
            <label className="block text-sm font-medium mb-1">Foto Toko</label>
            {previewImage && (
              <img src={previewImage} alt="preview" className="w-full h-40 object-cover rounded mb-2" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border rounded" />
          </div>
        </div>
      </form>

      <div className="mt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 
            ${submitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {submitting && <Loader2 className="animate-spin w-5 h-5" />}
          {submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </motion.div>
  );
}
