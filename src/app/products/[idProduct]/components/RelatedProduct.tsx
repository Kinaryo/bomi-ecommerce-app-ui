import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";

interface RelatedProduct {
  idProduct: number;
  name: string;
  price: number;
  avgRating: number;
  imageUrl: string;
}

interface RelatedProductProps {
  relatedProducts: RelatedProduct[];
}

export default function RelatedProduct({ relatedProducts }: RelatedProductProps) {
  return (
    <section className="mx-auto p-1 md:p-2 lg:p-8 mt-4 border-gray-400 shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 ">Produk Terkait</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {relatedProducts.length > 0 ? (
          relatedProducts.map((product) => (
            <Link
              key={product.idProduct}
              href={`/products/${product.idProduct}`}
              passHref
            >
              <div className="block p-4 bg-gray-50 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="relative w-full h-40 mb-2 rounded-md overflow-hidden">
                  <Image
                    src={product.imageUrl}
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
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">Tidak ada produk terkait.</p>
        )}
      </div>
    </section>
  );
}
