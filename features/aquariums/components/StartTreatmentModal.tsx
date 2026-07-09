// features/aquariums/components/StartTreatmentModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Loader2, Stethoscope, Syringe, AlertTriangle, FileText, ChevronDown, Info } from "lucide-react";
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
  quarantine_required?: boolean; 
}

interface MedOption {
  id: string;
  name_id: string; 
  name_en: string; 
  dosage_unit: string;
  safe_for_plants?: boolean; 
  safe_for_inverts?: boolean; 
}

export default function StartTreatmentModal({ aquariumId, isOpen, onClose, onSuccess, dict, lang }: Props) {
  const router = useRouter();

  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [medications, setMedications] = useState<MedOption[]>([]);
  
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form States
  const [diseaseId, setDiseaseId] = useState<string>("");
  const [medicationId, setMedicationId] = useState<string>("");
  const [severityScore, setSeverityScore] = useState<number>(3);
  const [symptoms, setSymptoms] = useState<string>("");

  const handleClose = useCallback(() => {
    setDiseaseId("");
    setMedicationId("");
    setSeverityScore(3);
    setSymptoms("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = ""; 
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

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
            quarantine_required: d.quarantine_required === true, 
          })) as DiseaseOption[];

          const validatedMedications = (res.medications || []).map((m: Record<string, unknown>) => ({
            id: String(m.id || ""),
            name_id: String(m.name_id || m.name || ""), 
            name_en: String(m.name_en || m.name || ""), 
            dosage_unit: String(m.dosage_unit || ""),
            safe_for_plants: m.safe_for_plants === true,
            safe_for_inverts: m.safe_for_inverts === true,
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
        router.refresh(); 
        handleClose();
      } else {
        toast.error(res.error || (lang === 'id' ? "Gagal menyimpan data rekam medis." : "Failed to save medical record."));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (lang === 'id' ? "Terjadi kesalahan internal data" : "Internal database exception");
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 💡 PERBAIKAN 1: Background Wrapper menggunakan `items-center` dan `justify-center` tanpa `overflow-y-auto`
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      
      {isLoadingOptions ? (
        // 💡 PERBAIKAN 2: Dihapus class `my-auto` agar Flexbox tidak bingung
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-12 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
          <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            {lang === 'id' ? "Sinkronisasi basis data medis..." : "Synchronizing medical database..."}
          </p>
        </div>
      ) : (
        // 💡 PERBAIKAN 3: Kotak Modal dibatasi ketat `max-h-[90vh]` dan `flex-col`, dihapus class `my-auto`
        <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] md:max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          
          {/* HEADER (Selalu lengket di atas, tidak ter-scroll) */}
          <div className="relative z-10 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shrink-0 shadow-sm">
            <div className="pr-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                {dict.formTitle || (lang === 'id' ? "Formulir Pendaftaran Pasien Baru" : "New Patient Registration Form")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                {dict.formDesc || (lang === 'id' ? "Laporkan kasus infeksi baru di akuarium Anda. AI akan melacak perkembangan kesembuhan harian." : "Report a new infection case in your aquarium. AI will track daily recovery progress.")}
              </p>
            </div>
            
            <button 
              type="button"
              onClick={handleClose} 
              className="p-2 bg-slate-200 text-slate-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-600 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] dark:hover:text-white transition-all duration-300 rounded-full shrink-0"
            >
              <X className="w-5 h-5 font-bold" />
            </button>
          </div>

          {/* ======================= */}
          {/* 🤖 AI QUARANTINE ENGINE */}
          {/* ======================= */}
          {diseaseId && medicationId && (() => {
            const selectedDis = diseases.find(d => d.id === diseaseId);
            const selectedMed = medications.find(m => m.id === medicationId);
            const isContagious = selectedDis?.quarantine_required;
            
            const isToxic = selectedMed && (!selectedMed.safe_for_plants || !selectedMed.safe_for_inverts);
            
            if (isContagious || isToxic) {
              return (
                <div className="mx-6 mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 flex gap-4 animate-in slide-in-from-bottom-2 shrink-0">
                  <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight text-sm mb-1">
                      {lang === 'id' ? "⚠️ PERHATIAN: WAJIB PINDAH KE TANK KARANTINA" : "⚠️ WARNING: QUARANTINE TANK REQUIRED"}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-500/80 font-medium">
                      {isContagious 
                        ? (lang === 'id' ? "Penyakit ini sangat menular. Pindahkan pasien ke Hospital Tank sebelum diobati." : "This disease is highly contagious. Move patient to a Hospital Tank.") 
                        : (lang === 'id' ? "Obat ini beracun bagi tanaman atau udang/siput di akuarium utama Anda." : "This medication is toxic to plants or invertebrates in your main display tank.")
                      }
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* BODY FORM (Ini area yang HANYA BISA DI-SCROLL, flex-1 dan overflow-y-auto) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white dark:bg-slate-950">
            <form id="start-treatment-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-500" /> {dict.labelDisease || (lang === 'id' ? "Diagnosa Penyakit" : "Disease Diagnosis")}
                </label>
                <div className="relative">
                  <select 
                    required 
                    value={diseaseId} 
                    onChange={(e) => setDiseaseId(e.target.value)} 
                    className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:border-rose-500 dark:focus:border-rose-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- {lang === 'id' ? "Pilih Jenis Penyakit" : "Select Disease Specification"} --</option>
                    {diseases.map(d => (
                      <option key={d.id} value={d.id}>{lang === 'id' ? d.name_id : d.name_en}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" /> 
                  {lang === 'id' ? "Pilih penyakit berdasarkan hasil Analisis AI atau pengamatan manual Anda." : "Select illness based on AI Analysis or manual observation."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-blue-500" /> {dict.labelMedication || (lang === 'id' ? "Terapi Obat Utama" : "Primary Treatment Medication")}
                </label>
                <div className="relative">
                  <select 
                    required 
                    value={medicationId} 
                    onChange={(e) => setMedicationId(e.target.value)} 
                    className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- {lang === 'id' ? "Pilih Tipe Obat" : "Select Medication Protocol"} --</option>
                    {medications.map(m => (
                      <option key={m.id} value={m.id}>{lang === 'id' ? m.name_id : m.name_en}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" /> 
                  {lang === 'id' ? "Pilih obat utama yang akan diberikan. Pastikan cocok dengan penyakit yang diderita." : "Select main medication to administer. Ensure it matches the diagnosed disease."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> {lang === 'id' ? "Tingkat Keparahan Awal (Skala 1-5)" : "Initial Severity Metric (Scale 1-5)"}
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  required 
                  value={severityScore} 
                  onChange={(e) => setSeverityScore(Math.max(1, Math.min(5, Number(e.target.value))))} 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-center focus:border-amber-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" /> 
                  {lang === 'id' ? "1 = Sangat Ringan (Gejala awal), 5 = Sangat Kritis (Kondisi fatal/sekarat). Otomatis terisi oleh standar AI, tapi bisa diubah." : "1 = Very Mild, 5 = Critical/Fatal. Auto-filled by AI standard, but can be adjusted."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> {dict.labelNotes || (lang === 'id' ? "Daftar Gejala (Pisahkan dengan Koma)" : "Symptom List (Comma Separated)")}
                </label>
                <textarea 
                  rows={3} 
                  required
                  value={symptoms} 
                  onChange={(e) => setSymptoms(e.target.value)} 
                  placeholder={dict.placeholderNotes || (lang === 'id' ? "Contoh: Bintik putih di insang, nafsu makan hilang, berenang pasif" : "e.g., White spots on gills, loss of appetite, passive swimming")}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:border-slate-400 outline-none custom-scrollbar resize-none"
                />
                <p className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" /> 
                  {lang === 'id' ? "Sebutkan gejala fisik/perilaku spesifik. Ini akan dijadikan referensi pemulihan di laporan harian berikutnya." : "Mention specific physical/behavioral symptoms. This acts as recovery baseline for future daily logs."}
                </p>
              </div>

            </form>
          </div>

          {/* FOOTER (Selalu lengket di bawah, tidak ter-scroll) */}
          <div className="relative z-10 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {dict.btnCancel || (lang === 'id' ? "Batal" : "Cancel")}
            </Button>
            
            <Button 
              type="submit" 
              form="start-treatment-form"
              disabled={isSubmitting} 
              className="flex-1 h-12 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl shadow-md active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {lang === 'id' ? "Mulai Pengobatan" : "Start Treatment"}
                </span>
              )}
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}