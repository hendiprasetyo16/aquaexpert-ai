// app/(dashboard)/dashboard/fishes/create/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import FishForm from "@/features/fishes/components/FishForm";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; 

export default function CreateFishPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { dict, language } = useLanguage(); 

  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/fishes");
    }
  }, [role, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  if (role === "user") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 transition-colors duration-300">
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {language === 'id' ? "Tambah Data Ikan" : "Add New Fish"}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {language === 'id' ? "Masukkan detail spesies ikan baru ke dalam ensiklopedia." : "Enter details for a new fish species into the encyclopedia."}
        </p>
      </div>

      <FishForm mode="create" />
      
    </div>
  );
}