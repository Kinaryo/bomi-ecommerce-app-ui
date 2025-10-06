"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import Image from "next/image";
import StarRating from "../components/StarRating";

// ================== Interfaces ==================
interface ReviewImage {
  idImage: number;
  imageUrl: string;
  publicId: string;
}

interface SellerReply {
  idReply: number;
  reply: string;
  createdAt: string;
  seller: { idUser: number; name: string; role: string; profileImageUrl?: string };
}

interface Review {
  idComment: number;
  comment: string;
  rating: number;
  createdAt: string;
  user: { idUser: number; name: string; profileUrl?: string };
  images?: ReviewImage[];
  replies?: SellerReply[];
}

// ================== Component ==================
export default function ReviewsPage() {
  const { slug } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/products/${slug}/reviews?page=${page}&limit=10`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) throw new Error("Gagal memuat ulasan");
        const resData = await res.json();

        setReviews(prev =>
          page === 1 ? resData.data || [] : [...prev, ...(resData.data || [])]
        );
        setHasMore((resData.data?.length ?? 0) > 0);
      } catch (err: unknown) {
        if (err instanceof Error) {
          Swal.fire("Error", err.message, "error");
        } else {
          Swal.fire("Error", "Gagal memuat ulasan", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [slug, page]);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-20 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Semua Ulasan</h1>

      {loading && <p className="text-gray-500">Memuat...</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-gray-500">Belum ada ulasan</p>
      )}

      <div className="space-y-6">
        {reviews.map((review, index) => (
          <div
            key={`${review.idComment}-${index}`}
            className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Image
                src={
                  review.user.profileUrl ||
                  "https://via.placeholder.com/40x40.png?text=?"
                }
                alt={review.user.name || "Foto pengguna"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div>
                <span className="font-semibold text-gray-800">
                  {review.user.name}
                </span>
                <span className="block text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-2">
              <StarRating rating={review.rating} />
            </div>

            {/* Comment */}
            <p className="text-gray-700 mt-2">{review.comment}</p>

            {/* Images */}
            {(review.images?.length ?? 0) > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {review.images!.map((img, imgIndex) => (
                  <Image
                    key={`${img.idImage}-${imgIndex}`}
                    src={img.imageUrl}
                    alt={`Gambar ulasan ${review.user.name}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}

            {/* Replies */}
            {(review.replies?.length ?? 0) > 0 && (
              <div className="mt-4 pl-6 border-l-4 border-blue-300 space-y-3">
                {review.replies!.map((reply, replyIndex) => (
                  <div
                    key={`${reply.idReply}-${replyIndex}`}
                    className="flex items-start gap-3"
                  >
                    <Image
                      src={
                        reply.seller.profileImageUrl ||
                        "https://via.placeholder.com/40x40.png?text=S"
                      }
                      alt={reply.seller.name || "Foto penjual"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border"
                    />
                    <div className="bg-gray-100 p-3 rounded-lg shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">
                        {reply.seller.name}
                      </p>
                      {reply.seller.role && (
                        <p className="text-xs text-gray-400 italic">
                          {reply.seller.role === "seller"
                            ? "Penjual"
                            : reply.seller.role}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">{reply.reply}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {!loading && hasMore && (
        <button
          onClick={() => setPage(prev => prev + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Muat lebih banyak
        </button>
      )}
    </div>
  );
}
