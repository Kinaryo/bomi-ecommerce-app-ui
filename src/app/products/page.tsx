import { Suspense } from "react";
import ProductsPageContent from "./ProductsPageContent";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Memuat produk...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
