// app/(dashboard)/dashboard/disease-expert/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  Stethoscope, AlertTriangle, Activity, Fish, ShieldPlus, ChevronLeft, ChevronRight, Droplets
} from "lucide-react";
import toast from "react-hot-toast";

import { SymptomPicker } from "@/features/diseases/components/SymptomPicker";
import { DiseaseResultCard } from "@/features/diseases/components/DiseaseResultCard";
import { DiseaseDetailModal } from "@/features/diseases/components/DiseaseDetailModal";

import { getDiseaseMatchAction } from "@/features/diseases/services/disease-match.actions";
import { getUserAquariumsAction } from "@/features/aquariums/actions/aquarium.actions";
import { getSymptomsAction } from "@/features/diseases/actions/symptom.actions";

import type { Symptom, DiseaseMatchResult, Disease } from "@/features/diseases/types/disease.types";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";
import { Button } from "@/components/ui/button";

const RESULTS_PER_PAGE = 3;
const SESSION_KEY = "aquaexpert_disease_inference_v1"; 

interface SavedDiseaseSession {
  aquariumId: string;
  symptomIds: string[];
  results: DiseaseMatchResult[];
  inferredRootCauses?: string[]; 
}

interface DiseaseExpertDict {
  title?: string;
  subtitle?: string;
  step1?: string;
  resultTitle?: string;
  processing?: string;
  idleDesc?: string;
  noAqTitle?: string;
  noAqDesc?: string;
  btnPrev?: string;
  btnNext?: string;
  page?: string;
  loadingEngine?: string;
  toastNoAq?: string;
  toastNoMatch?: string;
  toastSuccess?: string;
  toastFailLoad?: string;
}

interface RootDict {
  disease?: {
    diseaseExpertEngine?: DiseaseExpertDict;
  };
  diseaseExpertEngine?: DiseaseExpertDict;
  [key: string]: unknown;
}

