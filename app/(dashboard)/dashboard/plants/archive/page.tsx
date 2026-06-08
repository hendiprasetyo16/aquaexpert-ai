"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import PlantArchiveList from "@/features/plants/components/PlantArchiveList";
import { Loader2, ArrowLeft, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlantArchivePage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();

  // PROTEKSI ROUTE: User biasa tidak boleh mengakses arsip
  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/plants");
    }
  }, [role, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        {/* PERBAIKAN: Loader warna dinamis */}
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
      </div>
    );
  }

  if (role === "user") return null;

  return (
    <div className="max-w-6xl space-y-6 pb-10 p-6 transition-colors duration-300">
      
      {/* HEADER ARSIP */}
      {/* PERBAIKAN: border-b menjadi adaptif */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-3">
            {/* PERBAIKAN: Warna Ikon */}
            <Archive className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Arsip Tanaman</h2>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
            Daftar tanaman yang telah dinonaktifkan. Anda dapat memulihkannya kembali atau menghapusnya secara permanen dari sistem.
          </p>
        </div>

        {/* PERBAIKAN: Tombol Outline Adaptif */}
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/plants")} 
          className="shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Database
        </Button>
      </div>

      {/* RENDER LIST ARSIP */}
      <PlantArchiveList />
      
    </div>
  );
}