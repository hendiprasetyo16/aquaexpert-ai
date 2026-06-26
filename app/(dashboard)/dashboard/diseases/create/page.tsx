// app/(dashboard)/dashboard/diseases/create/page.tsx
import { DiseaseForm } from "@/features/diseases/components/DiseaseForm";
import { Stethoscope } from "lucide-react";

export default function AddDiseasePage() {
  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-3">
            <Stethoscope className="w-8 h-8" />
            Tambah Database Patogen
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
            Masukkan detail penyakit, gejala klinis, dan instruksi pengobatan baru ke dalam Sistem Pakar.
          </p>
        </div>

        {/* Memanggil komponen Form dalam mode Create */}
        <DiseaseForm mode="create" />
        
      </div>
    </div>
  );
}