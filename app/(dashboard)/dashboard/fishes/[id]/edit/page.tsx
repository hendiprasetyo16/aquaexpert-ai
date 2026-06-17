// app/(dashboard)/dashboard/fishes/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; 

import FishForm from "@/features/fishes/components/FishForm";
import { getFishById } from "@/features/fishes/repositories/fish.repository";
import { Fish as FishType } from "@/features/fishes/types/fish.types";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; 

export default function EditFishPage() {
  const params = useParams();
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth(); 
  const { language } = useLanguage(); 

  const [fish, setFish] = useState<FishType | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/fishes");
    }
  }, [role, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFishById(params.id as string);
        setFish(data);
      } catch (error) {
        console.error("Gagal memuat data ikan:", error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  if (role === "user") return null;

  if (!fish) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
        <p>{language === 'id' ? "Data ikan tidak ditemukan." : "Fish data not found."}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
        >
          {language === 'id' ? "Kembali" : "Go Back"}
        </button>
      </div>
    );
  }

  const displayName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {language === 'id' ? "Edit Data Ikan" : "Edit Fish Data"}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {language === 'id' ? "Memperbarui informasi untuk spesies" : "Updating information for"} <span className="font-semibold text-gray-900 dark:text-slate-200">{displayName}</span>.
        </p>
      </div>
      <FishForm mode="edit" fish={fish} />
    </div>
  );
}