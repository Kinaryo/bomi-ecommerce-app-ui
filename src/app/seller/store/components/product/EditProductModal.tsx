"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";

interface EditProductModalProps {
  token: string | null;
  productId: number | null;
  onClose: () => void;
  onUpdate: (updatedData: any) => void;
}

export default function EditProductModal({
  token,
  productId,
  onClose,
  onUpdate,
}: EditProductModalProps) {
  const [form, setForm] = useState({
    idCategory: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    status: "active",
    weight: 0,
    length: "",
    width: "",
    height: "",
  });

  const [categories, setCategories] = useState<
    { idCategory: number; name: string }[]
  >([]);
  const [busy, setBusy] = useState(false);

  // format angka jadi ribuan
  const formatNumber = (value: number | string) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(Number(value));
  };

  // Fetch produk + kategori
  useEffect(() => {
    if (!productId || !token) return;

    const fetchProduct = async () => {
      try {
        Swal.fire({
          title: "Mengambil data produk...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/edit/${productId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const resJson = await res.json();
        Swal.close();

        if (resJson.status === "success") {
          const data = resJson.data;
          setForm({
            idCategory: String(data.idCategory || ""),
            name: data.name || "",
            description: data.description || "",
            price: data.price || 0,
            stock: data.stock || 0,
            status: data.status || "active",
            weight: data.weight || 0,
            length: String(data.length || ""),
            width: String(data.width || ""),
            height: String(data.height || ""),
          });
          setCategories(resJson.dataCategorys || []);
        } else {
          Swal.fire(
            "Gagal",
            resJson.message || "Tidak bisa ambil data produk",
            "error"
          );
        }
      } catch (err) {
        Swal.close();
        Swal.fire("Error", "Terjadi kesalahan saat ambil data produk", "error");
      }
    };

    fetchProduct();
  }, [productId, token]);

  const handleSubmit = async () => {
    if (!form.idCategory || !form.name || !form.description) {
      Swal.fire("Error", "Semua field wajib diisi", "error");
      return;
    }

    try {
      setBusy(true);
      Swal.fire({
        title: "Memperbarui produk...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/update/${productId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const resJson = await res.json();
      Swal.close();

      if (resJson.status === "success") {
        Swal.fire("Berhasil", "Produk berhasil diperbarui", "success");
        onUpdate(resJson.data);
        onClose();
      } else {
        Swal.fire(
          "Gagal",
          resJson.message || "Gagal memperbarui produk",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Terjadi kesalahan saat memperbarui produk", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Edit Produk</h2>
          <div className="space-y-3">
            {/* Dropdown kategori */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kategori
              </label>
              <select
                value={form.idCategory}
                onChange={(e) =>
                  setForm({ ...form, idCategory: e.target.value })
                }
                className="border p-2 rounded w-full"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.idCategory} value={cat.idCategory}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Produk
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Deskripsi
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Harga (Rp)
              </label>
              <input
                type="text"
                value={form.price ? formatNumber(form.price) : ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\./g, "");
                  const numericValue = Number(rawValue) || 0;
                  setForm({ ...form, price: numericValue });
                }}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stok</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="border p-2 rounded w-full"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Berat (gram)
              </label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: Number(e.target.value) })
                }
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Panjang (cm)
                </label>
                <input
                  type="number"
                  value={form.length}
                  onChange={(e) =>
                    setForm({ ...form, length: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Lebar (cm)
                </label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) =>
                    setForm({ ...form, width: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tinggi (cm)
                </label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) =>
                    setForm({ ...form, height: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>

            <button
              disabled={busy}
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
