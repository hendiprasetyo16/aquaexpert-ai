"use client";

import { useState } from "react";
import { Loader2, FolderPlus, RefreshCw, Server, AlertTriangle, Database, HardDriveDownload } from "lucide-react";
import toast from "react-hot-toast";

// Kunci rahasia (Pastikan sama persis dengan yang ada di API Route)
const ADMIN_SECRET = "aquaexpert-sinkron-2024";

export default function SetupStorage() {
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);

  // 1. PANGGIL API BUAT FOLDER
  const handleCreateFolders = async () => {
    const confirm = window.confirm("Yakin ingin membuat 120 folder di Supabase Storage?");
    if (!confirm) return;

    setLoadingFolder(true);
    try {
      // PERBAIKAN: Menggunakan Headers untuk mengirim Secret Key
      const response = await fetch("/api/create-folders", {
        method: "GET",
        headers: { "x-admin-secret": ADMIN_SECRET }
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
      const response = await fetch("/api/sync-images", {
        method: "GET",
        headers: { "x-admin-secret": ADMIN_SECRET }
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

  // 3. PANGGIL API BACKUP DATABASE (JSON SAJA)
  const handleBackup = async () => {
    if (!window.confirm("Backup seluruh teks Database ke file JSON di Supabase Storage? (Ini TIDAK mengunduh gambar fisik).")) return;
    
    setLoadingBackup(true);
    try {
      const res = await fetch("/api/backup-restore", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET
        },
        body: JSON.stringify({ action: "BACKUP" }) 
      });
      const data = await res.json();
      data.success ? toast.success(data.message) : toast.error(data.error);
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingBackup(false);
    }
  };

  // 4. PANGGIL API RESTORE DATABASE (JSON SAJA)
  const handleRestore = async () => {
    if (!window.confirm("PERINGATAN! RESTORE akan menimpa data saat ini dengan file backup JSON terakhir. Lanjutkan?")) return;
    
    setLoadingBackup(true);
    try {
      const res = await fetch("/api/backup-restore", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET
        },
        body: JSON.stringify({ action: "RESTORE" }) 
      });
      const data = await res.json();
      data.success ? toast.success(data.message) : toast.error(data.error);
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingBackup(false);
    }
  };

  const isAnyLoading = loadingFolder || loadingSync || loadingBackup;

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
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
              Proses di bawah ini akan mengeksekusi operasi massal secara langsung ke Supabase. Harap pastikan koneksi internet Anda stabil. Fitur Backup hanya mengamankan metadata teks (JSON), bukan file gambar fisik.
            </div>
          </div>

          {/* Area Tombol Storage (Baris 1) */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">1. Manajemen Storage</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group relative">
                <button
                  type="button"
                  onClick={handleCreateFolders}
                  disabled={isAnyLoading}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-6 py-4 font-medium text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50"
                >
                  {loadingFolder ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <FolderPlus className="h-5 w-5 text-slate-400" />}
                  {loadingFolder ? "Memproses..." : "Setup Folder Storage"}
                </button>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  onClick={handleSyncImages}
                  disabled={isAnyLoading}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-4 font-medium text-white shadow-lg shadow-teal-900/20 transition-all hover:bg-teal-500 hover:shadow-teal-900/40 disabled:opacity-50"
                >
                  {loadingSync ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                  {loadingSync ? "Mensinkronkan..." : "Auto-Sync Gambar"}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Area Tombol Backup Database (Baris 2) */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">2. Disaster Recovery (Database)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group relative">
                <button
                  type="button"
                  onClick={handleBackup}
                  disabled={isAnyLoading}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-sky-900/50 bg-sky-950/30 px-6 py-4 font-medium text-sky-400 transition-all hover:bg-sky-900/50 hover:border-sky-700/50 disabled:opacity-50"
                >
                  {loadingBackup ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                  Backup Database (JSON)
                </button>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isAnyLoading}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-6 py-4 font-medium text-red-400 transition-all hover:bg-red-900/50 hover:border-red-700/50 disabled:opacity-50"
                >
                  {loadingBackup ? <Loader2 className="h-5 w-5 animate-spin" /> : <HardDriveDownload className="h-5 w-5" />}
                  Restore Database (JSON)
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}