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
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (role === "user") return null;

  return (
    <div className="max-w-6xl space-y-6 pb-10 p-6">
      
      {/* HEADER ARSIP */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Archive className="h-8 w-8 text-slate-500" />
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">Arsip Tanaman</h2>
          </div>
          <p className="mt-2 text-slate-400 max-w-2xl">
            Daftar tanaman yang telah dinonaktifkan. Anda dapat memulihkannya kembali atau menghapusnya secara permanen dari sistem.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/plants")} 
          className="shrink-0 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Database
        </Button>
      </div>

      {/* RENDER LIST ARSIP */}
      <PlantArchiveList />
      
    </div>
  );
}