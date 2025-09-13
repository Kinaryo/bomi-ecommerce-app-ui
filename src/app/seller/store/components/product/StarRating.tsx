"use client";

import { Star } from "lucide-react";

export default function StarRating({ rating }: { rating?: number }) {
  // fallback → kalau rating undefined/null/NaN, jadikan 0
  const safeRating = Number.isFinite(rating as number) ? (rating as number) : 0;

  const full = Math.floor(safeRating);
  const partial = safeRating % 1 !== 0;
  const percentage = (safeRating % 1) * 100;
  const empty = 5 - (full + (partial ? 1 : 0));

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(Math.max(0, full))].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-4 h-4"
          fill="currentColor"
          stroke="currentColor"
        />
      ))}
      {partial && (
        <div className="relative w-4 h-4">
          <Star
            className="absolute inset-0 w-4 h-4 text-gray-300"
            fill="currentColor"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            <Star
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              stroke="currentColor"
            />
          </div>
        </div>
      )}
      {[...Array(Math.max(0, empty))].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300"
          fill="currentColor"
        />
      ))}
      <span className="ml-1 text-sm text-gray-600 font-semibold">
        {safeRating.toFixed(1)}
      </span>
    </div>
  );
}
