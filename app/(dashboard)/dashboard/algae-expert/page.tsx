// app/(dashboard)/dashboard/algae-expert/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getAlgaeList } from "@/features/algae/repositories/algae.repository";
import { Algae } from "@/features/algae/types/algae.types";
import AlgaeCard from "@/features/algae/components/AlgaeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, AlertTriangle, ShieldCheck
} from "lucide-react";

import { generateAlgaeDiagnosis, UserAnswersAlgae, RecommendedAlgae } from "@/features/algae/services/expert.service";
import { useLanguage } from "@/providers/LanguageProvider";

const SESSION_KEY = "aquaexpert_algae_inference_v1";
const ITEMS_PAGE_1 = 11; 
const ITEMS_PAGE_N = 10; 

export default function AlgaeExpertEngine() {
  const { dict, language } = useLanguage(); 
  const [algaeList, setAlgaeList] = useState<Algae[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedAlgae[] | null>(null);

  // USER INPUT STATES FOR ALGAE
  const [color, setColor] = useState("");
  const [texture, setTexture] = useState("");
  const [location, setLocation] = useState("");
  const [trigger, setTrigger] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getAlgaeList();
        setAlgaeList(data);
      } catch (error) {
        console.error("Gagal memuat Knowledge Base Algae:", error);
      } finally {
        setLoading(false);
      }
    }
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.answers) {
          setColor(parsed.answers.color);
          setTexture(parsed.answers.texture);
          setLocation(parsed.answers.location);
          setTrigger(parsed.answers.trigger);
        }
        if (parsed.results) setResults(parsed.results);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
      } catch (e) {}
    }
  }, []);

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

  useEffect(() => {
    if (results !== null && algaeList.length > 0) {
      const answers: UserAnswersAlgae = { color, texture, location, trigger };
      const aiResults = generateAlgaeDiagnosis(algaeList, answers, dict.algaeExpert);
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
  }, [language, dict.algaeExpert, algaeList.length]); 

  const runDiagnosisEngine = () => {
    setLoading(true);
    setCurrentPage(1); 
    
    const answers: UserAnswersAlgae = { color, texture, location, trigger };
    const aiResults = generateAlgaeDiagnosis(algaeList, answers, dict.algaeExpert);

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
    switch (key) {
      case "Excellent": return dict.expertEngine?.confExcellent || "Excellent Match";
      case "VeryGood": return dict.expertEngine?.confVeryGood || "Very Good Match";
      case "Good": return dict.expertEngine?.confGood || "Good Match";
      default: return dict.expertEngine?.confModerate || "Moderate Match";
    }
  };

  let totalPages = 0;
  let displayedResults: RecommendedAlgae[] = [];
  let startIndex = 0;
  let endIndex = 0;

  if (results && results.length > 0) {
    const totalItems = results.length;
    const remainingItems = Math.max(0, totalItems - ITEMS_PAGE_1);
    
    if (totalItems <= ITEMS_PAGE_1) totalPages = 1;
    else totalPages = 1 + Math.ceil(remainingItems / ITEMS_PAGE_N);

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

  if (!dict.algaeExpert) return null;

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> {dict.algaeExpert.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {dict.algaeExpert.subtitle}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-4 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-500" /> {language === 'id' ? "Filter Analisis" : "Analysis Filter"}
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.algaeExpert.q1_color}</Label>
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Warna" : "Select Color"} --</option>
                    <option value="green">{language === 'id' ? "Hijau" : "Green"}</option>
                    <option value="brown">{language === 'id' ? "Coklat / Keemasan" : "Brown / Golden"}</option>
                    <option value="black">{language === 'id' ? "Hitam / Abu Gelap" : "Black / Dark Gray"}</option>
                    <option value="gray">{language === 'id' ? "Abu-abu / Putih Pucat" : "Gray / Pale White"}</option>
                    <option value="light_green">{language === 'id' ? "Hijau Muda" : "Light Green"}</option>
                    <option value="blue_green">{language === 'id' ? "Biru Kehijauan (Gelap)" : "Blue-Green / Dark"}</option>
                    <option value="reddish">{language === 'id' ? "Kemerahan" : "Reddish"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.algaeExpert.q2_texture}</Label>
                  <select value={texture} onChange={(e) => setTexture(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Tekstur" : "Select Texture"} --</option>
                    <option value="tuft">{language === 'id' ? "Mengelompok (Kuas)" : "Tuft / Brush-like"}</option>
                    <option value="hairy">{language === 'id' ? "Panjang (Rambut/Benang)" : "Long Hair / Threads"}</option>
                    <option value="dust">{language === 'id' ? "Serbuk / Berdebu" : "Dust / Powdery"}</option>
                    <option value="hard_spot">{language === 'id' ? "Titik Keras (Susah dikerok)" : "Hard Spots"}</option>
                    <option value="slime">{language === 'id' ? "Berlendir / Lembaran" : "Slime / Sheet"}</option>
                    <option value="branching">{language === 'id' ? "Bercabang (Tanduk Rusa)" : "Branching / Wiry"}</option>
                    <option value="easily_wiped">{language === 'id' ? "Mudah Diusap" : "Easily Wiped"}</option>
                    <option value="smelly">{language === 'id' ? "Berbau Busuk" : "Smelly"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.algaeExpert.q3_location}</Label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Lokasi" : "Select Location"} --</option>
                    <option value="glass">{language === 'id' ? "Kaca Akuarium" : "Aquarium Glass"}</option>
                    <option value="hardscape">{language === 'id' ? "Hardscape (Batu/Kayu)" : "Hardscape (Rocks/Wood)"}</option>
                    <option value="leaf_edges">{language === 'id' ? "Pinggiran Daun" : "Leaf Edges"}</option>
                    <option value="plants">{language === 'id' ? "Menyelimuti Tanaman" : "Covering Plants"}</option>
                    <option value="substrate">{language === 'id' ? "Substrat / Pasir" : "Substrate / Sand"}</option>
                    <option value="equipment">{language === 'id' ? "Pipa / Peralatan" : "Equipment / Pipes"}</option>
                    <option value="everywhere">{language === 'id' ? "Di Seluruh Area Tank" : "Everywhere"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dict.algaeExpert.q4_trigger}</Label>
                  <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Pemicu" : "Select Trigger"} --</option>
                    <option value="new_tank">{language === 'id' ? "Tank Baru (< 2 Bulan)" : "New Tank (< 2 Months)"}</option>
                    <option value="co2_fluctuation">{language === 'id' ? "Fluktuasi CO2" : "CO2 Fluctuation"}</option>
                    <option value="high_light">{language === 'id' ? "Lampu Terlalu Terang/Lama" : "Light Too Bright/Long"}</option>
                    <option value="poor_circulation">{language === 'id' ? "Arus Mati (Sirkulasi Buruk)" : "Poor Circulation (Dead Spots)"}</option>
                    <option value="nutrient_imbalance">{language === 'id' ? "Ketidakseimbangan Nutrisi" : "Nutrient Imbalance"}</option>
                    <option value="high_organics">{language === 'id' ? "Penumpukan Organik Kotor" : "High Organics Buildup"}</option>
                  </select>
                </div>
              </div>

              <Button onClick={runDiagnosisEngine} disabled={loading || (!color && !texture && !location && !trigger)} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-14 mt-6 text-base shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : dict.algaeExpert.btn_diagnose}
              </Button>
            </CardContent>
          </Card>

          {/* KOLOM KANAN: HASIL REKOMENDASI AI */}
          <div className="xl:col-span-8 space-y-6">
            {!results ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 transition-colors p-8 text-center">
                <Cpu className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">{language === 'id' ? "Mesin Diagnosis Siap" : "Diagnosis Engine Ready"}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">
                  {language === 'id' ? "Pilih gejala yang Anda lihat di sebelah kiri, dan sistem akan mengidentifikasi jenis alga tersebut." : "Select the symptoms you see on the left, and the system will identify the algae."}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-red-200 dark:border-red-900/30 rounded-2xl bg-red-50 dark:bg-red-950/10 p-8 text-center transition-colors">
                <Info className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">{language === 'id' ? "Alga Tidak Ditemukan" : "Algae Not Found"}</h3>
                <p className="text-base text-slate-600 dark:text-red-400/80 max-w-lg leading-relaxed">
                  {language === 'id' ? "Kombinasi gejala yang Anda pilih tidak cocok dengan jenis alga umum manapun. Coba kurangi filter untuk hasil yang lebih luas." : "The combination of symptoms does not match any common algae. Try reducing the filters."}
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">{language === 'id' ? "Hasil Diagnosis" : "Diagnosis Results"}</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2">{language === 'id' ? "Ditemukan kemungkinan jenis alga berdasarkan pengamatan Anda." : "Found possible algae types based on your observation."}</p>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 text-sm md:text-base px-5 py-2 rounded-full border border-teal-200 dark:border-teal-900 font-bold whitespace-nowrap shadow-sm">
                    <CheckCircle2 className="h-5 w-5" /> {results.length} {language === 'id' ? "Cocok" : "Matches"}
                  </span>
                </div>
                
                <div className="grid gap-5 lg:grid-cols-2">
                  {displayedResults.map((algae, index) => {
                    const globalIndex = startIndex + index;
                    const isTopMatch = globalIndex === 0;

                    // JUARA 1 (THE BEST MATCH)
                    if (isTopMatch) {
                      const topCauses = language === 'en' && algae.causes_en?.length ? algae.causes_en : algae.causes_id || [];
                      const topSolutions = language === 'en' && algae.solutions_en?.length ? algae.solutions_en : algae.solutions_id || [];

                      return (
                        <div key={algae.id} className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-xl shadow-teal-500/10 mb-2 flex flex-col">
                          
                          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-white font-black flex items-center gap-2 text-sm tracking-widest uppercase shadow-sm z-10 relative">
                            <Trophy className="h-5 w-5 text-amber-300" /> {language === 'id' ? "Kemungkinan Terbesar" : "Highest Probability"}
                          </div>

                          <div className="flex flex-col lg:flex-row items-stretch flex-1">
                            <div className="p-4 lg:p-5 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 lg:w-[320px] shrink-0">
                              <div className="w-full max-w-[280px] lg:max-w-none">
                                <AlgaeCard algae={algae} />
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-4 lg:p-5">
                              <div className="flex flex-col items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'id' ? 'Keyakinan AI' : 'AI Confidence'}</p>
                                  <h4 className="text-lg font-black text-gray-900 dark:text-slate-100 leading-tight">
                                    {language === "id" ? "Laporan Diagnosis" : "Diagnosis Report"}
                                  </h4>
                                </div>
                                <div className={`inline-flex max-w-full flex-wrap items-center px-3 py-2 rounded-lg border ${getConfidenceColor(algae.matchConfidenceKey)} shadow-sm`}>
                                  <div className="flex items-center shrink-0 whitespace-nowrap">
                                    <Target className="w-4 h-4 mr-1.5" />
                                    <span className="font-black text-sm">{algae.matchScore} {language === 'id' ? 'Poin' : 'Points'}</span>
                                    <span className="mx-2 opacity-40">|</span>
                                  </div>
                                  <span className="font-bold text-xs uppercase tracking-wide leading-tight">{getConfidenceLabel(algae.matchConfidenceKey)}</span>
                                </div>
                              </div>

                              <div className="flex-1">
                                {algae.matchReasons.length > 0 ? (
                                  <div className="grid gap-2.5 sm:grid-cols-1">
                                    {algae.matchReasons.map((reason, i) => (
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
                                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">-</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ACTION PLAN EKSKLUSIF JUARA 1 */}
                          <div className="grid md:grid-cols-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                             <div className="p-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                               <h5 className="font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2">
                                 <AlertTriangle className="h-5 w-5" /> {language === 'id' ? "Penyebab Umum" : "Root Causes"}
                               </h5>
                               <ul className="space-y-2">
                                 {topCauses.map((c, i) => (
                                   <li key={i} className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 flex items-start">
                                     <span className="text-amber-500 mr-2 mt-0.5">•</span> <span>{c}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="p-5">
                               <h5 className="font-bold text-teal-600 dark:text-teal-500 mb-3 flex items-center gap-2">
                                 <ShieldCheck className="h-5 w-5" /> {language === 'id' ? "Saran Penanganan" : "Treatment Solutions"}
                               </h5>
                               <ul className="space-y-2">
                                 {topSolutions.map((s, i) => (
                                   <li key={i} className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 flex items-start">
                                     <span className="text-teal-500 mr-2 mt-0.5">✓</span> <span>{s}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                          </div>

                        </div>
                      );
                    }

                    // RANKING LAINNYA
                    return (
                      <div key={algae.id} className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="absolute top-0 left-0 z-20 w-8 h-8 bg-slate-800 text-white rounded-br-xl flex items-center justify-center font-black shadow-sm text-xs">
                          {globalIndex + 1}
                        </div>

                        <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                           <div className="w-full max-w-[280px]">
                             <AlgaeCard algae={algae} />
                           </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex flex-col items-start gap-2 mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'id' ? 'Keyakinan AI' : 'AI Confidence'}</span>
                            <div className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md border ${getConfidenceColor(algae.matchConfidenceKey)}`}>
                              <span className="whitespace-nowrap">{algae.matchScore} {language === 'id' ? 'Poin' : 'Pts'}</span>
                              <span className="opacity-40">•</span>
                              <span className="leading-tight break-words">{getConfidenceLabel(algae.matchConfidenceKey)}</span>
                            </div>
                          </div>

                          {algae.matchReasons.length > 0 ? (
                            <ul className="space-y-2 border-l-2 border-teal-500/40 pl-3 py-1 flex-1">
                              {algae.matchReasons.map((reason, i) => (
                                <li key={i} className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300 leading-snug flex items-start">
                                  <span className="text-teal-500 dark:text-teal-400 mr-2 font-bold">✓</span> 
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-200 dark:border-slate-800 py-1 flex-1">-</p>
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
                       {language === 'id' ? "Menampilkan" : "Showing"} <span className="font-bold text-gray-900 dark:text-slate-200">{startIndex + 1}</span> - <span className="font-bold text-gray-900 dark:text-slate-200">{Math.min(endIndex, results.length)}</span> {language === 'id' ? "dari" : "of"} <span className="font-bold text-gray-900 dark:text-slate-200">{results.length}</span> data
                    </p>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                      <div className="flex flex-wrap lg:flex-nowrap justify-center gap-1 sm:gap-1.5 w-full lg:w-auto">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 shrink-0"><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 shrink-0"><ChevronLeft className="h-4 w-4" /></Button>
                        
                        {pageNumbers.map(num => (
                          <Button key={num} variant={currentPage === num ? "default" : "outline"} onClick={() => setCurrentPage(num)} className={`h-8 w-8 p-0 text-sm font-medium shrink-0 ${currentPage === num ? 'bg-teal-600 hover:bg-teal-500 text-white' : ''}`}>
                            {num}
                          </Button>
                        ))}

                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 shrink-0"><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 shrink-0"><ChevronsRight className="h-4 w-4" /></Button>
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