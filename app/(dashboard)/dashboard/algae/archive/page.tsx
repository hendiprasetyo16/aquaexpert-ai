// app/(dashboard)/dashboard/algae/archive/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AlgaeArchiveList from "@/features/algae/components/AlgaeArchiveList";
import { Loader2, ArrowLeft, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AlgaeArchivePage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { dict, language } = useLanguage(); 

  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/algae");
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10 p-6 transition-colors duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-3">
            <Archive className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              {dict.algaeExpert?.algaeArchiveList?.title || (language === 'id' ? "Arsip Alga" : "Algae Archive")}
            </h2>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
            {dict.algaeExpert?.algaeArchiveList?.subtitle || (language === 'id' ? "Daftar alga yang dinonaktifkan." : "List of deactivated algae.")}
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/algae")} 
          className="shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {language === 'id' ? "Kembali" : "Back"}
        </Button>
      </div>

      <AlgaeArchiveList />
      
    </div>
  );
}