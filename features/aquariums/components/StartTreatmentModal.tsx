// features/aquariums/components/StartTreatmentModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Save, Loader2, Stethoscope, Syringe, AlertTriangle, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { getTreatmentDropdownOptionsAction, startNewTreatmentSessionAction } from "@/features/diseases/actions/start-treatment.actions";

interface Props {
  aquariumId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dict: Record<string, string>;
  lang: "id" | "en";
}

interface DiseaseOption {
  id: string;
  name_id: string;
  name_en: string;
  severity: number;
}

interface MedOption {
  id: string;
  name: string;
  dosage_unit: string;
}

export default function StartTreatmentModal({ aquariumId, isOpen, onClose, onSuccess, dict, lang }: Props) {
  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [medications, setMedications] = useState<MedOption[]>([]);
  
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form States
  const [diseaseId, setDiseaseId] = useState<string>("");
  const [medicationId, setMedicationId] = useState<string>("");
  const [severityScore, setSeverityScore] = useState<number>(3);
  const [symptoms, setSymptoms] = useState<string>("");

  // Clean close handler to reset form states safely
  const handleClose = useCallback(() => {
    setDiseaseId("");
    setMedicationId("");
    setSeverityScore(3);
    setSymptoms("");
    onClose();
  }, [onClose]);

  // Effect 1: Body Scroll Lock & Global Escape Key Listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Effect 2: Fetch Dropdown Database Safely
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchOptions() {
      setIsLoadingOptions(true);
      try {
        const res = await getTreatmentDropdownOptionsAction();
        if (!isMounted) return;

        if (res.success) {
          const validatedDiseases = (res.diseases || []).map((d: Record<string, unknown>) => ({
            id: String(d.id || ""),
            name_id: String(d.name_id || ""),
            name_en: String(d.name_en || ""),
            severity: Number(d.severity || 3),
          })) as DiseaseOption[];

          const validatedMedications = (res.medications || []).map((m: Record<string, unknown>) => ({
            id: String(m.id || ""),
            name: String(m.name || ""),
            dosage_unit: String(m.dosage_unit || ""),
          })) as MedOption[];

          setDiseases(validatedDiseases);
          setMedications(validatedMedications);
        } else {
          toast.error(res.error || (lang === 'id' ? "Gagal memuat referensi medis." : "Failed to load medical references."));
        }
      } catch (err) {
        console.error("CRITICAL EXCEPTION FETCHING DROPDOWNS:", err);
        toast.error(lang === 'id' ? "Gangguan koneksi internal." : "Internal connection disruption.");
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    }

    fetchOptions();
    return () => { isMounted = false; };
  }, [isOpen, lang]);

  // Effect 3: Automatic Severity Predictor Baseline
  useEffect(() => {
    if (diseaseId) {
      const selectedDisease = diseases.find(d => d.id === diseaseId);
      if (selectedDisease) {
        setSeverityScore(selectedDisease.severity);
      }
    }
  }, [diseaseId, diseases]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!diseaseId || !medicationId) {
      toast.error(lang === 'id' ? "Penyakit dan Obat wajib dipilih." : "Disease and Medication are required.");
      return;
    }

    setIsSubmitting(true);
    const symptomsArray = symptoms
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const res = await startNewTreatmentSessionAction({
        aquariumId,
        diseaseId,
        medicationId,
        initialSeverityScore: severityScore,
        initialSymptoms: symptomsArray
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Sesi pengobatan berhasil dimulai!" : "Treatment session started successfully!");
        onSuccess();
        handleClose();
      } else {
        console.error("DB INSERT EXECUTION ERROR:", res.error);
        toast.error(res.error || (lang === 'id' ? "Gagal menyimpan data rekam medis." : "Failed to save medical record."));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (lang === 'id' ? "Terjadi kesalahan internal data" : "Internal database exception");
      console.error("FATAL MODAL TRANSACTION CRASH:", errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* PERBAIKAN 1: Menggunakan Flexbox Center Murni */
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {isLoadingOptions ? (
        /* LOADING FRAME */
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-12 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none z-0"></div>
          <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            {lang === 'id' ? "Sinkronisasi basis data medis..." : "Synchronizing medical database..."}
          </p>
        </div>
      ) : (
        /* PERBAIKAN 2: Mengontrol Max Height Form Agar Tidak Melebihi Layar Komputer/HP */
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        >
          {/* Aesthetic Overlay Ambient Background Vector */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none z-0"></div>

          {/* FIXED HEADER CONTENT */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shrink-0 relative z-10">
            <div className="pr-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                {dict.formTitle || (lang === 'id' ? "Formulir Rekam Medis Baru" : "New Medical Record Form")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                {dict.formDesc || (lang === 'id' ? "Laporkan kasus infeksi baru di akuarium Anda. Data ini sangat berharga untuk disumbangkan ke dalam Sistem Analitik AI." : "Report a new infection case in your aquarium. This data is highly valuable for the AI Analytics System.")}
              </p>
            </div>
            <button 
              type="button"
              onClick={handleClose} 
              className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-600 dark:hover:text-white transition-all duration-150 rounded-full shrink-0 shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4 font-bold" />
            </button>
          </div>

          {/* PERBAIKAN 3: Memakai flex-1 dengan overflow-y-auto agar dinamis & tetap nyaman di-scroll */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 bg-white dark:bg-slate-950 relative z-10">
            
            {/* INFECTION DIAGNOSIS SELECTION */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-500" /> {dict.labelDisease || (lang === 'id' ? "Diagnosa Penyakit" : "Disease Diagnosis")}
              </label>
              <div className="relative">
                <select 
                  required 
                  value={diseaseId} 
                  onChange={(e) => setDiseaseId(e.target.value)} 
                  className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:border-rose-500 dark:focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>-- {lang === 'id' ? "Pilih Jenis Penyakit" : "Select Disease Specification"} --</option>
                  {diseases.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'id' ? d.name_id : d.name_en}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* CLINICAL MEDICATION SELECTION */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Syringe className="w-3.5 h-3.5 text-blue-500" /> {dict.labelMedication || (lang === 'id' ? "Terapi Obat Utama" : "Primary Treatment Medication")}
              </label>
              <div className="relative">
                <select 
                  required 
                  value={medicationId} 
                  onChange={(e) => setMedicationId(e.target.value)} 
                  className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>-- {lang === 'id' ? "Pilih Tipe Obat" : "Select Medication Protocol"} --</option>
                  {medications.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* SEVERITY LEVEL METRIC */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {lang === 'id' ? "Tingkat Keparahan Klinis (Skala 1-5)" : "Clinical Severity Metric (Scale 1-5)"}
              </label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                required 
                value={severityScore} 
                onChange={(e) => setSeverityScore(Math.max(1, Math.min(5, Number(e.target.value))))} 
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-center focus:border-amber-500 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all"
              />
            </div>

            {/* QUALITATIVE SYMPTOM NOTES */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" /> {dict.labelNotes || (lang === 'id' ? "Catatan Manifestasi Gejala (Pisahkan dengan Koma)" : "Symptom Manifestation Logs (Comma Separated)")}
              </label>
              <textarea 
                rows={3} 
                value={symptoms} 
                onChange={(e) => setSymptoms(e.target.value)} 
                placeholder={dict.placeholderNotes || (lang === 'id' ? "Contoh: Bintik putih di insang, nafsu makan berkurang, berenang lambat..." : "e.g., White spots on gills, reduced appetite, lethargic swimming...")}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-950 outline-none custom-scrollbar transition-all resize-none"
              />
            </div>

          </div>
          
          {/* ACTION BUTTON FOOTER */}
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex gap-3 relative z-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {dict.btnCancel || (lang === 'id' ? "Batal" : "Cancel")}
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 h-12 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {dict.btnSave || (lang === 'id' ? "Simpan Data" : "Save Record")}
                </span>
              )}
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}