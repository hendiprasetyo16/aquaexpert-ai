import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-lg border border-slate-800">
        <AlertCircle className="h-10 w-10 text-teal-500" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">
          Halaman Sedang Dibangun
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Maaf, fitur atau halaman yang Anda tuju belum tersedia atau masih dalam tahap pengembangan.
        </p>
      </div>

      <Link href="/dashboard">
        <Button className="bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-900/20">
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}