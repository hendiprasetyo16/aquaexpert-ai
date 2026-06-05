// app/(dashboard)/dashboard/admin-panel/page.tsx
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
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white">Super Admin Control Panel</h1>
        <p className="text-slate-400 mt-2">Pusat kendali database, storage, dan sistem pakar AquaExpert.</p>
      </div>

      {/* Panggil komponen SetupStorage di sini */}
      <SetupStorage />
      
      {/* Nanti Anda bisa menambah komponen admin lain di sini */}
      {/* <ManageUsers /> */}
      {/* <SystemLogs /> */}
    </div>
  );
}