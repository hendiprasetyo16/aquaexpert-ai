// features/diseases/components/DailyLogModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Syringe, Droplets, Eye, ArrowRightLeft, Info, Trash2, AlertTriangle, Activity, ArchiveX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

import { ActiveTreatmentDto } from "../actions/start-treatment.actions";
import { logDailyTreatmentAction, deleteTreatmentSessionAction } from "../actions/log-treatment.actions";
import type { ActionTaken } from "../types/treatment.types";

interface Props {
  session: ActiveTreatmentDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void; // Disesuaikan agar bisa menerima Async
  tDict: Record<string, string>;
  lang: "id" | "en";
  hasLoggedToday: boolean;
}

export default function DailyLogModal({ session, isOpen, onClose, onSuccess, tDict, lang, hasLoggedToday }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false); 
  
  const [actionTaken, setActionTaken] = useState<ActionTaken>(
    (session.latest_log?.action_taken as ActionTaken) || "Observed"
  );
  const [medicationDose, setMedicationDose] = useState<number | "">("");
  const [newFishLostCount, setNewFishLostCount] = useState<number | "">(0);
  const [notes, setNotes] = useState(session.latest_log?.notes || "");
  
  const [remainingSymptoms, setRemainingSymptoms] = useState<string[]>(session.initial_symptoms || []);

  const initialCount = Math.max(1, session.initial_symptoms?.length || 1);
  const currentCount = remainingSymptoms.length;
  // Kalkulasi Real-time yang langsung terlihat di UI
  const projectedRecovery = Math.max(0, Math.min(100, Math.round(((initialCount - currentCount) / initialCount) * 100)));

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !showDeleteConfirm && !showAbortConfirm) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, showDeleteConfirm, showAbortConfirm]);

  if (!isOpen) return null;

  const handleToggleSymptom = (symptomId: string) => {
    setRemainingSymptoms(prev => 
      prev.includes(symptomId) ? prev.filter(id => id !== symptomId) : [...prev, symptomId]
    );
  };

  const handleDeleteSession = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteTreatmentSessionAction(session.id, session.aquarium_id);
      if (res.success) {
        toast.success(lang === 'id' ? "Sesi salah input berhasil dihapus!" : "Session deleted!");
        await onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Gagal menghapus sesi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAbortSession = async () => {
    setIsAborting(true);
    try {
      const res = await logDailyTreatmentAction({
        aquariumId: session.aquarium_id,
        sessionId: session.id,
        remainingSymptomIds: remainingSymptoms,
        actionTaken: "Medication Changed", // Ini kode di backend untuk membatalkan
        medicationDose: 0,
        newFishLostCount: 0,
        notes: "Sesi dibatalkan oleh pengguna (Ganti Obat/Lainnya).",
        lang: lang
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Sesi dipindahkan ke Riwayat!" : "Session moved to History!");
        await onSuccess(); // Tunggu data ter-refresh dulu
        onClose();         // Baru tutup modal
      } else {
        toast.error(res.error || "Gagal membatalkan sesi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsAborting(false);
      setShowAbortConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await logDailyTreatmentAction({
        aquariumId: session.aquarium_id,
        sessionId: session.id,
        remainingSymptomIds: remainingSymptoms,
        actionTaken: actionTaken,
        medicationDose: Number(medicationDose) || 0,
        newFishLostCount: Number(newFishLostCount) || 0,
        notes: notes,
        lang: lang
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Rekam medis tersimpan!" : "Medical log saved!");
        if (res.analytics) toast(lang === 'id' ? res.analytics.aiRecommendationId : res.analytics.aiRecommendationEn, { icon: "🤖", duration: 6000 });
        
        await onSuccess(); // PENTING: Refresh tabel di latar belakang dulu
        onClose();         // Baru tutup modal, agar data di layar langsung berubah!
      } else {
        toast.error(res.error || "Gagal menyimpan rekam medis.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionOptions: { val: ActionTaken; label: string; icon: React.ReactNode; desc: string }[] = [
    { val: "Observed", label: lang === 'id' ? "Hanya Observasi" : "Observation Only", icon: <Eye className="w-4 h-4" />, desc: lang==='id'?"Hanya memantau.":"Monitoring only." },
    { val: "Redosed", label: lang === 'id' ? "Dosis Ulang" : "Redosed", icon: <Syringe className="w-4 h-4" />, desc: lang==='id'?"Menambah obat ke tangki.":"Adding more medication." },
    { val: "Water Change", label: lang === 'id' ? "Ganti Air" : "Water Change", icon: <Droplets className="w-4 h-4" />, desc: lang==='id'?"Pergantian air harian.":"Daily water change." },
  ];

  return (
    <>
      {/* MODAL PERINGATAN HAPUS SALAH INPUT (Z-INDEX SUPER TINGGI 9999) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              {lang === 'id' ? "Hapus Sesi Ini?" : "Delete Session?"}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {lang === 'id' 
                ? "PERINGATAN: Gunakan ini HANYA JIKA Anda salah memasukkan data pasien. Semua rekam medis pada sesi ini akan hangus." 
                : "WARNING: Use ONLY IF you made a data entry mistake. All logs will be destroyed."}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 h-12 rounded-xl font-bold uppercase text-slate-600 dark:text-slate-300">Batal</Button>
              <Button type="button" onClick={handleDeleteSession} disabled={isDeleting} className="flex-1 h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl shadow-lg shadow-red-500/20">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "YA, HAPUS"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERINGATAN BATALKAN SESI / PINDAH RIWAYAT (Z-INDEX SUPER TINGGI 9999) */}
      {showAbortConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArchiveX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              {lang === 'id' ? "Pindah ke Riwayat?" : "Move to History?"}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {lang === 'id' 
                ? "Sesi ini akan dinyatakan BERHENTI/GAGAL dan dipindahkan ke Riwayat Terdahulu. Setelah ini Anda bisa membuka Sesi Baru." 
                : "This session will be ABORTED/FAILED and moved to Past History. You can start a new session after this."}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAbortConfirm(false)} disabled={isAborting} className="flex-1 h-12 rounded-xl font-bold uppercase text-slate-600 dark:text-slate-300">Batal</Button>
              <Button type="button" onClick={handleAbortSession} disabled={isAborting} className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded-xl shadow-lg shadow-amber-500/20">
                {isAborting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "PINDAHKAN"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FORM UTAMA */}
      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/80 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] md:max-h-[85vh] border border-slate-200 dark:border-slate-800 my-auto">
          
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                {tDict.formTitle || (lang === 'id' ? "Buku Rekam Medis Harian" : "Daily Medical Logbook")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {tDict.formDesc || (lang === 'id' ? "Catat perkembangan pasien hari ini untuk dievaluasi oleh sistem AI." : "Record today's patient progress for AI.")}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-600 transition-colors rounded-full shrink-0">
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          <form id="daily-log-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6 bg-white dark:bg-slate-950">
              
              {hasLoggedToday && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex gap-3 text-blue-800 dark:text-blue-300">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs font-bold leading-relaxed">
                    {lang === 'id' 
                      ? "Sistem membatasi 1 log per hari. Anda SUDAH MENGISI log hari ini. Jika Anda menekan Simpan, data yang sebelumnya akan di-UPDATE (ditimpa)." 
                      : "You HAVE LOGGED today. Saving this form will UPDATE (Overwrite) your previous entry for today."}
                  </p>
                </div>
              )}

              {/* REAL-TIME PREVIEW PANEL DENGAN WARNA TERANG YANG AMAN */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                 <div className="flex justify-between items-end mb-2">
                   <div className="flex items-center gap-2">
                     <Activity className="w-4 h-4 text-emerald-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                       {lang === 'id' ? "Proyeksi Kesembuhan" : "Projected Recovery"}
                     </span>
                   </div>
                   <span className={`text-2xl font-black ${projectedRecovery === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                     {projectedRecovery}%
                   </span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
                   <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${projectedRecovery}%` }} />
                 </div>
                 
                 <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                   <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-snug">
                     {projectedRecovery === 100 
                       ? (lang === 'id' ? "🎉 LUAR BIASA! Gejala habis. Jika disimpan, sistem akan menyatakan ikan SEMBUH TOTAL dan memindahkannya ke Riwayat Selesai." : "🎉 EXCELLENT! No symptoms. System will mark as FULLY RECOVERED.")
                       : (lang === 'id' ? "Cabut centang gejala di bawah untuk melihat persentase ini naik secara real-time." : "Uncheck symptoms below to see this percentage rise in real-time.")
                     }
                   </p>
                 </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {lang === 'id' ? "Tindakan Utama Hari Ini" : "Main Action Today"}
                  </label>
                  
                  {/* TOMBOL BATAL/PINDAH RIWAYAT */}
                  <Button 
                    type="button" 
                    onClick={() => setShowAbortConfirm(true)} 
                    disabled={isSubmitting || isAborting} 
                    variant="ghost" 
                    className="h-8 px-2 text-[10px] uppercase font-black tracking-widest text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30"
                  >
                    <ArchiveX className="w-3.5 h-3.5 mr-1" /> {lang === 'id' ? "Ganti Obat (Pindah Riwayat)" : "Change Meds"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actionOptions.map(opt => (
                    <div key={opt.val} onClick={() => setActionTaken(opt.val)} className={`cursor-pointer flex flex-col gap-1 p-3 rounded-xl border-2 transition-all ${actionTaken === opt.val ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'}`}>
                      <div className={`flex items-center gap-2 font-bold text-sm ${actionTaken === opt.val ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>{opt.icon} {opt.label}</div>
                      <p className={`text-[10px] ${actionTaken === opt.val ? 'text-rose-600 dark:text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {lang === 'id' ? "Dosis Diberikan" : "Dose Administered"} ({session.medication?.dosage_unit})
                  </label>
                  <Input 
                    type="number" min={0} step={0.1} 
                    value={medicationDose} 
                    onChange={(e) => setMedicationDose(e.target.value ? Number(e.target.value) : "")} 
                    disabled={actionTaken === "Observed" || actionTaken === "Medication Changed"} 
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold dark:text-slate-100 focus:border-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">
                    {lang === 'id' ? "Kematian Baru (Ekor)" : "New Casualties"}
                  </label>
                  <Input 
                    type="number" min={0} 
                    value={newFishLostCount} 
                    onChange={(e) => setNewFishLostCount(e.target.value ? Number(e.target.value) : "")} 
                    className="h-12 rounded-xl bg-rose-50 border-rose-200 font-bold text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 focus:border-rose-500" 
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex justify-between">
                  {lang === 'id' ? "Checklist Sisa Gejala" : "Remaining Symptoms"}
                </label>
                <div className="space-y-2">
                  {session.initial_symptoms.map(symId => (
                    <label key={symId} className="flex items-center gap-3 p-2 cursor-pointer group bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300">
                      <input 
                        type="checkbox" 
                        checked={remainingSymptoms.includes(symId)} 
                        onChange={() => handleToggleSymptom(symId)} 
                        className="w-5 h-5 accent-rose-600 rounded shrink-0"
                      />
                      <span className={`text-sm font-bold ${remainingSymptoms.includes(symId) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>{symId}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50 mt-2">
                  <p className="text-[10px] text-slate-500 flex items-start gap-1.5 leading-snug">
                    <Info className="w-3 h-3 shrink-0 text-emerald-500" /> 
                    {lang === 'id' ? "Penting: Cabut centang jika gejala sudah sembuh. Jika semua gejala hilang, AI akan menandai Sembuh Total." : "Uncheck healed symptoms. If all unchecked, AI marks it Fully Recovered."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {lang === 'id' ? "Catatan Klinis (Opsional)" : "Clinical Notes (Optional)"}
                </label>
                <textarea 
                  rows={3} 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-medium text-sm text-slate-800 dark:text-slate-200 custom-scrollbar resize-none" 
                  placeholder={lang === 'id' ? 'Contoh: Ikan mulai mau makan pelet...' : 'e.g., Fish responds to pellets...'}
                />
              </div>
            </div>
            
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-3 shrink-0">
               <Button type="button" onClick={() => setShowDeleteConfirm(true)} variant="outline" disabled={isSubmitting || isDeleting} className="w-auto h-12 sm:h-14 rounded-xl font-bold uppercase tracking-wider border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors">
                 <Trash2 className="w-4 h-4 mr-2" /> {lang === 'id' ? "Salah Input" : "Mistake"}
               </Button>
               <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting} className="flex-1 h-12 sm:h-14 rounded-xl font-bold uppercase border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                 {lang === 'id' ? "Batal" : "Cancel"}
               </Button>
               <Button type="submit" form="daily-log-form" disabled={isSubmitting || isDeleting} className="flex-1 h-12 sm:h-14 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all active:scale-[0.98]">
                 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-4 h-4 mr-1.5" /> {lang === 'id' ? "SIMPAN DATA" : "SAVE DATA"}</>}
               </Button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}