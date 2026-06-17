// app/(dashboard)/dashboard/fish-expert/engine/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getFishes } from "@/features/fishes/repositories/fish.repository";
import { Fish as FishType } from "@/features/fishes/types/fish.types";
import FishCard from "@/features/fishes/components/FishCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, Fish
} from "lucide-react";

import { generateFishRecommendations, UserFishAnswers, RecommendedFish, FishExpertDictionary } from "@/features/fishes/services/fish-expert.service";
import { useLanguage } from "@/providers/LanguageProvider";

const SESSION_KEY = "aquaexpert_fish_inference_v1";
const ITEMS_PAGE_1 = 11; 
const ITEMS_PAGE_N = 10; 

type ExperienceLevel = "Pemula" | "Menengah" | "Mahir";

interface FishEngineDict {
  fishExpertEngine?: {
    title: string; subtitle: string; formTitle: string;
    q1: string; q1Opt1: string; q1Opt2: string; q1Opt3: string;
    q2: string; q3: string; q4: string; q5: string;
    q5Opt1: string; q5Opt2: string; q5Opt3: string;
    needSchooling: string; btnStart: string; processing: string;
    idleTitle: string; idleDesc: string; failTitle: string; failDesc: string;
    successTitle: string; successDesc: string; matchCount: string; bestMatch: string;
    confidence: string; points: string; defaultReason: string;
    paginationShowing: string; paginationTo: string; paginationOf: string; paginationData: string;
    confExcellent: string; confVeryGood: string; confGood: string; confModerate: string;
  };
}

