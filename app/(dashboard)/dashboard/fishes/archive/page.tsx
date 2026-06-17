// app/(dashboard)/dashboard/fishes/archive/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import FishArchiveList from "@/features/fishes/components/FishArchiveList";
import { Loader2, ArrowLeft, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider"; 

export default function FishArchivePage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { language } = useLanguage(); 

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
    <div className="max-w-6xl space-y-6 pb-10 p-6 transition-colors duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-3">
            <Archive className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
               {language === 'id' ? "Arsip Data Ikan" : "Fish Archive"}
            </h2>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
             {language === 'id' ? "Data ikan yang disembunyikan dari sistem utama. Anda dapat memulihkannya kembali." : "Fish data hidden from the main system. You can restore them anytime."}
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/fishes")} 
          className="shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {language === 'id' ? "Kembali" : "Go Back"}
        </Button>
      </div>

      <FishArchiveList />
      
    </div>
  );
}