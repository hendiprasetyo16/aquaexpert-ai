// components/SetupStorage.tsx
"use client";

import { useState } from "react";
import { Loader2, FolderPlus, RefreshCw, Server, AlertTriangle, Database, HardDriveDownload, Leaf, Bug } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider";

const ADMIN_SECRET = "aquaexpert-sinkron-2024";

// Tipe aksi untuk modal
type ActionType = "plant_folder" | "plant_sync" | "algae_sync" | "db_backup" | "db_restore" | null;

export default function SetupStorage() {
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<ActionType>(null);
  const { dict, language } = useLanguage();

  // --- FUNGSI EKSEKUSI UTAMA ---
  const executeAction = async () => {
    if (!actionModal) return;
    setLoading(true);

    try {
      let endpoint = "";
      let method = "GET";
      let body = undefined;

      switch (actionModal) {
        case "plant_folder":
          endpoint = "/api/plants/create-folders";
          break;
        case "plant_sync":
          endpoint = "/api/plants/sync-images";
          break;
        case "algae_sync":
          endpoint = "/api/algae/sync-images";
          break;
        case "db_backup":
          endpoint = "/api/backup-restore";
          method = "POST";
          body = JSON.stringify({ action: "BACKUP" });
          break;
        case "db_restore":
          endpoint = "/api/backup-restore";
          method = "POST";
          body = JSON.stringify({ action: "RESTORE" });
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET
        },
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

  // Helper untuk mengambil deskripsi modal yang sesuai
  const getModalDescription = () => {
    switch (actionModal) {
      case "plant_folder": return dict.controlPanel.confirmFolder;
      case "plant_sync": return dict.controlPanel.confirmSync;
      case "algae_sync": return language === 'id' ? "Sinkronisasi otomatis URL gambar Alga ke database?" : "Auto-sync Algae image URLs to database?";
      case "db_backup": return dict.controlPanel.confirmBackup;
      case "db_restore": return dict.controlPanel.confirmRestore;
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 space-y-6">
      
      {/* WARNING BANNER */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-5 text-amber-800 dark:text-amber-200/80 transition-colors duration-300 shadow-sm">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="text-sm leading-relaxed">
          <strong className="block text-amber-700 dark:text-amber-400 font-bold text-base mb-1.5">{dict.controlPanel.warningTitle}</strong>
          {dict.controlPanel.warningDesc}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        
        {/* KARTU 1: MANAJEMEN TANAMAN (PLANTS) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{language === 'id' ? "Sistem Tanaman" : "Plant System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button onClick={() => setActionModal("plant_folder")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-all">
              <span className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-slate-400" />
                {dict.controlPanel.setupFolder}
              </span>
            </button>
            
            <div className="pt-2 mt-auto">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed">
                {dict.controlPanel.syncHint}
              </div>
              <button onClick={() => setActionModal("plant_sync")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {dict.controlPanel.syncImages}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 2: MANAJEMEN ALGAE */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-teal-50 dark:bg-teal-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-lg text-teal-600 dark:text-teal-400">
              <Bug className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{language === 'id' ? "Sistem Alga" : "Algae System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {language === 'id' ? "ℹ️ Alga tidak menggunakan sub-folder. Semua gambar berada di root bucket." : "ℹ️ Algae do not use sub-folders. All images are in the root bucket."}
            </div>
            
            <div className="pt-2 mt-auto">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed">
                {dict.controlPanel.syncHint}
              </div>
              <button onClick={() => setActionModal("algae_sync")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-900/20 px-4 py-3 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100 hover:border-teal-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {dict.controlPanel.syncImages}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 3: DISASTER RECOVERY (DATABASE CORE) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col md:col-span-2 xl:col-span-1">
          <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-slate-700 dark:text-slate-300">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{dict.controlPanel.disasterRecovery.split("(")[0]}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            
            {/* INFO BOX TAMBAHAN */}
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {dict.controlPanel.disasterHint || (language === 'id' ? "ℹ️ File Backup (JSON) akan disimpan otomatis di Storage. Fitur Restore akan menimpa seluruh isi database saat ini dengan file backup terbaru." : "ℹ️ Backup files (JSON) are automatically saved to Storage. The Restore feature will overwrite the current database with the latest backup file.")}
            </div>

            <div className="mt-auto space-y-3">
              <button onClick={() => setActionModal("db_backup")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 text-sm font-medium text-sky-700 dark:text-sky-400 hover:bg-sky-100 hover:border-sky-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {dict.controlPanel.backupDB}
                </span>
              </button>
              <button onClick={() => setActionModal("db_restore")} disabled={loading} className="flex w-full items-center justify-between rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 transition-all">
                <span className="flex items-center gap-2">
                  <HardDriveDownload className="h-4 w-4" />
                  {dict.controlPanel.restoreDB}
                </span>
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
                {dict.controlPanel.confirmModal?.title || "Konfirmasi Eksekusi"}
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {getModalDescription()}
            </p>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button 
                type="button" 
                disabled={loading} 
                onClick={() => setActionModal(null)} 
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {dict.controlPanel.confirmModal?.cancel || "Batal"}
              </button>
              <button 
                type="button" 
                disabled={loading} 
                onClick={executeAction} 
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-500 disabled:opacity-50 flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading 
                  ? (dict.controlPanel.confirmModal?.processing || "Memproses...") 
                  : (dict.controlPanel.confirmModal?.proceed || "Ya, Eksekusi")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}