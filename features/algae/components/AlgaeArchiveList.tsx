// features/algae/components/AlgaeArchiveList.tsx
"use client";

import { useEffect, useState } from "react";
import { getArchivedAlgae } from "../repositories/algae.repository";
import { restoreAlgaeAction, hardDeleteAlgaeAction } from "../actions/algae.actions";
import { Algae } from "../types/algae.types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 

import { Loader2, RefreshCcw, Trash2, Bug, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AlgaeArchiveList() {
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  const [algaeData, setAlgaeData] = useState<Algae[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [algaeToRestore, setAlgaeToRestore] = useState<Algae | null>(null);
  const [algaeToDelete, setAlgaeToDelete] = useState<Algae | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function loadArchivedData() {
    try {
      setLoading(true);
      const data = await getArchivedAlgae();
      setAlgaeData(data);
    } catch (error) { toast.error("Error loading archive"); } 
    finally { setLoading(false); }
  }

  useEffect(() => { loadArchivedData(); }, []);

  async function executeRestore() {
    if (!algaeToRestore) return;
    try {
      setProcessingId(algaeToRestore.id);
      const result = await restoreAlgaeAction(algaeToRestore.id);
      if (!result.success) throw new Error(result.error);
      toast.success("Restore success");
      setAlgaeData((prev) => prev.filter((a) => a.id !== algaeToRestore.id));
    // REFAKTOR: Hapus any, ganti unknown + Type Guard
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Error"); } 
    finally { setProcessingId(null); setAlgaeToRestore(null); }
  }

  async function executeHardDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!algaeToDelete) return;
    const currentName = language === 'en' && algaeToDelete.name_en ? algaeToDelete.name_en : algaeToDelete.name_id;
    if (deleteConfirmText !== currentName) { toast.error("Name mismatch"); return; }

    try {
      setProcessingId(algaeToDelete.id);
      const result = await hardDeleteAlgaeAction(algaeToDelete.id);
      if (!result.success) throw new Error(result.error);
      toast.success("Permanently deleted");
      setAlgaeData((prev) => prev.filter((a) => a.id !== algaeToDelete.id));
    // REFAKTOR: Hapus any, ganti unknown + Type Guard
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Error"); } 
    finally { setProcessingId(null); setAlgaeToDelete(null); setDeleteConfirmText(""); }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 transition-colors duration-300">
      
      {loading ? (
        <div className="flex h-60 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" /></div>
      ) : algaeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-20 text-center transition-colors duration-300">
          <AlertCircle className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">{dict.algaeExpert?.algaeArchiveList?.emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{dict.algaeExpert?.algaeArchiveList?.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {algaeData.map((algae) => {
            const displayName = language === 'en' && algae.name_en ? algae.name_en : algae.name_id;
            return (
            <Card key={algae.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 opacity-80 transition-all hover:opacity-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 grayscale transition-colors">
                  {algae.image_url ? (
                    <img src={algae.image_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Bug className="h-6 w-6 text-slate-400 dark:text-slate-600" /></div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate font-semibold text-gray-900 dark:text-slate-200">{displayName}</h4>
                  <p className="truncate text-xs italic text-slate-500 dark:text-slate-400">{algae.scientific_name || dict.algaeExpert?.algaeArchiveList?.noScientificName}</p>
                </div>
              </div>

              <CardContent className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 transition-colors">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAlgaeToRestore(algae)} disabled={processingId === algae.id} className="border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-800 dark:hover:text-white transition-colors w-full sm:w-auto">
                    {processingId === algae.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    {dict.algaeExpert?.algaeArchiveList?.btnRestore}
                  </Button>

                  {role === "super_admin" && (
                    <Button variant="destructive" size="sm" onClick={() => { setAlgaeToDelete(algae); setDeleteConfirmText(""); }} disabled={processingId === algae.id} className="bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-800 dark:hover:text-white border border-red-200 dark:border-red-900 w-full sm:w-auto transition-colors">
                      {processingId === algae.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      {dict.algaeExpert?.algaeArchiveList?.btnHardDelete}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* MODAL RESTORE */}
      {algaeToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400"><RefreshCcw className="h-6 w-6" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{dict.algaeExpert?.algaeArchiveList?.modalRestoreTitle}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {dict.algaeExpert?.algaeArchiveList?.modalRestoreDesc} <strong className="text-gray-900 dark:text-slate-200">{language === 'en' && algaeToRestore.name_en ? algaeToRestore.name_en : algaeToRestore.name_id}</strong> {dict.algaeExpert?.algaeArchiveList?.modalRestoreDesc2}
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button disabled={processingId === algaeToRestore.id} onClick={() => setAlgaeToRestore(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.algaeExpert?.algaeArchiveList?.cancel}</button>
              <button disabled={processingId === algaeToRestore.id} onClick={executeRestore} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 bg-teal-600 hover:bg-teal-500">
                {processingId === algaeToRestore.id ? dict.algaeExpert?.algaeArchiveList?.processing : dict.algaeExpert?.algaeArchiveList?.btnConfirmRestore}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HARD DELETE */}
      {algaeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"><AlertTriangle className="h-6 w-6" /></div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{dict.algaeExpert?.algaeArchiveList?.modalDeleteTitle}</h3>
            </div>
            
            <form onSubmit={executeHardDelete}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc1} <strong>{dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc2}</strong> {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc3} <strong className="text-gray-900 dark:text-slate-200 select-all">{language === 'en' && algaeToDelete.name_en ? algaeToDelete.name_en : algaeToDelete.name_id}</strong> {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc4}
              </p>
              <input required type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={dict.algaeExpert?.algaeArchiveList?.typeAlgaeName} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-red-500 transition-colors mb-6" />
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={processingId === algaeToDelete.id} onClick={() => {setAlgaeToDelete(null); setDeleteConfirmText("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.algaeExpert?.algaeArchiveList?.cancel}</button>
                <button type="submit" disabled={processingId === algaeToDelete.id || deleteConfirmText !== (language === 'en' && algaeToDelete.name_en ? algaeToDelete.name_en : algaeToDelete.name_id)} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {processingId === algaeToDelete.id ? dict.algaeExpert?.algaeArchiveList?.deleting : dict.algaeExpert?.algaeArchiveList?.btnConfirmDelete}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}