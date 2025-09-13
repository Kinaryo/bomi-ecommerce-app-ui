"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import SearchBar from "../components/SearchBar";
import StoreProducts from "../components/StoreProducts";
import StarRating from "../components/StarRating";
import Image from "next/image";

interface Product {
  idProduct: number;
  name: string;
  price: number;
  avgRating: number;
  totalReviews: number;
  imageUrl: string;
}

interface Category {
  idCategory: number;
  name: string;
  imageCategoryUrl: string;
}

interface Store {
  storeName: string;
  storeAddress: string;
  storeImageUrl: string;
  rating: number;
}

const FIRST_BATCH_LIMIT = 5;
const NEXT_BATCH_LIMIT = 10;

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [storeData, setStoreData] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  // fetch store data
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/store/${slug}`
        );
        const resJson = await res.json();
        if (resJson.status === "success") {
          setStoreData(resJson.data as Store);
        } else {
          throw new Error("Store tidak ditemukan");
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Store tidak ditemukan",
        });
      }
    };
    if (slug) fetchStore();
  }, [slug]);

  // fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/categories`
        );
        const resJson = await res.json();
        setCategories(resJson.data || []);
      } catch (err) {
        console.error("Gagal ambil kategori", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // fetch products function (dibungkus useCallback supaya stabil)
  const fetchProducts = useCallback(
    async (pageParam: number, query: string, categoryId: number | null) => {
      setLoadingProducts(true);
      try {
        const limit = pageParam === 1 ? FIRST_BATCH_LIMIT : NEXT_BATCH_LIMIT;
        const categoryParam = categoryId ? `&category=${categoryId}` : "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/stores/${slug}/products?page=${pageParam}&limit=${limit}&search=${encodeURIComponent(
            query
          )}${categoryParam}`
        );
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
          setHasMore(false);
          return;
        }

        setProducts((prev) => {
          if (pageParam === 1) return data.data as Product[];
          const combined = [...prev, ...(data.data as Product[])];
          const unique = Array.from(
            new Map(combined.map((p) => [p.idProduct, p])).values()
          );
          return unique;
        });
      } catch (err) {
        console.error("Gagal fetch produk", err);
      } finally {
        setLoadingProducts(false);
      }
    },
    [slug] // dependensi supaya tidak berubah-ubah
  );

  // reset products saat search/kategori berubah
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setProducts([]);
    fetchProducts(1, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, slug, fetchProducts]);

  // infinite scroll next page
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, searchQuery, selectedCategory);
    }
  }, [page, searchQuery, selectedCategory, slug, fetchProducts]);

  const lastProductCallback = useCallback(
    (node: HTMLDivElement | null) => {
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

  const handleBackToList = () => {
    router.push("/products");
  };

  if (!storeData) {
    return <div className="max-w-4xl mx-auto p-6">Memuat data toko...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-20 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center gap-6 border p-6 rounded-md shadow-md bg-gray-50">
        <Image
          src={storeData.storeImageUrl || "/placeholder-store.jpg"}
          alt={storeData.storeName}
          width={120}
          height={120}
          className="w-24 h-24 object-cover rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{storeData.storeName}</h1>
          <p className="text-gray-600">{storeData.storeAddress}</p>
          <StarRating rating={storeData.rating} />
        </div>
      </div>

      {/* Search */}
      <SearchBar value={searchQuery} onSearch={setSearchQuery} />

      {/* Kategori */}
      <div className="flex gap-6 overflow-x-auto justify-start pb-4 mb-2 mt-5">
        {loadingCategories ? (
          <p className="text-gray-400">Memuat kategori...</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.idCategory}
              className={`flex items-center justify-between w-48 p-2 rounded-lg shadow-sm cursor-pointer transition-all duration-300 ${
                selectedCategory === cat.idCategory
                  ? "bg-blue-100 border border-blue-400"
                  : "bg-white"
              }`}
              onClick={() =>
                setSelectedCategory(
                  cat.idCategory === selectedCategory ? null : cat.idCategory
                )
              }
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border flex-shrink-0">
                <Image
                  src={cat.imageCategoryUrl || "/no-category.png"}
                  alt={cat.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium text-gray-700 text-center flex-1 ml-3">
                {cat.name}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Produk */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Produk dari toko ini</h2>
        <StoreProducts products={products} />

        {/* Infinite scroll sentinel */}
        <div ref={lastProductCallback} />

        {!hasMore && (
          <p className="text-center mt-4 text-gray-500">Tidak ada produk lagi</p>
        )}
      </div>

      {/* Tombol kembali ke daftar produk */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke daftar produk</span>
      </button>
    </div>
  );
}
