"use client";

import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

import SetupStorage from "@/components/SetupStorage";

export default function DashboardPage() {
  // PANGGIL CONTEXT INSTAN
  const { user, profile, role, isLoading } = useAuth();

  // Tampilkan loading jika context masih sinkronisasi
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-3xl font-bold">
        Dashboard AquaExpert AI
      </h1>

      {profile && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-teal-400">Informasi Sesi Anda</h2>
          <div className="space-y-2 text-slate-300">
            <p><span className="font-medium text-slate-400">Nama:</span> {profile.full_name}</p>
            <p><span className="font-medium text-slate-400">Email:</span> {user?.email}</p>
            <p>
              <span className="font-medium text-slate-400">Role:</span>{" "}
              <span className="rounded-md bg-teal-900/50 px-2 py-1 text-xs text-teal-400">
                {role}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* INI ADALAH KOMPONEN SETUP STORAGE SEMENTARA */}
      {/*role === "super_admin" && (
        <div className="mt-8 border-t border-slate-800 pt-8">
          <SetupStorage />
        </div>
      )*/}
    </div>
  );
}