"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Image from "next/image";

interface Category {
  idCategory: number;
  name: string;
}

export interface NewProduct {
  idProduct: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  weight: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  images: string[];
  idCategory: number;
}


interface AddProductFormProps {
  categories: Category[];
  onAdd?: (product: NewProduct) => void;
}

export default function AddProductForm({ categories, onAdd }: AddProductFormProps) {
  const [category, setCategory] = useState<number | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [weight, setWeight] = useState<number>(0);
  const [length, setLength] = useState<number | "">("");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // load draft dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("addProductForm");
    if (saved) {
      const data = JSON.parse(saved);
      setCategory(data.category || "");
      setName(data.name || "");
      setDescription(data.description || "");
      setPrice(data.price || 0);
      setStock(data.stock || 0);
      setStatus(data.status || "active");
      setWeight(data.weight || 0);
      setLength(data.length || "");
      setWidth(data.width || "");
      setHeight(data.height || "");
    }
  }, []);

  // simpan draft ke localStorage
  useEffect(() => {
    const save = {
      category,
      name,
      description,
      price,
      stock,
      status,
      weight,
      length,
      width,
      height,
    };
    localStorage.setItem("addProductForm", JSON.stringify(save));
  }, [category, name, description, price, stock, status, weight, length, width, height]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (filesArray.length + images.length > 5) {
      Swal.fire("Error", "Maksimal upload 5 gambar", "error");
      return;
    }
    setImages((prev) => [...prev, ...filesArray]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category || !name || !description || !price || !stock || !status || !weight) {
      Swal.fire("Error", "Semua field wajib diisi", "error");
      return;
    }
    if (images.length < 1) {
      Swal.fire("Error", "Minimal 1 gambar wajib diupload", "error");
      return;
    }

    const formData = new FormData();
    formData.append("idCategory", category.toString());
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price.toString());
    formData.append("stock", stock.toString());
    formData.append("status", status);
    formData.append("weight", weight.toString());
    if (length) formData.append("length", length.toString());
    if (width) formData.append("width", width.toString());
    if (height) formData.append("height", height.toString());
    images.forEach((img) => formData.append("images", img));

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        Swal.fire("Berhasil", "Produk berhasil dibuat", "success");

        // ✅ panggil callback onAdd dengan produk dari API (kalau ada)
        if (data.product) {
          onAdd?.(data.product);
        } else {
          // fallback: build object manual
          onAdd?.({
            idProduct: Date.now(),
            name,
            description,
            price,
            stock,
            status,
            weight,
            length: length || null,
            width: width || null,
            height: height || null,
            images: images.map((img) => URL.createObjectURL(img)),
            idCategory: Number(category),
          });
        }

        // reset form
        setCategory("");
        setName("");
        setDescription("");
        setPrice(0);
        setStock(0);
        setStatus("active");
        setWeight(0);
        setLength("");
        setWidth("");
        setHeight("");
        setImages([]);
        localStorage.removeItem("addProductForm");
      } else {
        Swal.fire("Error", data.message || "Gagal membuat produk", "error");
      }
    } catch (err: unknown) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan saat mengirim data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Tambah Produk Baru</h2>

      {/* Kategori */}
      <div>
        <label className="block mb-1 font-medium">Kategori</label>
        <select
          value={category}
          onChange={(e) => setCategory(Number(e.target.value))}
          className="border p-2 rounded w-full"
        >
          <option value="">Pilih Kategori</option>
          {categories.map((cat) => (
            <option key={cat.idCategory} value={cat.idCategory}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nama Produk */}
      <div>
        <label className="block mb-1 font-medium">Nama Produk</label>
        <input
          type="text"
          placeholder="Nama Produk"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block mb-1 font-medium">Deskripsi Produk</label>
        <textarea
          placeholder="Deskripsi Produk"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Harga, Stok, Status */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Harga</label>
          <input
            type="number"
            placeholder="Harga"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Stok</label>
          <input
            type="number"
            placeholder="Stok"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="border p-2 rounded w-full"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Berat dan Dimensi */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Berat (kg)</label>
          <input
            type="number"
            placeholder="Berat"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Panjang (cm, opsional)</label>
          <input
            type="number"
            placeholder="Panjang"
            value={length}
            onChange={(e) => setLength(e.target.value === "" ? "" : Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Lebar (cm, opsional)</label>
          <input
            type="number"
            placeholder="Lebar"
            value={width}
            onChange={(e) => setWidth(e.target.value === "" ? "" : Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 font-medium">Tinggi (cm, opsional)</label>
          <input
            type="number"
            placeholder="Tinggi"
            value={height}
            onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Gambar */}
      <div>
        <label className="block mb-1 font-medium">Gambar Produk (1–5)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="border p-2 rounded w-full"
        />
        <p className="text-sm text-gray-500 mt-1">Pilih minimal 1 dan maksimal 5 gambar.</p>

        {/* Preview gambar */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {images.map((img, idx) => (
            <div key={idx} className="relative">
              <Image
                src={URL.createObjectURL(img)}
                alt={img.name}
                className="w-24 h-24 object-cover rounded border"
                width={96}
                height={96}
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4"
      >
        {loading ? "Mengirim..." : "Tambah Produk"}
      </button>
    </div>
  );
}
