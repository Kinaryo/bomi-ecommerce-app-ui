"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const MapPicker = dynamic(() => import("../components/mapPicker"), {
  ssr: false,
});

interface Province {
  provinceId: string;
  name: string;
}
interface City {
  cityId: string;
  name: string;
}
interface District {
  districtId: string;
  name: string;
}
interface SubDistrict {
  subDistrictId: string;
  name: string;
}

interface ShippingAddress {
  idShippingAddress: number;
  country: string;
  provinces?: { provinceId: string };
  cities?: { cityId: string };
  districts?: { districtId: string };
  subDistricts?: { subDistrictId: string };
  street: string;
  houseNumber: string;
  rt: string;
  rw: string;
  addressLine: string;
  longitude: string;
  latitude: string;
  isPrimary: boolean;
}

const parseResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
};

export default function EditShippingAddress() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressId, setAddressId] = useState<number | null>(null);
  const router = useRouter();
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

  const isInitialLoad = useRef(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isFormValid = Boolean(
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
      form.longitude
  );

  // ambil alamat user
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/shipping-address`, {
      headers: authHeaders,
    })
      .then(parseResponse)
      .then((data: { data: ShippingAddress[] }) => {
        if (Array.isArray(data?.data) && data.data.length > 0) {
          const alamat = data.data[0];
          setAddressId(alamat.idShippingAddress);
          setForm({
            country: alamat.country || "Indonesia",
            provinceId: alamat.provinces?.provinceId || "",
            cityId: alamat.cities?.cityId || "",
            districtId: alamat.districts?.districtId || "",
            subDistrictId: alamat.subDistricts?.subDistrictId || "",
            street: alamat.street || "",
            houseNumber: alamat.houseNumber || "",
            rt: alamat.rt || "",
            rw: alamat.rw || "",
            addressLine: alamat.addressLine || "",
            longitude: alamat.longitude || "",
            latitude: alamat.latitude || "",
            isPrimary: alamat.isPrimary ?? true,
          });
        }
      })
      .catch((err: unknown) =>
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat",
          text:
            (err as Error).message || "Terjadi error saat mengambil alamat",
        })
      )
      .finally(() => setLoading(false));
  }, [authHeaders]);

  // fetch province
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/province`, {
      headers: authHeaders,
    })
      .then(parseResponse)
      .then((data: { data: Province[] }) => setProvinces(data.data || []))
      .catch((err: unknown) =>
        Swal.fire({ icon: "error", title: "Error", text: (err as Error).message })
      );
  }, [authHeaders]);

  // fetch cities
  useEffect(() => {
    if (!form.provinceId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cities/${form.provinceId}`,
      { headers: authHeaders }
    )
      .then(parseResponse)
      .then((data: { cities: City[] }) => setCities(data.cities || []))
      .catch((err: unknown) =>
        Swal.fire({ icon: "error", title: "Error", text: (err as Error).message })
      );

    if (!isInitialLoad.current) {
      setCities([]);
      setForm((prev) => ({
        ...prev,
        cityId: "",
        districtId: "",
        subDistrictId: "",
      }));
    }
  }, [form.provinceId, authHeaders]);

  // fetch districts
  useEffect(() => {
    if (!form.cityId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/district/${form.cityId}`,
      { headers: authHeaders }
    )
      .then(parseResponse)
      .then((data: { districts: District[] }) => setDistricts(data.districts || []))
      .catch((err: unknown) =>
        Swal.fire({ icon: "error", title: "Error", text: (err as Error).message })
      );

    if (!isInitialLoad.current) {
      setDistricts([]);
      setSubDistricts([]);
      setForm((prev) => ({ ...prev, districtId: "", subDistrictId: "" }));
    }
  }, [form.cityId, authHeaders]);

  // fetch subdistricts
  useEffect(() => {
    if (!form.districtId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/sub-district/${form.districtId}`,
      { headers: authHeaders }
    )
      .then(parseResponse)
      .then((data: { subDistricts: SubDistrict[] }) =>
        setSubDistricts(data.subDistricts || [])
      )
      .catch((err: unknown) =>
        Swal.fire({ icon: "error", title: "Error", text: (err as Error).message })
      );

    if (!isInitialLoad.current) {
      setSubDistricts([]);
      setForm((prev) => ({ ...prev, subDistrictId: "" }));
    }
    isInitialLoad.current = false;
  }, [form.districtId, authHeaders]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !addressId) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Lengkapi semua field dan pilih lokasi di peta!",
      });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/shipping-address/update/${addressId}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(form),
        }
      );
      const result = await parseResponse(res);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Alamat berhasil diperbarui.",
        }).then(() => {
          router.push("/profile");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: (result as { message?: string })?.message || "Gagal mengupdate alamat.",
        });
      }
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: (err as Error).message || "Silakan coba lagi nanti.",
      });
    }
  };

  if (loading) return <p className="text-center py-6">Loading data alamat...</p>;

  return (
    <motion.div
      className="max-w-6xl mx-auto p-4 mt-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        Edit Alamat Pengiriman
      </h1>

      <form
        id="edit-address-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* kiri */}
        <div className="space-y-3">
          <select
            name="provinceId"
            value={form.provinceId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Pilih Provinsi</option>
            {provinces.map((p) => (
              <option key={p.provinceId} value={p.provinceId}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="cityId"
            value={form.cityId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={!form.provinceId || cities.length === 0}
          >
            <option value="">
              {cities.length === 0 ? "Data kota tidak tersedia" : "Pilih Kota"}
            </option>
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="districtId"
            value={form.districtId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={!form.cityId || districts.length === 0}
          >
            <option value="">
              {districts.length === 0
                ? "Data kecamatan tidak tersedia"
                : "Pilih Kecamatan"}
            </option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            name="subDistrictId"
            value={form.subDistrictId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={!form.districtId || subDistricts.length === 0}
          >
            <option value="">
              {subDistricts.length === 0
                ? "Data kelurahan/desa tidak tersedia"
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
            value={form.street}
            placeholder="Jalan"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="houseNumber"
            value={form.houseNumber}
            placeholder="Nomor Rumah"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-2">
            <input
              type="text"
              name="rt"
              value={form.rt}
              placeholder="RT"
              onChange={handleChange}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="text"
              name="rw"
              value={form.rw}
              placeholder="RW"
              onChange={handleChange}
              className="w-1/2 p-2 border rounded"
            />
          </div>

          <input
            type="text"
            name="addressLine"
            value={form.addressLine}
            placeholder="Detail Alamat"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* kanan map */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPin className="text-blue-600 w-5 h-5" />
            <p className="text-sm text-blue-700">
              Klik lokasi pada peta untuk memperbarui koordinat.
            </p>
          </div>

          <div className="h-64 w-full border rounded-lg overflow-hidden shadow-sm">
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) =>
                setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
              }
            />
          </div>

          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">
                Latitude
              </label>
              <input
                type="text"
                value={form.latitude}
                readOnly
                className="w-full p-2 border rounded text-sm bg-gray-50"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">
                Longitude
              </label>
              <input
                type="text"
                value={form.longitude}
                readOnly
                className="w-full p-2 border rounded text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <button
          type="submit"
          form="edit-address-form"
          className="w-full py-3 rounded-lg text-white font-medium transition bg-blue-600 hover:bg-blue-700"
        >
          Simpan Perubahan
        </button>
      </div>
    </motion.div>
  );
}
