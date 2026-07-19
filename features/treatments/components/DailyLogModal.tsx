// features/treatments/components/DailyLogModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { X, Save, Loader2, Syringe, Droplets, Eye, Info, Trash2, AlertTriangle, Activity, ArchiveX, Beaker, Thermometer, TestTube2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

import { ActiveTreatmentDto } from "../actions/start-treatment.actions";
import { logDailyTreatmentAction, deleteTreatmentSessionAction } from "../actions/log-treatment.actions";
import type { ActionTaken } from "../types/treatment.types";

interface Props {
  session: ActiveTreatmentDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void; 
  tDict: Record<string, string>;
  lang: "id" | "en";
  hasLoggedToday: boolean;
}

interface MedicationInfo {
  base_dosage_per_100l: number;
  dosage_unit: string;
}

// 💡 TAMBAHKAN INI TEPAT DI BAWAH interface MedicationInfo
type ExtendedSession = ActiveTreatmentDto & {
  latest_log?: {
    action_taken: string;
    notes: string;
    day_number: number;
    remaining_symptoms?: string[];
  } | null;
};

export default function DailyLogModal({ session, isOpen, onClose, onSuccess, tDict, lang, hasLoggedToday }: Props) {
  const router = useRouter(); 
  const [mounted, setMounted] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false); 
  
  const [actionTaken, setActionTaken] = useState<ActionTaken>(
    (session.latest_log?.action_taken as ActionTaken) || "Observed"
  );
  
  // 💡 FIX BUG 1: Selalu biarkan kosong agar tidak menduplikasi riwayat catatan lama
  const [notes, setNotes] = useState(""); 
  
  // 💡 FIX BUG 2: Gunakan data sisa gejala terakhir agar checklist tidak mereset ke awal setiap hari
  const extendedSession = session as ExtendedSession; // <-- Casting aman standar TypeScript
  const [remainingSymptoms, setRemainingSymptoms] = useState<string[]>(
    extendedSession.latest_log?.remaining_symptoms || extendedSession.initial_symptoms || []
  );
  
  const [waterChangePct, setWaterChangePct] = useState<number | "">(50); 
  const [medicationDose, setMedicationDose] = useState<number | "">("");
  const [newFishLostCount, setNewFishLostCount] = useState<number | "">(0);
  
  const [temp, setTemp] = useState<number | "">("");
  const [ammonia, setAmmonia] = useState<number | "">("");
  const [nitrite, setNitrite] = useState<number | "">("");

  const [medInfo, setMedInfo] = useState<MedicationInfo | null>(null);
  const [tankVolume, setTankVolume] = useState<number>(0);
  const [isLoadingMedInfo, setIsLoadingMedInfo] = useState(true);

  const initialCount = Math.max(1, session.initial_symptoms?.length || 1);
  const currentCount = remainingSymptoms.length;
  const projectedRecovery = Math.max(0, Math.min(100, Math.round(((initialCount - currentCount) / initialCount) * 100)));
  const isCured = projectedRecovery === 100; 

  const calculatedBaseDose = (tankVolume > 0 && medInfo) ? (tankVolume / 100) * medInfo.base_dosage_per_100l : 0;
  const currentWaterChangePct = Number(waterChangePct) || 0;
  const finalRecommendedDose = actionTaken === "Water Change" 
    ? calculatedBaseDose * (currentWaterChangePct / 100) 
    : calculatedBaseDose;

  useEffect(() => {
    setMounted(true);
    if (!isOpen || !session.medication_id) return;
    
    let isMountedLocal = true;
    const fetchData = async () => {
      setIsLoadingMedInfo(true);
      const supabase = createClient();
      try {
        const [medRes, tankRes] = await Promise.all([
          supabase.from('medications').select('base_dosage_per_100l, dosage_unit').eq('id', session.medication_id).single(),
          supabase.from('my_aquariums').select('*').eq('id', session.aquarium_id).single()
        ]);
        if (isMountedLocal) {
          if (medRes.data) setMedInfo(medRes.data as MedicationInfo);
          if (tankRes.data) {
            const vol = tankRes.data.net_water_volume_liters || tankRes.data.volume_liters || 0;
            if (vol > 0) setTankVolume(vol);
            else if (tankRes.data.length_cm && tankRes.data.width_cm && tankRes.data.height_cm) {
              setTankVolume((tankRes.data.length_cm * tankRes.data.width_cm * tankRes.data.height_cm) / 1000);
            }
          }
          setIsLoadingMedInfo(false);
        }
      } catch (error) {
        if (isMountedLocal) setIsLoadingMedInfo(false);
      }
    };
    fetchData();
    return () => { isMountedLocal = false; };
  }, [isOpen, session.medication_id, session.aquarium_id]);

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

  if (!isOpen || !mounted) return null;

  const handleToggleSymptom = (symptomId: string) => {
    setRemainingSymptoms(prev => prev.includes(symptomId) ? prev.filter(id => id !== symptomId) : [...prev, symptomId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await logDailyTreatmentAction({
        aquariumId: session.aquarium_id, sessionId: session.id, remainingSymptomIds: remainingSymptoms,
        actionTaken: actionTaken, medicationDose: Number(medicationDose) || 0, newFishLostCount: Number(newFishLostCount) || 0,
        notes: notes, lang: lang,
        waterParameters: { temp: temp, ammonia: ammonia, nitrite: nitrite } 
      });
      if (res.success) {
        if (isCured) toast.success(lang === 'id' ? "Selesai! Ikan dinyatakan sembuh." : "Completed! Fish marked as cured.");
        else toast.success(lang === 'id' ? "Rekam medis tersimpan!" : "Medical log saved!");
        await onSuccess(); 
        onClose(); 
        window.dispatchEvent(new Event("aquarium_data_changed"));    
        router.refresh(); 
      } else { toast.error(res.error || "Gagal menyimpan rekam medis."); }
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteSession = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteTreatmentSessionAction(session.id, session.aquarium_id);
      if (res.success) {
        toast.success(lang === 'id' ? "Sesi salah input dihapus!" : "Session deleted!");
        await onSuccess(); 
        onClose(); 
        window.dispatchEvent(new Event("aquarium_data_changed"));
        router.refresh();
      } else { toast.error(res.error || "Gagal."); }
    } finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const handleAbortSession = async () => {
    setIsAborting(true);
    try {
      const res = await logDailyTreatmentAction({
        aquariumId: session.aquarium_id, sessionId: session.id, remainingSymptomIds: remainingSymptoms,
        actionTaken: "Medication Changed", medicationDose: 0, newFishLostCount: 0, notes: "Sesi dibatalkan.", lang: lang
      });
      if (res.success) {
        toast.success(lang === 'id' ? "Dipindahkan ke Riwayat!" : "Moved to History!");
        await onSuccess(); 
        onClose(); 
        window.dispatchEvent(new Event("aquarium_data_changed"));        
        router.refresh();
      } else { toast.error(res.error || "Gagal."); }
    } finally { setIsAborting(false); setShowAbortConfirm(false); }
  };

  const actionOptions: { val: ActionTaken; label: string; icon: React.ReactNode; desc: string }[] = [
    { val: "Observed", label: lang === 'id' ? "Hanya Observasi" : "Observation Only", icon: <Eye className="w-4 h-4"/>, desc: lang==='id'?"Hanya memantau.":"Monitoring only." },
    { val: "Redosed", label: lang === 'id' ? "Dosis Ulang" : "Redosed", icon: <Syringe className="w-4 h-4"/>, desc: lang==='id'?"Menambah obat ke tangki.":"Adding more medication." },
    { val: "Water Change", label: lang === 'id' ? "Ganti Air" : "Water Change", icon: <Droplets className="w-4 h-4"/>, desc: lang==='id'?"Pergantian air harian.":"Daily water change." },
  ];

  return createPortal(
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase">Batalkan Sesi?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Gunakan ini hanya jika Anda SALAH INPUT pasien. Semua rekam medis hari ini akan ikut terhapus.</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleDeleteSession} disabled={isDeleting} className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "YA, HAPUS PERMANEN"}
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="w-full h-12 font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700">Batal</Button>
            </div>
          </div>
        </div>
      )}

      {showAbortConfirm && (
        <div className="fixed inset-0 z-[9999999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><ArchiveX className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase">Ganti Obat?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Sesi pengobatan ini akan dihentikan dan dipindahkan ke Riwayat. Anda harus memulai sesi pengobatan baru dari awal.</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleAbortSession} disabled={isAborting} className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded-xl">
                {isAborting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "YA, GANTI OBAT"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAbortConfirm(false)} disabled={isAborting} className="w-full h-12 font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700">Batal</Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] border border-slate-200 dark:border-slate-800">
          
          <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shadow-sm z-10">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                {tDict.formTitle || (lang === 'id' ? "Buku Rekam Medis Harian" : "Daily Medical Logbook")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {tDict.formDesc || (lang === 'id' ? "Catat perkembangan pasien hari ini untuk dievaluasi oleh sistem Pakar." : "Record today's patient progress for Expert System.")}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 bg-slate-200 text-slate-600 hover:bg-red-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-600 transition-colors rounded-full shrink-0">
              <X className="w-5 h-5 font-bold"/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white dark:bg-slate-950 relative">
            <form id="daily-log-form" onSubmit={handleSubmit} className="space-y-6">
              
              {hasLoggedToday && !isCured && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex gap-3 text-blue-800 dark:text-blue-300">
                  <Info className="w-5 h-5 shrink-0 mt-0.5"/>
                  <p className="text-[11px] sm:text-xs font-bold leading-relaxed">
                    {lang === 'id' ? "Anda SUDAH MENGISI log hari ini. Jika disimpan, catatan baru akan digabungkan dengan aman." : "You HAVE LOGGED today. Saving will SECURELY APPEND your new entry."}
                  </p>
                </div>
              )}

              <div className={`p-5 rounded-2xl border transition-colors ${isCured ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                 <div className="flex justify-between items-end mb-2">
                   <div className="flex items-center gap-2">
                     <Activity className={`w-4 h-4 ${isCured ? 'text-emerald-600' : 'text-emerald-500'}`}/>
                     <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                       {lang === 'id' ? "Proyeksi Kesembuhan" : "Projected Recovery"}
                     </span>
                   </div>
                   <span className={`text-2xl font-black ${isCured ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                     {projectedRecovery}%
                   </span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
                   <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${projectedRecovery}%` }} />
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                   <p className={`text-[11px] font-medium leading-snug ${isCured ? 'text-emerald-700 font-bold dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                     {isCured 
                       ? (lang === 'id' ? "✨ LUAR BIASA! Gejala habis. Sistem akan menutup sesi dan menandai pasien SEMBUH TOTAL." : "✨ EXCELLENT! No symptoms. System will close session as FULLY RECOVERED.")
                       : (lang === 'id' ? "Cabut centang gejala di bawah untuk melihat persentase naik." : "Uncheck symptoms below to see percentage rise.")
                     }
                   </p>
                 </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {lang === 'id' ? "Tindakan Utama Hari Ini" : "Main Action Today"}
                  </label>
                  <Button type="button" onClick={() => setShowAbortConfirm(true)} disabled={isSubmitting || isAborting} variant="ghost" className="h-8 px-2 text-[10px] uppercase font-black tracking-widest text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 w-full sm:w-auto">
                    <ArchiveX className="w-3.5 h-3.5 mr-1"/> {lang === 'id' ? "Ganti Obat (Pindah Riwayat)" : "Change Meds"}
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

                {!isLoadingMedInfo && medInfo && (actionTaken === "Redosed" || actionTaken === "Water Change") && (
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl flex gap-3 text-blue-800 dark:text-blue-300 mt-3">
                     <Beaker className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                     <div className="text-xs space-y-3 w-full">
                       <p className="font-bold text-sm">{lang === 'id' ? "Kalkulator Dosis Otomatis" : "Auto Dosage Calculator"}</p>

                       {actionTaken === "Water Change" && (
                         <div className="space-y-1.5 bg-blue-100/50 dark:bg-blue-900/40 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                           <label className="text-[11px] font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">{lang === 'id' ? "Berapa % air yang diganti?" : "How much water changed?"}</label>
                           <div className="flex gap-2 items-center flex-wrap">
                             {[20, 30, 50].map(pct => (
                               <button key={pct} type="button" onClick={() => setWaterChangePct(pct)} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${waterChangePct === pct ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-50'}`}>{pct}%</button>
                             ))}
                             <div className="relative flex-1 min-w-[80px] max-w-[100px]">
                               <Input type="number" min={0} max={100} value={waterChangePct} onChange={(e) => setWaterChangePct(e.target.value ? Number(e.target.value) : "")} className="h-8 text-[11px] font-bold rounded-lg pr-6 bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100" placeholder="Custom" />
                               <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">%</span>
                             </div>
                           </div>
                         </div>
                       )}
                       
                       <div className="flex flex-col gap-1.5 bg-white/60 dark:bg-slate-900/50 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                         <div className="flex justify-between items-center"><span className="font-medium text-slate-500">{lang === 'id' ? 'Volume Penuh' : 'Full Volume'}</span><span className="font-bold text-slate-700">{tankVolume > 0 ? `${tankVolume} L` : '???'}</span></div>
                         <div className="flex justify-between items-center"><span className="font-medium text-slate-500">{lang === 'id' ? 'Dosis Standar' : 'Std Dose'}</span><span className="font-bold text-slate-700">{medInfo.base_dosage_per_100l} {medInfo.dosage_unit} / 100L</span></div>
                         {actionTaken === "Water Change" && tankVolume > 0 && (
                           <div className="flex justify-between items-center text-blue-600"><span className="font-medium">{lang === 'id' ? 'Air Baru' : 'New Water'}</span><span className="font-bold">{waterChangePct || 0}%</span></div>
                         )}
                         <div className="h-px w-full bg-blue-200/50 my-1"></div>
                         <div className="flex justify-between items-center pt-1"><span className="font-bold text-blue-700">{lang === 'id' ? 'Saran Dosis' : 'Recommended Dose'}</span><span className="font-black text-[15px] text-blue-700">{tankVolume > 0 ? `${Number(finalRecommendedDose.toFixed(2))} ${medInfo.dosage_unit}` : 'Manual'}</span></div>
                       </div>
                       
                       {tankVolume > 0 && (
                         <div className="flex justify-end pt-1">
                           <Button type="button" size="sm" onClick={() => setMedicationDose(Number(finalRecommendedDose.toFixed(2)))} className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm">
                             {lang === 'id' ? "Gunakan Dosis Ini" : "Use This Dose"}
                           </Button>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{lang === 'id' ? "Dosis Diberikan" : "Dose Administered"}</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min={0} 
                      step="any" 
                      value={medicationDose} 
                      onChange={(e) => setMedicationDose(e.target.value ? Number(e.target.value) : "")} 
                      disabled={actionTaken === "Observed" || actionTaken === "Medication Changed"} 
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold dark:text-slate-100 focus:border-blue-500 pr-16" 
                    />
                    {medInfo && actionTaken !== "Observed" && actionTaken !== "Medication Changed" && (
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none"><span className="text-xs font-bold text-slate-400 uppercase">{medInfo.dosage_unit}</span></div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest">{lang === 'id' ? "Kematian Baru (Ekor)" : "New Casualties"}</label>
                  <Input type="number" min={0} value={newFishLostCount} onChange={(e) => setNewFishLostCount(e.target.value ? Number(e.target.value) : "")} className="h-12 rounded-xl bg-rose-50 border-rose-200 font-bold text-rose-600 dark:bg-rose-950/30 focus:border-rose-500" />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <label className="text-[11px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <TestTube2 className="w-3.5 h-3.5" /> {lang === 'id' ? "Cek Parameter Air (Opsional)" : "Water Params (Optional)"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Thermometer className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="number" step="any" value={temp} onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : "")} className="h-10 pl-8 pr-6 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" placeholder="Temp" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">°C</span>
                  </div>
                  <div className="relative">
                    <Input type="number" step="any" value={ammonia} onChange={(e) => setAmmonia(e.target.value ? Number(e.target.value) : "")} className="h-10 px-3 pr-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-600" placeholder="NH3" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ppm</span>
                  </div>
                  <div className="relative">
                    <Input type="number" step="any" value={nitrite} onChange={(e) => setNitrite(e.target.value ? Number(e.target.value) : "")} className="h-10 px-3 pr-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-rose-500" placeholder="NO2" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">ppm</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{lang === 'id' ? "Checklist Sisa Gejala" : "Remaining Symptoms"}</label>
                <div className="space-y-2">
                  {session.initial_symptoms.map(symId => (
                    <label key={symId} className="flex items-center gap-3 p-2 cursor-pointer group bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300">
                      <input type="checkbox" checked={remainingSymptoms.includes(symId)} onChange={() => handleToggleSymptom(symId)} className="w-5 h-5 accent-rose-600 rounded shrink-0" />
                      <span className={`text-sm font-bold ${remainingSymptoms.includes(symId) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>{symId}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{lang === 'id' ? "Catatan Klinis (Opsional)" : "Clinical Notes (Optional)"}</label>
                <textarea 
                  rows={3} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-medium text-sm custom-scrollbar resize-none" 
                  placeholder={hasLoggedToday 
                    ? (lang === 'id' ? 'Ketik update baru di sini. (Catatan yang sebelumnya sudah tersimpan dengan aman)' : 'Type new updates here. (Previous notes are safe)') 
                    : (lang === 'id' ? 'Contoh: Ikan mulai mau makan pelet...' : 'e.g., Fish responds to pellets...')} 
                />
              </div>
            </form>
          </div>
          
          <div className="shrink-0 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
             <Button type="button" onClick={() => setShowDeleteConfirm(true)} variant="outline" disabled={isSubmitting || isDeleting} className="w-full sm:w-auto h-12 rounded-xl font-bold uppercase tracking-wider border-red-200 text-red-500 hover:bg-red-600 hover:text-white transition-all">
               <Trash2 className="w-4 h-4 mr-2"/> {lang === 'id' ? "Salah Input" : "Mistake"}
             </Button>
             <div className="flex flex-1 gap-3">
               <Button type="button" onClick={onClose} disabled={isSubmitting || isDeleting} variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-100">
                 {lang === 'id' ? "Batal" : "Cancel"}
               </Button>
               <Button 
                 type="submit" 
                 form="daily-log-form" 
                 disabled={isSubmitting || isDeleting} 
                 className={`flex-[2] h-12 text-white font-black text-sm uppercase rounded-xl transition-all shadow-lg ${isCured ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30'}`}
               >
                 {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : (
                   <span className="flex items-center justify-center gap-2">
                     <Save className="w-5 h-5"/> {isCured ? (lang === 'id' ? "SELESAIKAN PERAWATAN" : "COMPLETE TREATMENT") : (lang === 'id' ? "SIMPAN DATA" : "SAVE DATA")}
                   </span>
                 )}
               </Button>
             </div>
          </div>
        </div>
      </div>
    </>,
    document.body 
  );
}