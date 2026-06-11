"use client";

import { useState } from "react";
import { Loader2, FolderPlus, RefreshCw, Server, AlertTriangle, Database, HardDriveDownload } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

const ADMIN_SECRET = "aquaexpert-sinkron-2024";

export default function SetupStorage() {
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const { dict } = useLanguage(); // <-- PANGGIL KAMUS

  const handleCreateFolders = async () => {
    const confirm = window.confirm(dict.controlPanel.confirmFolder);
    if (!confirm) return;

    setLoadingFolder(true);
    try {
      const response = await fetch("/api/create-folders", {
        method: "GET", headers: { "x-admin-secret": ADMIN_SECRET }
      });
      const data = await response.json();
      data.success ? toast.success(data.message) : toast.error("Error: " + data.error);
    } catch (error) { toast.error("Error"); } finally { setLoadingFolder(false); }
  };

  const handleSyncImages = async () => {
    const confirm = window.confirm(dict.controlPanel.confirmSync);
    if (!confirm) return;

    setLoadingSync(true);
    try {
      const response = await fetch("/api/sync-images", {
        method: "GET", headers: { "x-admin-secret": ADMIN_SECRET }
      });
      const data = await response.json();
      data.success ? toast.success(data.message) : toast.error("Error: " + data.error);
    } catch (error) { toast.error("Error"); } finally { setLoadingSync(false); }
  };

  const handleBackup = async () => {
    if (!window.confirm(dict.controlPanel.confirmBackup)) return;
    setLoadingBackup(true);
    try {
      const res = await fetch("/api/backup-restore", { 
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ action: "BACKUP" }) 
      });
      const data = await res.json();
      data.success ? toast.success(data.message) : toast.error(data.error);
    } catch (error) { toast.error("Error"); } finally { setLoadingBackup(false); }
  };

  const handleRestore = async () => {
    if (!window.confirm(dict.controlPanel.confirmRestore)) return;
    setLoadingBackup(true);
    try {
      const res = await fetch("/api/backup-restore", { 
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ action: "RESTORE" }) 
      });
      const data = await res.json();
      data.success ? toast.success(data.message) : toast.error(data.error);
    } catch (error) { toast.error("Error"); } finally { setLoadingBackup(false); }
  };

  const isAnyLoading = loadingFolder || loadingSync || loadingBackup;

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-colors duration-300">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 dark:bg-teal-900/20 blur-3xl pointer-events-none"></div>

        <div className="relative border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-6 py-5 sm:px-8 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-200 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-inner">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{dict.controlPanel.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dict.controlPanel.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-6 sm:px-8 sm:py-8 space-y-8">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-4 text-amber-800 dark:text-amber-200/80 transition-colors duration-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block text-amber-700 dark:text-amber-400 font-semibold mb-1">{dict.controlPanel.warningTitle}</strong>
              {dict.controlPanel.warningDesc}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{dict.controlPanel.storageMgmt}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group relative">
                <button type="button" onClick={handleCreateFolders} disabled={isAnyLoading} className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-6 py-4 font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50">
                  {loadingFolder ? <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-slate-400" /> : <FolderPlus className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                  {loadingFolder ? dict.controlPanel.processing : dict.controlPanel.setupFolder}
                </button>
              </div>
              <div className="group relative">
                <button type="button" onClick={handleSyncImages} disabled={isAnyLoading} className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-4 font-medium text-white shadow-lg shadow-teal-600/20 dark:shadow-teal-900/20 transition-all hover:bg-teal-500 disabled:opacity-50">
                  {loadingSync ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                  {loadingSync ? dict.controlPanel.syncing : dict.controlPanel.syncImages}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800 transition-colors duration-300" />

          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{dict.controlPanel.disasterRecovery}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group relative">
                <button type="button" onClick={handleBackup} disabled={isAnyLoading} className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/30 px-6 py-4 font-medium text-sky-700 dark:text-sky-400 transition-all hover:bg-sky-100 dark:hover:bg-sky-900/50 disabled:opacity-50">
                  {loadingBackup ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                  {dict.controlPanel.backupDB}
                </button>
              </div>
              <div className="group relative">
                <button type="button" onClick={handleRestore} disabled={isAnyLoading} className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-6 py-4 font-medium text-red-700 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50">
                  {loadingBackup ? <Loader2 className="h-5 w-5 animate-spin" /> : <HardDriveDownload className="h-5 w-5" />}
                  {dict.controlPanel.restoreDB}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}