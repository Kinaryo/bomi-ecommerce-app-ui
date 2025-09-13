"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import StarRating from "./StarRating";

interface StoreCardProps {
  storeSlug: string;   // 🔹 pakai slug, bukan id
  storeName: string;
  storeAddress: string;
  storeImageUrl?: string;
  rating: number;
}

export default function StoreCard({
  storeSlug,
  storeName,
  storeAddress,
  storeImageUrl,
  rating,
}: StoreCardProps) {
  return (
    <Link
      href={`/store/${storeSlug}`} // 🔹 arahkan ke slug
      className="flex items-center justify-between gap-4 p-6 rounded-md border-gray-400 shadow-md hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-4">
        <img
          src={storeImageUrl || "/placeholder-store.jpg"}
          alt={storeName}
          width={80}
          height={80}
          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{storeName}</h2>
          <p className="text-gray-600 text-xs">{storeAddress}</p>
          <StarRating rating={rating} />
        </div>
      </div>
      <ChevronRight className="text-gray-500" />
    </Link>
  );
}
