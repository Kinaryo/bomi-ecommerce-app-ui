'use client'

import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import ImageCarousel from './components/ProductImageCarousel'
import StarRating from './components/StarRating'
import ReviewList from './components/ReviewList'
import StoreCard from './components/StoreCard'
import RelatedProduct from './components/RelatedProduct'
import { ShoppingCart } from 'lucide-react'

interface ProductImage {
  idImage: number
  imageUrl: string
}

interface Product {
  idProduct: string
  name: string
  description: string
  price: number
  rating: number
  totalReview: number
  stock: number
  images: ProductImage[]
}

interface Store {
  slug: string
  storeName: string
  storeAddress: string
  storeImageUrl: string
  rating: number
}

interface ReviewImage {
  idImage: number
  imageUrl: string
  publicId: string
}
interface SellerReply {
  idReply: number
  reply: string
  seller: {
    name: string
    role: string
    profileImageUrl?: string
  }
}
interface Review {
  name: string
  profileImageUrl?: string
  createdAt: string
  rating: number
  comment: string
  images?: ReviewImage[]
  replies?: SellerReply[]
}

interface RelatedProductType {
  idProduct: string
  name: string
  price: number
  imageUrl: string
}

interface ProductPageProps {
  params: {
    idProduct: string
  }
}

// 🛠 universal require login
function requireLogin(callback: () => void) {
  const token = localStorage.getItem('token')
  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Anda belum login',
      text: 'Silakan login terlebih dahulu untuk melanjutkan.',
      showCancelButton: true,
      confirmButtonText: 'Login',
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/login'
      }
    })
    return
  }
  callback()
}

// 🛠 fetch helper dengan token
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token tidak ada')
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export default function ProductPage({ params }: ProductPageProps) {
  const { idProduct } = params

  const [dataProduct, setDataProduct] = useState<Product | null>(null)
  const [dataStore, setDataStore] = useState<Store | null>(null)
  const [dataReview, setDataReview] = useState<Review[]>([])
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductType[]>([])
  const [loading, setLoading] = useState({ buyNow: false, addCart: false })

  // fetch produk realtime
  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/products/${idProduct}`
      )
      const resData = await res.json()
      if (resData.status === 'success') {
        setDataProduct(resData.data.dataProduct as Product)
        setDataStore(resData.data.dataStore as Store)
        setDataReview(resData.data.dataReview as Review[])
        setRelatedProducts(resData.data.relatedProducts as RelatedProductType[])
      }
    } catch (err) {
      console.error('Error fetch produk:', err)
    }
  }, [idProduct])

  useEffect(() => {
    fetchProduct()
    const interval = setInterval(fetchProduct, 10000)
    return () => clearInterval(interval)
  }, [fetchProduct])

  if (!dataProduct || !dataStore) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-700">Memuat...</div>
  }

  // Tambah ke keranjang
  const handleAddToCart = () => {
    if (dataProduct.stock <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Stok Habis',
        text: 'Produk tidak tersedia saat ini',
      })
      return
    }
    requireLogin(async () => {
      setLoading((prev) => ({ ...prev, addCart: true }))
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/add-cart-item/${dataProduct.idProduct}`,
          { method: 'POST', body: JSON.stringify({ quantity: 1 }) }
        )
        const resJson = await res.json()
        if (!res.ok || resJson.status === 'error') {
          Swal.fire({ icon: 'error', title: 'Gagal', text: resJson.message })
          return
        }
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Produk berhasil ditambahkan ke keranjang (1 pcs).`,
        })
      } catch (err) {
        const e = err as Error
        if (e.message === 'Token tidak ada') return
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.message })
      } finally {
        setLoading((prev) => ({ ...prev, addCart: false }))
      }
    })
  }

  // Beli sekarang
  const handleBuyNow = async () => {
    requireLogin(async () => {
      const { value: quantity } = await Swal.fire({
        title: 'Masukkan Quantity',
        input: 'number',
        inputLabel: 'Quantity yang ingin dibeli',
        inputPlaceholder: 'Masukkan jumlah',
        inputValue: 1,
        showCancelButton: true,
      })
      if (!quantity || Number(quantity) < 1) return
      if (Number(quantity) > dataProduct.stock) {
        Swal.fire({
          icon: 'warning',
          title: 'Stok Tidak Cukup',
          text: `Stok tersedia hanya ${dataProduct.stock} pcs`,
        })
        return
      }
      setLoading((prev) => ({ ...prev, buyNow: true }))
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/add-cart-item/${dataProduct.idProduct}`,
          {
            method: 'POST',
            body: JSON.stringify({ quantity: Number(quantity) }),
          }
        )
        const resJson = await res.json()
        if (!res.ok || resJson.status === 'error') {
          Swal.fire({ icon: 'error', title: 'Gagal', text: resJson.message })
          return
        }
        const idCartItem = resJson.data?.idCartItem as string | undefined
        if (!idCartItem) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Gagal membuat cart item. Silakan coba lagi',
          })
          return
        }
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Produk berhasil ditambahkan ke keranjang (${quantity} pcs). Lanjut ke checkout?`,
          showCancelButton: true,
          confirmButtonText: 'Ya, Checkout',
          cancelButtonText: 'Tetap di sini',
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = `/checkout?idCartItem=${idCartItem}`
          }
        })
      } catch (err) {
        const e = err as Error
        if (e.message === 'Token tidak ada') return
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.message })
      } finally {
        setLoading((prev) => ({ ...prev, buyNow: false }))
      }
    })
  }

  return (
    <div className="mx-auto p-3 md:p-2 lg:p-8 mt-4">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-800 mb-6">
        Detail Produk
      </h1>

      {/* konten utama detail produk */}
      <div className="flex flex-col md:flex-row gap-8 border-gray-400 rounded-md shadow-md p-6">
        <div className="w-full md:w-1/2">
          {dataProduct.images?.length > 0 && (
            <ImageCarousel images={dataProduct.images} name={dataProduct.name} />
          )}
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{dataProduct.name}</h1>
          <p className="text-gray-700">{dataProduct.description}</p>
          <p className="text-2xl text-black font-semibold">
            Rp{dataProduct.price.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center space-x-2 text-gray-600">
            <StarRating rating={dataProduct.rating} />
            <span className="text-gray-500 text-sm">
              | {dataProduct.totalReview} ulasan
            </span>
          </div>
          <div className="text-gray-700 mt-6 mb-6">
            <span className="font-bold p-2 border-gray-100 shadow-md rounded-md bg-gray-100">
              Stok: {dataProduct.stock}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={loading.addCart}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="inline w-4 h-4 mr-2" />
              {loading.addCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={loading.buyNow}
              onClick={handleBuyNow}
            >
              {loading.buyNow ? 'Memproses...' : 'Beli Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {/* Review */}
      <div className="mt-10">
        <ReviewList reviews={dataReview} />
      </div>

      {/* Toko */}
      <div className="mt-10">
        <StoreCard store={dataStore} />
      </div>

      {/* Produk terkait */}
      <div className="mt-10">
        <RelatedProduct products={relatedProducts} />
      </div>
    </div>
  )
}
