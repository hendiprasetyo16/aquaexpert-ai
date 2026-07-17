// app/(dashboard)/dashboard/algae-expert/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { getAlgaeList } from "@/features/algae/repositories/algae.repository";
import { Algae } from "@/features/algae/types/algae.types";
import AlgaeCard from "@/features/algae/components/AlgaeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, AlertTriangle, ShieldCheck, Stethoscope, Droplets, Camera, ScanLine
} from "lucide-react";
import toast from "react-hot-toast";

import { generateAlgaeDiagnosis, UserAnswersAlgae, RecommendedAlgae } from "@/features/algae/services/expert.service";
import { useLanguage } from "@/providers/LanguageProvider";
import { getAlgaeTagDesc } from "@/features/algae/components/algae-helpers"; 
// 💡 IMPORT ACTION AI VISION ALGA KITA
import { analyzeAlgaeImageAction } from "@/features/algae/actions/analyze-algae-vision.actions";

const SESSION_KEY = "aquaexpert_algae_inference_v1";
const ITEMS_PAGE_1 = 11; 
const ITEMS_PAGE_N = 10; 

interface AlgaeExpertDict {
  title?: string;
  subtitle?: string;
  q1_color?: string;
  q2_texture?: string;
  q3_location?: string;
  q4_trigger?: string;
  btn_diagnose?: string;
}

interface ExpertEngineDict {
  confExcellent?: string;
  confVeryGood?: string;
  confGood?: string;
  confModerate?: string;
  paginationShowing?: string;
  paginationTo?: string;
  paginationOf?: string;
  paginationData?: string;
  defaultReason?: string;
  points?: string;
  bestMatch?: string;
  confidence?: string;
}

