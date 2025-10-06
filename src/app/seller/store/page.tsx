import { Suspense } from "react";
import StorePageContent from "./StorePageContent";

export default function StorePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Memuat toko...</div>}>
      <StorePageContent />
    </Suspense>
  );
}
