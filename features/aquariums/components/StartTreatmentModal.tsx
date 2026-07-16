// features/aquariums/components/StartTreatmentModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { 
  X, Save, Loader2, Stethoscope, Syringe, AlertTriangle, 
  FileText, ChevronDown, ShieldCheck, Sparkles, AlertCircle, Info, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Import Action bawaan Bapak
import { getTreatmentDropdownOptionsAction, startNewTreatmentSessionAction } from "@/features/treatments/actions/start-treatment.actions";
// Import Mesin AI Apoteker buatan Bapak
import { getMedicationRecommendationAction } from "@/features/treatments/services/medication-engine.actions";
import type { MedicationRecommendation } from "@/features/treatments/types/medication.types";

interface Props {
  aquariumId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dict: Record<string, string>;
  lang: "id" | "en";
}

interface DiseaseOption { id: string; name_id: string; name_en: string; severity: number; quarantine_required?: boolean; }

export default function StartTreatmentModal({ aquariumId, isOpen, onClose, onSuccess, dict, lang }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State Formulir
  const [diseaseId, setDiseaseId] = useState<string>("");
  const [medicationId, setMedicationId] = useState<string>("");
  const [severityScore, setSeverityScore] = useState<number>(3);
  const [symptoms, setSymptoms] = useState<string>("");

  // State AI Engine
  const [aiRecommendations, setAiRecommendations] = useState<MedicationRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [netVolume, setNetVolume] = useState<number>(0);

  const handleClose = useCallback(() => { 
    setDiseaseId(""); 
    setMedicationId(""); 
    setSeverityScore(3); 
    setSymptoms(""); 
    setAiRecommendations([]);
    onClose(); 
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKeyDown); };
  }, [isOpen, handleClose]);

  // 1. Load Daftar Penyakit
  useEffect(() => {
    if (!isOpen) return;
    let isMountedLocal = true;
    async function fetchOptions() {
      setIsLoadingOptions(true);
      try {
        const res = await getTreatmentDropdownOptionsAction();
        if (!isMountedLocal) return;

        if (res.success) {
          const validatedDiseases = (res.diseases || []).map((d: any) => ({
            id: String(d.id || ""),
            name_id: String(d.name_id || ""),
            name_en: String(d.name_en || ""),
            severity: Number(d.severity || 3),
            quarantine_required: d.quarantine_required === true, 
          })) as DiseaseOption[];
          setDiseases(validatedDiseases);
        } else {
          toast.error(res.error || "Gagal memuat referensi medis.");
        }
      } catch (err) {
        toast.error("Gangguan koneksi internal.");
      } finally {
        if (isMountedLocal) setIsLoadingOptions(false);
      }
    }
    fetchOptions();
    return () => { isMountedLocal = false; };
  }, [isOpen]);

  // 2. TRIGGER MESIN AI SAAT PENYAKIT DIPILIH
  useEffect(() => {
    if (diseaseId && isOpen) {
      const selectedDisease = diseases.find(d => d.id === diseaseId);
      if (selectedDisease) setSeverityScore(selectedDisease.severity);

      // Reset pilihan obat sebelumnya & mulai analisis
      setMedicationId("");
      setIsAnalyzing(true);
      setAiRecommendations([]);

      getMedicationRecommendationAction({ aquariumId, diseaseId, lang })
        .then((res) => {
          if (res.success) {
            setAiRecommendations(res.recommendations);
            setNetVolume(res.netVolumeLiters);
          } else {
            toast.error(res.error || "AI Gagal menganalisis obat.");
          }
        })
        .catch(() => toast.error("Koneksi ke AI terputus."))
        .finally(() => setIsAnalyzing(false));
    }
  }, [diseaseId, aquariumId, lang, isOpen, diseases]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!diseaseId || !medicationId) {
      toast.error(lang === 'id' ? "Penyakit dan Obat wajib dipilih." : "Disease and Medication are required.");
      return;
    }

    setIsSubmitting(true);
    const symptomsArray = symptoms.split(",").map(s => s.trim()).filter(s => s.length > 0);

    try {
      const res = await startNewTreatmentSessionAction({
        aquariumId, diseaseId, medicationId, initialSeverityScore: severityScore, initialSymptoms: symptomsArray
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Sesi pengobatan berhasil dimulai!" : "Treatment session started successfully!");
        onSuccess();
        router.refresh(); 
        handleClose();
        // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
      } else {
        toast.error(res.error || "Gagal menyimpan rekam medis.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan internal data");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const selectedDiseaseInfo = diseases.find(d => d.id === diseaseId);

  return createPortal(
    <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      {isLoadingOptions ? (
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-950 shadow-2xl p-12 flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mb-4"/>
          <p className="text-sm font-bold text-slate-500 animate-pulse">{lang === 'id' ? "Menyiapkan formulir medis..." : "Loading medical form..."}</p>
        </div>
      ) : (
        <div className="w-full max-w-3xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          
          <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shadow-sm z-10">
            <div className="pr-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                {lang === 'id' ? "Pendaftaran & Analisis AI" : "Registration & AI Analysis"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                {lang === 'id' ? "Pilih penyakit, dan AI Apoteker akan meresepkan obat yang paling aman untuk ekosistem Anda." : "Select a disease, and the AI Pharmacist will prescribe the safest medication."}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 bg-slate-200 text-slate-600 hover:bg-red-600 hover:text-white rounded-full transition-all duration-300 shrink-0">
              <X className="w-5 h-5 font-black"/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative">
            
            {/* PERINGATAN KARANTINA JIKA MENULAR */}
            {selectedDiseaseInfo?.quarantine_required && (
              <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 flex gap-4 shrink-0">
                <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0"/>
                <div>
                  <h4 className="font-black text-amber-800 dark:text-amber-400 uppercase text-sm mb-1">
                    {lang === 'id' ? "⚠️ WAJIB PINDAH KE TANK KARANTINA" : "⚠️ QUARANTINE TANK REQUIRED"}
                  </h4>
                  <p className="text-xs text-amber-700 font-medium">
                    {lang === 'id' ? "Penyakit ini sangat menular. Segera pindahkan pasien ke Hospital Tank." : "Highly contagious. Move patient to Hospital Tank immediately."}
                  </p>
                </div>
              </div>
            )}

            <form id="start-treatment-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-500"/> {lang === 'id' ? "1. Diagnosa Penyakit" : "1. Disease Diagnosis"}
                </label>
                <div className="relative">
                  <select required value={diseaseId} onChange={(e) => setDiseaseId(e.target.value)} className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold focus:border-rose-500 outline-none cursor-pointer appearance-none">
                    <option value="" disabled>-- {lang === 'id' ? "Pilih Indikasi Penyakit" : "Select Disease Indication"} --</option>
                    {diseases.map(d => (
                      <option key={d.id} value={d.id}>{lang === 'id' ? d.name_id : d.name_en}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                </div>
              </div>

              {/* AREA AI REKOMENDASI OBAT */}
              {diseaseId && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500"/> {lang === 'id' ? "2. Analisis & Resep Apoteker AI" : "2. AI Pharmacist Prescription"}
                    </label>
                    {!isAnalyzing && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                        Net Volume: {netVolume} L
                      </span>
                    )}
                  </div>

                  {isAnalyzing ? (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {lang === 'id' ? "AI sedang mengkalkulasi dosis dan kecocokan fauna..." : "AI is calculating dosage and fauna compatibility..."}
                      </p>
                    </div>
                  ) : aiRecommendations.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 text-center">
                      <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">{lang === 'id' ? "Belum ada protokol obat untuk penyakit ini." : "No medication protocol for this disease."}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiRecommendations.map((rec) => {
                        const isSelected = medicationId === rec.medicationId;
                        const isSafe = rec.isSafeToUse;

                        return (
                          <div 
                            key={rec.medicationId}
                            onClick={() => isSafe && setMedicationId(rec.medicationId)}
                            className={`relative rounded-2xl p-4 border-2 transition-all duration-200 flex flex-col justify-between 
                              ${!isSafe ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 opacity-80 cursor-not-allowed" 
                                : isSelected ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md cursor-pointer scale-[1.02]" 
                                : "border-slate-200 bg-white dark:bg-slate-900 cursor-pointer hover:border-blue-300"}
                            `}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-black text-lg leading-tight ${!isSafe ? 'text-red-700' : 'text-slate-800 dark:text-slate-100'}`}>
                                  {rec.name}
                                </h4>
                                {rec.priority === "Primary" && isSafe && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">
                                    {lang === 'id' ? "Pilihan Utama" : "Top Choice"}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mb-3">
                                {rec.activeIngredient}
                              </p>

                              {isSafe ? (
                                <div className="space-y-1.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500">Target Dosis (Total)</span>
                                    <span className="text-blue-600">{rec.calculatedDosage} {rec.dosageUnit}</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500">Siklus / Durasi</span>
                                    <span className="text-slate-700 dark:text-slate-300">{rec.durationDays} Hari</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-red-600 uppercase">
                                    <AlertTriangle className="w-4 h-4"/> Dilarang / Berbahaya
                                  </div>
                                  <ul className="space-y-1.5">
                                    {rec.safetyAlerts.map((alert, idx) => (
                                      <li key={idx} className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg leading-snug flex items-start gap-1.5">
                                        <X className="w-3 h-3 shrink-0 mt-0.5"/> {alert.reason}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Status Icon */}
                            {isSafe && isSelected && (
                              <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-1 shadow-md">
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* AREA GEJALA & SKOR (Hanya muncul jika Obat sudah dipilih) */}
              {medicationId && (
                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500"/> {lang === 'id' ? "3. Tingkat Keparahan Awal (Skala 1-5)" : "3. Initial Severity (Scale 1-5)"}
                    </label>
                    <input type="number" min="1" max="5" required value={severityScore} onChange={(e) => setSeverityScore(Math.max(1, Math.min(5, Number(e.target.value))))} className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-center focus:border-amber-500 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500"/> {lang === 'id' ? "4. Daftar Gejala (Koma)" : "4. Symptoms (Comma)"}
                    </label>
                    <textarea rows={3} required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder={lang === 'id' ? "Contoh: Bintik putih di insang, nafsu makan hilang..." : "e.g., White spots on gills, loss of appetite..."} className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium focus:border-slate-400 outline-none resize-none custom-scrollbar" />
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="shrink-0 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 z-10">
            <Button type="button" onClick={handleClose} disabled={isSubmitting} variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase border-slate-200">
              {lang === 'id' ? "Batal" : "Cancel"}
            </Button>
            
            <Button type="submit" form="start-treatment-form" disabled={isSubmitting || !medicationId || isAnalyzing} className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-xl shadow-md border-none disabled:bg-slate-300 dark:disabled:bg-slate-800">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (lang === 'id' ? "Mulai Pengobatan" : "Start Treatment")}
            </Button>
          </div>

        </div>
      )}
    </div>,
    document.body
  );
}