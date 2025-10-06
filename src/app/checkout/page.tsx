'use client';

import { Suspense } from 'react';
import CheckoutPaymentContent from './CheckoutPaymentContent';

export default function CheckoutPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Memuat checkout...</div>}>
      <CheckoutPaymentContent />
    </Suspense>
  );
}
