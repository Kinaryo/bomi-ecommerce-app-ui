"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Star, X, Edit3, Trash2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

interface ReviewImage {
  idImage: number;
  imageUrl: string;
}

interface Seller {
  name: string;
  role?: string;
  profileImageUrl?: string;
}

interface Reply {
  idReply: number;
  reply: string;
  createdAt: string;
  seller?: Seller;
}

interface Review {
  idComment: number;
  idUser: number;
  comment: string;
  rating: number;
  images: ReviewImage[];
  createdAt: string;
  users: { name: string };
  replies?: Reply[];
}

interface LocalImage {
  file: File;
  preview: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const { idOrder } = useParams() as { idOrder: string };
  const searchParams = useSearchParams();
  const backTab = searchParams?.get("tab") || "pending_payment";

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchReview = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/review/${idOrder}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        const fetched: Review | null = data.data || null;
        setReview(fetched);
        if (fetched) {
          setComment(fetched.comment ?? "");
          setRating(fetched.rating ?? 5);
        }
        return fetched;
      } else {
        Swal.fire("Gagal", data.message || "Gagal mengambil review", "error");
        return null;
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [idOrder, router]);

  useEffect(() => {
    fetchReview();
    return () => {
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    };
  }, [fetchReview, images]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Swal.fire("Error", "Komentar tidak boleh kosong", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const totalImagesCount = (review?.images?.length || 0) + images.length;
    if (totalImagesCount > 5) {
      Swal.fire("Error", "Maksimal 5 gambar per review", "error");
      return;
    }

    const formData = new FormData();
    formData.append("comment", comment);
    formData.append("rating", rating.toString());
    images.forEach((img) => formData.append("images", img.file));

    setIsSubmitting(true);

    Swal.fire({
      title: isEditing ? "Mengupdate Review..." : "Mengirim Review...",
      text: "Harap tunggu sebentar",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const endpoint = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/update-review/${review?.idComment}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/add-review/${idOrder}`;

      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        await fetchReview();
        setImageVersion(Date.now());
        images.forEach((i) => URL.revokeObjectURL(i.preview));
        setImages([]);
        if (fileInputRef.current) fileInputRef.current.value = "";

        Swal.fire({
          title: "Sukses",
          text: isEditing
            ? "Review berhasil diperbarui"
            : "Review berhasil dikirim",
          icon: "success",
          confirmButtonText: "OK",
        });

        setIsEditing(false);
      } else {
        Swal.fire("Gagal", data.message || "Gagal mengirim review", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async (idImage: number) => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const confirm = await Swal.fire({
      title: "Hapus Gambar?",
      text: "Gambar ini akan dihapus permanen dari review",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Menghapus Gambar...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/review/image/${idImage}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        setReview((prev) =>
          prev
            ? { ...prev, images: (prev.images ?? []).filter((img) => img.idImage !== idImage) }
            : prev
        );
        await fetchReview();
        setImageVersion(Date.now());
        Swal.fire("Sukses", "Gambar berhasil dihapus", "success");
      } else {
        Swal.fire("Gagal", data.message || "Gagal menghapus gambar", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan", "error");
    }
  };

  const handleDeleteReview = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const confirm = await Swal.fire({
      title: "Hapus Review?",
      text: "Review beserta semua gambar akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Menghapus Review...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/delete-review/${review?.idComment}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.status === "success") {
        setReview(null);
        setComment("");
        setRating(5);
        images.forEach((i) => URL.revokeObjectURL(i.preview));
        setImages([]);
        setIsEditing(false);

        Swal.fire("Sukses", "Review berhasil dihapus", "success").then(() => {
          router.push(`/order?tab=${backTab}`);
        });
      } else {
        Swal.fire("Gagal", data.message || "Gagal menghapus review", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan", "error");
    }
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      const toRemove = prev[index];
      if (toRemove) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== selectedFiles.length) {
      Swal.fire("Error", "Hanya file gambar yang diperbolehkan", "error");
      return;
    }

    const existingCount = (review?.images?.length || 0) + images.length;
    if (existingCount + imageFiles.length > 5) {
      Swal.fire("Error", "Maksimal 5 gambar per review", "error");
      return;
    }

    const newLocalImages: LocalImage[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newLocalImages]);
  };

  const handleBackToList = () => {
    router.push(`/order?tab=${backTab}`);
  };

  if (loading) return <p className="text-center mt-20 animate-pulse">Loading...</p>;

  const withCacheBuster = (url: string) =>
    `${url}${url.includes("?") ? "&" : "?"}v=${imageVersion}`;

  return (
    <div className="p-6 max-w-3xl mx-auto mt-20 space-y-6">
      {/* Tombol kembali */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> <span>Kembali ke daftar order</span>
      </button>

      {review && !isEditing ? (
        <>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Review Order</h1>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              <Edit3 size={16} /> Edit
            </button>
            <button
              onClick={handleDeleteReview}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <Trash2 size={16} /> Hapus
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-800">{review.users?.name || "Anonim"}</p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={20}
                  className={n <= review.rating ? "text-yellow-500" : "text-gray-300"}
                  fill={n <= review.rating ? "currentColor" : "none"}
                />
              ))}
            </div>

            <p className="text-gray-700 mb-2">{review.comment}</p>

            {(review.images ?? []).length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {(review.images ?? []).map((img) => (
                  <div key={img.idImage}>
                    <Image
                      src={withCacheBuster(img.imageUrl)}
                      alt="review-img"
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
            )}

            {(review.replies ?? []).length > 0 && (
              <div className="mt-4 space-y-3">
                {(review.replies ?? []).map((reply) => (
                  <div
                    key={reply.idReply}
                    className="flex gap-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400"
                  >
                    <Image
                      src={reply.seller?.profileImageUrl || "https://via.placeholder.com/40x40.png?text=S"}
                      alt={reply.seller?.name || "seller"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {reply.seller?.name}
                      </p>
                      <p className="text-xs text-gray-400 mb-1">
                        {reply.seller?.role || "Penjual"}
                      </p>
                      <p className="text-gray-700">{reply.reply}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Form edit/tulis review */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {review ? "Edit Review" : "Tulis Review"}
          </h1>

          {/* Rating */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="focus:outline-none">
                  <Star size={24} className={n <= rating ? "text-yellow-500" : "text-gray-300"} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Komentar</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Tulis komentar Anda..."
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Upload Gambar (opsional)</label>

            {(review?.images ?? []).length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {(review?.images ?? []).map((img) => (
                  <div key={img.idImage} className="relative w-full h-24 rounded overflow-hidden border border-gray-300 group">
                    <Image
                      src={withCacheBuster(img.imageUrl)}
                      alt="old-review-img"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.idImage)}
                      className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-gray-600"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500">
              Sisa slot gambar: {5 - (review?.images?.length || 0) - images.length}
            </p>

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {images.map((img, idx) => (
                  <div key={`new-preview-${idx}`} className="relative w-full h-24 rounded overflow-hidden border border-gray-300 group">
                    <Image
                      src={img.preview}
                      alt={`preview-${idx}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(idx)}
                      className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-red-500"
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditing
                ? "Mengupdate..."
                : "Mengirim..."
              : review
                ? "Update Review"
                : "Kirim Review"}
          </button>
        </>
      )}
    </div>
  );
}
