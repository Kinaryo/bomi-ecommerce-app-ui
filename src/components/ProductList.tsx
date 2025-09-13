"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";

interface Product {
  idProduct: number;
  nameProduct: string;
  price: number;
  nameStore: string;
  avgRating: string;
  totalReviews: number;
  primaryImage: string;
  sold: number;
}

export default function ProductList({ data }: { data: Product[] }) {
  const [products] = useState<Product[]>(data);

  return (
    <div className="mx-auto p-1 md:p-2 lg:p-8 mt-4">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Produk
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 min-h-screen">
        {products.map((product) => (
          <Link
            key={product.idProduct}
            href={`/products/${product.idProduct}`}
            className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl bg-gray-100 overflow-hidden block border border-gray-300"
          >
            {/* Gambar Produk */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={product.primaryImage || "/fallback.jpg"}
                alt={product.nameProduct}
                className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                draggable={false}
                loading="lazy"
              />
            </div>

            {/* Info Produk */}
            <div className="p-3 space-y-1">
              <h4 className="font-bold text-sm line-clamp-2 text-gray-800">
                {product.nameProduct}
              </h4>
              <p className="text-xs text-gray-500">{product.nameStore}</p>
            </div>

            {/* Harga, Terjual & Rating */}
            <div className="px-3 pb-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-primary font-semibold text-sm">
                  Rp {product.price.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-600">{product.sold} Terjual</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {product.avgRating} ({product.totalReviews} ulasan)
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
