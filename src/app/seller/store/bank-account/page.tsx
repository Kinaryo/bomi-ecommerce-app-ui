"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export default function BankAccountPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountHolder: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [formDisabled, setFormDisabled] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  const handleBackToList = () => {
    router.push("/seller/store");
  };

  // bungkus fetchData pakai useCallback supaya tidak berubah-ubah
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBankAccounts(data.data);

        if (data.data.length > 0) {
          const acc = data.data[0];
          setForm({
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            accountHolder: acc.accountHolder,
          });
          setEditId(acc.id);
          setFormDisabled(true);
        } else {
          setForm({ bankName: "", accountNumber: "", accountHolder: "" });
          setEditId(null);
          setFormDisabled(false);
        }
      } else {
        Swal.fire("Error", data.message || "Gagal mengambil data rekening", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan server", "error");
    } finally {
      setLoading(false);
    }
  }, [token]); // dependensi token supaya lint aman

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login untuk mengakses halaman bank account.",
        confirmButtonText: "Login",
      }).then(() => (window.location.href = "/login"));
      return;
    }
    fetchData();
  }, [fetchData, token]); // dependensi fetchData & token supaya lint aman

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const isUpdate = bankAccounts.length > 0;
    const action = isUpdate ? "Update" : "Tambah";

    const confirm = await Swal.fire({
      title: `${action} rekening?`,
      text: `Apakah kamu yakin ingin ${action.toLowerCase()} rekening ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
    });
    if (!confirm.isConfirmed) return;

    const url =
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/bank-accounts` +
      (isUpdate ? `/${editId}` : "");
    const method = isUpdate ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        Swal.fire("Berhasil", `Rekening berhasil ${isUpdate ? "diperbarui" : "ditambahkan"}`, "success");
        fetchData();
      } else {
        Swal.fire("Gagal", data.message || `Gagal ${action.toLowerCase()} rekening`, "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan server", "error");
    }
  };

  const handleEditMode = () => setFormDisabled(false);

  const handleCancel = () => {
    fetchData();
  };

  const handleDelete = async () => {
    if (!token || !editId) return;
    const confirm = await Swal.fire({
      title: "Hapus rekening?",
      text: "Data tidak dapat dikembalikan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seller/bank-accounts/${editId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        Swal.fire("Berhasil", "Rekening dihapus", "success");
        fetchData();
      } else {
        Swal.fire("Gagal", data.message || "Gagal hapus rekening", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan server", "error");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Memuat data rekening…</div>;
  }

  return (
    <div className="p-6 md:p-10 mt-20 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 justify-center items-center flex">Bank Account</h1>

      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition shadow-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> <span>Kembali ke Store</span>
      </button>

      {bankAccounts.length === 0 ? (
        <div className="mb-4 text-yellow-700 bg-yellow-100 p-3 rounded">
          Anda belum memiliki rekening. Silakan tambahkan rekening baru.
        </div>
      ) : (
        <div className="mb-4 text-blue-700 bg-blue-100 p-3 rounded">
          Anda sudah memiliki rekening. Anda dapat mengeditnya.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Nama Bank</label>
          <input
            disabled={formDisabled}
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nomor Rekening</label>
          <input
            disabled={formDisabled}
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Atas Nama</label>
          <input
            disabled={formDisabled}
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.accountHolder}
            onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
            required
          />
        </div>

        {formDisabled ? (
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleEditMode}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Hapus
            </button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
              {bankAccounts.length > 0 ? "Update Rekening" : "Tambah Rekening"}
            </button>
            {bankAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                Batal
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
