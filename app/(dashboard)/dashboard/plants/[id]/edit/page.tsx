"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; 

import PlantForm from "@/features/plants/components/PlantForm";
import { getPlantById } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import { Loader2 } from "lucide-react";

export default function EditPlantPage() {
  const params = useParams();
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth(); 

  const [plant, setPlant] = useState<Plant | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // 1. PROTEKSI ROUTE: Jika user biasa mencoba masuk via URL, tendang ke list!
  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/plants");
    }
  }, [role, authLoading, router]);

  // 2. AMBIL DATA TANAMAN DARI DATABASE
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPlantById(params.id as string);
        setPlant(data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
      </div>
    );
  }

  if (role === "user") return null;

  if (!plant) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
        <p>Data tanaman tidak ditemukan.</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 font-medium text-teal-600 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    // PERBAIKAN: Ditambahkan mx-auto (ke tengah), px-4 sm:px-6 lg:px-8 (padding kiri-kanan), dan pt-6 (padding atas)
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 transition-colors duration-300">
      
      {/* HEADER HALAMAN */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Edit Tanaman</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Perbarui informasi detail untuk <span className="font-semibold text-gray-900 dark:text-slate-200">{plant.name}</span>.
        </p>
      </div>

      {/* FORM EDIT */}
      <PlantForm mode="edit" plant={plant} />
      
    </div>
  );
}