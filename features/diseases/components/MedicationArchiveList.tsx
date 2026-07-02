// features/diseases/components/MedicationArchiveList.tsx
"use client";

import { useEffect, useState } from "react";
import { getArchivedMedications, toggleMedicationArchiveAction, hardDeleteMedicationAction, MedicationDto } from "../actions/medication.actions";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 

import { Loader2, RefreshCcw, Trash2, Pill, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface MedicationArchiveListProps {
  onActionSuccess?: () => void;
}

export default function MedicationArchiveList({ onActionSuccess }: MedicationArchiveListProps) {
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  
  // 💡 HACK TYPESCRIPT: Ubah menjadi string statis agar TS tidak melakukan Narrowing yang kaku
  const langString = String(language); 

  const [medData, setMedData] = useState<MedicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [medToRestore, setMedToRestore] = useState<MedicationDto | null>(null);
  const [medToDelete, setMedToDelete] = useState<MedicationDto | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootDict = (dict as Record<string, any>) || {};
  const arcDict = rootDict.medication?.archiveList || rootDict.medicationArchiveList || {};

  // 💡 HELPER FUNCTION: Menentukan nama yang tampil tanpa memicu error TypeScript
  const getMedName = (med: MedicationDto | null) => {
    if (!med) return "";
    if (langString === "en" && med.name_en) return med.name_en;
    // Fallback: Jika ID kosong, tampilkan EN
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
    
    // Keamanan Ketat: Harus sama persis (Case-sensitive)
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
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest">
          {arcDict.loading || (langString === "id" ? "Memuat Arsip..." : "Loading Archive...")}
        </p>
      </div>
    );
  }

  if (medData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-500">
          {arcDict.emptyState || (langString === "id" ? "Tidak ada obat yang diarsip." : "No archived medications found.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-1 gap-3">
        {medData.map((med) => {
          const name = getMedName(med);
          return (
            <Card key={med.id} className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm rounded-xl">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{name}</h4>
                    <p className="text-xs text-slate-400 truncate">{med.active_ingredient}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMedToRestore(med)}
                    className="h-9 px-3 rounded-lg border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{arcDict.btnRestore || (langString === "id" ? "Pulihkan" : "Restore")}</span>
                  </Button>

                  {role === "super_admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMedToDelete(med)}
                      className="h-9 px-3 rounded-lg border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{arcDict.btnDelete || (langString === "id" ? "Hapus" : "Delete")}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MODAL KONFIRMASI PULIHKAN */}
      {medToRestore && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-emerald-500" />
              {arcDict.modalRestoreTitle || (langString === "id" ? "Pulihkan Obat" : "Restore Medication")}
            </h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {langString === "id" 
                ? `Apakah Anda yakin ingin mengembalikan obat "${getMedName(medToRestore)}" agar muncul kembali di daftar aktif?`
                : `Are you sure you want to restore "${getMedName(medToRestore)}" to the active database?`}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setMedToRestore(null)} disabled={processingId !== null} className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {arcDict.cancel || (langString === "id" ? "Batal" : "Cancel")}
              </Button>
              <Button type="button" onClick={handleRestore} disabled={processingId !== null} className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20">
                {processingId === medToRestore.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (arcDict.confirmRestore || (langString === "id" ? "PULIHKAN" : "RESTORE"))}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PERMANEN (SUPER ADMIN ONLY) */}
      {medToDelete && role === "super_admin" && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 dark:bg-slate-800 text-red-600 flex items-center justify-center rounded-full mb-3 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-red-600 text-center mb-2">
              {arcDict.modalDeleteTitle || (langString === "id" ? "Hapus Permanen" : "Delete Permanently")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-4">
              {langString === "id" 
                ? "Tindakan ini tidak bisa dibatalkan. Seluruh relasi data obat ini akan dihapus dari database." 
                : "This action is irreversible. The medication and its relational records will be completely removed."}
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {langString === "id" ? "Ketik nama obat untuk konfirmasi:" : "Type medication name to confirm:"}
              </span>
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 select-all bg-white dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700">
                {getMedName(medToDelete)}
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={langString === "id" ? "Ketik persis seperti di atas..." : "Type exactly as above..."}
                className="h-10 w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 focus:border-red-500 outline-none rounded-lg transition-colors text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleHardDelete}
                disabled={processingId !== null || deleteConfirmText !== getMedName(medToDelete)}
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-40 transition-colors"
              >
                {processingId === medToDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (arcDict.btnConfirmDelete || (langString === "id" ? "KONFIRMASI HAPUS" : "CONFIRM DELETE"))}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setMedToDelete(null); setDeleteConfirmText(""); }} disabled={processingId !== null} className="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {arcDict.cancel || (langString === "id" ? "Batal" : "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}