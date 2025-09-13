// app/products/[slug]/page.tsx
import React from "react";
import ClientProduct from "./ClientProduct"; // file client component (di bawah)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchProductServer(slug: string) {
  const res = await fetch(`${API_BASE}/user/products/${slug}`, { next: { revalidate: 10 } });
  if (!res.ok) {
    // bisa handle 404 / error custom
    return null;
  }
  const json = await res.json();
  return json.data;
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const initialData = await fetchProductServer(slug);

  // jika ingin handle missing product server-side
  if (!initialData) {
    return <div className="p-6">Produk tidak ditemukan</div>;
  }

  // render client component dengan initial data
  return <ClientProduct initialData={initialData} />;
}
