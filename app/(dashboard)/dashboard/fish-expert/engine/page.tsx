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
import Image from "next/image";
import { 
  Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, Fish,
  Plus, X, HeartPulse, Search
} from "lucide-react";

import { generateFishRecommendations, UserFishAnswers, RecommendedFish, FishExpertDictionary, ExistingFishRecord } from "@/features/fishes/services/fish-expert.service";
import { useLanguage } from "@/providers/LanguageProvider";

const SESSION_KEY = "aquaexpert_fish_inference_v4";
const ITEMS_PAGE_1 = 11; 
const ITEMS_PAGE_N = 10; 

type ExperienceLevel = "Pemula" | "Menengah" | "Mahir";

// ==========================================
// INTERFACE UNTUK TYPE-SAFE DICTIONARY
// ==========================================
interface FishEngineDict {
  title?: string; subtitle?: string; formTitle?: string;
  q1?: string; q1Opt1?: string; q1Opt2?: string; q1Opt3?: string;
  q2?: string; q3?: string; q4?: string; q5?: string;
  q5Opt1?: string; q5Opt2?: string; q5Opt3?: string;
  needSchooling?: string; btnStart?: string; processing?: string;
  idleTitle?: string; idleDesc?: string; failTitle?: string; failDesc?: string;
  successTitle?: string; successDesc?: string; matchCount?: string; bestMatch?: string;
  confidence?: string; points?: string; defaultReason?: string;
  confExcellent?: string; confVeryGood?: string; confGood?: string; confModerate?: string;
}

