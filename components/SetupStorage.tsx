// components/SetupStorage.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, FolderPlus, RefreshCw, Server, AlertTriangle, Database, HardDriveDownload, Leaf, Bug, Container, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider";

const ADMIN_SECRET = "aquaexpert-sinkron-2024";

type ActionType = "plant_folder" | "plant_sync" | "algae_sync" | "aquarium_folder" | "aquarium_sync" | "db_backup" | "db_restore" | null;

export default function SetupStorage() {
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<ActionType>(null);
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  const cpDict = (dict as any)?.controlPanel || {};

  // Teks Hint Khusus Sinkronisasi (Pesan dari Bapak)
  const syncWarningText = lang === 'id' 
    ? "*Gunakan fitur ini HANYA jika Anda baru saja mengunggah gambar secara manual ke Supabase Storage. Sistem akan menghubungkan gambar tersebut ke database secara otomatis."
    : "*Only use this feature if you just manually uploaded images to Supabase Storage. The system will automatically link them to the database.";

  const executeAction = async () => {
    if (!actionModal) return;
    setLoading(true);

    try {
      let endpoint = "";
      let method = "GET";
      let body = undefined;

      switch (actionModal) {
        case "plant_folder": endpoint = "/api/plants/create-folders"; break;
        case "plant_sync": endpoint = "/api/plants/sync-images"; break;
        case "algae_sync": endpoint = "/api/algae/sync-images"; break;
        case "aquarium_folder": endpoint = "/api/aquariums/create-folders"; break;
        case "aquarium_sync": endpoint = "/api/aquariums/sync-images"; break;
        case "db_backup": 
          endpoint = "/api/backup-restore"; method = "POST"; body = JSON.stringify({ action: "BACKUP" }); break;
        case "db_restore": 
          endpoint = "/api/backup-restore"; method = "POST"; body = JSON.stringify({ action: "RESTORE" }); break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan atau server.");
    } finally {
      setLoading(false);
      setActionModal(null);
    }
  };

  const getModalDescription = () => {
    switch (actionModal) {
      case "plant_folder": return cpDict.confirmFolder || "Buat kerangka folder storage?";
      case "plant_sync": return cpDict.confirmSync || "Sinkronisasi otomatis URL gambar?";
      case "algae_sync": return lang === 'id' ? "Sinkronisasi URL gambar Alga ke database?" : "Auto-sync Algae image URLs?";
      case "aquarium_folder": return lang === 'id' ? "Siapkan folder 'covers' di bucket Aquariums?" : "Setup 'covers' folder in Aquariums bucket?";
      case "aquarium_sync": return lang === 'id' ? "Validasi integritas Storage Akuarium?" : "Validate Aquarium storage integrity?";
      case "db_backup": return cpDict.confirmBackup || "Backup database sekarang?";
      case "db_restore": return cpDict.confirmRestore || "Restore database? (Peringatan: Akan menimpa data)";
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 space-y-6">
      
      {/* WARNING BANNER */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-5 text-amber-800 dark:text-amber-200/80 transition-colors duration-300 shadow-sm">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="text-sm leading-relaxed">
          <strong className="block text-amber-700 dark:text-amber-400 font-bold text-base mb-1.5">{cpDict.warningTitle || "Peringatan Superadmin"}</strong>
          {cpDict.warningDesc || "Lakukan tindakan ini hanya saat diperlukan."}
        </div>
      </div>

      {/* PERBAIKAN GRID: Menjadi 3 Kolom di layar besar (lg:grid-cols-3) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* KARTU 1: MANAJEMEN TANAMAN */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Tanaman" : "Plant System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button onClick={() => setActionModal("plant_folder")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-all">
              <span className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-slate-400" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button onClick={() => setActionModal("plant_sync")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 2: SISTEM AKUARIUM */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-teal-50 dark:bg-teal-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-lg text-teal-600 dark:text-teal-400">
              <Container className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Akuarium" : "Aquarium System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button onClick={() => setActionModal("aquarium_folder")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-all">
              <span className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-slate-400" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto space-y-3">
              <button onClick={() => setActionModal("aquarium_sync")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-900/20 px-4 py-3 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100 hover:border-teal-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Validasi Storage" : "Validate Storage")}
                </span>
              </button>
              
              <Link href="/dashboard/admin-panel/aquariums" className="block">
                <button disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 hover:border-indigo-300 transition-all">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {lang === 'id' ? "Lihat Semua Akuarium" : "View All Aquariums"}
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* KARTU 3: MANAJEMEN ALGAE */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-teal-50 dark:bg-teal-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-lg text-teal-600 dark:text-teal-400">
              <Bug className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Alga" : "Algae System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {lang === 'id' ? "ℹ️ Alga tidak menggunakan sub-folder. Semua gambar berada di root bucket." : "ℹ️ Algae do not use sub-folders. All images are in the root bucket."}
            </div>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button onClick={() => setActionModal("algae_sync")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-900/20 px-4 py-3 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100 hover:border-teal-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 4: DISASTER RECOVERY (Membentang Penuh di Baris Bawah) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col mt-4">
          <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-slate-700 dark:text-slate-300">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{(cpDict.disasterRecovery || "Disaster Recovery").split("(")[0]}</h3>
          </div>
          <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
              {cpDict.disasterHint || (lang === 'id' ? "ℹ️ File Backup (JSON) disimpan otomatis di Storage Supabase. Fitur Restore akan menimpa seluruh isi database saat ini secara permanen." : "ℹ️ Backup files (JSON) are auto-saved. Restore will overwrite the current database.")}
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <button onClick={() => setActionModal("db_backup")} disabled={loading} className="flex-1 sm:flex-none items-center justify-center rounded-lg border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-900/20 px-6 py-3 text-sm font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-100 hover:border-sky-300 disabled:opacity-50 transition-all flex gap-2">
                <Database className="h-4 w-4" /> {cpDict.backupDB || "Backup Database"}
              </button>
              <button onClick={() => setActionModal("db_restore")} disabled={loading} className="flex-1 sm:flex-none items-center justify-center rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-6 py-3 text-sm font-bold text-red-700 dark:text-red-400 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 transition-all flex gap-2">
                <HardDriveDownload className="h-4 w-4" /> {cpDict.restoreDB || "Restore Database"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {cpDict.confirmModal?.title || "Konfirmasi Eksekusi"}
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {getModalDescription()}
            </p>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button 
                type="button" disabled={loading} onClick={() => setActionModal(null)} 
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {cpDict.confirmModal?.cancel || (lang === 'id' ? "Batal" : "Cancel")}
              </button>
              <button 
                type="button" disabled={loading} onClick={executeAction} 
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-500 disabled:opacity-50 flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? (cpDict.confirmModal?.processing || "Memproses...") : (cpDict.confirmModal?.proceed || "Ya, Eksekusi")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}