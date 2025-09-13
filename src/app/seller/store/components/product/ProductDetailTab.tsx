"use client";

import { useEffect, useState, useRef } from "react";
import ImageCarousel from "./ProductImageCarousel";
import StarRating from "./StarRating";
import ReviewList from "./ReviewList";
import Swal from "sweetalert2";
import { Camera, Trash2, Plus, Star } from "lucide-react";
import EditProductModal from "./EditProductModal";
import Image from "next/image";

interface ProductDetailProps {
  idProduct: string;
}

interface ProductImage {
  idImage: number;
  imageUrl: string | null;
  isPrimary?: boolean;
}

export default function ProductDetail({ idProduct }: ProductDetailProps) {
  const [data, setData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<"idle" | "post" | "update">("idle");
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false); // state modal

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch product detail
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/products/${idProduct}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((resData) => setData(resData.data))
      .catch((err) => console.error("Error fetch produk:", err));
  }, [idProduct, token]);

  if (!data) return <div className="max-w-6xl mx-auto p-6 text-gray-700">Memuat...</div>;

  const { dataProduct, dataReview } = data;
  const images: ProductImage[] = dataProduct.images || [];

  const handleSlotClick = (action: "post" | "update", idImage?: number) => {
    if (busy) return;

    if (action === "post" && images.length >= 5) {
      Swal.fire("Limit Tercapai", "Anda tidak dapat menambahkan lebih dari 5 gambar.", "warning");
      return;
    }

    setMode(action);
    setCurrentImageId(idImage ?? null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setMode("idle");
      setCurrentImageId(null);
      return;
    }

    if (mode === "post" && images.length >= 5) {
      Swal.fire("Limit Tercapai", "Tidak dapat menambahkan lebih dari 5 gambar.", "warning");
      setMode("idle");
      e.target.value = "";
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      setBusy(true);
      Swal.fire({
        title: mode === "update" ? "Memperbarui gambar..." : "Mengunggah gambar...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      let res, resJson;
      if (mode === "update" && currentImageId) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/${dataProduct.idProduct}/update-image/${currentImageId}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`! },
            body: formData,
          }
        );
        resJson = await res.json();
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/post-image/${dataProduct.idProduct}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`! },
            body: formData,
          }
        );
        resJson = await res.json();
      }

      Swal.close();

      if (resJson?.status === "success") {
        Swal.fire(
          "Berhasil",
          mode === "update" ? "Gambar berhasil diperbarui." : "Gambar berhasil ditambahkan.",
          "success"
        );

        if (mode === "update" && currentImageId) {
          const updatedImages = (dataProduct.images || []).map((img: ProductImage) =>
            img.idImage === currentImageId ? resJson.data : img
          );
          setData((prev: any) => ({ ...prev, dataProduct: { ...prev.dataProduct, images: updatedImages } }));
        } else {
          const updatedImages = [...(dataProduct.images || []), resJson.data];
          setData((prev: any) => ({ ...prev, dataProduct: { ...prev.dataProduct, images: updatedImages } }));
        }
      } else {
        Swal.fire("Gagal", resJson?.message || "Gagal upload/update gambar", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Terjadi kesalahan saat mengunggah gambar", "error");
    } finally {
      setBusy(false);
      setMode("idle");
      setCurrentImageId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (idImage: number) => {
    if (busy) return;

    const confirm = await Swal.fire({
      title: "Hapus gambar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      setBusy(true);
      Swal.fire({
        title: "Menghapus...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/${dataProduct.idProduct}/delete-image/${idImage}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}`! } }
      );
      const resJson = await res.json();

      Swal.close();

      if (resJson?.status === "success") {
        Swal.fire("Terhapus", "Gambar berhasil dihapus", "success");
        const updatedImages = (dataProduct.images || []).filter((img: ProductImage) => img.idImage !== idImage);
        setData((prev: any) => ({ ...prev, dataProduct: { ...prev.dataProduct, images: updatedImages } }));
      } else {
        Swal.fire("Gagal", resJson?.message || "Gagal menghapus gambar", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Terjadi kesalahan saat menghapus gambar", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSetPrimary = async (idImage: number) => {
    if (busy) return;
    try {
      setBusy(true);
      Swal.fire({ title: "Mengubah primary...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/products/${dataProduct.idProduct}/set-primary-image/${idImage}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}`! } }
      );
      const resJson = await res.json();

      Swal.close();

      if (resJson.status === "success") {
        Swal.fire("Berhasil", "Gambar berhasil dijadikan primary", "success");
        const updatedImages = (dataProduct.images || []).map((i: ProductImage) => ({
          ...i,
          isPrimary: i.idImage === idImage,
        }));
        setData((prev: any) => ({ ...prev, dataProduct: { ...prev.dataProduct, images: updatedImages } }));
      } else {
        Swal.fire("Gagal", resJson.message || "Gagal mengubah primary", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Terjadi kesalahan saat mengubah primary", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 bg-white relative">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={busy}
      />
      <div className="p-4 sm:p-6  border-gray-400 shadow-md rounded-md ">
        {/* Carousel */}
        {images.length > 0 && <ImageCarousel images={images} name={dataProduct.name} />}

        {/* Grid gambar */}
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
            {[...Array(5)].map((_, idx) => {
              const img = images[idx];
              return (
                <div
                  key={idx}
                  className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden"
                >
                  {img ? (
                    <>
                      <Image
                        src={img.imageUrl!}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {img.isPrimary ? (
                        <div className="absolute top-1 left-1 z-10">
                          <Star size={16} className="text-yellow-400" fill="currentColor" />
                        </div>
                      ) : (
                        <div className="absolute top-1 left-1 z-10">
                          <button
                            className="p-1 bg-black/50 rounded-full text-white hover:bg-black disabled:opacity-50"
                            onClick={() => handleSetPrimary(img.idImage)}
                            disabled={busy}
                          >
                            <Star size={16} />
                          </button>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 z-10">
                        <button
                          className="p-1 bg-black/50 rounded-full text-white hover:bg-black disabled:opacity-50"
                          onClick={() => handleDelete(img.idImage)}
                          disabled={busy}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-1 right-1 z-10">
                        <button
                          className="p-1 bg-black/50 rounded-full text-white hover:bg-black disabled:opacity-50"
                          onClick={() => handleSlotClick("update", img.idImage)}
                          disabled={busy}
                        >
                          <Camera size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSlotClick("post")}
                    >
                      <Plus size={28} />
                      <span className="text-xs">{busy ? "Sedang..." : "Tambah"}</span>
                      <span className="text-[10px] text-gray-400">Klik untuk unggah</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2">
            <p className="text-gray-600 text-xs sm:text-sm">
              *) Produk dengan tanda bintang kuning adalah gambar utama.
            </p>
          </div>
        </div>

        {/* Tombol Edit Produk */}
        <div className="flex justify-center md:justify-end mt-4">
          <button
            onClick={() => setEditModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            Edit Produk
          </button>
        </div>

        {/* Informasi produk */}
        <div className="flex flex-col md:flex-row gap-8 mt-6">
          <div className="w-full md:w-1/2 space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{dataProduct.name}</h1>
            {dataProduct.category && (
              <p className="text-sm text-gray-500">
                Kategori: <span className="font-medium">{dataProduct.category.name}</span>
              </p>
            )}
            <p className="text-gray-700">{dataProduct.description}</p>
            <p className="text-xl sm:text-2xl text-orange-500 font-semibold">
              Rp{dataProduct.price.toLocaleString("id-ID")}
            </p>
            <div className="flex items-center space-x-2 text-gray-600">
              <StarRating rating={dataProduct.rating} />
              <span className="text-gray-500 text-sm">| {dataProduct.totalReview} ulasan</span>
            </div>
            <p className="text-gray-700 font-bold">Stok: {dataProduct.stock}</p>
          </div>
        </div>
      </div>

      {/* Review */}
      <div className="p-4 sm:p-6  border-gray-400 shadow-md rounded-md ">
        <ReviewList reviews={dataReview} />
      </div>
      {/* Modal Edit Produk */}
      {editModalOpen && (
        <EditProductModal
          token={token}
          productId={dataProduct.idProduct}
          onClose={() => setEditModalOpen(false)}
          onUpdate={(updatedProduct) =>
            setData((prev: any) => ({
              ...prev,
              dataProduct: {
                ...prev.dataProduct,
                ...updatedProduct,
              },
            }))
          }
        />
      )}
    </div>
  );
}
