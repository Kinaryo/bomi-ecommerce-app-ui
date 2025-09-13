'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import Image from 'next/image';

// ======================
// Types
// ======================
type CartItemType = {
  idCartItem: number;
  quantity: number;
  total: number;
  product: {
    name: string;
    price: number;
    stock: number;
    primaryImage: string;
  };
};

type StoreType = {
  idStore: number;
  storeName: string;
  items: CartItemType[];
};

type CartType = {
  stores: StoreType[];
  grandTotal?: number;
};

type ApiCartResponse = {
  data: CartType;
};

// ======================
// ItemCard Component
// ======================
type ItemCardProps = {
  item: CartItemType;
  storeId: number;
  isChecked: boolean;
  toggleSelect: (storeId: number, item: CartItemType) => void;
  updateQuantity: (storeId: number, idCartItem: number, newQty: number) => void;
};

const ItemCard = memo(
  ({ item, storeId, isChecked, toggleSelect, updateQuantity }: ItemCardProps) => {
    const isOutOfStock = item.product.stock === 0;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isOutOfStock}
            onChange={() => toggleSelect(storeId, item)}
            className="mt-1 sm:mt-0"
          />

          <Image
            src={item.product.primaryImage}
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded-lg shadow-sm"
            width={64}
            height={64}
          />

          <div className="flex-1">
            <p className="font-medium text-gray-800 break-words">{item.product.name}</p>

            {item.product.stock === 0 ? (
              <p className="text-sm font-semibold text-red-600">Habis</p>
            ) : item.product.stock <= 2 ? (
              <p className="text-sm font-semibold text-orange-500">
                Stock: {item.product.stock}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Stock: {item.product.stock}</p>
            )}

            <p className="text-sm text-black font-semibold">
              Rp{item.product.price.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4 sm:justify-end sm:min-w-[200px]">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm w-[110px] justify-between bg-white">
            <button
              disabled={isOutOfStock || item.quantity <= 1}
              onClick={() => updateQuantity(storeId, item.idCartItem, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition text-lg font-bold rounded-md"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              disabled={isOutOfStock || item.quantity >= item.product.stock}
              onClick={() => updateQuantity(storeId, item.idCartItem, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition text-lg font-bold rounded-md"
            >
              +
            </button>
          </div>

          <p className="font-bold text-black text-right min-w-[80px] sm:w-[90px]">
            Rp{item.total.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    );
  }
);

// ✅ beri nama display agar linting hilang
ItemCard.displayName = 'ItemCard';

// ======================
// Main Cart Component
// ======================
export default function Cart() {
  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<CartItemType[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch Cart
  const getCart = useCallback(async () => {
    if (!token) {
      setError('Belum login, silakan login dulu.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/cart`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        const message = JSON.parse(text)?.message || 'Gagal fetch keranjang';
        throw new Error(message);
      }

      const data: ApiCartResponse = await res.json();
      setCart(data.data);
    } catch (err: unknown) {
      console.error('Error getCart:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getCart();
  }, [getCart]);

  // Toggle select item
  const toggleSelect = (storeId: number, item: CartItemType) => {
    if (item.product.stock === 0) {
      Swal.fire('Stok habis', 'Produk ini tidak bisa dipilih.', 'warning');
      return;
    }

    if (selectedStore === null) {
      setSelectedStore(storeId);
      setSelectedItems([item]);
      return;
    }

    if (selectedStore !== storeId) {
      Swal.fire('Perhatian', 'Hanya bisa memilih produk dari satu toko!', 'info');
      return;
    }

    if (selectedItems.find((i) => i.idCartItem === item.idCartItem)) {
      const newItems = selectedItems.filter((i) => i.idCartItem !== item.idCartItem);
      setSelectedItems(newItems);
      if (newItems.length === 0) setSelectedStore(null);
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Toggle select all (per toko)
  const toggleSelectAll = (store: StoreType) => {
    if (selectedStore === null || selectedStore === store.idStore) {
      const allSelected = store.items.every((i) =>
        selectedItems.some((si) => si.idCartItem === i.idCartItem)
      );

      if (allSelected) {
        setSelectedItems([]);
        setSelectedStore(null);
      } else {
        const validItems = store.items.filter((i) => i.product.stock > 0);
        setSelectedStore(store.idStore);
        setSelectedItems(validItems);
      }
    } else {
      Swal.fire('Perhatian', 'Hanya bisa memilih produk dari satu toko!', 'info');
    }
  };

  // Update quantity
  const updateQuantity = (storeId: number, idCartItem: number, newQty: number) => {
    if (newQty < 1) newQty = 1;

    const store = cart?.stores.find((s) => s.idStore === storeId);
    const item = store?.items.find((i) => i.idCartItem === idCartItem);
    if (!item) return;

    if (newQty > item.product.stock) {
      newQty = item.product.stock;
      Swal.fire(
        'Stok tidak cukup',
        `Stok tersedia hanya ${item.product.stock}`,
        'warning'
      );
    }

    setCart((prevCart) => {
      if (!prevCart) return prevCart;

      const updatedStores = prevCart.stores.map((store) => {
        if (store.idStore !== storeId) return store;
        return {
          ...store,
          items: store.items.map((i) =>
            i.idCartItem !== idCartItem
              ? i
              : { ...i, quantity: newQty, total: newQty * i.product.price }
          ),
        };
      });

      return { ...prevCart, stores: updatedStores };
    });

    setSelectedItems((prevSelected) =>
      prevSelected.map((i) =>
        i.idCartItem === idCartItem
          ? { ...i, quantity: newQty, total: newQty * i.product.price }
          : i
      )
    );

    if (token) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/update-cart-item/${idCartItem}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: newQty }),
        }
      ).catch((err: unknown) => {
        if (err instanceof Error) console.error('Error update quantity:', err.message);
      });
    }
  };

  const checkoutTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Swal.fire('Peringatan', 'Pilih produk terlebih dahulu!', 'info');
      return;
    }

    const outOfStock = selectedItems.find(
      (i) => i.quantity > i.product.stock || i.product.stock === 0
    );
    if (outOfStock) {
      Swal.fire(
        'Stok tidak cukup',
        `Produk "${outOfStock.product.name}" stoknya hanya ${outOfStock.product.stock}`,
        'error'
      );
      return;
    }

    const ids = selectedItems.map((i) => i.idCartItem);
    const query = new URLSearchParams({ items: ids.join(',') });
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <div className="mx-auto p-6 space-y-6 mt-20 mb-20">
      <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        Keranjang Saya
      </h1>

      {error && <div className="text-center text-red-500 mt-10">{error}</div>}
      {loading && <div className="p-6 text-gray-700 text-center">Memuat keranjang...</div>}

      {!loading && !error && (!cart || !cart.stores || cart.stores.length === 0) && (
        <div className="flex flex-col items-center justify-center mt-10">
          <p className="text-sx p-2 border border-gray-300 shadow-sm rounded-md">
            Belum ada produk ditambahkan
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        cart &&
        cart.stores &&
        cart.stores.length > 0 && (
          <>
            {cart.stores.map((store) => {
              const allChecked =
                selectedStore === store.idStore &&
                store.items.every((i) =>
                  selectedItems.some((si) => si.idCartItem === i.idCartItem)
                );

              return (
                <div
                  key={store.idStore}
                  className="bg-white rounded-xl shadow-lg p-5 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => toggleSelectAll(store)}
                    />
                    <h2 className="text-xl font-semibold text-gray-800">
                      {store.storeName}
                    </h2>
                  </div>

                  {store.items.map((item) => (
                    <ItemCard
                      key={item.idCartItem}
                      item={item}
                      storeId={store.idStore}
                      isChecked={selectedItems.some(
                        (i) => i.idCartItem === item.idCartItem
                      )}
                      toggleSelect={toggleSelect}
                      updateQuantity={updateQuantity}
                    />
                  ))}

                  <div className="flex justify-between items-center font-semibold text-black text-lg">
                    <span>Subtotal</span>
                    <span>
                      Rp
                      {store.items.reduce((s, i) => s + i.total, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}

            <AnimatePresence>
              {selectedItems.length > 0 && (
                <motion.div
                  className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-xl z-50 rounded-t-xl"
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="flex justify-between items-center font-semibold text-black mb-3 text-lg">
                    <span>Total Produk Dipilih</span>
                    <span>Rp{checkoutTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-blue-400 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Checkout ({selectedItems.length} produk)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
    </div>
  );
}
