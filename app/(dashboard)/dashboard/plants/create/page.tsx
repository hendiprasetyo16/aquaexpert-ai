"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import PlantForm from "@/features/plants/components/PlantForm";
import { Loader2 } from "lucide-react";

export default function CreatePlantPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();

  // PROTEKSI ROUTE: Jika user biasa mencoba masuk via URL, tendang kembali ke daftar tanaman
  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/plants");
    }
  }, [role, authLoading, router]);

  // Tampilkan loading spinner saat mengecek otentikasi
  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        {/* PERBAIKAN: Loader menjadi teal-600 di mode terang */}
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
      </div>
    );
  }

  // Jika yang login adalah user biasa, jangan render form sama sekali (karena sedang proses redirect)
  if (role === "user") return null;

  return (
    <div className="max-w-4xl space-y-6 pb-10 p-6 transition-colors duration-300">
      
      {/* HEADER HALAMAN */}
      <div>
        {/* PERBAIKAN: Warna teks disesuaikan */}
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Tambah Tanaman Baru</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Masukkan detail tanaman aquascape beserta gambarnya ke database.</p>
      </div>

      {/* FORM CREATE */}
      <PlantForm mode="create" />
      
    </div>
  );
}