export default function DiseaseExpertPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const rootDict = dict as RootDict;
  const expertDict: DiseaseExpertDict = rootDict.disease?.diseaseExpertEngine || rootDict.diseaseExpertEngine || {};

  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string>("");
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([]);
  
  const [persistedSymptomIds, setPersistedSymptomIds] = useState<string[]>([]);
  const [diagnosisResults, setDiagnosisResults] = useState<DiseaseMatchResult[]>([]);
  const [inferredWaterCauses, setInferredWaterCauses] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<Disease | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [aqRes, symRes] = await Promise.all([
          getUserAquariumsAction(),
          getSymptomsAction()
        ]);

        if (aqRes.success && aqRes.data) {
          setAquariums(aqRes.data);
          if (aqRes.data.length > 0) setSelectedAquariumId(aqRes.data[0].id);
        }

        if (symRes.success && symRes.data) {
          setAvailableSymptoms(symRes.data);
        } else {
          toast.error(expertDict.toastFailLoad || (lang === 'id' ? "Gagal memuat daftar gejala." : "Failed to load symptoms."));
        }

        const savedSession = sessionStorage.getItem(SESSION_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession) as SavedDiseaseSession;
            if (parsed.aquariumId) setSelectedAquariumId(parsed.aquariumId);
            if (parsed.symptomIds) setPersistedSymptomIds(parsed.symptomIds);
            if (parsed.results) setDiagnosisResults(parsed.results);
            if (parsed.inferredRootCauses) setInferredWaterCauses(parsed.inferredRootCauses);
          } catch (e) {
            console.error("Gagal memuat sesi:", e);
          }
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(expertDict.toastFailLoad || (lang === 'id' ? "Gagal memuat data." : "Failed to load data."));
      } finally {
        setIsLoadingInitial(false);
        setIsHydrated(true);
      }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleDiagnose = async (aquariumId: string, selectedSymptomIds: string[]) => {
    if (!aquariumId) {
      toast.error(expertDict.toastNoAq || (lang === 'id' ? "Pilih akuarium terlebih dahulu!" : "Please select an aquarium first!"));
      return;
    }
    
    setIsDiagnosing(true);
    setDiagnosisResults([]);
    setInferredWaterCauses([]); 
    setCurrentPage(1); 

    try {
      const response = await getDiseaseMatchAction(aquariumId, selectedSymptomIds, lang);
      
      if (!response.success || !response.matches) {
        throw new Error(response.error || "Gagal melakukan diagnosa");
      }

      setDiagnosisResults(response.matches);
      setInferredWaterCauses(response.inferredRootCauses || []);
      setPersistedSymptomIds(selectedSymptomIds);

      const sessionData: SavedDiseaseSession = {
        aquariumId,
        symptomIds: selectedSymptomIds,
        results: response.matches,
        inferredRootCauses: response.inferredRootCauses
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      if (response.matches.length === 0) {
        toast(expertDict.toastNoMatch || (lang === 'id' ? "Tidak ditemukan kecocokan patogen." : "No pathogen matches found."), { icon: "ℹ️" });
      } else {
        toast.success(expertDict.toastSuccess || (lang === 'id' ? "Diagnosa selesai!" : "Diagnosis complete!"));
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error(errMsg);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const totalPages = Math.ceil(diagnosisResults.length / RESULTS_PER_PAGE);
  const paginatedResults = diagnosisResults.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  if (isLoadingInitial || !isHydrated) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 dark:text-blue-500">
          <Activity className="w-10 h-10 animate-spin" />
          <p className="font-bold animate-pulse">{expertDict.loadingEngine || (lang === 'id' ? "Memuat Sistem Pakar..." : "Loading Expert System...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              <Stethoscope className="w-8 h-8 md:w-10 md:h-10" /> 
              {expertDict.title || (lang === 'id' ? "Pakar Diagnosa Penyakit" : "Disease Diagnosis Expert")}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed text-sm md:text-base font-medium">
              {expertDict.subtitle || (lang === 'id' ? "Pilih gejala klinis yang dialami ikan Anda. Sistem pakar kami akan mencocokkan gejala dengan database patogen untuk memberikan rekomendasi medis yang akurat dan aman." : "Select the clinical symptoms your fish are experiencing. Our expert system will match them against our pathogen database to provide accurate and safe medical recommendations.")}
            </p>
          </div>
        </div>

        {aquariums.length > 0 ? (
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-teal-400"></div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Fish className="w-4 h-4 text-blue-500" /> {expertDict.step1 || (lang === 'id' ? "1. Pilih Akuarium Terdampak" : "1. Select Affected Aquarium")}
                </label>
                <select 
                  value={selectedAquariumId} 
                  onChange={(e) => {
                    setSelectedAquariumId(e.target.value);
                    setDiagnosisResults([]); 
                    setInferredWaterCauses([]); 
                    setPersistedSymptomIds([]);
                    sessionStorage.removeItem(SESSION_KEY);
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500/70 outline-none font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {aquariums.map(aq => <option key={aq.id} value={aq.id}>{aq.name}</option>)}
                </select>
              </div>

              <SymptomPicker 
                aquariumId={selectedAquariumId}
                availableSymptoms={availableSymptoms}
                onSubmitDiagnosis={handleDiagnose}
                isLoading={isDiagnosing}
                lang={lang}
              />
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col h-full shadow-inner transition-colors">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <ShieldPlus className="w-6 h-6 text-blue-600 dark:text-blue-500" /> 
                  {expertDict.resultTitle || (lang === 'id' ? "Hasil Analisis Patologi" : "Pathology Analysis Results")}
                </h3>

                {isDiagnosing ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-pulse min-h-[400px]">
                    <Activity className="w-14 h-14 mb-4 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <p className="font-bold tracking-wide">{expertDict.processing || (lang === 'id' ? "Memproses komputasi patogen..." : "Processing pathogen computation...")}</p>
                  </div>
                ) : diagnosisResults.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 min-h-[400px] p-6 opacity-70">
                    <Stethoscope className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm">
                      {expertDict.idleDesc || (lang === 'id' ? "Pilih gejala di samping lalu klik tombol Analisis untuk melihat hasil diagnosa." : "Select symptoms on the left and click the Analysis button to see results.")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    
                    {inferredWaterCauses.length > 0 && (
                      <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl animate-in fade-in zoom-in duration-500">
                        <h4 className="text-sm font-black text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-2 uppercase tracking-wide">
                          <Droplets className="w-5 h-5" /> {lang === 'id' ? "Peringatan Kualitas Air AI" : "AI Water Quality Alert"}
                        </h4>
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-300 leading-relaxed mb-3">
                          {lang === 'id' 
                            ? "Berdasarkan kombinasi gejala ekstrem yang Anda pilih, AI mencurigai adanya kerusakan kualitas air (Tanpa perlu tes lab):" 
                            : "Based on the extreme symptom combination, AI suspects severe water quality degradation (Without lab tests):"}
                        </p>
                        <ul className="flex flex-col gap-2">
                          {inferredWaterCauses.map((cause, idx) => {
                            let translatedCause = cause;
                            if (cause === "CRITICAL_AMMONIA_SPIKE") translatedCause = lang === 'id' ? "Lonjakan Amonia Mematikan (Ammonia Spike)" : "Critical Ammonia Spike";
                            else if (cause === "OXYGEN_DEPLETION_OR_NITRITE") translatedCause = lang === 'id' ? "Kekurangan Oksigen / Keracunan Nitrit" : "Oxygen Depletion / Nitrite Poisoning";
                            else if (cause === "POOR_WATER_QUALITY_GENERAL") translatedCause = lang === 'id' ? "Penurunan Kualitas Air Drastis" : "General Poor Water Quality";
                            
                            return (
                              <li key={idx} className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-200 bg-white/50 dark:bg-slate-900/50 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> {translatedCause}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500 flex-1">
                      {paginatedResults.map((res, index) => {
                        const globalIndex = (currentPage - 1) * RESULTS_PER_PAGE + index;
                        return (
                          <DiseaseResultCard 
                            key={res.disease.id}
                            result={res}
                            lang={lang}
                            isTopMatch={globalIndex === 0} 
                            onDetailClick={(id) => setSelectedDiseaseDetail(res.disease)}
                          />
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> {expertDict.btnPrev || (lang === 'id' ? "Sebelumnya" : "Prev")}
                        </Button>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {expertDict.page || (lang === 'id' ? "Halaman" : "Page")} {currentPage} / {totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {expertDict.btnNext || (lang === 'id' ? "Lanjut" : "Next")} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm transition-colors">
             <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 opacity-80 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
             <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">
               {expertDict.noAqTitle || (lang === 'id' ? "Akuarium Belum Tersedia" : "No Aquarium Available")}
             </h3>
             <p className="font-medium text-slate-500 dark:text-slate-400 max-w-md">
               {expertDict.noAqDesc || (lang === 'id' ? "Anda harus membuat minimal satu akuarium di menu My Aquariums terlebih dahulu untuk menggunakan fitur ini." : "You must create at least one aquarium in the My Aquariums menu first to use this feature.")}
             </p>
          </div>
        )}

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