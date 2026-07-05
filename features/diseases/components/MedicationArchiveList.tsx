// features/diseases/components/MedicationArchiveList.tsx
"use client";

import { useEffect, useState } from "react";
import { getArchivedMedications, toggleMedicationArchiveAction, hardDeleteMedicationAction, MedicationDto } from "../actions/medication.actions";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 

import { Loader2, RefreshCcw, Trash2, Pill, AlertCircle, AlertTriangle, Archive, Syringe, Clock, CalendarDays, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface MedicationArchiveListProps {
  onActionSuccess?: () => void;
}

export default function MedicationArchiveList({ onActionSuccess }: MedicationArchiveListProps) {
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  const langString = String(language); 

  const [medData, setMedData] = useState<MedicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [medToRestore, setMedToRestore] = useState<MedicationDto | null>(null);
  const [medToDelete, setMedToDelete] = useState<MedicationDto | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const rootDict = (dict as Record<string, any>) || {};
  const arcDict = rootDict.medication?.archiveList || rootDict.medicationArchiveList || {};

  const getMedName = (med: MedicationDto | null) => {
    if (!med) return "";
    if (langString === "en" && med.name_en) return med.name_en;
    return med.name_id || med.name_en || "Unnamed Medication";
  };

  async function loadArchivedData() {
    try {
      setLoading(true);
      const res = await getArchivedMedications();
      setMedData(res);
    } catch (err) {
      toast.error(langString === "id" ? "Gagal memuat arsip obat." : "Failed to load archived medications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArchivedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medToRestore) return;

    try {
      setProcessingId(medToRestore.id);
      const res = await toggleMedicationArchiveAction(medToRestore.id, false); 

      if (res.success) {
        toast.success(langString === "id" ? "Obat berhasil dipulihkan!" : "Medication restored successfully!");
        setMedToRestore(null);
        loadArchivedData();
        if (onActionSuccess) onActionSuccess();
      } else {
        throw new Error(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medToDelete) return;

    const expectedName = getMedName(medToDelete);
    if (deleteConfirmText !== expectedName) {
      toast.error(langString === "id" ? "Nama obat tidak cocok!" : "Medication name mismatch!");
      return;
    }

    try {
      setProcessingId(medToDelete.id);
      const res = await hardDeleteMedicationAction(medToDelete.id);

      if (res.success) {
        toast.success(langString === "id" ? "Obat berhasil dihapus permanen!" : "Medication permanently deleted!");
        setMedToDelete(null);
        setDeleteConfirmText("");
        loadArchivedData();
        if (onActionSuccess) onActionSuccess();
      } else {
        throw new Error(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">
          {arcDict.loading || (langString === "id" ? "Membongkar Arsip..." : "Loading Archive...")}
        </p>
      </div>
    );
  }

  if (medData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-5">
          <Archive className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">
          {langString === "id" ? "Arsip Obat Kosong" : "Medication Archive Empty"}
        </h3>
        <p className="text-sm font-medium text-slate-500">
          {arcDict.emptyState || (langString === "id" ? "Belum ada referensi obat yang diarsipkan." : "No archived medication references found.")}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* KONTEN UTAMA ARSIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {medData.map((med, index) => {
          const name = getMedName(med);
          return (
            <Card key={med.id} className="relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl hover:shadow-md transition-shadow">
              
              {/* NOMOR URUT */}
              <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs px-4 py-1.5 rounded-bl-xl z-10">
                #{String(index + 1).padStart(2, '0')}
              </div>

              <CardContent className="p-5 md:p-6 flex flex-col h-full gap-4 pt-8">
                
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-lg leading-tight line-clamp-2 mb-1">{name}</h4>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                      {med.active_ingredient || (langString === "id" ? "Bahan Aktif Tidak Diketahui" : "Unknown Active Ingredient")}
                    </p>
                  </div>
                </div>

                {/* DETAIL INFORMASI OBAT (DIPERBAIKI) */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {langString === "id" ? "Standar Sembuh:" : "Success Rate:"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{med.success_rate_baseline_pct ? `${med.success_rate_baseline_pct}%` : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5" /> {langString === "id" ? "Dosis:" : "Dosage:"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{med.base_dosage_per_100l ? `${med.base_dosage_per_100l} ${med.dosage_unit || ''} / 100L` : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {langString === "id" ? "Durasi:" : "Duration:"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{med.treatment_duration_days ? `${med.treatment_duration_days} ${langString === "id" ? "Hari" : "Days"}` : "-"}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setMedToRestore(med)}
                    className="flex-1 h-11 rounded-xl border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 font-black text-xs uppercase tracking-widest transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {arcDict.btnRestore || (langString === "id" ? "Pulihkan" : "Restore")}
                  </Button>

                  {role === "super_admin" && (
                    <Button
                      variant="outline"
                      onClick={() => setMedToDelete(med)}
                      className="flex-1 h-11 rounded-xl border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 hover:text-red-700 font-black text-xs uppercase tracking-widest transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {arcDict.btnDelete || (langString === "id" ? "Hapus" : "Delete")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MODAL KONFIRMASI PULIHKAN (NORMAL RENDER) */}
      {medToRestore && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-slate-800 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <RefreshCcw className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              {arcDict.modalRestoreTitle || (langString === "id" ? "Pulihkan Obat?" : "Restore Medication?")}
            </h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {langString === "id" 
                ? `Obat "${getMedName(medToRestore)}" akan diaktifkan dan muncul kembali di database utama.`
                : `"${getMedName(medToRestore)}" will be reactivated and shown in the main database.`}
            </p>
            <div className="flex gap-3">
              <Button type="button" onClick={handleRestore} disabled={processingId !== null} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                {processingId === medToRestore.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (arcDict.confirmRestore || (langString === "id" ? "YA, PULIHKAN" : "YES, RESTORE"))}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMedToRestore(null)} disabled={processingId !== null} className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {arcDict.cancel || (langString === "id" ? "Batal" : "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PERMANEN (NORMAL RENDER) */}
      {medToDelete && role === "super_admin" && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95 relative overflow-hidden text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-slate-800 text-red-600 flex items-center justify-center rounded-full mx-auto mb-4 relative z-10">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-red-600 mb-2 uppercase tracking-tight relative z-10">
              {arcDict.modalDeleteTitle || (langString === "id" ? "Hapus Permanen?" : "Delete Permanently?")}
            </h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10">
              {langString === "id" 
                ? "Tindakan ini tidak bisa dibatalkan. Seluruh relasi data obat ini akan dibakar dari database." 
                : "This action is irreversible. The medication will be completely removed."}
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                {langString === "id" ? "Ketik nama obat untuk konfirmasi:" : "Type medication name to confirm:"}
              </span>
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 select-all bg-white dark:bg-slate-900 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {getMedName(medToDelete)}
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={langString === "id" ? "Ketik persis seperti di atas..." : "Type exactly as above..."}
                className="h-12 w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 focus:border-red-500 outline-none rounded-xl transition-colors text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              <Button
                type="button"
                onClick={handleHardDelete}
                disabled={processingId !== null || deleteConfirmText !== getMedName(medToDelete)}
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-40 transition-all"
              >
                {processingId === medToDelete.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (arcDict.btnConfirmDelete || (langString === "id" ? "YA, HAPUS PERMANEN" : "YES, DELETE PERMANENTLY"))}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setMedToDelete(null); setDeleteConfirmText(""); }} disabled={processingId !== null} className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {arcDict.cancel || (langString === "id" ? "Batal" : "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}