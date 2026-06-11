"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PlantForm from "@/features/plants/components/PlantForm";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- PANGGIL KAMUS

export default function CreatePlantPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { dict } = useLanguage(); // <-- INISIALISASI KAMUS

  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/plants");
    }
  }, [role, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
      </div>
    );
  }

  if (role === "user") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 transition-colors duration-300">
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {dict.plantCreate.title}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {dict.plantCreate.subtitle}
        </p>
      </div>

      <PlantForm mode="create" />
      
    </div>
  );
}