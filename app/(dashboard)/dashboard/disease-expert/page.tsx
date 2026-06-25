// app/(dashboard)/dashboard/disease-expert/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  Stethoscope, Activity, Loader2, AlertTriangle, ChevronRight, Container, ShieldPlus 
} from "lucide-react";
import toast from "react-hot-toast";

// Komponen Modular yang sudah Bapak buat sebelumnya
import { SymptomPicker } from "@/features/diseases/components/SymptomPicker";
import { DiseaseResultCard } from "@/features/diseases/components/DiseaseResultCard";
import { DiseaseDetailModal } from "@/features/diseases/components/DiseaseDetailModal";

// Actions & Types
import { getDiseaseMatchAction } from "@/features/diseases/actions/disease-match.actions";
import { getUserAquariumsAction } from "@/features/aquariums/actions/aquarium.actions";
// CATATAN: Pastikan Bapak memiliki Action untuk memanggil seluruh daftar Gejala (Symptoms) dari database
// Jika belum ada, Bapak bisa membuat file symptom.actions.ts nantinya.
// import { getAllSymptomsAction } from "@/features/diseases/actions/symptom.actions";

import type { Symptom, DiseaseMatchResult, Disease } from "@/features/diseases/types/disease.types";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";

export default function DiseaseExpertPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string>("");
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([]);

  const [diagnosisResults, setDiagnosisResults] = useState<DiseaseMatchResult[] | null>(null);
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<Disease | null>(null);

  // MENGAMBIL DICTIONARY SECARA AMAN & TYPE-SAFE
  const rootDict = dict as unknown as Record<string, any>;
  const pageDict = useMemo(() => rootDict.diseaseExpert || {}, [rootDict.diseaseExpert]);

  const tDict = useMemo(() => ({
    title: pageDict.title || "Disease Expert AI",
    subtitle: pageDict.subtitle || (lang === 'id' ? "Sistem diagnostik patologi akuatik presisi tinggi." : "High-precision aquatic pathology diagnostic system."),
    selectTank: lang === 'id' ? "Pilih Akuarium Terdampak" : "Select Affected Aquarium",
    selectTankDesc: lang === 'id' ? "Pilih ekosistem tangki untuk menganalisis kerentanan silang antar spesies." : "Choose a tank ecosystem to analyze cross-species susceptibility.",
    resultsTitle: lang === 'id' ? "Hasil Analisis Klinis" : "Clinical Analysis Results",
    noResults: lang === 'id' ? "Tidak ada patogen yang terdeteksi dengan gejala tersebut." : "No pathogens detected matching those symptoms.",
  }), [pageDict, lang]);

  // INITIAL DATA FETCH (Akuarium & Gejala)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const aqRes = await getUserAquariumsAction();
        if (aqRes.success && aqRes.data) {
          setAquariums(aqRes.data);
          if (aqRes.data.length > 0) {
            setSelectedAquariumId(aqRes.data[0].id);
          }
        }

        // TODO: Ganti dengan panggilan ke database yang sebenarnya (misal: getAllSymptomsAction())
        // Untuk saat ini kita gunakan dummy kosong agar UI bisa dirender
        const mockSymptoms: Symptom[] = []; 
        setAvailableSymptoms(mockSymptoms);

      } catch (error) {
        console.error("Gagal memuat data inisial:", error);
      } finally {
        setLoading(false);
        setIsHydrated(true);
      }
    }
    fetchInitialData();
  }, []);

  // HANDLER: SAAT USER KLIK "ANALISIS PATOLOGI" DI SYMPTOM PICKER
  const handleDiagnosisSubmit = useCallback(async (aquariumId: string, selectedSymptomIds: string[]) => {
    setIsAnalyzing(true);
    setDiagnosisResults(null);

    try {
      const response = await getDiseaseMatchAction(aquariumId, selectedSymptomIds, lang);
      
      if (response.success && response.matches) {
        setDiagnosisResults(response.matches);
        toast.success(lang === 'id' ? "Analisis selesai." : "Analysis complete.");
      } else {
        throw new Error(response.error || "Gagal mendapatkan hasil diagnosis.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [lang]);

  if (!isHydrated || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">
          {lang === 'id' ? "Menyiapkan Modul Kecerdasan Buatan..." : "Initializing AI Module..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3 transition-colors">
            <Stethoscope className="h-8 w-8 md:h-10 md:w-10" /> {tDict.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed transition-colors">
            {tDict.subtitle}
          </p>
        </div>

        {/* PEMILIH AKUARIUM */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Container className="w-5 h-5 text-teal-500" /> {tDict.selectTank}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tDict.selectTankDesc}</p>
            </div>
            
            <div className="w-full md:w-72">
              <select 
                value={selectedAquariumId} 
                onChange={(e) => { setSelectedAquariumId(e.target.value); setDiagnosisResults(null); }}
                className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 font-bold text-slate-800 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors cursor-pointer"
              >
                {aquariums.length === 0 ? (
                  <option value="">{lang === 'id' ? "-- Belum ada akuarium --" : "-- No aquariums --"}</option>
                ) : (
                  aquariums.map(aq => (
                    <option key={aq.id} value={aq.id}>{aq.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* AREA KOMPONEN UTAMA (PICKER & HASIL) */}
        {selectedAquariumId ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 1. SYMPTOM PICKER COMPONENT */}
            <div className="relative">
               {/* Overlay loading saat sedang analisis */}
               {isAnalyzing && (
                 <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                   <div className="flex flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                     <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
                     <p className="font-bold text-slate-700 dark:text-slate-200">Menganalisis Probabilitas...</p>
                   </div>
                 </div>
               )}
               
               <SymptomPicker 
                 aquariumId={selectedAquariumId}
                 availableSymptoms={availableSymptoms}
                 onSubmitDiagnosis={handleDiagnosisSubmit}
                 isLoading={isAnalyzing}
               />
            </div>

            {/* 2. HASIL DIAGNOSIS */}
            {diagnosisResults !== null && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-bottom-8 duration-700">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <Activity className="w-6 h-6 text-rose-500" /> {tDict.resultsTitle}
                </h3>
                
                {diagnosisResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <ShieldPlus className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{tDict.noResults}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {diagnosisResults.map((res, index) => (
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
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
             <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 opacity-50" />
             <p className="font-bold text-slate-500 dark:text-slate-400">
               {lang === 'id' ? "Anda harus membuat atau memilih akuarium terlebih dahulu." : "You must create or select an aquarium first."}
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