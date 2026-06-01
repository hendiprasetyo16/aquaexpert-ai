import PlantForm from "@/features/plants/components/PlantForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreatePlantPage() {
  return (
    <div className="p-6">
      <div className="mb-6 max-w-3xl space-y-4">
        <Link 
          href="/plants" 
          className="inline-flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tanaman
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Tambah Tanaman Baru</h1>
          <p className="mt-1 text-slate-400">Masukkan detail tanaman aquascape beserta gambarnya.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <PlantForm />
      </div>
    </div>
  );
}