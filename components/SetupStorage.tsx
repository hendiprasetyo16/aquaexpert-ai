"use client";

import { useState } from "react";
import { Loader2, FolderPlus, RefreshCw, Server, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SetupStorage() {
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);

  // 1. PANGGIL API BUAT FOLDER
  const handleCreateFolders = async () => {
    const confirm = window.confirm("Yakin ingin membuat 120 folder di Supabase Storage?");
    if (!confirm) return;

    setLoadingFolder(true);
    try {
      const response = await fetch("/api/create-folders?secret=aquaexpert-sinkron-2024", {
        method: "GET",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error("Gagal membuat folder: " + data.error);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingFolder(false);
    }
  };

  // 2. PANGGIL API SYNC GAMBAR
  const handleSyncImages = async () => {
    const confirm = window.confirm("Yakin ingin mensinkronkan ulang URL gambar ke Database?");
    if (!confirm) return;

    setLoadingSync(true);
    try {
      const response = await fetch("/api/sync-images?secret=aquaexpert-sinkron-2024", {
        method: "GET",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error("Gagal sinkronisasi: " + data.error);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        
        {/* Ornamen Latar Belakang (Glow) */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-900/20 blur-3xl pointer-events-none"></div>

        {/* Header Card */}
        <div className="relative border-b border-slate-800 bg-slate-950/40 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400 shadow-inner">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Super Admin Control Panel</h3>
              <p className="mt-1 text-sm text-slate-400">
                Pusat eksekusi skrip massal untuk Database & Storage AquaExpert.
              </p>
            </div>
          </div>
        </div>

        {/* Body Card */}
        <div className="relative px-6 py-6 sm:px-8 sm:py-8 space-y-8">
          
          {/* Box Peringatan */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-amber-900/10 p-4 text-amber-200/80">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block text-amber-400 font-semibold mb-1">Perhatian Eksekusi Server</strong>
              Proses di bawah ini akan memanggil API Server untuk mengeksekusi operasi massal secara langsung ke Supabase. Harap pastikan koneksi stabil saat proses berjalan.
            </div>
          </div>

          {/* Area Tombol Aksi */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tombol Buat Folder */}
            <div className="group relative">
              <button
                type="button"
                onClick={handleCreateFolders}
                disabled={loadingFolder || loadingSync}
                className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-6 py-4 font-medium text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:hover:bg-slate-800 disabled:hover:border-slate-700"
              >
                {loadingFolder ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <FolderPlus className="h-5 w-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                )}
                {loadingFolder ? "Memproses..." : "Setup Folder Storage"}
              </button>
            </div>

            {/* Tombol Sync Gambar */}
            <div className="group relative">
              <button
                type="button"
                onClick={handleSyncImages}
                disabled={loadingFolder || loadingSync}
                className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-4 font-medium text-white shadow-lg shadow-teal-900/20 transition-all hover:bg-teal-500 hover:shadow-teal-900/40 disabled:opacity-50 disabled:hover:bg-teal-600"
              >
                {loadingSync ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {loadingSync ? "Mensinkronkan..." : "Auto-Sync Gambar Database"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}