export default function FishExpertEnginePage() {
  const { dict, language } = useLanguage(); 
  const [fishes, setFishes] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedFish[] | null>(null);

  // USER INPUT STATES
  const [experience, setExperience] = useState<ExperienceLevel>("Pemula");
  const [tankVolumeLiters, setTankVolumeLiters] = useState<number>(60);
  const [currentPH, setCurrentPH] = useState<number>(7.0);
  const [currentTemp, setCurrentTemp] = useState<number>(26.0);
  const [fishTypePref, setFishTypePref] = useState("Community Tank");
  const [wantSchoolingFish, setWantSchoolingFish] = useState(true);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);

  // LOAD KNOWLEDGE BASE
  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getFishes();
        setFishes(data);
      } catch (error) {
        console.error("Gagal memuat Knowledge Base Ikan:", error);
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
          setTankVolumeLiters(parsed.answers.tankVolumeLiters);
          setCurrentPH(parsed.answers.currentPH);
          setCurrentTemp(parsed.answers.currentTemp);
          setFishTypePref(parsed.answers.fishTypePref);
          setWantSchoolingFish(parsed.answers.wantSchoolingFish);
        }
        if (parsed.results) setResults(parsed.results);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
      } catch (e) {
        console.error("Gagal membaca session data", e);
      }
    }
  }, []);

  // SIMPAN HALAMAN SAAT BERPINDAH
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

  const dictionary = dict as unknown as FishEngineDict;
  const engineDict = dictionary.fishExpertEngine || {
    title: "Fish Compatibility Engine", subtitle: "Verifikasi kecocokan ikan.", formTitle: "Kuesioner Tangki",
    q1: "Pengalaman", q1Opt1: "Pemula", q1Opt2: "Menengah", q1Opt3: "Mahir",
    q2: "Volume Tangki (Liter)", q3: "pH Air Saat Ini", q4: "Suhu Air Saat Ini (°C)", q5: "Rencana Ekosistem",
    q5Opt1: "Community Tank", q5Opt2: "Semi-Aggressive", q5Opt3: "Species Only",
    needSchooling: "Suka Ikan Berkelompok", btnStart: "Mulai Analisis", processing: "Memproses...",
    idleTitle: "Sistem Aktif", idleDesc: "Kirim parameter tangki Anda.", failTitle: "Gagal Menemukan Kecocokan", failDesc: "Kondisi air tidak aman.",
    successTitle: "Hasil Analisis", successDesc: "Daftar ikan yang aman.", matchCount: "Ikan Lolos", bestMatch: "Top Match",
    confidence: "Keamanan AI", points: "Poin", defaultReason: "Sesuai standar.",
    paginationShowing: "Menampilkan", paginationTo: "hingga", paginationOf: "dari", paginationData: "data.",
    confExcellent: "Sangat Cocok", confVeryGood: "Bagus", confGood: "Cocok", confModerate: "Cukup"
  };

  const runInferenceEngine = () => {
    setLoading(true);
    setCurrentPage(1); 
    
    const answers: UserFishAnswers = { experience, tankVolumeLiters, currentPH, currentTemp, wantSchoolingFish, fishTypePref };
    
    // Trik mendapatkan objek FishExpertDictionary dari JSON global secara dinamis (menggunakan as unknown)
    const aiResults = generateFishRecommendations(fishes, answers, dict.fishExpertEngine as unknown as FishExpertDictionary);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers, results: aiResults, currentPage: 1 }));

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  const getConfidenceColor = (key: string) => {
    switch (key) {
      case "Excellent": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "VeryGood": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
      case "Good": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getConfidenceLabel = (key: string) => {
    switch (key) {
      case "Excellent": return engineDict.confExcellent;
      case "VeryGood": return engineDict.confVeryGood;
      case "Good": return engineDict.confGood;
      default: return engineDict.confModerate;
    }
  };

  // LOGIKA PAGINATION
  let totalPages = 0;
  let displayedResults: RecommendedFish[] = [];
  let startIndex = 0;
  let endIndex = 0;

  if (results && results.length > 0) {
    const totalItems = results.length;
    const remainingItems = Math.max(0, totalItems - ITEMS_PAGE_1);
    
    if (totalItems <= ITEMS_PAGE_1) totalPages = 1;
    else totalPages = 1 + Math.ceil(remainingItems / ITEMS_PAGE_N);

    if (currentPage === 1) { startIndex = 0; endIndex = ITEMS_PAGE_1; } 
    else { startIndex = ITEMS_PAGE_1 + ((currentPage - 2) * ITEMS_PAGE_N); endIndex = startIndex + ITEMS_PAGE_N; }
    
    displayedResults = results.slice(startIndex, endIndex);
  }

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> {engineDict.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {engineDict.subtitle}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          {/* PANEL KIRI: FORMULIR INPUT */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-4 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {engineDict.formTitle}
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{engineDict.q1}</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-blue-500 outline-none">
                    <option value="Pemula">{engineDict.q1Opt1}</option>
                    <option value="Menengah">{engineDict.q1Opt2}</option>
                    <option value="Mahir">{engineDict.q1Opt3}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{engineDict.q3}</Label>
                        <Input type="number" step="0.1" value={currentPH} onChange={(e) => setCurrentPH(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-950 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{engineDict.q4}</Label>
                        <Input type="number" step="0.5" value={currentTemp} onChange={(e) => setCurrentTemp(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-950 focus:border-blue-500" />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{engineDict.q2}</Label>
                  <Input type="number" value={tankVolumeLiters} onChange={(e) => setTankVolumeLiters(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-950 focus:border-blue-500" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{engineDict.q5}</Label>
                  <select value={fishTypePref} onChange={(e) => setFishTypePref(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-blue-500 outline-none">
                    <option value="Community Tank">{engineDict.q5Opt1}</option>
                    <option value="Semi-Aggressive">{engineDict.q5Opt2}</option>
                    <option value="Species Only">{engineDict.q5Opt3}</option>
                  </select>
                </div>

                <div className="pt-5 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={wantSchoolingFish} onChange={(e) => setWantSchoolingFish(e.target.checked)} className="h-5 w-5 accent-blue-600 rounded cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{engineDict.needSchooling}</span>
                  </label>
                </div>
              </div>

              <Button onClick={runInferenceEngine} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 mt-4 text-base shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : engineDict.btnStart}
              </Button>
            </CardContent>
          </Card>

          {/* PANEL KANAN: HASIL REKOMENDASI AI */}
          <div className="xl:col-span-8 space-y-6">
            {!results ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center p-8">
                <Fish className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">{engineDict.idleTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">{engineDict.idleDesc}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-red-200 dark:border-red-900/30 rounded-2xl bg-red-50 dark:bg-red-950/10 p-8 text-center">
                <Info className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">{engineDict.failTitle}</h3>
                <p className="text-base text-slate-600 dark:text-red-400/80 max-w-lg leading-relaxed">{engineDict.failDesc}</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="mb-6 flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{engineDict.successTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{engineDict.successDesc}</p>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-5 py-2 rounded-full border border-blue-200 font-bold whitespace-nowrap">
                    <CheckCircle2 className="h-5 w-5" /> {results.length} {engineDict.matchCount}
                  </span>
                </div>
                
                <div className="grid gap-5 lg:grid-cols-2">
                  {displayedResults.map((fish, index) => {
                    const globalIndex = startIndex + index;
                    const isTopMatch = globalIndex === 0;
                    const confidenceKey = fish.matchConfidenceKey || "Moderate";

                    if (isTopMatch) {
                      return (
                        <div key={fish.id} className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 mb-2 flex flex-col">
                          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-white font-black flex items-center gap-2 text-sm tracking-widest uppercase z-10">
                            <Trophy className="h-5 w-5 text-amber-300" /> {engineDict.bestMatch}
                          </div>
                          <div className="flex flex-col lg:flex-row items-stretch flex-1">
                            <div className="p-4 lg:p-5 flex items-start justify-center border-b lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 lg:w-[320px] shrink-0">
                              <div className="w-full max-w-[280px] lg:max-w-none"><FishCard fish={fish} /></div>
                            </div>
                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-4 lg:p-5">
                              <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{engineDict.confidence}</p>
                                <div className={`inline-flex max-w-fit items-center px-3 py-2 rounded-lg border ${getConfidenceColor(confidenceKey)}`}>
                                  <Target className="w-4 h-4 mr-2" />
                                  <span className="font-black text-sm">{fish.matchScore} {engineDict.points}</span>
                                  <span className="mx-2 opacity-40">|</span>
                                  <span className="font-bold text-xs uppercase">{getConfidenceLabel(confidenceKey)}</span>
                                </div>
                              </div>
                              <ul className="space-y-2 border-l-2 border-blue-500/40 pl-3 py-1">
                                {fish.matchReasons.map((reason, i) => (
                                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start">
                                    <span className="text-blue-500 mr-2 font-bold">✓</span> <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={fish.id} className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md flex flex-col">
                        <div className="absolute top-0 left-0 z-20 w-8 h-8 bg-slate-800 text-white rounded-br-xl flex items-center justify-center font-black text-xs">{globalIndex + 1}</div>
                        <div className="p-4 flex justify-center bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                           <div className="w-full max-w-[280px]"><FishCard fish={fish} /></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className={`inline-flex items-center gap-2 text-[10px] font-bold px-2.5 py-1.5 rounded-md border mb-3 ${getConfidenceColor(confidenceKey)}`}>
                            <span>{fish.matchScore} {engineDict.points}</span>
                            <span>•</span>
                            <span>{getConfidenceLabel(confidenceKey)}</span>
                          </div>
                          <ul className="space-y-2 border-l-2 border-blue-500/40 pl-3 py-1">
                            {fish.matchReasons.map((reason, i) => (
                              <li key={i} className="text-[12px] text-slate-600 dark:text-slate-300 flex items-start">
                                <span className="text-blue-500 mr-2 font-bold">✓</span> <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex flex-col lg:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-5 mt-6 gap-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {engineDict.paginationShowing} <span className="font-bold">{startIndex + 1}</span> {engineDict.paginationTo} <span className="font-bold">{Math.min(endIndex, results.length)}</span> {engineDict.paginationOf} <span className="font-bold">{results.length}</span> {engineDict.paginationData}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-9 w-9"><ChevronLeft className="h-4 w-4" /></Button>
                      {pageNumbers.map(num => (
                        <Button key={num} variant={currentPage === num ? "default" : "outline"} onClick={() => setCurrentPage(num)} className={`h-9 w-9 p-0 ${currentPage === num ? 'bg-blue-600' : ''}`}>{num}</Button>
                      ))}
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-9 w-9"><ChevronRight className="h-4 w-4" /></Button>
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