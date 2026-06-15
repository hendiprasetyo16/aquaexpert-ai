// features/aquariums/components/AquariumDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// --- 1. IMPORTS DASAR ---
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { getAquariumByIdAction, updateAquariumAction, deleteAquariumAction } from "../actions/aquarium.actions";
import { Aquarium } from "../types/aquarium.types";
import { 
  ArrowLeft, Edit, Archive, Trash2, Container, AlertTriangle, 
  Droplets, Settings2, CalendarDays, Loader2, RefreshCw, 
  LayoutDashboard, Activity, Leaf, ShieldAlert, HeartPulse,
  Info, AlertCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// --- 2. IMPORTS KOMPONEN & MESIN PAKAR ---
import ParameterTab from "./ParameterTab";
import InventoryTab from "./InventoryTab"; 
import { getParametersAction, AquariumParameterLog } from "../actions/parameter.actions";
import { getTankInventoryAction, TankFish, TankPlant } from "../actions/inventory.actions";
import { analyzeAquariumHealth, HealthAnalysisResult } from "../utils/health-engine";
import { 
  calculateTankAge, getTankTypeDesc, getSubstrateDesc, 
  getFilterDesc, getLightDesc, getCO2Desc, getFertilizerDesc,
  AquariumDictionary
} from "./aquarium-helpers";

// --- 3. DEFINISI TIPE (INTERFACES) ---
interface DetailDictionary {
  back: string;
  edit: string;
  archive: string;
  restore: string;
  delete: string;
  overview: string;
  parameters: string;
  floraFauna: string;
  aiDiagnose: string;
  equipment: string;
  maintenance: string;
  dimensions: string;
}

type TabId = "overview" | "parameters" | "flora" | "ai";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

export default function AquariumDetail() {
  // --- 4. HOOKS & STATES AWAL ---
  const { dict, language } = useLanguage();
  const { role } = useAuth(); 
  
  const params = useParams<{ id: string }>(); 
  const router = useRouter();
  const lang = language as "id" | "en";
  const aquariumId = params?.id || "";
  
  const [aquarium, setAquarium] = useState<Aquarium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false); 
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthAnalysisResult | null>(null);

  // --- 5. SETUP KAMUS (DICTIONARY) ---
  const rootDict = dict as { aquarium?: { detail?: DetailDictionary }, formOptions?: any };
  
  const detailDict: DetailDictionary = rootDict?.aquarium?.detail || {
    back: lang === 'id' ? "Kembali ke Dashboard" : "Back to Dashboard",
    edit: lang === 'id' ? "Edit" : "Edit",
    archive: lang === 'id' ? "Arsipkan" : "Archive",
    restore: lang === 'id' ? "Pulihkan" : "Restore",
    delete: lang === 'id' ? "Hapus Permanen" : "Delete Permanently",
    overview: lang === 'id' ? "Ringkasan" : "Overview",
    parameters: lang === 'id' ? "Parameter Air" : "Water Parameters",
    floraFauna: lang === 'id' ? "Tanaman & Ikan" : "Flora & Fauna",
    aiDiagnose: lang === 'id' ? "Diagnosa AI" : "AI Diagnose",
    equipment: lang === 'id' ? "Peralatan" : "Equipment",
    maintenance: lang === 'id' ? "Perawatan" : "Maintenance",
    dimensions: lang === 'id' ? "Dimensi" : "Dimensions",
  };

  const TABS: TabItem[] = [
    { id: "overview", label: detailDict.overview, icon: LayoutDashboard },
    { id: "parameters", label: detailDict.parameters, icon: Activity },
    { id: "flora", label: detailDict.floraFauna, icon: Leaf },
    { id: "ai", label: detailDict.aiDiagnose, icon: ShieldAlert },
  ];

  // --- 6. FUNGSI PEMETAAN (TRANSLATOR NILAI DATABASE) ---
  // Ini digunakan untuk mengubah nilai mentah ('medium', 'hard', dll) menjadi teks kamus
  const getParamText = (val: string | null | undefined) => {
    if (!val) return "-";
    const lower = val.toLowerCase();
    if (lower === 'low') return rootDict?.formOptions?.paramLow || val;
    if (lower === 'medium') return rootDict?.formOptions?.paramMed || val;
    if (lower === 'high') return rootDict?.formOptions?.paramHigh || val;
    return val;
  };

  const getDifficultyText = (val: string | null | undefined) => {
    if (!val) return "-";
    const lower = val.toLowerCase();
    if (lower === 'easy') return rootDict?.formOptions?.diffEasy || val;
    if (lower === 'medium') return rootDict?.formOptions?.diffMedium || val;
    if (lower === 'hard') return rootDict?.formOptions?.diffHard || val;
    return val;
  };

  const getPlacementText = (val: string | null | undefined) => {
    if (!val) return "-";
    const lower = val.toLowerCase();
    if (lower === 'foreground') return rootDict?.formOptions?.placeFore || val;
    if (lower === 'midground') return rootDict?.formOptions?.placeMid || val;
    if (lower === 'background') return rootDict?.formOptions?.placeBack || val;
    if (lower === 'floating') return rootDict?.formOptions?.placeFloat || val;
    if (lower === 'epiphyte') return rootDict?.formOptions?.placeEpi || val;
    return val;
  };

  // --- 7. LOAD DATA (EFFECT) ---
  useEffect(() => {
    async function fetchAllData() {
      if (!aquariumId) return;
      try {
        const aqRes = await getAquariumByIdAction(aquariumId);
        if (!aqRes.success || !aqRes.data) throw new Error(aqRes.error || "Akuarium tidak ditemukan.");
        setAquarium(aqRes.data);

        const [paramRes, invRes] = await Promise.all([
          getParametersAction(aquariumId),
          getTankInventoryAction(aquariumId)
        ]);

        const result = analyzeAquariumHealth({
          aquarium: aqRes.data,
          parameters: paramRes.success ? (paramRes.data as AquariumParameterLog[]) : [],
          plants: invRes.success ? (invRes.plants as TankPlant[]) : [],
          fishes: invRes.success ? (invRes.fishes as TankFish[]) : [],
        });
        
        setHealthResult(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    }

    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (["overview", "parameters", "flora", "ai"].includes(hash)) setActiveTab(hash);
    }
    fetchAllData();
  }, [aquariumId]);

  // --- 8. FUNGSI HANDLERS ---
  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  };

  const handleArchiveToggle = async () => {
    if (!aquarium) return;
    setLoading(true);
    const newStatus = !aquarium.is_active;
    const res = await updateAquariumAction(aquariumId, { is_active: newStatus });
    if (res.success) {
      toast.success(newStatus ? "Akuarium dipulihkan." : "Akuarium diarsipkan.");
      setAquarium({ ...aquarium, is_active: newStatus });
      setShowArchiveModal(false);
    } else {
      toast.error(res.error || "Gagal.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteAquariumAction(aquariumId);
    if (res.success) {
      toast.success("Akuarium dihapus.");
      router.push("/dashboard/my-aquarium");
    } else {
      toast.error(res.error || "Gagal.");
      setLoading(false);
    }
  };

  // --- 9. HELPERS WARNA ---
  const getHealthColor = (status: string) => {
    switch (status) {
      case "Excellent": return "text-emerald-500";
      case "Good": return "text-blue-500";
      case "Warning": return "text-amber-500";
      case "Critical": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case "Excellent": return "bg-emerald-500";
      case "Good": return "bg-blue-500";
      case "Warning": return "bg-amber-500";
      case "Critical": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  const getHealthBorder = (status: string) => {
    switch (status) {
      case "Excellent": return "border-emerald-500";
      case "Good": return "border-blue-500";
      case "Warning": return "border-amber-500";
      case "Critical": return "border-red-500";
      default: return "border-slate-500";
    }
  };

  // --- 10. RENDER TAMPILAN ---
  if (loading && !aquarium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Memuat Mesin Pakar...</p>
      </div>
    );
  }

  if (error || !aquarium) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 bg-red-50 rounded-3xl border border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error 404</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard/my-aquarium")} variant="outline">Kembali</Button>
      </div>
    );
  }

  const isArchived = aquarium.is_active === false;
  const tankAge = calculateTankAge(aquarium.setup_date, {} as AquariumDictionary, lang);
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);

  return (
    <div className="w-full pb-24 animate-in fade-in duration-700">
      
      {/* --- BAGIAN: TOP STATIC NAVIGATION --- */}
      <div className="w-full bg-transparent px-4 sm:px-8 pt-4 pb-2 max-w-[1400px] mx-auto">
        <Button 
          onClick={() => router.push("/dashboard/my-aquarium")}
          variant="ghost" 
          className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 pl-2 pr-4 font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> {detailDict.back}
        </Button>
      </div>

      {/* --- BAGIAN: HERO HEADER (BENTO STYLE) --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="relative w-full min-h-[40vh] flex flex-col bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
          {aquarium.image_url && !imgError ? (
            <Image src={aquarium.image_url} alt={aquarium.name} fill className={`object-cover transition-all duration-1000 ${isArchived ? 'opacity-30 grayscale' : 'opacity-60'}`} onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${isArchived ? 'from-slate-800 to-slate-950' : 'from-teal-900 via-slate-900 to-slate-950'} opacity-90`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

          <div className="relative z-10 mt-auto p-6 sm:p-10 w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {isArchived ? (
                    <span className="inline-flex px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black tracking-widest uppercase rounded-full border border-amber-500/30 backdrop-blur-md items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> ARCHIVED</span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-black tracking-widest uppercase rounded-full border border-teal-500/30 backdrop-blur-md items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> ACTIVE ECOSYSTEM</span>
                  )}
                  {aquarium.is_primary && !isArchived && <span className="inline-flex px-3 py-1 bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg border border-blue-400">PRIMARY TANK</span>}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl tracking-tight">{aquarium.name}</h1>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-slate-300 font-medium">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm"><Container className="w-4 h-4 text-teal-400" /> <span className="text-sm">{tankType}</span></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm"><Droplets className="w-4 h-4 text-blue-400" /> <span className="text-sm">{aquarium.volume_liters} L</span></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button onClick={() => router.push(`/dashboard/my-aquarium/${aquariumId}/edit`)} className="bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 transition-all backdrop-blur-md h-11 px-5 rounded-xl font-bold"><Edit className="w-4 h-4 mr-2" /> {detailDict.edit}</Button>
                <Button onClick={() => setShowArchiveModal(true)} className={`h-11 px-5 rounded-xl font-bold border text-white transition-all backdrop-blur-md ${isArchived ? "bg-emerald-600/80 hover:bg-emerald-500 border-emerald-500/50" : "bg-amber-600/80 hover:bg-amber-500 border-amber-500/50"}`}>{isArchived ? <RefreshCw className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />} {isArchived ? detailDict.restore : detailDict.archive}</Button>
                {role === 'super_admin' && <Button onClick={() => setShowDeleteModal(true)} className="bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50 backdrop-blur-md h-11 px-5 rounded-xl font-bold transition-all"><Trash2 className="w-4 h-4 mr-2" /> {detailDict.delete}</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BAGIAN: MAIN CONTENT TABS --- */}
      <div className="max-w-[1400px] mx-auto p-4 sm:p-8 mt-4 relative z-20">
        
        <div className="flex items-center justify-start sm:justify-between bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6 p-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max w-full">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce' : ''}`} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[40vh]">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* KOTAK: HEALTH SCORE PANEL */}
              {healthResult && (
                <div className={`w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-md border-t-8 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 ${getHealthBorder(healthResult.status)}`}>
                  
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * healthResult.score) / 100} className={`${getHealthColor(healthResult.status)} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-3xl font-black ${getHealthColor(healthResult.status)}`}>{healthResult.score}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className={`p-2 rounded-xl text-white ${getHealthBg(healthResult.status)} shadow-lg`}><HeartPulse className="w-6 h-6" /></div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Ecosystem Health: <span className={getHealthColor(healthResult.status)}>{healthResult.status.toUpperCase()}</span></h3>
                        <p className="text-sm font-medium text-slate-500">Berdasarkan kalkulasi beban biologis dan parameter air terakhir.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> System Alerts</h4>
                        <ul className="space-y-2">
                          {healthResult.alerts.map((alert, i) => (
                            <li key={i} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              {healthResult.status === 'Critical' || alert.includes('Bahaya') ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/> : <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                              {alert}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5" /> Action Required</h4>
                        <ul className="space-y-2">
                          {healthResult.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KOTAK: BENTO GRID STATISTIK BAWAH */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch mt-2">
                
                {/* 1. KOTAK DIMENSI */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md border-t-4 border-slate-400 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col h-full">
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5" /> {detailDict.dimensions} & Age</h3>
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">System Maturity</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{tankAge}</p>
                      <p className="text-xs text-slate-500 mt-1">Est. Setup: {aquarium.setup_date}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Glass Dimensions</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{aquarium.length_cm} × {aquarium.width_cm} × {aquarium.height_cm} cm</p>
                    </div>
                  </div>
                </div>

                {/* 2. KOTAK PERALATAN CONFIG (BILINGUAL) */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md border-t-4 border-indigo-500 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col h-full">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" /> {detailDict.equipment}
                  </h3>
                  <div className="flex flex-col gap-3 flex-1 justify-center">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === 'id' ? "Filtrasi" : "Filtration"}</p>
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{getFilterDesc(aquarium.filter_type, lang)}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === 'id' ? "Pencahayaan" : "Lighting System"}</p>
                      {/* PENGGUNAAN FUNGSI MAPPING AGAR BILINGUAL */}
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{getParamText(aquarium.light_type)}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === 'id' ? "Injeksi CO2" : "CO2 Supply"}</p>
                      {/* PENGGUNAAN FUNGSI MAPPING AGAR BILINGUAL */}
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{getParamText(aquarium.co2_type)}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === 'id' ? "Suhu" : "Thermal Control"}</p>
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{aquarium.heater_enabled ? (lang === 'id' ? "Heater Aktif" : "Heater Active") : (lang === 'id' ? "Tanpa Heater" : "No Heater")}</p>
                    </div>
                  </div>
                </div>

                {/* 3. KOTAK MAINTENANCE (BILINGUAL) */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md border-t-4 border-blue-500 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col h-full">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5" /> {detailDict.maintenance}
                  </h3>
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex-1 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1.5">{lang === 'id' ? "Ganti Air (WC)" : "Water Change"}</p>
                      <p className="font-black text-2xl text-blue-900 dark:text-blue-100">
                        {aquarium.water_change_percent}% 
                        <span className="text-xs font-bold opacity-60 mx-1">{lang === 'id' ? "Tiap" : "Every"}</span> 
                        {aquarium.water_change_interval_days} 
                        <span className="text-xs font-bold opacity-60 ml-1">{lang === 'id' ? "Hari" : "Days"}</span>
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex-1 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1.5">{lang === 'id' ? "Jadwal Pupuk" : "Fertilizer Regimen"}</p>
                      <p className="font-black text-base text-emerald-900 dark:text-emerald-100 leading-tight">
                        {getFertilizerDesc(aquarium.fertilizer_type, lang)}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --- BAGIAN: TAB LAINNYA --- */}
          {activeTab === "parameters" && <div className="animate-in slide-in-from-right-4 duration-500"><ParameterTab aquariumId={aquariumId} /></div>}
          {activeTab === "flora" && <div className="animate-in slide-in-from-right-4 duration-500"><InventoryTab aquariumId={aquariumId} /></div>}
          {activeTab === "ai" && (
            <div className="flex flex-col items-center justify-center p-16 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200 dark:border-teal-900/50 animate-in zoom-in-95 duration-500">
               <ShieldAlert className="w-16 h-16 text-teal-500/50 mb-5" />
               <h4 className="text-lg font-black text-teal-800 dark:text-teal-200">AI Deep Diagnosis</h4>
               <p className="text-sm text-teal-600/70 dark:text-teal-400/70 mt-2 text-center max-w-sm">AI akan menganalisis tren parameter air Anda selama 30 hari terakhir untuk memberikan saran pencegahan alga dan penyakit.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- BAGIAN: MODAL ARSIP & HAPUS --- */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-t-8 ${isArchived ? 'border-emerald-500' : 'border-amber-500'}`}>
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-2">{isArchived ? (lang === 'id' ? "Pulihkan?" : "Restore?") : (lang === 'id' ? "Arsipkan?" : "Archive?")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {isArchived ? (lang === 'id' ? "Data akuarium akan kembali aktif di Dashboard utama." : "Aquarium data will be reactivated on the main Dashboard.") : (lang === 'id' ? "Data akan disembunyikan tapi riwayat tetap aman tersimpan." : "Data will be hidden but history remains safely stored.")}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleArchiveToggle} disabled={loading} className={`w-full h-11 rounded-xl font-black uppercase tracking-widest text-white ${isArchived ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"}`}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Action"}</Button>
              <Button variant="ghost" onClick={() => setShowArchiveModal(false)} disabled={loading} className="w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-11 rounded-xl">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-t-8 border-red-600">
            <div className="flex items-center gap-3 mb-3 text-red-600"><ShieldAlert className="h-8 w-8" /><h3 className="text-xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Total" : "Purge Data"}</h3></div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Peringatan: Tindakan ini akan <strong>menghapus permanen</strong> {aquarium.name} beserta seluruh log parameter yang pernah dicatat. Tidak bisa dibatalkan.</p>
                <div className="flex flex-col gap-3">
                    <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 w-full h-11 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "YA, HAPUS SEKARANG" : "YES, DELETE NOW")}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={loading} className="w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-11 rounded-xl font-bold">
                        {lang === 'id' ? "Batal" : "Cancel"}
                    </Button>
                </div>
          </div>
        </div>
      )}
    </div>
  );
}