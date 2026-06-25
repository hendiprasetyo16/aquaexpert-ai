// app/(dashboard)/dashboard/disease-expert/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  Stethoscope, AlertTriangle, Activity, Fish, ShieldPlus
} from "lucide-react";
import toast from "react-hot-toast";

// KOMPONEN UI
import { SymptomPicker } from "@/features/diseases/components/SymptomPicker";
import { DiseaseResultCard } from "@/features/diseases/components/DiseaseResultCard";
import { DiseaseDetailModal } from "@/features/diseases/components/DiseaseDetailModal";

// ACTIONS & TYPES
import { getDiseaseMatchAction } from "@/features/diseases/actions/disease-match.actions";
import { getUserAquariumsAction } from "@/features/aquariums/actions/aquarium.actions";
// Pastikan Anda sudah membuat action ini untuk mengambil list gejala dari DB
// import { getSymptomsAction } from "@/features/diseases/actions/symptom.actions";

import type { Symptom, DiseaseMatchResult, Disease } from "@/features/diseases/types/disease.types";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";

export default function DiseaseExpertPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string>("");
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([]);
  
  const [diagnosisResults, setDiagnosisResults] = useState<DiseaseMatchResult[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<Disease | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // 1. LOAD DATA AWAL (Akuarium & Gejala)
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [aqRes /*, symRes */] = await Promise.all([
          getUserAquariumsAction(),
          // getSymptomsAction() // Uncomment jika action getSymptomsAction sudah ada
        ]);

        if (aqRes.success && aqRes.data) {
          setAquariums(aqRes.data);
          if (aqRes.data.length > 0) setSelectedAquariumId(aqRes.data[0].id);
        }

        // Mock sementara jika getSymptomsAction belum siap. Ganti dengan hasil DB (symRes.data)
        const mockSymptoms: Symptom[] = [
          { id: "sym_gen_01", name_id: "Napas Cepat (Megap-megap)", name_en: "Rapid Breathing", body_region: "General" },
          { id: "sym_skn_01", name_id: "Bintik Putih (White Spot)", name_en: "White Spots", body_region: "Skin/Scales" },
          { id: "sym_eye_01", name_id: "Mata Bengkak Keluar", name_en: "Popeye", body_region: "Eyes" },
        ];
        setAvailableSymptoms(mockSymptoms);

      } catch (error) {
        toast.error(lang === 'id' ? "Gagal memuat data." : "Failed to load data.");
      } finally {
        setIsLoadingInitial(false);
      }
    }
    loadInitialData();
  }, [lang]);

  // 2. FUNGSI EKSEKUSI DIAGNOSA
  const handleDiagnose = async (aquariumId: string, selectedSymptomIds: string[]) => {
    if (!aquariumId) {
      toast.error(lang === 'id' ? "Pilih akuarium terlebih dahulu!" : "Please select an aquarium first!");
      return;
    }
    
    setIsDiagnosing(true);
    setDiagnosisResults([]);

    try {
      const response = await getDiseaseMatchAction(aquariumId, selectedSymptomIds, lang);
      
      if (!response.success || !response.matches) {
        throw new Error(response.error || "Gagal melakukan diagnosa");
      }

      setDiagnosisResults(response.matches);
      
      if (response.matches.length === 0) {
        toast(lang === 'id' ? "Tidak ditemukan kecocokan penyakit." : "No disease matches found.", { icon: "ℹ️" });
      } else {
        toast.success(lang === 'id' ? "Diagnosa selesai!" : "Diagnosis complete!");
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  if (isLoadingInitial) {
    return <div className="flex h-screen items-center justify-center"><Activity className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-3">
            <Stethoscope className="w-8 h-8 md:w-10 md:h-10" /> 
            {lang === 'id' ? "Pakar Diagnosa Penyakit" : "Disease Diagnosis Expert"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {lang === 'id' 
              ? "Pilih gejala klinis yang dialami ikan Anda. Sistem pakar AI kami akan mencocokkan gejala dengan database patogen untuk memberikan rekomendasi medis yang aman." 
              : "Select the clinical symptoms your fish are experiencing. Our expert system will match them against our pathogen database to provide safe medical recommendations."}
          </p>
        </div>

        {aquariums.length > 0 ? (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* KOLOM KIRI: INPUT GEJALA */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* SELECT AQUARIUM */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2">
                  <Fish className="w-4 h-4" /> {lang === 'id' ? "Pilih Akuarium Terdampak" : "Select Affected Aquarium"}
                </label>
                <select 
                  value={selectedAquariumId} 
                  onChange={(e) => setSelectedAquariumId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-semibold text-slate-700 dark:text-slate-200"
                >
                  {aquariums.map(aq => (
                    <option key={aq.id} value={aq.id}>{aq.name}</option>
                  ))}
                </select>
              </div>

              {/* PICKER GEJALA */}
              <SymptomPicker 
                aquariumId={selectedAquariumId}
                availableSymptoms={availableSymptoms}
                onSubmitDiagnosis={handleDiagnose}
                isLoading={isDiagnosing}
              />
            </div>

            {/* KOLOM KANAN: HASIL DIAGNOSA */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <ShieldPlus className="w-5 h-5 text-blue-600" /> 
                  {lang === 'id' ? "Hasil Analisis Klinis" : "Clinical Analysis Results"}
                </h3>

                {isDiagnosing ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 animate-pulse">
                    <Activity className="w-12 h-12 mb-4 text-blue-500" />
                    <p>{lang === 'id' ? "Mencocokkan patogen & mengevaluasi keamanan obat..." : "Matching pathogens & evaluating medication safety..."}</p>
                  </div>
                ) : diagnosisResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50">
                    <Stethoscope className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'id' ? "Pilih gejala di samping lalu klik proses untuk melihat hasil." : "Select symptoms on the left and process to see results."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {diagnosisResults.map((res) => (
                       <DiseaseResultCard 
                         key={res.disease.id}
                         result={res}
                         lang={lang}
                         onDetailClick={(id) => setSelectedDiseaseDetail(res.disease)}
                       />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
             <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 opacity-50" />
             <p className="font-bold text-slate-500 dark:text-slate-400">
               {lang === 'id' ? "Anda harus membuat akuarium di menu Inventory terlebih dahulu." : "You must create an aquarium in the Inventory menu first."}
             </p>
          </div>
        )}

        {/* 3. MODAL DETAIL PENYAKIT & PENGOBATAN */}
        {selectedDiseaseDetail && (
          <DiseaseDetailModal 
            disease={selectedDiseaseDetail}
            isOpen={selectedDiseaseDetail !== null}
            onClose={() => setSelectedDiseaseDetail(null)}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}