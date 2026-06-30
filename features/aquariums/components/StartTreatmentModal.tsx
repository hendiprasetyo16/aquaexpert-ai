// features/aquariums/components/StartTreatmentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Stethoscope, Syringe, AlertTriangle } from "lucide-react";
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

interface DiseaseOption { id: string; name_id: string; name_en: string; severity: number; }
interface MedOption { id: string; name: string; dosage_unit: string; }

export default function StartTreatmentModal({ aquariumId, isOpen, onClose, onSuccess, dict, lang }: Props) {
  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [medications, setMedications] = useState<MedOption[]>([]);
  
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [diseaseId, setDiseaseId] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [severityScore, setSeverityScore] = useState<number>(3);
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    async function fetchOptions() {
      setIsLoadingOptions(true);
      const res = await getTreatmentDropdownOptionsAction();
      if (res.success) {
        setDiseases(res.diseases as DiseaseOption[]);
        setMedications(res.medications as MedOption[]);
      } else {
        toast.error(res.error || "Gagal memuat referensi.");
      }
      setIsLoadingOptions(false);
    }
    fetchOptions();
  }, [isOpen]);

  // Auto-set severity jika penyakit dipilih
  useEffect(() => {
    if (diseaseId) {
      const selectedDisease = diseases.find(d => d.id === diseaseId);
      if (selectedDisease) setSeverityScore(selectedDisease.severity);
    }
  }, [diseaseId, diseases]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diseaseId || !medicationId) {
      toast.error(lang === 'id' ? "Penyakit dan Obat wajib dipilih." : "Disease and Medication are required.");
      return;
    }

    setIsSubmitting(true);
    const symptomsArray = symptoms.split(",").map(s => s.trim()).filter(s => s !== "");

    const res = await startNewTreatmentSessionAction({
      aquariumId,
      diseaseId,
      medicationId,
      initialSeverityScore: severityScore,
      initialSymptoms: symptomsArray
    });

    if (res.success) {
      toast.success(lang === 'id' ? "Sesi pengobatan dimulai!" : "Treatment session started!");
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || "Gagal menyimpan.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl flex flex-col overflow-hidden shadow-2xl scale-in-95">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{dict.formTitle || "Formulir Rekam Medis Baru"}</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">{dict.formDesc || "Laporkan kasus infeksi baru di akuarium Anda."}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {isLoadingOptions ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-bold text-slate-500">Memuat database medis...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-500" /> {dict.labelDisease || "Diagnosa Penyakit"}
                </label>
                <select 
                  required value={diseaseId} onChange={(e) => setDiseaseId(e.target.value)} 
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold focus:border-rose-500 outline-none"
                >
                  <option value="" disabled>-- Pilih Penyakit --</option>
                  {diseases.map(d => (
                    <option key={d.id} value={d.id}>{lang === 'id' ? d.name_id : d.name_en}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-blue-500" /> {dict.labelMedication || "Obat yang Digunakan"}
                </label>
                <select 
                  required value={medicationId} onChange={(e) => setMedicationId(e.target.value)} 
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold focus:border-blue-500 outline-none"
                >
                  <option value="" disabled>-- Pilih Obat Utama --</option>
                  {medications.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Keparahan (1-5)
                  </label>
                  <input 
                    type="number" min="1" max="5" required value={severityScore} onChange={(e) => setSeverityScore(Number(e.target.value))} 
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold text-center focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.labelNotes || "Catatan Gejala (Pisahkan koma)"}</label>
                <textarea 
                  rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} 
                  placeholder="Misal: Sirip robek, mata bengkak, lemas"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium focus:border-slate-400 outline-none custom-scrollbar"
                />
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl font-bold uppercase tracking-wider">{dict.btnCancel || "Batal"}</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> {dict.btnSave || "Simpan"}</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}