'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface PaymentData {
  [key: string]: unknown;
}

interface Receiver {
  receiverName: string;
  receiverAddress: string;
}

interface Shipper {
  shipperStoreName: string;
  shipperName: string;
  shipperAddress: string;
}

interface PaymentResponse {
  orderId: string;
  totalPayment: number;
  receiver: Receiver;
  shipper: Shipper;
  courierCost: number;
  totalPriceProduct: number;
  paymentToken: string;
}

export default function PaymentPage() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<PaymentResponse | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load payment data dari sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem('paymentData');
    if (!data) {
      setError('Data pembayaran tidak ditemukan. Kembali ke halaman checkout.');
      return;
    }
    setPaymentData(JSON.parse(data));
  }, []);

  // Load Snap JS SDK
  const loadSnapScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('midtrans-snap-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `${process.env.NEXT_PUBLIC_MIDTRANS_URL}/snap/snap.js`;
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      script.id = 'midtrans-snap-script';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal load Snap JS'));
      document.body.appendChild(script);
    });
  };

  // Kirim request order ke backend dan panggil Snap
  const handlePaymentRequest = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      if (!token) throw new Error('Belum login');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/customer/checkout/post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      const data: PaymentResponse & { status ?: string; message?: string } = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Gagal membuat order');
      }

      setResponseData(data);

      // Load Snap JS
      await loadSnapScript();

      // Pastikan snap dan token ada
      if (window.snap && data.paymentToken) {
        window.snap.pay(data.paymentToken, {
          onSuccess: () => Swal.fire('Sukses', 'Pembayaran berhasil!', 'success'),
          onPending: () => Swal.fire('Pending', 'Pembayaran menunggu konfirmasi.', 'info'),
          onError: () => Swal.fire('Error', 'Pembayaran gagal.', 'error'),
          onClose: () => Swal.fire('Dibatalkan', 'User menutup popup pembayaran.', 'warning'),
        });
      } else {
        Swal.fire('Error', 'Snap belum siap, silakan coba beberapa detik lagi.', 'error');
      }
    } catch (err) {
      const e = err as Error;
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentData) handlePaymentRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData]);

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!paymentData) return <div className="p-6 text-gray-700">Menyiapkan data pembayaran...</div>;
  if (loading) return <div className="p-6 text-gray-700">Memproses pembayaran...</div>;
  if (!responseData) return null;

  const { orderId, totalPayment, receiver, shipper, courierCost, totalPriceProduct } = responseData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Ringkasan Pembayaran</h1>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-2">Order Info</h2>
        <div>ID Order: {orderId}</div>
        <div>Total Produk: Rp{totalPriceProduct.toLocaleString('id-ID')}</div>
        <div>Ongkir: Rp{courierCost.toLocaleString('id-ID')}</div>
        <div className="font-bold text-orange-600">
          Total Bayar: Rp{totalPayment.toLocaleString('id-ID')}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-2">Penerima</h2>
        <div>{receiver.receiverName}</div>
        <div>{receiver.receiverAddress}</div>
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-2">Pengirim / Toko</h2>
        <div>{shipper.shipperStoreName}</div>
        <div>{shipper.shipperName}</div>
        <div>{shipper.shipperAddress}</div>
      </div>

      <div className="mt-4">
        <button
          onClick={handlePaymentRequest}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
        >
          Bayar Sekarang
        </button>
      </div>
    </div>
  );
}
