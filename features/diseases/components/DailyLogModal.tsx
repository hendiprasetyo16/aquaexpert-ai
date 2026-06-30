// features/diseases/components/DailyLogModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Syringe, Droplets, Eye, ArrowRightLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

import { ActiveTreatmentDto } from "../actions/start-treatment.actions";
import { logDailyTreatmentAction } from "../actions/log-treatment.actions";
import type { ActionTaken } from "../types/treatment.types";

interface Props {
  session: ActiveTreatmentDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tDict: Record<string, string>;
  lang: "id" | "en";
}

export default function DailyLogModal({ session, isOpen, onClose, onSuccess, tDict, lang }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionTaken, setActionTaken] = useState<ActionTaken>("Observed");
  const [medicationDose, setMedicationDose] = useState<number | "">("");
  const [newFishLostCount, setNewFishLostCount] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  
  const [remainingSymptoms, setRemainingSymptoms] = useState<string[]>(session.initial_symptoms || []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSymptom = (symptomId: string) => {
    setRemainingSymptoms(prev => 
      prev.includes(symptomId) ? prev.filter(id => id !== symptomId) : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
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
      toast.success(lang === 'id' ? "Rekam medis harian berhasil disimpan!" : "Daily medical log saved!");
      
      if (res.analytics) {
        const aiMsg = lang === 'id' ? res.analytics.aiRecommendationId : res.analytics.aiRecommendationEn;
        toast(aiMsg, { icon: "🤖", duration: 6000 });
      }

      onSuccess(); 
      onClose();
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal menyimpan rekam medis." : "Failed to save medical log."));
    }
    
    setIsSubmitting(false);
  };

  const actionOptions: { val: ActionTaken; label: string; icon: React.ReactNode }[] = [
    { val: "Observed", label: lang === 'id' ? "Hanya Observasi" : "Observation Only", icon: <Eye className="w-4 h-4" /> },
    { val: "Redosed", label: lang === 'id' ? "Dosis Ulang Obat" : "Redosed", icon: <Syringe className="w-4 h-4" /> },
    { val: "Water Change", label: lang === 'id' ? "Ganti Air" : "Water Change", icon: <Droplets className="w-4 h-4" /> },
    { val: "Medication Changed", label: lang === 'id' ? "Ganti Obat" : "Medication Changed", icon: <ArrowRightLeft className="w-4 h-4" /> },
  ];

  return (
    // FIX SCROLL: Diubah menjadi items-start dan overflow-y-auto untuk menangani layar pendek
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/80 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] md:max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 my-auto relative">
        
        {/* HEADER (Sticky di atas) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shrink-0 relative z-10">
          <div className="pr-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
              {tDict.formTitle || (lang === 'id' ? "Buku Rekam Medis Harian" : "Daily Medical Logbook")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
              {tDict.formDesc || (lang === 'id' ? "Catat perkembangan pasien hari ini untuk evaluasi sistem AI." : "Record today's patient progress for AI system evaluation.")}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-600 transition-all rounded-full shrink-0 cursor-pointer shadow-sm"
          >
            <X className="w-5 h-5 font-bold" />
          </button>
        </div>
        
        {/* BODY (Area scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white dark:bg-slate-950 relative z-10">
          <form id="daily-log-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* ACTION TAKEN */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {lang === 'id' ? "Tindakan Hari Ini" : "Action Taken Today"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actionOptions.map(opt => (
                  <div 
                    key={opt.val} 
                    onClick={() => setActionTaken(opt.val)}
                    className={`cursor-pointer flex items-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${actionTaken === opt.val ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" /> 
                {lang === 'id' ? "Pilih tindakan utama yang Anda berikan ke akuarium hari ini." : "Select the main medical action you performed today."}
              </p>
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
                  disabled={actionTaken === "Observed"} 
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:border-blue-500" 
                />
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" /> 
                  {lang === 'id' ? "Kosongkan jika Anda hanya memantau tanpa obat." : "Leave empty if observation only."}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">
                  {lang === 'id' ? "Kematian Baru (Ekor)" : "New Casualties"}
                </label>
                <Input 
                  type="number" min={0} 
                  value={newFishLostCount} 
                  onChange={(e) => setNewFishLostCount(e.target.value ? Number(e.target.value) : "")} 
                  className="h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 font-bold text-rose-600 focus:border-rose-500" 
                />
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" /> 
                  {lang === 'id' ? "Isi dengan angka jika ada korban jiwa hari ini." : "Enter number if there are casualties today."}
                </p>
              </div>
            </div>

            {/* SYMPTOMS (Checklist Gejala Sisa) */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex justify-between">
                {lang === 'id' ? "Gejala yang Masih Terlihat" : "Remaining Symptoms"}
              </label>
              
              <div className="space-y-2">
                {session.initial_symptoms.length > 0 ? session.initial_symptoms.map(symId => (
                  <label key={symId} className="flex items-center gap-3 p-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={remainingSymptoms.includes(symId)} 
                      onChange={() => handleToggleSymptom(symId)}
                      className="w-5 h-5 accent-rose-600 rounded cursor-pointer shrink-0"
                    />
                    <span className={`text-sm font-bold transition-colors leading-tight ${remainingSymptoms.includes(symId) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                      {symId}
                    </span>
                  </label>
                )) : (
                  <p className="text-sm text-slate-500 italic px-2">{lang === 'id' ? "Tidak ada catatan gejala awal." : "No initial symptoms logged."}</p>
                )}
              </div>
              
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50 mt-2">
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" /> 
                  {lang === 'id' ? "Penting: Cabut centang jika gejala ini sudah sembuh. AI memanfaatkannya untuk mengkalkulasi persentase pemulihan secara real-time." : "Important: Uncheck symptoms that are healed. AI uses this to calculate recovery percentage."}
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
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-medium text-sm text-slate-800 dark:text-slate-200 custom-scrollbar resize-none transition-all"
                placeholder={lang === 'id' ? 'Contoh: Ikan sudah mau merespon pelet...' : 'e.g., Fish responds to pellets...'}
              />
            </div>
          </form>
        </div>
        
        {/* FOOTER (Sticky di bawah) */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 shrink-0 relative z-10">
           <Button 
             type="button" 
             variant="outline" 
             onClick={onClose} 
             className="flex-1 h-12 sm:h-14 rounded-xl font-bold uppercase tracking-wider border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
           >
             {lang === 'id' ? "Batal" : "Cancel"}
           </Button>
           <Button 
             type="submit" 
             form="daily-log-form"
             disabled={isSubmitting} 
             className="flex-1 h-12 sm:h-14 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] dark:shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all active:scale-[0.98]"
           >
             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-5 h-5 mr-2" /> {lang === 'id' ? "Simpan Rekam Medis" : "Save Log"}</>}
           </Button>
        </div>

      </div>
    </div>
  );
}