export default function AlgaeExpertEngine() {
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  const [algaeList, setAlgaeList] = useState<Algae[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedAlgae[] | null>(null);

  const [color, setColor] = useState("");
  const [texture, setTexture] = useState("");
  const [location, setLocation] = useState("");
  const [trigger, setTrigger] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  
  // 💡 STATE UNTUK KAMERA & SCANNER
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dictRoot = dict as unknown as { 
    algaeExpert?: AlgaeExpertDict; 
    expertEngine?: ExpertEngineDict; 
  };

  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getAlgaeList();
        setAlgaeList(data);
      } catch (error: unknown) {
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

  useEffect(() => {
    if (results !== null && algaeList.length > 0) {
      const answers: UserAnswersAlgae = { color, texture, location, trigger };
      const aiResults = generateAlgaeDiagnosis(algaeList, answers, dictRoot.algaeExpert, language);
      setResults(aiResults);
      
      const savedSession = sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          parsed.results = aiResults;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        } catch(e: unknown) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, dictRoot.algaeExpert, algaeList.length]); 

  const runDiagnosisEngine = () => {
    setLoading(true);
    setCurrentPage(1); 
    
    const answers: UserAnswersAlgae = { color, texture, location, trigger };
    const aiResults = generateAlgaeDiagnosis(algaeList, answers, dictRoot.algaeExpert, language);

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

  // 💡 FUNGSI KOMPRESI GAMBAR
  const compressImageToBase64 = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Gagal memproses gambar")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // 💡 LOGIKA ANALISIS FOTO ALGA
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(lang === 'id' ? "Ukuran foto maksimal 10MB." : "Max photo size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading(lang === 'id' ? "AI Vision sedang menganalisis foto lumut..." : "AI Vision is scanning the algae photo...");

    try {
      const compressedBase64 = await compressImageToBase64(file);
      const res = await analyzeAlgaeImageAction(compressedBase64);
      
      if (res.success && res.aiFilters) {
        // 1. Update Dropdown State
        const newColor = res.aiFilters.color || "";
        const newTexture = res.aiFilters.texture || "";
        const newLocation = res.aiFilters.location || "";
        
        setColor(newColor);
        setTexture(newTexture);
        setLocation(newLocation);
        
        toast.success(
          lang === 'id' 
            ? `Berhasil! Filter telah diisi otomatis oleh AI.` 
            : `Success! Filters auto-filled by AI.`,
          { id: toastId, duration: 4000 }
        );

        // 2. Langsung eksekusi pencarian tanpa menunggu user klik tombol!
        setLoading(true);
        setCurrentPage(1); 
        
        const answers: UserAnswersAlgae = { color: newColor, texture: newTexture, location: newLocation, trigger };
        const aiResults = generateAlgaeDiagnosis(algaeList, answers, dictRoot.algaeExpert, language);

        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers, results: aiResults, currentPage: 1 }));

        setTimeout(() => {
          setResults(aiResults);
          setLoading(false);
        }, 1000);

      } else {
        throw new Error(res.error || "Gagal menganalisis gambar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal memindai gambar.", { id: toastId });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (key: string) => {
    switch (key) {
      case "Excellent": return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800";
      case "VeryGood": return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      case "Good": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getConfidenceLabel = (key: string) => {
    switch (key) {
      case "Excellent": return dictRoot.expertEngine?.confExcellent || (language === 'id' ? "Sangat Cocok" : "Excellent Match");
      case "VeryGood": return dictRoot.expertEngine?.confVeryGood || (language === 'id' ? "Kemungkinan Besar" : "Very Good Match");
      case "Good": return dictRoot.expertEngine?.confGood || (language === 'id' ? "Cukup Cocok" : "Good Match");
      default: return dictRoot.expertEngine?.confModerate || (language === 'id' ? "Kemungkinan Kecil" : "Moderate Match");
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

  if (!dictRoot.algaeExpert) return null;

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 relative">
      
      {/* 💡 EFEK SCANNER OVERLAY SAAT MEMPROSES FOTO */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-teal-900/40 backdrop-blur-[4px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(20,184,166,0.3)_50%,transparent_100%)] h-32 animate-[scan_2s_ease-in-out_infinite]" style={{ backgroundSize: '100% 800%' }}></div>
          <div className="bg-white/95 dark:bg-slate-900/95 px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-teal-200 dark:border-teal-800 relative z-10 scale-in-center">
            <ScanLine className="w-10 h-10 text-teal-600 animate-pulse" />
            <div>
              <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm md:text-base">
                {lang === 'id' ? "Memindai Alga..." : "Scanning Algae..."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'id' ? "Mengidentifikasi Warna & Tekstur" : "Identifying Color & Texture"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FILE TERSEMBUNYI */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        onChange={handleImageCapture}
        className="hidden"
      />

      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> {dictRoot.algaeExpert.title}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {dictRoot.algaeExpert.subtitle}
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-4 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between text-gray-900 dark:text-slate-100">
                <span className="flex items-center gap-2"><Filter className="h-5 w-5 text-teal-600 dark:text-teal-500" /> {language === 'id' ? "Filter Analisis" : "Analysis Filter"}</span>
              </h3>

              {/* 💡 TOMBOL KAMERA DITAMBAHKAN DI SINI */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isScanning}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-5 bg-teal-50/50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/50 border-2 border-dashed border-teal-300 dark:border-teal-800 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-teal-700 dark:text-teal-400 text-sm uppercase tracking-wide">
                    {lang === 'id' ? "Auto-Scan via Foto" : "Auto-Scan via Photo"}
                  </p>
                  <p className="text-[10px] text-teal-600/70 dark:text-teal-500/70 mt-1 font-medium max-w-[200px] leading-tight">
                    {lang === 'id' ? "AI akan mengenali warna, tekstur, & lokasi lumut secara otomatis." : "AI will auto-detect algae color, texture, & location."}
                  </p>
                </div>
              </button>

              <div className="relative">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                 <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold tracking-widest">{lang === 'id' ? 'ATAU INPUT MANUAL' : 'OR MANUAL INPUT'}</span></div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dictRoot.algaeExpert.q1_color || "1. Warna"}</Label>
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Warna" : "Select Color"} --</option>
                    <option value="green">{language === 'id' ? "Hijau" : "Green"}</option>
                    <option value="light_green">{language === 'id' ? "Hijau Muda" : "Light Green"}</option>
                    <option value="dark_green">{language === 'id' ? "Hijau Gelap" : "Dark Green"}</option>
                    <option value="blue_green">{language === 'id' ? "Biru Kehijauan" : "Blue-Green"}</option>
                    <option value="brown">{language === 'id' ? "Coklat / Keemasan" : "Brown / Golden"}</option>
                    <option value="black">{language === 'id' ? "Hitam" : "Black"}</option>
                    <option value="gray">{language === 'id' ? "Abu-abu" : "Gray"}</option>
                    <option value="dark_gray">{language === 'id' ? "Abu-abu Gelap" : "Dark Gray"}</option>
                    <option value="white">{language === 'id' ? "Putih Pucat" : "Pale White"}</option>
                    <option value="reddish">{language === 'id' ? "Kemerahan" : "Reddish"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dictRoot.algaeExpert.q2_texture || "2. Tekstur Visual"}</Label>
                  <select value={texture} onChange={(e) => setTexture(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Tekstur" : "Select Texture"} --</option>
                    <option value="tuft">{language === 'id' ? "Mengelompok (Kuas)" : "Tuft / Brush-like"}</option>
                    <option value="hairy">{language === 'id' ? "Seperti Rambut Pendek" : "Hairy"}</option>
                    <option value="long_thread">{language === 'id' ? "Benang Panjang" : "Long Threads"}</option>
                    <option value="wiry">{language === 'id' ? "Kaku / Seperti Kawat" : "Wiry / Stiff"}</option>
                    <option value="branching">{language === 'id' ? "Bercabang (Tanduk)" : "Branching"}</option>
                    <option value="dust">{language === 'id' ? "Serbuk / Berdebu" : "Dust / Powdery"}</option>
                    <option value="powdery">{language === 'id' ? "Seperti Bedak" : "Powdery"}</option>
                    <option value="hard_spot">{language === 'id' ? "Titik Keras (Susah Dikerok)" : "Hard Spots"}</option>
                    <option value="slime">{language === 'id' ? "Berlendir / Lendir" : "Slime"}</option>
                    <option value="sheet">{language === 'id' ? "Membentuk Lembaran" : "Sheet-like"}</option>
                    <option value="flat">{language === 'id' ? "Datar / Ceper" : "Flat"}</option>
                    <option value="soft">{language === 'id' ? "Lembut" : "Soft"}</option>
                    <option value="easily_wiped">{language === 'id' ? "Mudah Diusap/Dibersihkan" : "Easily Wiped"}</option>
                    <option value="smelly">{language === 'id' ? "Berbau Busuk" : "Smelly"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dictRoot.algaeExpert.q3_location || "3. Lokasi Penyebaran"}</Label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Lokasi" : "Select Location"} --</option>
                    <option value="glass">{language === 'id' ? "Kaca Akuarium" : "Aquarium Glass"}</option>
                    <option value="hardscape">{language === 'id' ? "Hardscape (Batu/Kayu)" : "Hardscape (Rocks/Wood)"}</option>
                    <option value="substrate">{language === 'id' ? "Substrat / Pasir" : "Substrate / Sand"}</option>
                    <option value="plants">{language === 'id' ? "Menyelimuti Tanaman" : "Covering Plants"}</option>
                    <option value="leaf_edges">{language === 'id' ? "Pinggiran Daun" : "Leaf Edges"}</option>
                    <option value="slow_leaves">{language === 'id' ? "Daun Tumbuh Lambat" : "Slow-growing Leaves"}</option>
                    <option value="moss">{language === 'id' ? "Menyelinap di Lumut" : "Inside Moss"}</option>
                    <option value="equipment">{language === 'id' ? "Pipa / Filter / Peralatan" : "Equipment / Pipes"}</option>
                    <option value="high_flow">{language === 'id' ? "Area Arus Kencang" : "High Flow Areas"}</option>
                    <option value="everywhere">{language === 'id' ? "Di Seluruh Area Tank" : "Everywhere"}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">{dictRoot.algaeExpert.q4_trigger || "4. Pemicu / Trigger (Opsional)"}</Label>
                  <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-all">
                    <option value="">-- {language === 'id' ? "Pilih Pemicu (Opsional)" : "Select Trigger (Optional)"} --</option>
                    <option value="new_tank">{language === 'id' ? "Tank Baru (< 2 Bulan)" : "New Tank (< 2 Months)"}</option>
                    <option value="co2_fluctuation">{language === 'id' ? "Fluktuasi CO2" : "CO2 Fluctuation"}</option>
                    <option value="low_co2">{language === 'id' ? "Kekurangan CO2" : "Low CO2 Level"}</option>
                    <option value="high_light">{language === 'id' ? "Lampu Terlalu Terang/Lama" : "Light Too Bright/Long"}</option>
                    <option value="poor_circulation">{language === 'id' ? "Sirkulasi Buruk (Titik Mati)" : "Poor Circulation (Dead Spots)"}</option>
                    <option value="low_flow">{language === 'id' ? "Kurang Arus Air Umum" : "Low Water Flow"}</option>
                    <option value="nutrient_imbalance">{language === 'id' ? "Ketidakseimbangan Nutrisi Umum" : "General Nutrient Imbalance"}</option>
                    <option value="low_phosphate">{language === 'id' ? "Kekurangan Fosfat (PO4)" : "Low Phosphate (PO4)"}</option>
                    <option value="low_nitrate">{language === 'id' ? "Kekurangan Nitrat (NO3)" : "Low Nitrate (NO3)"}</option>
                    <option value="high_ammonia">{language === 'id' ? "Amonia Tinggi (Spike)" : "High Ammonia Spike"}</option>
                    <option value="iron_imbalance">{language === 'id' ? "Kelebihan Zat Besi (Fe)" : "Excess Iron (Fe)"}</option>
                    <option value="high_silicate">{language === 'id' ? "Silikat Tinggi" : "High Silicate"}</option>
                    <option value="high_organics">{language === 'id' ? "Penumpukan Sisa Organik Kotor" : "High Organics Buildup"}</option>
                  </select>
                </div>
              </div>

              <Button onClick={runDiagnosisEngine} disabled={loading || (!color && !texture && !location && !trigger)} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-14 mt-6 text-base shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-[0.98]">
                {loading && !isScanning ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : dictRoot.algaeExpert.btn_diagnose || "Analisis Diagnosis"}
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
                  {language === 'id' ? "Gunakan fitur Auto-Scan Foto atau pilih filter manual untuk mengidentifikasi jenis alga." : "Use Auto-Scan Photo or select manual filters to identify the algae."}
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
                
                <div className="grid gap-6 lg:grid-cols-2">
                  {displayedResults.map((algae, index) => {
                    const globalIndex = startIndex + index;
                    const isTopMatch = globalIndex === 0;

                    // ==========================================
                    // EKSKLUSIF JUARA 1 (GABUNGAN UI TERBARU)
                    // ==========================================
                    if (isTopMatch) {
                      const topCauses = language === 'en' && algae.causes_en?.length ? algae.causes_en : algae.causes_id || [];
                      const allSolutions = language === 'en' && algae.solutions_en?.length ? algae.solutions_en : algae.solutions_id || [];

                      const preventionKeywordsID = ["jaga", "rutin", "hindari", "jangan", "pastikan", "cegah", "kuras", "bersihkan", "kontrol"];
                      const preventionKeywordsEN = ["maintain", "routine", "avoid", "do not", "ensure", "prevent", "clean", "regular", "control"];
                      const keywords = language === 'id' ? preventionKeywordsID : preventionKeywordsEN;

                      const treatments: string[] = [];
                      const preventions: string[] = [];

                      allSolutions.forEach(s => {
                        const lowerS = s.toLowerCase();
                        if (keywords.some(kw => lowerS.includes(kw))) preventions.push(s);
                        else treatments.push(s);
                      });

                      if (preventions.length === 0 && treatments.length > 0) preventions.push(treatments.pop()!);

                      return (
                        <div key={algae.id} className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-xl shadow-teal-500/10 mb-4 flex flex-col">
                          
                          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-white font-black flex items-center gap-2 text-sm tracking-widest uppercase shadow-sm z-10 relative">
                            <Trophy className="h-5 w-5 text-amber-300" /> {language === 'id' ? "Diagnosis Utama (Kemungkinan Terbesar)" : "Primary Diagnosis (Highest Probability)"}
                          </div>

                          <div className="flex flex-col lg:flex-row items-stretch border-b border-slate-100 dark:border-slate-800">
                            <div className="p-4 lg:p-5 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 lg:w-[320px] shrink-0">
                              <div className="w-full max-w-[280px] lg:max-w-none">
                                <AlgaeCard algae={algae} />
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-4 lg:p-5">
                              <div className="flex flex-col items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-lg font-black text-gray-900 dark:text-slate-100 leading-tight flex items-center gap-2">
                                  <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-500" />
                                  {language === "id" ? "Laporan Analisis Pakar" : "Expert Analysis Report"}
                                </h4>
                                <div className={`inline-flex items-center self-start px-3 py-1.5 rounded-lg border ${getConfidenceColor(algae.matchConfidenceKey)} shadow-sm shrink-0`}>
                                  <Target className="w-4 h-4 mr-1.5" />
                                  <span className="font-black text-sm">{algae.matchScore} {language === 'id' ? 'Poin' : 'Pts'}</span>
                                  <span className="mx-2 opacity-40">|</span>
                                  <span className="font-bold text-xs uppercase tracking-wide">{getConfidenceLabel(algae.matchConfidenceKey)}</span>
                                </div>
                              </div>

                              <div className="flex-1">
                                {algae.matchReasons.length > 0 ? (
                                  <div className="grid gap-3 sm:grid-cols-1">
                                    {algae.matchReasons.map((reason, i) => (
                                      <div key={i} className="flex items-start bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 transition-colors">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-1 rounded-full mr-3 shrink-0 mt-0.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <span className="text-[13px] sm:text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
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

                          {/* DARI SNIPPET 1: DAMPAK EKOSISTEM (Affected Conditions) */}
                          {algae.affected_conditions && algae.affected_conditions.length > 0 && (
                             <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40">
                               <h5 className="font-bold text-rose-700 dark:text-rose-500 mb-2.5 flex items-center gap-2 uppercase tracking-wider text-xs">
                                 <AlertTriangle className="h-4 w-4" /> {language === 'id' ? "Dampak Kerusakan Ekosistem" : "Ecosystem Damages"}
                               </h5>
                               <div className="flex flex-wrap gap-2">
                                 {algae.affected_conditions.map(c => (
                                   <span key={c} className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm border border-rose-200 dark:border-rose-800/60">
                                     {getAlgaeTagDesc(c, language)}
                                   </span>
                                 ))}
                               </div>
                             </div>
                          )}

                          {/* DARI SNIPPET 2: 3-KOLOM (Penyebab, Penanganan, Pencegahan) */}
                          <div className="grid md:grid-cols-3 bg-slate-50/50 dark:bg-slate-950/50 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                             <div className="p-5 flex flex-col h-full bg-amber-50/30 dark:bg-amber-950/10">
                               <h5 className="font-bold text-amber-700 dark:text-amber-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                 <AlertTriangle className="h-4 w-4" /> {language === 'id' ? "Kemungkinan Penyebab" : "Root Causes"}
                               </h5>
                               <ul className="space-y-3 flex-1">
                                 {topCauses.map((c, i) => (
                                   <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start font-medium leading-snug">
                                     <span className="text-amber-500 mr-2.5 mt-0.5 text-base leading-none">•</span> <span>{c}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>

                             <div className="p-5 flex flex-col h-full bg-blue-50/30 dark:bg-blue-950/10">
                               <h5 className="font-bold text-blue-700 dark:text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                 <Droplets className="h-4 w-4" /> {language === 'id' ? "Langkah Penanganan" : "Treatment Plan"}
                               </h5>
                               <ul className="space-y-3 flex-1">
                                 {treatments.length > 0 ? treatments.map((s, i) => (
                                   <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start font-medium leading-snug">
                                     <span className="text-blue-500 mr-2 mt-0.5 font-bold">✓</span> <span>{s}</span>
                                   </li>
                                 )) : <li className="text-sm text-slate-500 italic">-</li>}
                               </ul>
                             </div>

                             <div className="p-5 flex flex-col h-full bg-emerald-50/30 dark:bg-emerald-950/10">
                               <h5 className="font-bold text-emerald-700 dark:text-emerald-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                 <ShieldCheck className="h-4 w-4" /> {language === 'id' ? "Tindakan Pencegahan" : "Prevention"}
                               </h5>
                               <ul className="space-y-3 flex-1">
                                 {preventions.length > 0 ? preventions.map((s, i) => (
                                   <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start font-medium leading-snug">
                                     <span className="text-emerald-500 mr-2 mt-0.5 font-bold">✓</span> <span>{s}</span>
                                   </li>
                                 )) : <li className="text-sm text-slate-500 italic">-</li>}
                               </ul>
                             </div>
                          </div>

                        </div>
                      );
                    }

                    // ==========================================
                    // RANKING 2, 3, DST...
                    // ==========================================
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
                          <div className="flex flex-col items-start gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                               <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-500" />
                               {language === 'id' ? 'Laporan Analisis' : 'Analysis Report'}
                            </span>
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

                        {/* DAMPAK EKOSISTEM UNTUK KANDIDAT LAIN */}
                        {algae.affected_conditions && algae.affected_conditions.length > 0 && (
                          <div className="px-5 pb-5 pt-0">
                            <div className="flex flex-wrap gap-1.5">
                              {algae.affected_conditions.slice(0, 3).map(c => (
                                <span key={c} className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded text-[10px] font-semibold border border-rose-100 dark:border-rose-900/50">
                                  {getAlgaeTagDesc(c, language)}
                                </span>
                              ))}
                              {algae.affected_conditions.length > 3 && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                  +{algae.affected_conditions.length - 3} {language === 'id' ? 'lainnya' : 'more'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
                
                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-t border-slate-200 dark:border-slate-800 pt-5 mt-6 gap-4 transition-colors">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center lg:text-left mb-1 lg:mb-0">
                       {dictRoot.expertEngine?.paginationShowing || (language === 'id' ? "Menampilkan" : "Showing")} <span className="font-bold text-gray-900 dark:text-slate-200">{startIndex + 1}</span> {dictRoot.expertEngine?.paginationTo || (language === 'id' ? "hingga" : "to")} <span className="font-bold text-gray-900 dark:text-slate-200">{Math.min(endIndex, results.length)}</span> {dictRoot.expertEngine?.paginationOf || (language === 'id' ? "dari" : "of")} <span className="font-bold text-gray-900 dark:text-slate-200">{results.length}</span> {dictRoot.expertEngine?.paginationData || "data"}
                    </p>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
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