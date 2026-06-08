"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import SetupStorage from "@/components/SetupStorage";

export default function AdminPanelPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  // KUNCI GEMBOK HALAMAN: Tendang jika bukan super_admin
  useEffect(() => {
    if (!isLoading && role !== "super_admin") {
      router.replace("/dashboard"); 
    }
  }, [role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Mencegah kedipan UI sebelum redirect berjalan
  if (role !== "super_admin") return null;

  return (
    <div className="space-y-6 p-6">
      {/* PERBAIKAN: border-slate-200 untuk mode terang, dark:border-slate-800 untuk mode gelap */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
        
        {/* PERBAIKAN UTAMA: text-gray-900 (mode terang) dan dark:text-white (mode gelap) */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Super Admin Control Panel
        </h1>
        
        {/* PERBAIKAN DESKRIPSI: text-slate-600 (mode terang) dan dark:text-slate-400 (mode gelap) */}
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Pusat kendali database, storage, dan sistem pakar AquaExpert.
        </p>
      </div>

      {/* Panggil komponen SetupStorage di sini */}
      <SetupStorage />
      
      {/* Nanti Anda bisa menambah komponen admin lain di sini */}
      {/* <ManageUsers /> */}
      {/* <SystemLogs /> */}
    </div>
  );
}