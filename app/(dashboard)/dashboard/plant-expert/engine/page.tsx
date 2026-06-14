// app/(dashboard)/dashboard/plant-expert/engine/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import PlantCard from "@/features/plants/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, Sparkles, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target
} from "lucide-react";

import { generateRecommendations, UserAnswers, RecommendedPlant, PlantExpertDictionary } from "@/features/plants/services/expert.service";
import { useLanguage } from "@/providers/LanguageProvider";

const SESSION_KEY = "aquaexpert_plant_inference_v4";
const ITEMS_PAGE_1 = 11; 
const ITEMS_PAGE_N = 10; 

type ExperienceLevel = "Pemula" | "Menengah" | "Mahir";
type LightLevel = "Low" | "Medium" | "High";
type MaintenanceLevel = "Low" | "Medium" | "High";

export default function PlantExpertEngineV4() {
  const { dict, language } = useLanguage(); 
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedPlant[] | null>(null);

  // USER INPUT STATES
  const [experience, setExperience] = useState<ExperienceLevel>("Pemula");
  const [tankSize, setTankSize] = useState("Medium");
  const [co2, setCo2] = useState("Tanpa CO2");
  const [light, setLight] = useState<LightLevel>("Low");
  const [maintenance, setMaintenance] = useState<MaintenanceLevel>("Low");
  const [style, setStyle] = useState("Bebas");
  const [shrimpTank, setShrimpTank] = useState(false);
  const [wantCarpet, setWantCarpet] = useState(false);
  const [wantRedPlant, setWantRedPlant] = useState(false);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);

  // LOAD KNOWLEDGE BASE
  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getPlants();
        setPlants(data);
      } catch (error) {
        console.error("Gagal memuat Knowledge Base:", error);
      } finally {
        setLoading(false);
      }
    }
    loadKnowledgeBase();
  }, []);

  // LOAD SESSION STORAGE
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.answers) {
          setExperience(parsed.answers.experience as ExperienceLevel);
          setTankSize(parsed.answers.tankSize);
          setCo2(parsed.answers.hasCO2 ? "Tinggi (Injeksi)" : "Tanpa CO2");
          setLight(parsed.answers.light as LightLevel);
          setMaintenance(parsed.answers.maintenance as MaintenanceLevel);
          setStyle(parsed.answers.style);
          setShrimpTank(parsed.answers.shrimpTank);
          setWantCarpet(parsed.answers.wantCarpet);
          setWantRedPlant(parsed.answers.wantRedPlant || false);
        }
        if (parsed.results) {
          setResults(parsed.results);
        }
        if (parsed.currentPage) {
          setCurrentPage(parsed.currentPage);
        }
      } catch (e) {
        console.error("Gagal membaca session data", e);
      }
    }
  }, []);

  // SIMPAN HALAMAN SAAT BERPINDAH (PAGINATION)
  useEffect(() => {
    if (results !== null) {
       const savedSession = sessionStorage.getItem(SESSION_KEY);
       if (savedSession) {
         try {
           const parsed = JSON.parse(savedSession);
           parsed.currentPage = currentPage;
           sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
         } catch (e) {}
       }
    }
  }, [currentPage, results]);

  // HITUNG ULANG JIKA BAHASA BERUBAH
  useEffect(() => {
    if (results !== null && plants.length > 0 && dict.expertEngine) {
      const answers: UserAnswers = { experience, tankSize, hasCO2: co2 === "Tinggi (Injeksi)", light, maintenance, style, shrimpTank, wantCarpet, wantRedPlant };
      
      // SOLUSI ERROR ARGUMEN: Menambahkan dict.expertEngine secara Type-Safe (Bebas dari 'any')
      const aiResults = generateRecommendations(plants, answers, dict.expertEngine as unknown as PlantExpertDictionary); 
      setResults(aiResults);
      
      const savedSession = sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          parsed.results = aiResults;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        } catch(e) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, dict.expertEngine, plants.length]); 

  const runInferenceEngine = () => {
    if (!dict.expertEngine) return;
    setLoading(true);
    setCurrentPage(1); 
    
    const answers: UserAnswers = {
      experience, tankSize, hasCO2: co2 === "Tinggi (Injeksi)", light, maintenance, style, shrimpTank, wantCarpet, wantRedPlant
    };

    // SOLUSI ERROR ARGUMEN: Menambahkan dict.expertEngine secara Type-Safe (Bebas dari 'any')
    const aiResults = generateRecommendations(plants, answers, dict.expertEngine as unknown as PlantExpertDictionary);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ 
      answers, 
      results: aiResults,
      currentPage: 1
    }));

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  const getConfidenceColor = (key: string) => {
    switch (key) {
      case "Excellent": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "VeryGood": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      case "Good": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getConfidenceLabel = (key: string) => {
    if (!dict.expertEngine) return key;
    switch (key) {
      case "Excellent": return dict.expertEngine.confExcellent;
      case "VeryGood": return dict.expertEngine.confVeryGood;
      case "Good": return dict.expertEngine.confGood;
      default: return dict.expertEngine.confModerate;
    }
  };

  // LOGIKA PAGINATION
  let totalPages = 0;
  let displayedResults: RecommendedPlant[] = [];
  let startIndex = 0;
  let endIndex = 0;

  if (results && results.length > 0) {
    const totalItems = results.length;
    const remainingItems = Math.max(0, totalItems - ITEMS_PAGE_1);
    
    if (totalItems <= ITEMS_PAGE_1) {
      totalPages = 1;
    } else {
      totalPages = 1 + Math.ceil(remainingItems / ITEMS_PAGE_N);
    }

    if (currentPage === 1) {
      startIndex = 0;
      endIndex = ITEMS_PAGE_1;
    } else {
      startIndex = ITEMS_PAGE_1 + ((currentPage - 2) * ITEMS_PAGE_N);
      endIndex = startIndex + ITEMS_PAGE_N;
    }
    
    displayedResults = results.slice(startIndex, endIndex);
  }

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  if (!dict.expertEngine) return null; // Safety check for dictionary loading

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> {dict.expertEngine.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {dict.expertEngine.subtitle}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-4 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-500" /> {dict.expertEngine.formTitle}
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q1}</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Pemula">{dict.expertEngine.q1Opt1}</option>
                    <option value="Menengah">{dict.expertEngine.q1Opt2}</option>
                    <option value="Mahir">{dict.expertEngine.q1Opt3}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q2}</Label>
                  <select value={tankSize} onChange={(e) => setTankSize(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Nano">Nano (≤ 40cm)</option>
                    <option value="Small">Small (45-60cm)</option>
                    <option value="Medium">Medium (60-90cm)</option>
                    <option value="Large">Large (90-120cm)</option>
                    <option value="Extra Large">Extra Large (&gt;120cm)</option>
                    <option value="Pond">{dict.expertEngine.q2OptPond}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q3}</Label>
                  <select value={co2} onChange={(e) => setCo2(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Tanpa CO2">{dict.expertEngine.q3Opt1}</option>
                    <option value="Tinggi (Injeksi)">{dict.expertEngine.q3Opt2}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q4}</Label>
                  <select value={light} onChange={(e) => setLight(e.target.value as LightLevel)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Low">{dict.expertEngine.q4Opt1}</option>
                    <option value="Medium">{dict.expertEngine.q4Opt2}</option>
                    <option value="High">{dict.expertEngine.q4Opt3}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q5}</Label>
                  <select value={maintenance} onChange={(e) => setMaintenance(e.target.value as MaintenanceLevel)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Low">{dict.expertEngine.q5Opt1}</option>
                    <option value="Medium">{dict.expertEngine.q5Opt2}</option>
                    <option value="High">{dict.expertEngine.q5Opt3}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.expertEngine.q6}</Label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="Bebas">{dict.expertEngine.q6Opt1}</option>
                    <option value="Nature">{dict.expertEngine.q6Opt2}</option>
                    <option value="Dutch">{dict.expertEngine.q6Opt3}</option>
                    <option value="Iwagumi">{dict.expertEngine.q6Opt4}</option>
                    <option value="Jungle">{dict.expertEngine.q6Opt5}</option>
                  </select>
                </div>

                <div className="pt-5 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={wantCarpet} onChange={(e) => setWantCarpet(e.target.checked)} className="h-5 w-5 accent-teal-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">{dict.expertEngine.needCarpet}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={wantRedPlant} onChange={(e) => setWantRedPlant(e.target.checked)} className="h-5 w-5 accent-rose-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-600 transition-colors">{dict.expertEngine.needRed}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={shrimpTank} onChange={(e) => setShrimpTank(e.target.checked)} className="h-5 w-5 accent-teal-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">{dict.expertEngine.needShrimp}</span>
                  </label>
                </div>
              </div>

              <Button onClick={runInferenceEngine} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-14 mt-4 text-base shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : dict.expertEngine.btnStart}
              </Button>
            </CardContent>
          </Card>

          {/* KOLOM KANAN: HASIL REKOMENDASI AI */}
          <div className="xl:col-span-8 space-y-6">
            {!results ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 transition-colors p-8 text-center">
                <Cpu className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">{dict.expertEngine.idleTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">
                  {dict.expertEngine.idleDesc}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-red-200 dark:border-red-900/30 rounded-2xl bg-red-50 dark:bg-red-950/10 p-8 text-center transition-colors">
                <Info className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">{dict.expertEngine.failTitle}</h3>
                <p className="text-base text-slate-600 dark:text-red-400/80 max-w-lg leading-relaxed">
                  {dict.expertEngine.failDesc}
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">{dict.expertEngine.successTitle}</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2">{dict.expertEngine.successDesc}</p>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 text-sm md:text-base px-5 py-2 rounded-full border border-teal-200 dark:border-teal-900 font-bold whitespace-nowrap shadow-sm">
                    <CheckCircle2 className="h-5 w-5" /> {results.length} {dict.expertEngine.matchCount}
                  </span>
                </div>
                
                <div className="grid gap-5 lg:grid-cols-2">
                  {displayedResults.map((plant, index) => {
                    const globalIndex = startIndex + index;
                    const isTopMatch = globalIndex === 0;

                    // SOLUSI ERROR PROPERTI: Menggunakan matchConfidenceKey
                    const confidenceKey = plant.matchConfidenceKey || "Moderate";

                    if (isTopMatch) {
                      return (
                        <div key={plant.id} className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-xl shadow-teal-500/10 mb-2 flex flex-col">
                          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-white font-black flex items-center gap-2 text-sm tracking-widest uppercase shadow-sm z-10 relative">
                            <Trophy className="h-5 w-5 text-amber-300" /> {dict.expertEngine.bestMatch}
                          </div>
                          <div className="flex flex-col lg:flex-row items-stretch flex-1">
                            <div className="p-4 lg:p-5 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 lg:w-[320px] shrink-0">
                              <div className="w-full max-w-[280px] lg:max-w-none">
                                <PlantCard plant={plant} />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-4 lg:p-5">
                              <div className="flex flex-col items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{dict.expertEngine.confidence}</p>
                                  <h4 className="text-lg font-black text-gray-900 dark:text-slate-100 leading-tight">
                                    {language === "id" ? "Laporan Kecocokan AI" : "AI Match Report"}
                                  </h4>
                                </div>
                                <div className={`inline-flex max-w-full flex-wrap items-center px-3 py-2 rounded-lg border ${getConfidenceColor(confidenceKey)} shadow-sm`}>
                                  <div className="flex items-center shrink-0 whitespace-nowrap">
                                    <Target className="w-4 h-4 mr-1.5" />
                                    <span className="font-black text-sm">{plant.matchScore} {dict.expertEngine.points}</span>
                                    <span className="mx-2 opacity-40">|</span>
                                  </div>
                                  <span className="font-bold text-xs uppercase tracking-wide leading-tight">{getConfidenceLabel(confidenceKey)}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                {plant.matchReasons && plant.matchReasons.length > 0 ? (
                                  <div className="grid gap-2.5 sm:grid-cols-1">
                                    {plant.matchReasons.map((reason, i) => (
                                      <div key={i} className="flex items-start bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 transition-colors">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-1 rounded-full mr-3 shrink-0 mt-0.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <span className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 leading-snug font-medium">
                                          {reason}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">{dict.expertEngine.defaultReason}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={plant.id} className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="absolute top-0 left-0 z-20 w-8 h-8 bg-slate-800 text-white rounded-br-xl flex items-center justify-center font-black shadow-sm text-xs">
                          {globalIndex + 1}
                        </div>
                        <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                           <div className="w-full max-w-[280px]">
                             <PlantCard plant={plant} />
                           </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex flex-col items-start gap-2 mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dict.expertEngine.confidence}</span>
                            <div className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md border ${getConfidenceColor(confidenceKey)}`}>
                              <span className="whitespace-nowrap">{plant.matchScore} {dict.expertEngine.points}</span>
                              <span className="opacity-40">•</span>
                              <span className="leading-tight break-words">{getConfidenceLabel(confidenceKey)}</span>
                            </div>
                          </div>
                          {plant.matchReasons && plant.matchReasons.length > 0 ? (
                            <ul className="space-y-2 border-l-2 border-teal-500/40 pl-3 py-1 flex-1">
                              {plant.matchReasons.map((reason, i) => (
                                <li key={i} className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300 leading-snug flex items-start">
                                  <span className="text-teal-500 dark:text-teal-400 mr-2 font-bold">✓</span> 
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-200 dark:border-slate-800 py-1 flex-1">{dict.expertEngine.defaultReason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-t border-slate-200 dark:border-slate-800 pt-5 mt-6 gap-4 transition-colors">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center lg:text-left mb-1 lg:mb-0">
                      {dict.expertEngine.paginationShowing} <span className="font-bold text-gray-900 dark:text-slate-200">{startIndex + 1}</span> {dict.expertEngine.paginationTo} <span className="font-bold text-gray-900 dark:text-slate-200">{Math.min(endIndex, results.length)}</span> {dict.expertEngine.paginationOf} <span className="font-bold text-gray-900 dark:text-slate-200">{results.length}</span> {dict.expertEngine.paginationData}
                    </p>
                    
                    <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                      <div className="flex flex-wrap lg:flex-nowrap justify-center lg:justify-end gap-1 sm:gap-1.5 w-full lg:w-auto">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {pageNumbers.map(num => (
                          <Button
                            key={num}
                            variant={currentPage === num ? "default" : "outline"}
                            onClick={() => setCurrentPage(num)}
                            className={`h-8 w-8 p-0 text-sm font-medium transition-all shrink-0 ${
                              currentPage === num 
                                ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-600 dark:border-teal-500 shadow-md shadow-teal-600/20 scale-105' 
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {num}
                          </Button>
                        ))}

                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-sm border-t lg:border-t-0 lg:border-l border-slate-300 dark:border-slate-700 pt-2.5 lg:pt-0 lg:pl-3 w-full lg:w-auto transition-colors text-slate-600 dark:text-slate-300">
                        <Input 
                          type="number" min={1} max={totalPages} value={currentPage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= totalPages) setCurrentPage(val);
                          }}
                          className="w-12 h-8 text-center text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-teal-500 transition-colors"
                        />
                        <span className="whitespace-nowrap">/ {totalPages}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}