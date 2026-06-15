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
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { 
      setProcessingId(null); 
      setAlgaeToRestore(null); 
    }
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
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { 
      setProcessingId(null); 
      setAlgaeToDelete(null); 
      setDeleteConfirmText(""); 
    }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 transition-colors duration-300">
      
      {loading ? (
        <div className="flex h-60 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-500" /></div>
      ) : algaeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-24 text-center transition-colors duration-300">
          <AlertCircle className="mb-4 h-16 w-16 text-slate-300 dark:text-slate-700" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-200">{dict.algaeExpert?.algaeArchiveList?.emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400 font-medium">{dict.algaeExpert?.algaeArchiveList?.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {algaeData.map((algae) => {
            const displayName = language === 'en' && algae.name_en ? algae.name_en : algae.name_id;
            return (
            <Card key={algae.id} className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden opacity-90 transition-all hover:opacity-100 hover:shadow-xl hover:border-teal-200 flex flex-col justify-between">
              <div className="flex items-center gap-4 p-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 grayscale transition-colors border border-slate-200 dark:border-slate-700">
                  {algae.image_url ? (
                    <img src={algae.image_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Bug className="h-8 w-8 text-slate-300 dark:text-slate-600" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate text-lg font-black text-slate-800 dark:text-slate-100">{displayName}</h4>
                  <p className="truncate text-sm italic font-medium text-slate-500 mt-1">{algae.scientific_name || dict.algaeExpert?.algaeArchiveList?.noScientificName}</p>
                </div>
              </div>

              <CardContent className="border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setAlgaeToRestore(algae)} disabled={processingId === algae.id} className="h-11 rounded-xl font-bold border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-600 hover:text-white transition-all w-full sm:w-auto shadow-sm">
                    {processingId === algae.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    {dict.algaeExpert?.algaeArchiveList?.btnRestore}
                  </Button>

                  {role === "super_admin" && (
                    <Button variant="destructive" onClick={() => { setAlgaeToDelete(algae); setDeleteConfirmText(""); }} disabled={processingId === algae.id} className="h-11 rounded-xl font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-900/50 w-full sm:w-auto transition-all shadow-sm">
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

      {/* MODAL RESTORE MEWAH */}
      {algaeToRestore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl border-t-8 border-teal-500 bg-white dark:bg-slate-900 p-8 shadow-2xl transition-all">
            <div className="mb-4 flex items-center gap-3 text-teal-500">
              <RefreshCcw className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{dict.algaeExpert?.algaeArchiveList?.modalRestoreTitle}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {dict.algaeExpert?.algaeArchiveList?.modalRestoreDesc} <strong className="text-gray-900 dark:text-slate-100 bg-teal-50 dark:bg-teal-900/30 px-1 py-0.5 rounded">{language === 'en' && algaeToRestore.name_en ? algaeToRestore.name_en : algaeToRestore.name_id}</strong> {dict.algaeExpert?.algaeArchiveList?.modalRestoreDesc2}
            </p>
            <div className="flex flex-col gap-3">
              <Button disabled={processingId === algaeToRestore.id} onClick={executeRestore} className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 text-white bg-teal-600 hover:bg-teal-700 transition-colors">
                {processingId === algaeToRestore.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : dict.algaeExpert?.algaeArchiveList?.btnConfirmRestore}
              </Button>
              <Button variant="ghost" disabled={processingId === algaeToRestore.id} onClick={() => setAlgaeToRestore(null)} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                {dict.algaeExpert?.algaeArchiveList?.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HARD DELETE MEWAH */}
      {algaeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl border-t-8 border-red-600 bg-white dark:bg-slate-900 p-8 shadow-2xl transition-all">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{dict.algaeExpert?.algaeArchiveList?.modalDeleteTitle}</h3>
            </div>
            
            <form onSubmit={executeHardDelete} className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc1} <strong>{dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc2}</strong> {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc3} <strong className="text-gray-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/30 px-1 py-0.5 rounded select-all">{language === 'en' && algaeToDelete.name_en ? algaeToDelete.name_en : algaeToDelete.name_id}</strong> {dict.algaeExpert?.algaeArchiveList?.modalDeleteDesc4}
              </p>
              
              <input required type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={dict.algaeExpert?.algaeArchiveList?.typeAlgaeName} className="h-12 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-red-500 font-bold mb-4 outline-none transition-colors" />
              
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={processingId === algaeToDelete.id || deleteConfirmText !== (language === 'en' && algaeToDelete.name_en ? algaeToDelete.name_en : algaeToDelete.name_id)} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 transition-colors">
                  {processingId === algaeToDelete.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : dict.algaeExpert?.algaeArchiveList?.btnConfirmDelete}
                </Button>
                <Button type="button" disabled={processingId === algaeToDelete.id} onClick={() => {setAlgaeToDelete(null); setDeleteConfirmText("");}} className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 font-bold uppercase tracking-wider transition-colors">
                  {dict.algaeExpert?.algaeArchiveList?.cancel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}