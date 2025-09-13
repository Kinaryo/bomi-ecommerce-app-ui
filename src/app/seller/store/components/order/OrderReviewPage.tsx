"use client";

import { useEffect, useState } from "react";
import { Star, Edit, Trash2, Send } from "lucide-react";

interface ReviewImage {
  idImage: number;
  imageUrl: string;
}

interface Reply {
  idReply: number;
  reply: string;
  seller: { name: string };
}

interface Review {
  idComment: number;
  rating: number;
  comment: string;
  createdAt: string;
  users: { name: string };
  images: ReviewImage[];
  replies?: Reply[];
}

export default function OrderReviewPage({
  token,
  idOrder,
}: {
  token: string | null;
  idOrder: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [editReplyId, setEditReplyId] = useState<number | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/order/${idOrder}/reviews`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        console.log("API Review Response:", data);

        if (data.status === "success") {
          setReviews(Array.isArray(data.data) ? data.data : []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Gagal fetch review:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [idOrder, token]);

  const handleReplySubmit = async (idComment: number) => {
    const replyText = replyInputs[idComment];
    if (!replyText?.trim()) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/review/${idComment}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply: replyText }),
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        setReviews((prev) =>
          prev.map((r) =>
            r.idComment === idComment
              ? { ...r, replies: [...(r.replies || []), data.data] }
              : r
          )
        );
        setReplyInputs((prev) => ({ ...prev, [idComment]: "" }));
      } else {
        alert(data.message || "Gagal menyimpan reply");
      }
    } catch (err) {
      console.error("Gagal simpan reply:", err);
    }
  };

  const handleReplyUpdate = async (idReply: number, idComment: number) => {
    const replyText = replyInputs[idComment];
    if (!replyText?.trim()) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/review/reply/${idReply}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply: replyText }),
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        setReviews((prev) =>
          prev.map((r) =>
            r.idComment === idComment
              ? {
                  ...r,
                  replies: r.replies?.map((rep) =>
                    rep.idReply === idReply ? { ...rep, reply: replyText } : rep
                  ),
                }
              : r
          )
        );
        setEditReplyId(null);
        setReplyInputs((prev) => ({ ...prev, [idComment]: "" }));
      } else {
        alert(data.message || "Gagal update reply");
      }
    } catch (err) {
      console.error("Gagal update reply:", err);
    }
  };

  const handleReplyDelete = async (idReply: number, idComment: number) => {
    if (!confirm("Yakin ingin hapus balasan ini?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/review/reply/${idReply}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        setReviews((prev) =>
          prev.map((r) =>
            r.idComment === idComment
              ? {
                  ...r,
                  replies: r.replies?.filter((rep) => rep.idReply !== idReply),
                }
              : r
          )
        );
      } else {
        alert(data.message || "Gagal hapus reply");
      }
    } catch (err) {
      console.error("Gagal hapus reply:", err);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-600 animate-pulse">
        Loading review...
      </p>
    );

  if (!loading && reviews.length === 0)
    return (
      <div className="p-6 mt-4 mx-auto bg-white rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Review Customer</h2>
        <p className="text-center mt-10 text-gray-500">
          Belum ada review untuk order ini
        </p>
      </div>
    );

  return (
    <div className="p-6 mt-4 mx-auto bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-6">Review Customer</h2>

      <div className="grid  gap-4">
        {reviews.map((review) => (
          <div
            key={review.idComment}
            className="bg-gray-50 rounded-xl shadow-md p-4 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">{review?.users?.name || "Anonim"}</p>
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* ⭐ Rating */}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={20}
                  className={
                    n <= review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {review.rating}/5
              </span>
            </div>

            <p className="text-gray-700">{review.comment}</p>

            {review.images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-3">
                {review.images.map((img) => (
                  <img
                    key={img.idImage}
                    src={img.imageUrl}
                    alt="review-img"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}

            {/* 💬 Seller Reply */}
<div className="mt-4 border-t pt-3">
  {review.replies && review.replies.length > 0 ? (
    review.replies.map((rep) => (
      <div
        key={rep.idReply}
        className="bg-purple-50 p-2 rounded-md text-sm text-gray-700 flex justify-between items-start"
      >
        {editReplyId === rep.idReply ? (
          <div className="flex flex-col w-full gap-2">
            <textarea
              value={replyInputs[review.idComment] || rep.reply}
              onChange={(e) =>
                setReplyInputs((prev) => ({
                  ...prev,
                  [review.idComment]: e.target.value,
                }))
              }
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-purple-200"
            />
            <button
              onClick={() =>
                handleReplyUpdate(rep.idReply, review.idComment)
              }
              className="self-end px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Send size={16} className="inline mr-1" /> Simpan
            </button>
          </div>
        ) : (
          <>
            <span>
              <span className="font-semibold">
                {rep.seller?.name || "Seller"}:
              </span>{" "}
              {rep.reply}
            </span>
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => {
                  setEditReplyId(rep.idReply);
                  setReplyInputs((prev) => ({
                    ...prev,
                    [review.idComment]: rep.reply,
                  }));
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() =>
                  handleReplyDelete(rep.idReply, review.idComment)
                }
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    ))
  ) : (
    <div className="flex flex-col gap-2">
      <textarea
        value={replyInputs[review.idComment] || ""}
        onChange={(e) =>
          setReplyInputs((prev) => ({
            ...prev,
            [review.idComment]: e.target.value,
          }))
        }
        placeholder="Tulis balasan..."
        rows={3}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-purple-200"
      />
      <button
        onClick={() => handleReplySubmit(review.idComment)}
        className="self-end px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
      >
        Balas
      </button>
    </div>
  )}
</div>

          </div>
        ))}
      </div>
    </div>
  );
}
