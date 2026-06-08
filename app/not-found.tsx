import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center">
      {/* PERBAIKAN: Lingkaran ikon sekarang adaptif bg-slate-100 / dark:bg-slate-900 */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <AlertCircle className="h-10 w-10 text-teal-600 dark:text-teal-500" />
      </div>
      
      <div className="space-y-2">
        {/* PERBAIKAN: Judul diubah ke text-gray-900 agar hitam di mode terang */}
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          Halaman Sedang Dibangun
        </h2>
        {/* PERBAIKAN: Deskripsi menggunakan text-slate-600 di mode terang */}
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Maaf, fitur atau halaman yang Anda tuju belum tersedia atau masih dalam tahap pengembangan.
        </p>
      </div>

      <Link href="/dashboard">
        <Button className="bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-600/10 dark:shadow-teal-900/20">
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}