"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import StarRating from "./StarRating";
import Image from "next/image";

interface StoreCardProps {
  storeSlug: string;
  storeName?: string;
  storeAddress?: string;
  storeImageUrl?: string;
  rating?: number;
}

export default function StoreCard({
  storeSlug,
  storeName = "Toko",
  storeAddress = "-",
  storeImageUrl,
  rating = 0,
}: StoreCardProps) {
  return (
    <Link
      href={`/store/${storeSlug}`}
      className="flex items-center justify-between gap-4 p-6 rounded-md border-gray-400 shadow-md hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-4">
        <Image
          src={storeImageUrl || "/placeholder-store.jpg"}
          alt={storeName?.trim() || "Foto Toko"}
          width={80}
          height={80}
          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full"
        />
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 truncate">
            {storeName}
          </h2>
          <p className="text-gray-600 text-xs truncate">{storeAddress}</p>
          <div className="mt-1">
            <StarRating rating={rating} />
          </div>
        </div>
      </div>
      <ChevronRight className="text-gray-500" />
    </Link>
  );
}
