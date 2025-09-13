"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductImageCarousel({
  images,
  name,
}: {
  images: { idImage: number; imageUrl: string }[];
  name: string;
}) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg group">
      <Image
        src={images[current].imageUrl}
        alt={`${name} ${current + 1}`}
        fill
        className="object-cover"
      />

      {/* tombol prev */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* tombol next */}
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* overlay index */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
