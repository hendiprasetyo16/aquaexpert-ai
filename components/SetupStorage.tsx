// components/SetupStorage.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Loader2, FolderPlus, RefreshCw, Server, AlertTriangle, 
  Database, HardDriveDownload, Leaf, Bug, Container, Eye, Fish, Activity, BookOpen, ChevronDown, ChevronUp, User
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider";

const ADMIN_SECRET = "aquaexpert-sinkron-2024";

type ActionType = "plant_folder" | "plant_sync" | "algae_folder" | "algae_sync" | "fish_folder" | "fish_sync" | "disease_sync" | "aquarium_folder" | "aquarium_sync" | "avatar_folder" | "avatar_sync" | "db_backup" | "db_restore" | null;

interface ControlPanelDict {
  warningTitle?: string;
  warningDesc?: string;
  setupFolder?: string;
  syncImages?: string;
  disasterRecovery?: string;
  disasterHint?: string;
  backupDB?: string;
  restoreDB?: string;
  confirmFolder?: string;
  confirmSync?: string;
  confirmBackup?: string;
  confirmRestore?: string;
  confirmModal?: {
    title?: string;
    cancel?: string;
    proceed?: string;
    processing?: string;
  };
}

export default function SetupStorage() {
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<ActionType>(null);
  const [showGuide, setShowGuide] = useState(false); 

  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  const dictRoot = dict as { controlPanel?: ControlPanelDict };
  const cpDict: ControlPanelDict = dictRoot?.controlPanel || {};

  const syncWarningText = lang === 'id' 
    ? "*Gunakan fitur ini HANYA jika Anda baru saja mengunggah gambar secara manual ke Supabase Storage. Sistem akan menghubungkan gambar tersebut ke database secara otomatis."
    : "*Only use this feature if you just manually uploaded images to Supabase Storage. The system will automatically link them to the database.";

  const executeAction = async () => {
    if (!actionModal) return;
    setLoading(true);

    try {
      let endpoint = "";
      let method = "GET";
      let body: string | undefined = undefined;

      switch (actionModal) {
        case "plant_folder": endpoint = "/api/plants/create-folders"; break;
        case "plant_sync": endpoint = "/api/plants/sync-images"; break;
        case "algae_folder": endpoint = "/api/algae/create-folders"; break;
        case "algae_sync": endpoint = "/api/algae/sync-images"; break;
        case "fish_folder": endpoint = "/api/fishes/create-folders"; break;
        case "fish_sync": endpoint = "/api/fishes/sync-images"; break;
        case "disease_sync": endpoint = "/api/diseases/sync-images"; break;
        case "aquarium_folder": endpoint = "/api/aquariums/create-folders"; break;
        case "aquarium_sync": endpoint = "/api/aquariums/sync-images"; break;
        case "avatar_folder": endpoint = "/api/avatars/create-folders"; break;
        case "avatar_sync": endpoint = "/api/avatars/sync-images"; break;
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
    } catch (error: unknown) {
      if (error instanceof Error) {
         console.error("Setup Action Error:", error.message);
      }
      toast.error("Terjadi kesalahan jaringan atau server.");
    } finally {
      setLoading(false);
      setActionModal(null);
    }
  };

  const getModalDescription = () => {
    switch (actionModal) {
      case "plant_folder": return cpDict.confirmFolder || "Buat kerangka folder storage Tanaman?";
      case "plant_sync": return cpDict.confirmSync || "Sinkronisasi otomatis URL gambar Tanaman?";
      case "fish_folder": return lang === 'id' ? "Buat kerangka folder storage Ikan?" : "Create Fish storage folders?";
      case "fish_sync": return lang === 'id' ? "Sinkronisasi URL gambar Ikan ke database?" : "Auto-sync Fish image URLs?";
      case "algae_folder": return lang === 'id' ? "Buat kerangka folder storage Alga?" : "Create Algae storage folders?";
      case "algae_sync": return lang === 'id' ? "Sinkronisasi URL gambar Alga ke database?" : "Auto-sync Algae image URLs?";
      case "disease_sync": return lang === 'id' ? "Sinkronisasi URL gambar Penyakit ke database?" : "Auto-sync Disease image URLs?";
      case "aquarium_folder": return lang === 'id' ? "Siapkan folder 'covers' di bucket Aquariums?" : "Setup 'covers' folder in Aquariums bucket?";
      case "aquarium_sync": return lang === 'id' ? "Validasi integritas Storage Akuarium?" : "Validate Aquarium storage integrity?";
      case "avatar_folder": return lang === 'id' ? "Inisialisasi bucket 'avatars' untuk pengguna?" : "Initialize 'avatars' bucket for users?";
      case "avatar_sync": return lang === 'id' ? "Validasi integritas Storage Avatar?" : "Validate Avatar storage integrity?";
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
        <div className="text-sm leading-relaxed flex-1">
          <strong className="block text-amber-700 dark:text-amber-400 font-bold text-base mb-1.5">{cpDict.warningTitle || "Peringatan Superadmin"}</strong>
          {cpDict.warningDesc || "Lakukan tindakan ini hanya saat diperlukan."}
        </div>
      </div>

      {/* ADMIN CHEAT SHEET (PANDUAN MEMORI ADMIN) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            {lang === 'id' ? "📖 Panduan Memori Admin (Cheat Sheet)" : "📖 Admin Memory Guide (Cheat Sheet)"}
          </div>
          {showGuide ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {showGuide && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 space-y-4 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-black text-indigo-600 dark:text-indigo-400">1. Kenapa ada "Setup Folder"?</h4>
                <p className="leading-relaxed">Supabase Storage tidak mengizinkan pembuatan folder kosong. Tombol ini otomatis membuat file <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">.keep</code> tersembunyi berdasarkan slug di database agar folder terbentuk masal. Tanpa ini, admin harus membuat ratusan folder manual.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-emerald-600 dark:text-emerald-400">2. Kenapa ada "Sync Images"?</h4>
                <p className="leading-relaxed">Setelah admin men-drag-and-drop puluhan gambar ke folder Supabase secara manual, database SQL belum tahu URL gambar tersebut. Tombol ini menyuruh server membaca semua gambar di Storage lalu mencatat URL-nya secara otomatis ke kolom <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">image_url</code> database.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <h4 className="font-black text-rose-600 dark:text-rose-400">3. Apa fungsi API_SECRET_KEY?</h4>
                <p className="leading-relaxed">Route API ini melakukan operasi masif. Jika terekspos publik, hacker bisa memicu server down. Kunci rahasia (yang diatur dalam variabel environment <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-bold text-rose-500">API_SECRET_KEY</code>) bertindak sebagai gembok antar muka UI dan Backend agar perintah hanya sah jika ditekan dari panel ini.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* KARTU 1: MANAJEMEN IKAN */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <Fish className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Ikan" : "Fish System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button 
              onClick={() => setActionModal("fish_folder")} 
              disabled={loading} 
              className="group flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <FolderPlus className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button 
                onClick={() => setActionModal("fish_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 hover:border-blue-400 dark:hover:bg-blue-800 dark:hover:border-blue-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 2: MANAJEMEN TANAMAN */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Tanaman" : "Plant System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button 
              onClick={() => setActionModal("plant_folder")} 
              disabled={loading} 
              className="group flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <FolderPlus className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button 
                onClick={() => setActionModal("plant_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/40 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-800 dark:hover:border-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-emerald-900 dark:group-hover:text-emerald-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 3: MANAJEMEN ALGAE */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg text-amber-600 dark:text-amber-400">
              <Bug className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Alga" : "Algae System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button 
              onClick={() => setActionModal("algae_folder")} 
              disabled={loading} 
              className="group flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <FolderPlus className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button 
                onClick={() => setActionModal("algae_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/40 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:hover:bg-amber-800 dark:hover:border-amber-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 4: MANAJEMEN PENYAKIT / DISEASES */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-rose-100 dark:bg-rose-900/50 p-2 rounded-lg text-rose-600 dark:text-rose-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Penyakit" : "Disease System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {lang === 'id' ? "ℹ️ Patogen/Penyakit tidak menggunakan sub-folder. Semua gambar berada di root bucket." : "ℹ️ Diseases do not use sub-folders. All images are in the root bucket."}
            </div>
            <div className="pt-2 mt-auto">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 italic leading-relaxed text-justify">
                {syncWarningText}
              </div>
              <button 
                onClick={() => setActionModal("disease_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/40 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 hover:border-rose-400 dark:hover:bg-rose-800 dark:hover:border-rose-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-rose-900 dark:group-hover:text-rose-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Sinkronisasi Gambar" : "Sync Images")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 5: SISTEM AKUARIUM */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-teal-50 dark:bg-teal-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-lg text-teal-600 dark:text-teal-400">
              <Container className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Akuarium" : "Aquarium System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button 
              onClick={() => setActionModal("aquarium_folder")} 
              disabled={loading} 
              className="group flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <FolderPlus className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto space-y-3">
              <button 
                onClick={() => setActionModal("aquarium_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/40 px-4 py-3 text-sm font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-100 hover:border-teal-400 dark:hover:bg-teal-800 dark:hover:border-teal-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-teal-900 dark:group-hover:text-teal-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Validasi Storage" : "Validate Storage")}
                </span>
              </button>
              <Link href="/dashboard/admin-panel/aquariums" className="block">
                <button 
                  disabled={loading} 
                  className="group flex w-full items-center justify-between rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-4 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 dark:hover:bg-indigo-800 dark:hover:border-indigo-500 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2 group-hover:text-indigo-900 dark:group-hover:text-indigo-100 transition-colors">
                    <Eye className="h-4 w-4" />
                    {lang === 'id' ? "Lihat Semua Akuarium" : "View All Aquariums"}
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* KARTU 6: SISTEM AVATAR (BARU) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-purple-50 dark:bg-purple-950/30 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-600 dark:text-purple-400">
              <User className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === 'id' ? "Sistem Avatar" : "Avatar System"}</h3>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col">
            <button 
              onClick={() => setActionModal("avatar_folder")} 
              disabled={loading} 
              className="group flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <FolderPlus className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                {cpDict.setupFolder || (lang === 'id' ? "Setup Folder Storage" : "Setup Storage Folders")}
              </span>
            </button>
            <div className="pt-2 mt-auto space-y-3">
              <button 
                onClick={() => setActionModal("avatar_sync")} 
                disabled={loading} 
                className="group flex w-full items-center justify-between rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/40 px-4 py-3 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 hover:border-purple-400 dark:hover:bg-purple-800 dark:hover:border-purple-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-purple-900 dark:group-hover:text-purple-100 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {cpDict.syncImages || (lang === 'id' ? "Validasi Storage" : "Validate Storage")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU 7: DISASTER RECOVERY */}
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
              <button 
                onClick={() => setActionModal("db_backup")} 
                disabled={loading} 
                className="group flex-1 sm:flex-none items-center justify-center rounded-lg border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/40 px-6 py-3 text-sm font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 hover:border-sky-400 dark:hover:bg-sky-800 dark:hover:border-sky-500 disabled:opacity-50 transition-all flex gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-sky-900 dark:group-hover:text-sky-100 transition-colors">
                  <Database className="h-4 w-4" /> {cpDict.backupDB || "Backup Database"}
                </span>
              </button>
              
              <button 
                onClick={() => setActionModal("db_restore")} 
                disabled={loading} 
                className="group flex-1 sm:flex-none items-center justify-center rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/40 px-6 py-3 text-sm font-bold text-red-700 dark:text-red-300 hover:bg-red-100 hover:border-red-400 dark:hover:bg-red-800 dark:hover:border-red-500 disabled:opacity-50 transition-all flex gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-2 group-hover:text-red-900 dark:group-hover:text-red-100 transition-colors">
                  <HardDriveDownload className="h-4 w-4" /> {cpDict.restoreDB || "Restore Database"}
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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