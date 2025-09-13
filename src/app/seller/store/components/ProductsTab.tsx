"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, ArrowLeft } from "lucide-react";
import ProductDetail from "./product/ProductDetailTab";
import AddProductForm from "./product/AddProductForm";
import Swal from "sweetalert2";
import SearchBar from "../components/product/SearchBar";

interface Product {
  idProduct: number;
  nameProduct: string;
  price: number;
  nameStore: string;
  primaryImage: string | null;
  avgRating?: number;
  totalReviews?: number;
  sold?: number;
  idCategory?: number;
}

interface Category {
  idCategory: number;
  name: string;
  imageCategoryUrl: string | null;
}

interface ProductsTabProps {
  token: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProductsTab({ token }: ProductsTabProps) {
  const FIRST_BATCH_LIMIT = 5;
  const NEXT_BATCH_LIMIT = 10;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<any>(null);
  const [hasBankAccount, setHasBankAccount] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // fetch categories, store, and bank check
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resCategories, resStore, resBank] = await Promise.all([
          fetch(`${API_BASE_URL}/user/categories`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE_URL}/seller/store`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE_URL}/seller/bank-check`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        const dataCategories = await resCategories.json();
        const dataStore = await resStore.json();
        const dataBank = await resBank.json();

        setCategories(dataCategories.data || []);
        setStore(dataStore?.data || null);
        setHasBankAccount(dataBank?.hasBankAccount ?? false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan";
        setErrorMessage(message);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (token) fetchInitialData();
    else setLoadingCategories(false);
  }, [token]);

  // fetch products
  const fetchProducts = async (
    page: number,
    query = "",
    categoryId: number | null = null
  ) => {
    if (loadingProducts || !hasMore) return;
    setLoadingProducts(true);

    try {
      const limit = page === 1 ? FIRST_BATCH_LIMIT : NEXT_BATCH_LIMIT;
      const categoryParam = categoryId ? `&category=${categoryId}` : "";

      const res = await fetch(
        `${API_BASE_URL}/seller/products?page=${page}&limit=${limit}&search=${encodeURIComponent(
          query
        )}${categoryParam}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        setHasMore(false);
        return;
      }

      const mappedProducts: Product[] = data.data.map((p: any) => ({
        idProduct: p.idProduct,
        nameProduct: p.nameProduct,
        price: p.price,
        nameStore: p.nameStore,
        primaryImage: p.primaryImage,
        avgRating: p.avgRating,
        totalReviews: p.totalReviews,
        sold: p.sold,
        idCategory: p.idCategory,
      }));

      setProducts((prev) => {
        const combined = [...prev, ...mappedProducts];
        const unique = Array.from(
          new Map(combined.map((p) => [p.idProduct, p])).values()
        );
        return unique;
      });

      // kalau jumlah produk < limit, berarti sudah terakhir
      if (data.data.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMessage(message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // infinite scroll observer
  const lastProductCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingProducts) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingProducts) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingProducts, hasMore]
  );

  useEffect(() => {
    if (!hasMore && observer.current) {
      observer.current.disconnect();
    }
  }, [hasMore]);

  // fetch ketika search / category berubah
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setProducts([]);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (page >= 1 && hasMore) {
      fetchProducts(page, searchQuery, selectedCategory);
    }
  }, [page, searchQuery, selectedCategory]);

  // action handler
  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id);
  };

  const handleBackToList = () => {
    setSelectedProductId(null);
    setAddingProduct(false);
  };

  const handleAddProduct = (product: Product) => {
    setProducts([product, ...products]);
    setAddingProduct(false);
  };

  const handleClickAddProduct = async () => {
    if (!store) {
      await Swal.fire({
        title: "Belum Punya Toko",
        text: "Kamu harus membuat toko terlebih dahulu sebelum bisa menambahkan produk.",
        icon: "warning",
        confirmButtonText: "Buat Toko Sekarang",
      });
      window.location.href = "/seller/store/add-store";
      return;
    }

    if (!hasBankAccount) {
      await Swal.fire({
        title: "Belum Punya Rekening",
        text: "Kamu harus menambahkan rekening bank terlebih dahulu sebelum bisa menambahkan produk.",
        icon: "warning",
        confirmButtonText: "Tambah Rekening Sekarang",
      });
      window.location.href = "/seller/store/bank-account";
      return;
    }

    setAddingProduct(true);
  };

  // loading & error
  if (!hydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

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

  // render tambah produk / detail produk
  if (addingProduct) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={handleBackToList}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar produk
        </button>
        <AddProductForm
          categories={categories}
          onAdd={handleAddProduct}
          nextId={products.length ? Math.max(...products.map((p) => p.idProduct)) + 1 : 1}
        />
      </div>
    );
  }

  if (selectedProductId) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={handleBackToList}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar produk
        </button>
        <ProductDetail idProduct={selectedProductId.toString()} />
      </div>
    );
  }

  // render utama
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header + Tambah Produk */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={handleClickAddProduct}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
        }}
      />

      {/* Category */}
      <div className="flex gap-6 overflow-x-auto justify-between pb-4 mt-4">
        {categories.map((cat) => (
          <div
            key={cat.idCategory}
            className={`flex items-center justify-between w-48 p-2 rounded-lg shadow-sm cursor-pointer transition-all duration-300
              ${selectedCategory === cat.idCategory ? "bg-blue-100 border border-blue-400" : "bg-white"}`}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.idCategory ? null : cat.idCategory
              )
            }
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border flex-shrink-0">
              <img
                src={cat.imageCategoryUrl || "/no-category.png"}
                alt={cat.name}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = "/no-category.png")}
              />
            </div>
            <p className="text-sm font-medium text-gray-700 text-center flex-1 ml-3">
              {cat.name}
            </p>
          </div>
        ))}
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-2 justify-between">
        {products.map((product, index) => {
          const isLast = index === products.length - 1;
          return (
            <div
              key={product.idProduct}
              onClick={() => handleSelectProduct(product.idProduct)}
              ref={isLast ? lastProductCallback : null}
              className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl bg-gray-100 overflow-hidden block border border-gray-300 cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={product.primaryImage || "/no-image.png"}
                  alt={product.nameProduct}
                  className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  draggable={false}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = "/no-image.png")}
                />
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <h4 className="font-bold text-sm line-clamp-2 text-gray-800">
                  {product.nameProduct}
                </h4>
                <p className="text-xs text-gray-500">{product.nameStore}</p>
              </div>

              {/* Price, Sold, Rating */}
              <div className="px-3 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-black font-semibold text-sm">
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {product.sold || 0} Terjual
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {(product.avgRating || 0).toFixed(1)} ({product.totalReviews || 0} ulasan)
                </div>
              </div>
            </div>
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

      {!hasMore && !loadingProducts && (
        <p className="text-center mt-4 col-span-full text-gray-500">
          Tidak ada produk lagi
        </p>
      )}
    </div>
  );
}
