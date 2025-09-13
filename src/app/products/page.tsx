"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import Image from "next/image";

interface Product {
  idProduct: number;
  nameProduct: string;
  price: number;
  nameStore: string | null;
  primaryImage: string | null;
  avgRating: number;
  totalReviews: number;
  sold: number;
}

interface Category {
  idCategory: number;
  name: string;
  imageCategoryUrl: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function ProductsPage() {
  const FIRST_BATCH_LIMIT = 5;
  const NEXT_BATCH_LIMIT = 10;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const observer = useRef<IntersectionObserver | null>(null);

  // INIT CATEGORY DARI QUERY URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(parseInt(categoryFromUrl, 10));
    }
  }, [searchParams]);

  // FETCH CATEGORIES
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/user/categories`, { headers });
        if (!res.ok) throw new Error("Gagal mengambil kategori");
        const data = await res.json();
        setCategories(data.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan";
        setErrorMessage(message);
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [router]);

  // FETCH PRODUCTS (dibungkus useCallback supaya stabil)
  const fetchProducts = useCallback(
    async (page: number, query = "", categoryId: number | null = null) => {
      setLoadingProducts(true);
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const limit = page === 1 ? FIRST_BATCH_LIMIT : NEXT_BATCH_LIMIT;
        const categoryParam = categoryId ? `&category=${categoryId}` : "";
        const res = await fetch(
          `${API_BASE_URL}/user/products?page=${page}&limit=${limit}&search=${encodeURIComponent(
            query
          )}${categoryParam}`,
          { headers }
        );

        const data = await res.json();

        if (!data.data || data.data.length === 0) {
          setHasMore(false);
          return;
        }

        setProducts((prev) => {
          const combined = [...prev, ...data.data];
          const unique = Array.from(
            new Map(combined.map((p) => [p.idProduct, p])).values()
          );
          return unique;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan";
        setErrorMessage(message);
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    },
    [FIRST_BATCH_LIMIT, NEXT_BATCH_LIMIT, API_BASE_URL]
  );

  // OBSERVER REF CALLBACK
  const lastProductCallback = useCallback(
    (node: HTMLDivElement) => {
      if (loadingProducts) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingProducts, hasMore]
  );

  // FETCH PRODUCTS KETIKA PAGE, SEARCH, ATAU CATEGORY BERUBAH
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setProducts([]);
    fetchProducts(1, searchQuery, selectedCategory);
  }, [fetchProducts, searchQuery, selectedCategory]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, searchQuery, selectedCategory);
    }
  }, [fetchProducts, page, searchQuery, selectedCategory]);

  // LOADING / ERROR STATE
  if (loadingCategories && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {errorMessage}
      </div>
    );
  }

  // RENDER PAGE
  return (
    <div className="mx-auto p-2 md:p-2 lg:p-8 mt-20">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Produk
      </h1>

      <SearchBar
        value={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(1);
          setHasMore(true);
          setProducts([]);
        }}
      />

      {/* Kategori */}
      <div className="flex gap-6 overflow-x-auto justify-between pb-4 mb-2 mt-5">
        {categories.map((cat) => (
          <div
            key={cat.idCategory}
            className={`flex items-center justify-between w-48 p-2 rounded-lg shadow-sm cursor-pointer transition-all duration-300
              ${
                selectedCategory === cat.idCategory
                  ? "bg-blue-100 border border-blue-400"
                  : "bg-white"
              }`}
            onClick={() => {
              const newCategory =
                cat.idCategory === selectedCategory ? null : cat.idCategory;
              setSelectedCategory(newCategory);

              const params = new URLSearchParams(window.location.search);
              if (newCategory) {
                params.set("category", newCategory.toString());
              } else {
                params.delete("category");
              }
              router.replace(`/products?${params.toString()}`, { scroll: false });
            }}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border flex-shrink-0">
              <Image
                src={cat.imageCategoryUrl || "/no-category.png"}
                alt={cat.name}
                className="w-full h-full object-cover"
                width={48}
                height={48}
              />
            </div>
            <p className="text-sm font-medium text-gray-700 text-center flex-1 ml-3">
              {cat.name}
            </p>
          </div>
        ))}
      </div>

      {/* Produk */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4 p-1">
        {products.map((product, index) => {
          const isLast = index === products.length - 1;
          return (
            <Link
              key={product.idProduct}
              href={`/products/${product.idProduct}`}
              className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl bg-gray-100 overflow-hidden block border border-gray-300"
              ref={isLast ? lastProductCallback : null}
            >
              {/* Gambar */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={product.primaryImage || "/no-image.png"}
                  alt={product.nameProduct}
                  className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  draggable={false}
                  loading="lazy"
                  fill
                />
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <h4 className="font-bold text-sm line-clamp-2 text-gray-800">
                  {product.nameProduct}
                </h4>
                <p className="text-xs text-gray-500">{product.nameStore}</p>
              </div>

              {/* Harga, Terjual, Rating */}
              <div className="px-3 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-primary font-semibold text-sm">
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-600">{product.sold} Terjual</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {product.avgRating.toFixed(1)} ({product.totalReviews} ulasan)
                </div>
              </div>
            </Link>
          );
        })}

        {/* Skeleton loader */}
        {loadingProducts &&
          Array.from({ length: NEXT_BATCH_LIMIT }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="block bg-white p-4 rounded-xl shadow animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-gray-200 rounded-full" />
                ))}
              </div>
            </div>
          ))}
      </div>

      {!hasMore && (
        <p className="text-center mt-4 col-span-full text-gray-500">
          Tidak ada produk lagi
        </p>
      )}
    </div>
  );
}
