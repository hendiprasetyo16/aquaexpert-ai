// app/(dashboard)/dashboard/diseases/[id]/edit/EditDiseaseClient.tsx
"use client";

import { DiseaseForm } from "@/features/diseases/components/DiseaseForm";
import type { Disease } from "@/features/diseases/types/disease.types";
import { Edit, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider"; // 👈 Pakai hook andalanmu

interface Props {
  data: Disease | null;
  error: any;
}

export default function EditDiseaseClient({ data, error }: Props) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  // Deteksi nama dinamis sesuai bahasa yang aktif
  const diseaseName = data ? (lang === "en" && data.name_en ? data.name_en : data.name_id) : "";

  // ERROR STATE DENGAN TOMBOL KEMBALI (DUA BAHASA)
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500 opacity-80" />
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {lang === 'id' ? "Data Tidak Ditemukan" : "Data Not Found"}
          </h2>
          <p className="text-slate-500 mt-2">
            {lang === 'id' 
              ? "Gagal mengambil data dari database. Pastikan ID penyakit valid." 
              : "Failed to retrieve data from the database. Make sure the disease ID is valid."}
          </p>
        </div>
        <Link 
          href="/dashboard/diseases" 
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> {lang === 'id' ? "Kembali ke Tabel" : "Back to Table"}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
              <Edit className="w-8 h-8" />
              {lang === 'id' ? "Edit Data Patogen" : "Edit Pathogen Data"}
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
              {lang === 'id' ? (
                <>Melakukan pembaruan pada data penyakit <strong className="text-slate-700 dark:text-slate-300">{diseaseName}</strong>.</>
              ) : (
                <>Updating disease data for <strong className="text-slate-700 dark:text-slate-300">{diseaseName}</strong>.</>
              )}
            </p>
          </div>
          
          <Link href="/dashboard/diseases" className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> {lang === 'id' ? "Kembali" : "Back"}
          </Link>
        </div>

        <DiseaseForm mode="edit" initialData={data as Disease} />
        
      </div>
    </div>
  );
}