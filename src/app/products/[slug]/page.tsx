// app/products/[slug]/page.tsx
import React from "react";
import ClientProduct from "./ClientProduct";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchProductServer(slug: string) {
  const res = await fetch(`${API_BASE}/user/products/${slug}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.data;
}

// 👇 params sekarang promise, harus di-await
export default async function ProductPage(
  props: { params: Promise<{ slug: string }> } // ubah tipe params jadi Promise
) {
  const { slug } = await props.params; // ✅ di-await dulu
  const initialData = await fetchProductServer(slug);

  if (!initialData) {
    return <div className="p-6">Produk tidak ditemukan</div>;
  }

  return <ClientProduct initialData={initialData} />;
}