export default function FishExpertEnginePage() {
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  const [fishes, setFishes] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedFish[] | null>(null);

  // USER INPUT STATES 
  const [experience, setExperience] = useState<ExperienceLevel>("Pemula");
  const [tankVolumeLiters, setTankVolumeLiters] = useState<number | "">("");
  const [tankLengthCm, setTankLengthCm] = useState<number | "">(""); 
  const [currentPH, setCurrentPH] = useState<number | "">("");
  const [currentTemp, setCurrentTemp] = useState<number | "">("");
  const [currentGH, setCurrentGH] = useState<number | "">("");
  const [fishTypePref, setFishTypePref] = useState("Community Tank");
  const [wantSchoolingFish, setWantSchoolingFish] = useState(true);
  
  const [hasShrimp, setHasShrimp] = useState(false); 
  const [hasPlants, setHasPlants] = useState(true);  
  const [aquascapeStyle, setAquascapeStyle] = useState("Bebas"); 
  
  // V4 MY AQUARIUM SIMULATOR STATES
  const [existingFishes, setExistingFishes] = useState<ExistingFishRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelectedFishId, setModalSelectedFishId] = useState("");
  const [modalQty, setModalQty] = useState<number | "">(1);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getFishes();
        setFishes(data);
      } catch (error) { console.error("Gagal memuat Knowledge Base Ikan:", error); } 
      finally { setLoading(false); }
    }
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.answers) {
          setExperience(parsed.answers.experience || "Pemula");
          setTankVolumeLiters(parsed.answers.tankVolumeLiters || "");
          setTankLengthCm(parsed.answers.tankLengthCm || "");
          setCurrentPH(parsed.answers.currentPH || "");
          setCurrentTemp(parsed.answers.currentTemp || "");
          setCurrentGH(parsed.answers.currentGH || "");
          setFishTypePref(parsed.answers.fishTypePref || "Community Tank");
          setWantSchoolingFish(parsed.answers.wantSchoolingFish ?? true);
          setHasShrimp(parsed.answers.hasShrimp || false);
          setHasPlants(parsed.answers.hasPlants || false);
          setAquascapeStyle(parsed.answers.aquascapeStyle || "Bebas");
          if (parsed.answers.existingFishes) setExistingFishes(parsed.answers.existingFishes);
        }
        if (parsed.results) setResults(parsed.results);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
      } catch (e: unknown) {}
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
         } catch (e: unknown) {}
       }
    }
  }, [currentPage, results]);

  const handleModalSave = () => {
    if (!modalSelectedFishId || !modalQty || modalQty < 1) return;
    const fishObj = fishes.find(f => f.id === modalSelectedFishId);
    if (!fishObj) return;

    setExistingFishes(prev => {
      const exists = prev.find(p => p.fish.id === modalSelectedFishId);
      if (exists) {
        return prev.map(p => p.fish.id === modalSelectedFishId ? { ...p, quantity: p.quantity + Number(modalQty) } : p);
      }
      return [...prev, { fish: fishObj, quantity: Number(modalQty) }];
    });
    
    setModalSelectedFishId("");
    setModalQty(1);
    setModalSearch("");
    setIsModalOpen(false);
  };

  const handleRemoveFish = (id: string) => {
    setExistingFishes(prev => prev.filter(p => p.fish.id !== id));
  };

  const filteredModalFishes = fishes.filter(f => {
    const term = modalSearch.toLowerCase();
    const nameId = f.name_id?.toLowerCase() || "";
    const nameEn = f.name_en?.toLowerCase() || "";
    return nameId.includes(term) || nameEn.includes(term);
  });

  // MENGAMBIL DICTIONARY DENGAN AMAN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootDict = dict as unknown as { fishExpertEngine: FishEngineDict; fishList: any };
  const engineDict = rootDict.fishExpertEngine || {};
  const listDict = rootDict.fishList || {};

  // PENGAMANAN FALLBACK TEKS BILINGUAL
  const t = {
    title: engineDict.title || "Fish Compatibility Engine V4",
    subtitle: engineDict.subtitle || "Sistem cerdas evaluasi bioload predator-prey dan kapasitas water layer.",
    formTitle: engineDict.formTitle || "Kuesioner Ekosistem Tangki",
    
    // Pertanyaan
    exp: engineDict.q1 || (lang === 'id' ? "1. Pengalaman Anda" : "1. Your Experience"),
    q1Opt1: engineDict.q1Opt1 || "Pemula",
    q1Opt2: engineDict.q1Opt2 || "Menengah",
    q1Opt3: engineDict.q1Opt3 || "Mahir",
    
    vol: engineDict.q2 || (lang === 'id' ? "2. Volume Tangki (Liter)" : "2. Tank Volume (Liters)"),
    len: lang === 'id' ? "Panjang Tangki (cm)" : "Tank Length (cm)",
    ph: engineDict.q3 || (lang === 'id' ? "3. pH Air Saat Ini" : "3. Current Water pH"),
    temp: engineDict.q4 || (lang === 'id' ? "4. Suhu Air Saat Ini (°C)" : "4. Current Temp (°C)"),
    gh: lang === 'id' ? "GH Air (Opsional)" : "Water GH (Optional)",
    
    eco: engineDict.q5 || (lang === 'id' ? "5. Rencana Ekosistem" : "5. Ecosystem Plan"),
    q5Opt1: engineDict.q5Opt1 || "Community Tank",
    q5Opt2: engineDict.q5Opt2 || "Semi-Aggressive",
    q5Opt3: engineDict.q5Opt3 || "Species Only",
    
    style: lang === 'id' ? "Style Akuarium" : "Aquascape Style",
    plants: lang === 'id' ? "Ada Tanaman Hidup" : "Has Live Plants",
    shrimp: lang === 'id' ? "Ada Udang Hias" : "Has Shrimp",
    needSchooling: engineDict.needSchooling || (lang === 'id' ? "Suka Ikan Berkelompok" : "I like schooling fish"),
    
    // UI Simulator
    simTitle: lang === 'id' ? "Simulator Penghuni (My Aquarium)" : "My Aquarium Simulator",
    simDesc: lang === 'id' ? "Masukkan jenis ikan yang saat ini SUDAH ADA di dalam tank Anda. AI akan menghitung sisa kapasitas tangki, mencegah overstock, dan menghindari ikan saling memangsa (hukum rimba)." : "Enter fish that ALREADY exist in your tank. AI will calculate remaining capacity, prevent overstocking, and avoid predatory mismatch.",
    simBtn: lang === 'id' ? "Tambah Fauna" : "Select Fauna",
    simEmpty: lang === 'id' ? "Belum ada penghuni. Tangki kosong." : "No inhabitants. Tank is empty.",
    
    // Modal
    modalTitle: lang === 'id' ? "Pilih Fauna" : "Select Fauna",
    modalSearch: lang === 'id' ? "Cari spesies..." : "Search species...",
    modalCancel: lang === 'id' ? "BATAL" : "CANCEL",
    modalSave: lang === 'id' ? "SIMPAN" : "SAVE",
    
    // Hasil Engine
    btnStart: engineDict.btnStart || (lang === 'id' ? "Mulai Analisis" : "Start Analysis"),
    idleTitle: engineDict.idleTitle || "Sistem Aktif",
    idleDesc: engineDict.idleDesc || "Kirim parameter tangki Anda untuk diagnosis cerdas.",
    failTitle: engineDict.failTitle || "Gagal Menemukan Kecocokan",
    failDesc: engineDict.failDesc || "Tangki terlalu ekstrem atau overstock.",
    successTitle: engineDict.successTitle || "Hasil Analisis",
    successDesc: engineDict.successDesc || "Daftar ikan yang aman digabungkan dengan penghuni lama.",
    matchCount: engineDict.matchCount || "Spesies Aman",
    bestMatch: engineDict.bestMatch || "Top Match",
    confidence: engineDict.confidence || "Keamanan AI",
    points: engineDict.points || "Poin",
    defaultReason: engineDict.defaultReason || "Sesuai standar.",
    confExcellent: engineDict.confExcellent || "Sangat Cocok",
    confVeryGood: engineDict.confVeryGood || "Bagus",
    confGood: engineDict.confGood || "Cocok",
    confModerate: engineDict.confModerate || "Cukup",
    
    // Pagination
    showing: listDict.showing || (lang === 'id' ? "Menampilkan" : "Showing"),
    to: listDict.to || (lang === 'id' ? "hingga" : "to"),
    of: listDict.of || (lang === 'id' ? "dari" : "of"),
    data: listDict.data || "data.",
    page: listDict.page || (lang === 'id' ? "Hal" : "Page")
  };

  const runInferenceEngine = () => {
    setLoading(true);
    setCurrentPage(1); 
    
    const answers: UserFishAnswers = { 
      experience, 
      tankVolumeLiters: Number(tankVolumeLiters) || 60, 
      tankLengthCm: Number(tankLengthCm) || 60, 
      currentPH: Number(currentPH) || 7.0, 
      currentTemp: Number(currentTemp) || 26.0, 
      currentGH: Number(currentGH) || 5,
      wantSchoolingFish, 
      fishTypePref, 
      hasShrimp, 
      hasPlants, 
      aquascapeStyle, 
      existingFishes 
    };
    
    const aiResults = generateFishRecommendations(fishes, answers, engineDict as unknown as FishExpertDictionary, lang);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers, results: aiResults, currentPage: 1 }));

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  const getConfidenceColor = (key: string) => {
    switch (key) {
      case "Excellent": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "VeryGood": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
      case "Good": return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getConfidenceLabel = (key: string) => {
    switch (key) { 
      case "Excellent": return t.confExcellent; 
      case "VeryGood": return t.confVeryGood; 
      case "Good": return t.confGood; 
      default: return t.confModerate; 
    }
  };

  let totalPages = 0;
  let displayedResults: RecommendedFish[] = [];
  let startIndex = 0;
  let endIndex = 0;

  if (results && results.length > 0) {
    const totalItems = results.length;
    const remainingItems = Math.max(0, totalItems - ITEMS_PAGE_1);
    if (totalItems <= ITEMS_PAGE_1) totalPages = 1; else totalPages = 1 + Math.ceil(remainingItems / ITEMS_PAGE_N);
    if (currentPage === 1) { startIndex = 0; endIndex = ITEMS_PAGE_1; } else { startIndex = ITEMS_PAGE_1 + ((currentPage - 2) * ITEMS_PAGE_N); endIndex = startIndex + ITEMS_PAGE_N; }
    displayedResults = results.slice(startIndex, endIndex);
  }

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const isFormIncomplete = tankVolumeLiters === "" || tankLengthCm === "" || currentPH === "" || currentTemp === "";

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> {t.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          {/* PANEL KIRI: FORMULIR INPUT V4 */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-5 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-5 sm:p-8 space-y-6">
              
              {/* SECTION: LINGKUNGAN */}
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {t.formTitle}
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{t.exp}</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm focus:border-blue-500 outline-none">
                    <option value="Pemula">{t.q1Opt1}</option>
                    <option value="Menengah">{t.q1Opt2}</option>
                    <option value="Mahir">{t.q1Opt3}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider flex items-center gap-1">{t.vol} <span className="text-red-500">*</span></Label>
                    <Input type="number" required placeholder="Cth: 100" value={tankVolumeLiters} onChange={(e) => setTankVolumeLiters(e.target.value ? Number(e.target.value) : "")} className="h-11 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider flex items-center gap-1">{t.len} <span className="text-red-500">*</span></Label>
                    <Input type="number" required placeholder="Cth: 60" value={tankLengthCm} onChange={(e) => setTankLengthCm(e.target.value ? Number(e.target.value) : "")} className="h-11 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider flex items-center gap-1">{t.ph} <span className="text-red-500">*</span></Label>
                        <Input type="number" step="0.1" required placeholder="Cth: 6.8" value={currentPH} onChange={(e) => setCurrentPH(e.target.value ? Number(e.target.value) : "")} className="h-11 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider flex items-center gap-1">{t.temp} <span className="text-red-500">*</span></Label>
                        <Input type="number" step="0.1" required placeholder="Cth: 25.5" value={currentTemp} onChange={(e) => setCurrentTemp(e.target.value ? Number(e.target.value) : "")} className="h-11 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs uppercase font-bold tracking-wider">{t.gh}</Label>
                        <Input type="number" step="0.5" placeholder="Cth: 4" value={currentGH} onChange={(e) => setCurrentGH(e.target.value ? Number(e.target.value) : "")} className="h-11 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 font-bold" />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{t.eco}</Label>
                    <select value={fishTypePref} onChange={(e) => setFishTypePref(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm focus:border-blue-500 outline-none">
                      <option value="Community Tank">{t.q5Opt1}</option>
                      <option value="Semi-Aggressive">{t.q5Opt2}</option>
                      <option value="Species Only">{t.q5Opt3}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">{t.style}</Label>
                    <select value={aquascapeStyle} onChange={(e) => setAquascapeStyle(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm focus:border-blue-500 outline-none">
                      <option value="Bebas">{lang === 'id' ? "Bebas / Tanpa Tema" : "No Theme"}</option>
                      <option value="Nature">Nature Style</option>
                      <option value="Dutch">Dutch Style</option>
                      <option value="Iwagumi">Iwagumi</option>
                      <option value="Biotope">Biotope</option>
                      <option value="Blackwater">Blackwater</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 pb-2 space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={hasPlants} onChange={(e) => setHasPlants(e.target.checked)} className="h-5 w-5 accent-teal-600 rounded cursor-pointer" />
                      <span className="text-[13px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">{t.plants}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={hasShrimp} onChange={(e) => setHasShrimp(e.target.checked)} className="h-5 w-5 accent-emerald-600 rounded cursor-pointer" />
                      <span className="text-[13px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">{t.shrimp}</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input type="checkbox" checked={wantSchoolingFish} onChange={(e) => setWantSchoolingFish(e.target.checked)} className="h-5 w-5 accent-blue-600 rounded cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{t.needSchooling}</span>
                  </label>
                </div>
              </div>

              {/* SECTION: V4 MY AQUARIUM INTEGRATION */}
              <div className="pt-2">
                <h3 className="text-xl font-extrabold pb-2 flex items-center gap-2 text-blue-600 dark:text-blue-500 mb-2">
                  <HeartPulse className="h-6 w-6" /> {t.simTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {t.simDesc}
                </p>
                
                <Button type="button" onClick={() => setIsModalOpen(true)} className="w-full h-14 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-500 border border-blue-500/30 border-dashed rounded-xl font-bold flex items-center justify-center transition-all mb-4 text-sm sm:text-base">
                  <Plus className="w-5 h-5 mr-2" /> {t.simBtn}
                </Button>

                {/* DAFTAR IKAN EXISTING (INVENTORY) */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {existingFishes.length === 0 ? (
                    <div className="flex items-center justify-center h-24 border border-slate-200 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                      <p className="text-sm text-slate-500 italic text-center">
                        {t.simEmpty}
                      </p>
                    </div>
                  ) : (
                    existingFishes.map((ef, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all hover:border-red-300 group">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                            {ef.fish.image_url ? (
                              <Image src={ef.fish.image_url} alt={ef.fish.name_id} fill sizes="48px" className="object-cover" unoptimized />
                            ) : (
                              <Fish className="h-6 w-6 m-auto mt-3 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-blue-700 dark:text-cyan-400 text-xs bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded shadow-sm border border-blue-100 dark:border-blue-900">{ef.quantity}x</span>
                               <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{lang === 'en' && ef.fish.name_en ? ef.fish.name_en : ef.fish.name_id}</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">{ef.fish.water_layer || 'Mid'} • Adult: {ef.fish.estimated_adult_size_cm || 5}cm</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveFish(ef.fish.id)} className="text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-colors p-1.5"><X className="h-4 w-4"/></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button onClick={runInferenceEngine} disabled={loading || isFormIncomplete} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest h-16 mt-6 text-base shadow-[0_0_20px_rgba(37,99,235,0.4)] dark:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 rounded-xl">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : t.btnStart}
              </Button>
            </CardContent>
          </Card>

          {/* PANEL KANAN: HASIL REKOMENDASI AI */}
          <div className="xl:col-span-7 space-y-6">
            {!results ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center p-8">
                <Fish className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">{t.idleTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">{t.idleDesc}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-red-200 dark:border-red-900/30 rounded-2xl bg-red-50 dark:bg-red-950/10 p-8 text-center">
                <Info className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">{t.failTitle}</h3>
                <p className="text-base text-slate-600 dark:text-red-400/80 max-w-lg leading-relaxed">{t.failDesc}</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="mb-6 flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t.successTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t.successDesc}</p>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-400 px-5 py-2 rounded-full border border-blue-200 dark:border-blue-900 font-bold whitespace-nowrap">
                    <CheckCircle2 className="h-5 w-5" /> {results.length} {t.matchCount}
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
                            <Trophy className="h-5 w-5 text-amber-300" /> {t.bestMatch}
                          </div>
                          <div className="flex flex-col lg:flex-row items-stretch flex-1">
                            <div className="p-4 lg:p-5 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 lg:w-[320px] shrink-0">
                              <div className="w-full max-w-[280px] lg:max-w-none"><FishCard fish={fish} /></div>
                            </div>
                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-4 lg:p-5">
                              <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.confidence}</p>
                                <div className={`inline-flex max-w-fit items-center px-3 py-2 rounded-lg border ${getConfidenceColor(confidenceKey)}`}>
                                  <Target className="w-4 h-4 mr-2" />
                                  <span className="font-black text-sm">{fish.matchScore} {t.points}</span>
                                  <span className="mx-2 opacity-40">|</span>
                                  <span className="font-bold text-xs uppercase tracking-wide">{getConfidenceLabel(confidenceKey)}</span>
                                </div>
                              </div>
                              <ul className="space-y-2 border-l-2 border-blue-500/40 pl-3 py-1 flex-1">
                                {fish.matchReasons.map((reason, i) => (
                                  <li key={i} className="text-[13px] text-slate-700 dark:text-slate-300 flex items-start font-medium leading-snug">
                                    <span className="text-blue-500 mr-2 font-bold mt-0.5">✓</span> <span>{reason}</span>
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
                        <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                           <div className="w-full max-w-[280px]"><FishCard fish={fish} /></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className={`inline-flex items-center gap-2 text-[10px] font-bold px-2.5 py-1.5 rounded-md border mb-4 ${getConfidenceColor(confidenceKey)}`}>
                            <span>{fish.matchScore} {t.points}</span>
                            <span>•</span>
                            <span className="uppercase tracking-wider">{getConfidenceLabel(confidenceKey)}</span>
                          </div>
                          <ul className="space-y-2 border-l-2 border-blue-500/40 pl-3 py-1">
                            {fish.matchReasons.map((reason, i) => (
                              <li key={i} className="text-[12px] text-slate-700 dark:text-slate-300 flex items-start font-medium leading-tight">
                                <span className="text-blue-500 mr-2 font-bold">✓</span> <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PENYELARASAN PAGINATION SESUAI PLANT EXPERT */}
                {totalPages > 1 && (
                  <div className="flex flex-col lg:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 gap-4 transition-colors">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center lg:text-left w-full lg:w-auto">
                      {t.showing} <span className="font-medium text-gray-900 dark:text-slate-200">{startIndex + 1}</span> {t.to} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(endIndex, results.length)}</span> {t.of} <span className="font-medium text-gray-900 dark:text-slate-200">{results.length}</span> {t.data}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 w-full lg:w-auto">
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {pageNumbers.map(num => (
                        <Button 
                          key={num} 
                          variant={currentPage === num ? "default" : "outline"} 
                          onClick={() => setCurrentPage(num)} 
                          className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all shrink-0 ${
                            currentPage === num 
                              ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md shadow-blue-600/20 scale-105' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          {num}
                        </Button>
                      ))}

                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors shrink-0">
                        <ChevronsRight className="h-4 w-4" />
                      </Button>

                      {/* FITUR LOMPAT HALAMAN (GO TO PAGE) */}
                      <div className="flex items-center justify-center gap-2 text-sm border-t lg:border-t-0 lg:border-l border-slate-300 dark:border-slate-700 pt-2.5 lg:pt-0 lg:pl-3 w-full lg:w-auto transition-colors text-slate-600 dark:text-slate-300">
                        <span className="hidden sm:inline">{t.page}</span>
                        <Input 
                          type="number" min={1} max={totalPages} value={currentPage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= totalPages) setCurrentPage(val);
                          }}
                          className="w-12 sm:w-14 h-8 text-center text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
                        />
                        <span className="whitespace-nowrap sm:hidden">/ {totalPages}</span>
                        <span className="hidden sm:inline">/ {totalPages}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL SELECT FAUNA (MY AQUARIUM SIMULATOR) */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-2xl flex flex-col overflow-hidden shadow-2xl scale-in-95">
            
            {/* HEADER MODAL */}
            <div className="p-5 sm:p-6 border-b border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-white">{t.modalTitle}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input placeholder={t.modalSearch} value={modalSearch} onChange={e => setModalSearch(e.target.value)} className="bg-[#1e293b] border-slate-700 text-white pl-10 h-12 rounded-xl focus:border-blue-500 placeholder:text-slate-500" />
              </div>
            </div>
            
            {/* GRID GAMBAR IKAN */}
            <div className="p-6 overflow-y-auto max-h-[50vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-[#0b1120] custom-scrollbar">
               {filteredModalFishes.map(f => (
                 <div key={f.id} onClick={() => setModalSelectedFishId(f.id)} className={`cursor-pointer rounded-xl border-2 overflow-hidden flex flex-col items-center p-3 transition-all ${modalSelectedFishId === f.id ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-800 bg-[#1e293b] hover:border-slate-600'}`}>
                   <div className="w-16 h-16 rounded-lg bg-slate-800 mb-3 relative overflow-hidden flex items-center justify-center shadow-inner">
                     {f.image_url ? <Image src={f.image_url} fill sizes="64px" className="object-cover" alt="" unoptimized /> : <Fish className="w-8 h-8 text-slate-500"/>}
                   </div>
                   <p className="text-xs font-bold text-center text-slate-200 line-clamp-2 leading-tight">{lang === 'en' && f.name_en ? f.name_en : f.name_id}</p>
                 </div>
               ))}
               {filteredModalFishes.length === 0 && (
                 <div className="col-span-full py-10 text-center text-slate-500 italic">Data tidak ditemukan.</div>
               )}
            </div>
            
            {/* BOTTOM ACTION BAR */}
            <div className="p-5 sm:p-6 border-t border-slate-800 bg-[#0f172a] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
              <div className="w-full sm:w-32 space-y-2">
                <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">QTY</Label>
                <Input type="number" min={1} value={modalQty} onChange={e => setModalQty(e.target.value ? Number(e.target.value) : "")} className="bg-[#1e293b] border-slate-700 text-white h-12 font-bold focus:border-blue-500 text-center sm:text-left" />
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 sm:w-auto h-12 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 font-bold uppercase tracking-wider">{t.modalCancel}</Button>
                 <Button onClick={handleModalSave} disabled={!modalSelectedFishId || !modalQty} className="flex-1 sm:w-auto h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold w-full sm:w-32 uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                   {t.modalSave}
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}