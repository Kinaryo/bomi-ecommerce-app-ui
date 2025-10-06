import { Suspense } from 'react';
import OrderClient from './OrderClinet';

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-gray-600">Loading orders...</div>}>
      <OrderClient />
    </Suspense>
  );
}
