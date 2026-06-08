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
    // text-white diganti menjadi text-foreground agar otomatis hitam di mode terang dan putih di mode gelap
    <div className="p-6 text-foreground space-y-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold">
        Dashboard AquaExpert AI
      </h1>

      {profile && (
        // Latar kotak disesuaikan: Terang = bg-white, Gelap = bg-slate-900/50
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-4 text-xl font-semibold text-teal-600 dark:text-teal-400">Informasi Sesi Anda</h2>
          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <p><span className="font-medium text-slate-500 dark:text-slate-400">Nama:</span> {profile.full_name}</p>
            <p><span className="font-medium text-slate-500 dark:text-slate-400">Email:</span> {user?.email}</p>
            <p className="flex items-center gap-2 mt-2">
              <span className="font-medium text-slate-500 dark:text-slate-400">Role:</span>
              {/* Lencana (Badge) Role disesuaikan warnanya */}
              <span className="rounded-md bg-teal-100 dark:bg-teal-900/50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                {role}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* INI ADALAH KOMPONEN SETUP STORAGE SEMENTARA */}
      {/* Jika kamu ingin membukanya, hapus komentar di bawah ini */}
      {/* role === "super_admin" && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors duration-300">
          <SetupStorage />
        </div>
      ) */}
    </div>
  );
}