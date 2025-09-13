"use client";

import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";

interface StoreProduct {
  idProduct: number;
  name: string;
  price: number;
  avgRating: number;
  totalReviews: number;
  imageUrl: string;
}

interface StoreProductsProps {
  products: StoreProduct[];
}

export default function StoreProducts({ products }: StoreProductsProps) {
  if (products.length === 0) {
    return <p className="text-gray-500">Belum ada produk</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {products.map((product) => (
        <Link
          key={product.idProduct}
          href={`/products/${product.idProduct}`}
          className="block p-4 bg-gray-50 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        >
          <div className="relative w-full h-40 mb-2 rounded-md overflow-hidden">
            <Image
              src={product.imageUrl || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {product.name}
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Rp{product.price.toLocaleString("id-ID")}
          </p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <StarRating rating={product.avgRating} />
            <span className="ml-1">({product.totalReviews})</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
