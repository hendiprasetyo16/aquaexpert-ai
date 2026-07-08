// features/aquariums/components/AquariumDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { getAquariumByIdAction, updateAquariumAction, deleteAquariumAction } from "../actions/aquarium.actions";
import { Aquarium } from "../types/aquarium.types";
import { 
  ArrowLeft, Edit, Archive, Trash2, Container, AlertTriangle, 
  Droplets, RefreshCw, LayoutDashboard, Activity, Leaf, ShieldAlert,
  Stethoscope, Fish, Loader2, HeartPulse, Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import ParameterTab from "./ParameterTab";
import InventoryTab from "./InventoryTab"; 
import MaintenanceTab from "./MaintenanceTab"; 
import TreatmentTab from "./TreatmentTab"; 
import HealthDashboard from "./health/HealthDashboard"; 
import AIDeepDiagnosisPanel from "./health/AIDeepDiagnosisPanel";
import { AquariumSpecsPanel } from "./AquariumSpecsPanel"; 

import { getParametersAction } from "../actions/parameter.actions";
import { getTankInventoryAction } from "../actions/inventory.actions";
import { getMaintenanceDashboardAction } from "../actions/maintenance.actions";
import { getActiveTreatmentsAction } from "@/features/diseases/actions/start-treatment.actions";

import type { AquariumParameterLog } from "../types/parameter.types";
import type { TankFish, TankPlant } from "../types/inventory.types";
import { analyzeAquariumHealth, HealthAnalysisResult } from "../utils/health-engine";
import { getTankTypeDesc } from "./aquarium-helpers";

interface DetailDictionary {
  back: string; edit: string; archive: string; restore: string;
  delete: string; overview: string; parameters: string;
  floraFauna: string; aiDiagnose: string; equipment: string;
  maintenance: string; dimensions: string;
  treatment: string; 
}

type TabId = "overview" | "parameters" | "flora" | "maintenance" | "treatment" | "ai";

export default function AquariumDetail() {
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
  const [totalFishes, setTotalFishes] = useState(0);
  const [totalPlants, setTotalPlants] = useState(0);

  const rootDict = dict as { aquarium?: { detail?: DetailDictionary }, formOptions?: Record<string, string> };
  const isSuperAdmin = role === 'super_admin';

  const detailDict: DetailDictionary = rootDict?.aquarium?.detail || {
    back: lang === 'id' ? "Kembali" : "Go Back",
    edit: lang === 'id' ? "Edit" : "Edit",
    archive: lang === 'id' ? "Arsipkan" : "Archive",
    restore: lang === 'id' ? "Pulihkan" : "Restore",
    delete: lang === 'id' ? "Hapus Permanen" : "Delete Permanently",
    overview: lang === 'id' ? "Ringkasan" : "Overview",
    parameters: lang === 'id' ? "Parameter Air" : "Water Parameters",
    floraFauna: lang === 'id' ? "Tanaman & Ikan" : "Flora & Fauna",
    aiDiagnose: lang === 'id' ? "Diagnosa AI" : "AI Diagnosis", 
    equipment: lang === 'id' ? "Peralatan" : "Equipment",
    maintenance: lang === 'id' ? "Perawatan" : "Maintenance",
    dimensions: lang === 'id' ? "Dimensi" : "Dimensions",
    treatment: lang === 'id' ? "Pengobatan" : "Treatment",
  };

  const TABS = [
    { id: "overview" as TabId, label: detailDict.overview, icon: LayoutDashboard },
    { id: "parameters" as TabId, label: detailDict.parameters, icon: Activity },
    { id: "flora" as TabId, label: detailDict.floraFauna, icon: Leaf },
    { id: "maintenance" as TabId, label: detailDict.maintenance, icon: RefreshCw }, 
    { id: "treatment" as TabId, label: detailDict.treatment, icon: HeartPulse }, 
    { id: "ai" as TabId, label: detailDict.aiDiagnose, icon: Stethoscope }, 
  ];

  useEffect(() => {
    async function fetchAllData() {
      if (!aquariumId) return;
      try {
        const aqRes = await getAquariumByIdAction(aquariumId);
        if (!aqRes.success || !aqRes.data) throw new Error(aqRes.error || "Akuarium tidak ditemukan.");
        setAquarium(aqRes.data);

        const [paramRes, invRes, maintRes, treatRes] = await Promise.all([
          getParametersAction(aquariumId),
          getTankInventoryAction(aquariumId),
          getMaintenanceDashboardAction(aquariumId),
          getActiveTreatmentsAction(aquariumId)
        ]);

        const paramData = paramRes.success ? (paramRes.data as AquariumParameterLog[]) : [];
        const plantData = invRes.success ? (invRes.plants as TankPlant[]) : [];
        const fishData = invRes.success ? (invRes.fishes as TankFish[]) : [];
        const maintData = maintRes.success ? maintRes.tasksStatus : [];
        const treatData = treatRes.success ? treatRes.data : [];

        setTotalFishes(fishData.reduce((acc, curr) => acc + curr.quantity, 0));
        setTotalPlants(plantData.reduce((acc, curr) => acc + curr.quantity, 0));

        const result = analyzeAquariumHealth({
          aquarium: aqRes.data,
          parameters: paramData,
          plants: plantData,
          fishes: fishData,
          maintenanceStatus: maintData,
          activeTreatments: treatData,
          lang: lang 
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
      if (["overview", "parameters", "flora", "maintenance", "treatment", "ai"].includes(hash)) setActiveTab(hash);
    }
    fetchAllData();
  }, [aquariumId, lang]);

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/dashboard/my-aquarium");
    }
  };

  const handleArchiveToggle = async () => {
    if (!aquarium) return;
    setLoading(true);
    const newStatus = !aquarium.is_active;
    const res = await updateAquariumAction(aquariumId, { is_active: newStatus });
    if (res.success) {
      toast.success(newStatus ? (lang === 'id' ? "Akuarium dipulihkan." : "Aquarium restored.") : (lang === 'id' ? "Akuarium diarsipkan." : "Aquarium archived."));
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
      toast.success(lang === 'id' ? "Akuarium dihapus." : "Aquarium deleted.");
      handleGoBack(); 
    } else {
      toast.error(res.error || "Gagal.");
      setLoading(false);
    }
  };

  if (loading && !aquarium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">{lang === 'id' ? "Memuat Ekosistem..." : "Loading Ecosystem..."}</p>
      </div>
    );
  }

  if (error || !aquarium) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 bg-red-50 rounded-3xl border border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error 404</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={handleGoBack} variant="outline">{detailDict.back}</Button>
      </div>
    );
  }

  const isArchived = aquarium.is_active === false;
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);

  const bioloadPercent = healthResult ? Math.max(0, 100 - healthResult.scores.bioload) : 0;
  const bioloadColor = bioloadPercent < 50 ? "text-teal-500 bg-teal-50 dark:bg-teal-900/30" : bioloadPercent < 80 ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" : "text-rose-500 bg-rose-50 dark:bg-rose-900/30";

  return (
    <div className="w-full pb-24 animate-in fade-in duration-700 transition-colors">
      
      {/* HERO NAVIGATION */}
      <div className="w-full bg-transparent px-4 sm:px-8 pt-4 pb-2 max-w-[1400px] mx-auto">
        <Button onClick={handleGoBack} variant="ghost" className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 pl-2 pr-4 font-bold">
          <ArrowLeft className="w-5 h-5 mr-2" /> {detailDict.back}
        </Button>
      </div>

      {/* HERO HEADER */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="relative w-full min-h-[45vh] sm:min-h-[50vh] flex flex-col bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
          {aquarium.image_url && !imgError ? (
            <Image 
              src={aquarium.image_url} 
              alt={aquarium.name} 
              fill 
              className={`object-cover transition-all duration-1000 ${isArchived ? 'opacity-40 grayscale' : 'opacity-80'}`} 
              onError={() => setImgError(true)} 
              unoptimized 
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${isArchived ? 'from-slate-800 to-slate-950' : 'from-teal-900 via-slate-900 to-slate-950'} opacity-90`} />
          )}

          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950/70 to-transparent pointer-events-none z-0" />
          <div className="absolute bottom-0 inset-x-0 h-1/2 sm:h-2/5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-0" />

          <div className="absolute top-5 sm:top-8 left-5 sm:left-8 flex flex-wrap gap-2 z-20">
            {isArchived ? (
              <span className="inline-flex px-3 py-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-widest uppercase rounded-full border border-amber-500/30 backdrop-blur-md items-center gap-1.5 shadow-lg">
                <Archive className="w-3.5 h-3.5" /> ARCHIVED
              </span>
            ) : (
              <span className="inline-flex px-3 py-1.5 bg-teal-500/20 text-teal-300 text-[10px] font-black tracking-widest uppercase rounded-full border border-teal-500/30 backdrop-blur-md items-center gap-1.5 shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> ACTIVE ECOSYSTEM
              </span>
            )}
            {aquarium.is_primary && !isArchived && (
              <span className="inline-flex px-3 py-1.5 bg-blue-500/80 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg border border-blue-400/50 backdrop-blur-md">
                PRIMARY TANK
              </span>
            )}
          </div>

          <div className="relative z-20 mt-auto p-5 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 w-full pointer-events-none">
            <div className="space-y-3 w-full lg:w-auto flex-1 flex flex-col pointer-events-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-xl tracking-tight break-words">
                {aquarium.name}
              </h1>
              
              {/* 💡 FIX: Tampilan 2 Baris Sesuai Desain Bapak */}
              <div className="flex flex-col gap-y-2 mt-1">
                {/* Baris 1: Tipe Akuarium (Penuh) */}
                <div className="flex flex-wrap items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md shadow-sm shrink-0">
                    <Container className="w-4 h-4 text-teal-300 shrink-0" /> 
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">{tankType}</span>
                  </div>
                </div>
                
                {/* Baris 2: Dimensi Berdampingan dengan Volume Air */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md shadow-sm shrink-0">
                    <Maximize className="w-4 h-4 text-indigo-300 shrink-0" /> 
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">{aquarium.length_cm}x{aquarium.width_cm}x{aquarium.height_cm} cm</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md shadow-sm shrink-0">
                    <Droplets className="w-4 h-4 text-blue-300 shrink-0" /> 
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">{aquarium.volume_liters} L</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0 pointer-events-auto">
              <Button onClick={() => router.push(`/dashboard/my-aquarium/${aquariumId}/edit`)} className="flex-1 lg:flex-none bg-slate-900/60 hover:bg-white text-white hover:text-slate-900 border border-white/20 transition-all backdrop-blur-md h-11 sm:h-12 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-sm min-w-fit">
                <Edit className="w-4 h-4 mr-2 shrink-0" /> {detailDict.edit}
              </Button>
              <Button onClick={() => setShowArchiveModal(true)} className={`flex-1 lg:flex-none h-11 sm:h-12 px-5 rounded-xl font-bold border transition-all backdrop-blur-md text-xs sm:text-sm min-w-fit shadow-sm ${isArchived ? "bg-emerald-600/40 text-emerald-300 hover:bg-emerald-500 hover:text-white border-emerald-500/50" : "bg-amber-600/40 text-amber-300 hover:bg-amber-500 hover:text-white border-amber-500/50"}`}>
                {isArchived ? <RefreshCw className="w-4 h-4 mr-2 shrink-0" /> : <Archive className="w-4 h-4 mr-2 shrink-0" />} 
                {isArchived ? detailDict.restore : detailDict.archive}
              </Button>
              {isSuperAdmin && (
                <Button onClick={() => setShowDeleteModal(true)} className="w-full lg:w-auto bg-red-600/40 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 backdrop-blur-md h-11 sm:h-12 px-5 rounded-xl font-bold transition-all text-xs sm:text-sm shadow-sm mt-1 lg:mt-0">
                  <Trash2 className="w-4 h-4 mr-2 shrink-0" /> {detailDict.delete}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="max-w-[1400px] mx-auto p-4 sm:p-8 mt-4 relative z-20">
        <div className="flex items-center justify-start bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6 p-2 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 min-w-max w-full">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center justify-center gap-2 flex-1 min-w-[130px] px-3 sm:px-4 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce' : ''}`} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[40vh]">
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 sm:p-3 rounded-full text-blue-600 dark:text-blue-400 mb-2 shrink-0">
                    <Fish className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">{lang === 'id' ? "Total Ikan" : "Fish Stock"}</p>
                  <p className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {totalFishes} <span className="text-xs font-semibold text-slate-500">{lang === 'id' ? "Ekor" : "pcs"}</span>
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 sm:p-3 rounded-full text-emerald-600 dark:text-emerald-400 mb-2 shrink-0">
                    <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">{lang === 'id' ? "Total Flora" : "Plants"}</p>
                  <p className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {totalPlants} <span className="text-xs font-semibold text-slate-500">{lang === 'id' ? "Porsi" : "pts"}</span>
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="bg-cyan-50 dark:bg-cyan-900/30 p-2 sm:p-3 rounded-full text-cyan-600 dark:text-cyan-400 mb-2 shrink-0">
                    <Container className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">{lang === 'id' ? "Kapasitas & Ukuran" : "Capacity & Size"}</p>
                  <p className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{aquarium.volume_liters} L</p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-none">
                    {aquarium.length_cm} <span className="text-[8px] mx-0.5">X</span> {aquarium.width_cm} <span className="text-[8px] mx-0.5">X</span> {aquarium.height_cm} cm
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className={`p-2 sm:p-3 rounded-full mb-2 shrink-0 ${bioloadColor}`}>
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">{lang === 'id' ? "Beban Ekologi" : "Bioload"}</p>
                  <p className={`text-base sm:text-xl font-black leading-none ${bioloadPercent > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {bioloadPercent}%
                  </p>
                </div>
              </div>
              
              {healthResult && <HealthDashboard healthResult={healthResult} lang={lang} />}
              
              <div className="mt-2">
                <AquariumSpecsPanel aquarium={aquarium} lang={lang} />
              </div>
            </div>
          )}

          {activeTab === "parameters" && <div className="animate-in slide-in-from-right-4 duration-500"><ParameterTab aquariumId={aquariumId} /></div>}
          {activeTab === "flora" && <div className="animate-in slide-in-from-right-4 duration-500"><InventoryTab aquariumId={aquariumId} /></div>}
          {activeTab === "maintenance" && <div className="animate-in slide-in-from-right-4 duration-500"><MaintenanceTab aquariumId={aquariumId} /></div>}
          
          {activeTab === "treatment" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <TreatmentTab aquariumId={aquariumId} />
            </div>
          )}
          
          {activeTab === "ai" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <AIDeepDiagnosisPanel aquariumId={aquariumId} lang={lang} />
            </div>
          )}
        </div>
      </div>

      {/* MODAL ARCHIVE */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${isArchived ? 'border-emerald-500' : 'border-amber-500'}`}>
            <div className={`flex items-center gap-3 mb-5 ${isArchived ? 'text-emerald-500' : 'text-amber-500'}`}>
              <RefreshCw className="w-8 h-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{isArchived ? (lang === 'id' ? "Pulihkan?" : "Restore?") : (lang === 'id' ? "Arsipkan?" : "Archive?")}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {isArchived ? (lang === 'id' ? "Data akuarium akan kembali aktif di Dashboard utama." : "Aquarium data will be reactivated on the main Dashboard.") : (lang === 'id' ? "Data akan disembunyikan tapi riwayat tetap aman tersimpan." : "Data will be hidden but history remains safely stored.")}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleArchiveToggle} disabled={loading} className={`w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg text-white transition-colors ${isArchived ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"}`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "KONFIRMASI" : "CONFIRM ACTION")}
              </Button>
              <Button variant="ghost" onClick={() => setShowArchiveModal(false)} disabled={loading} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600">
            <div className="flex items-center gap-3 mb-5 text-red-600">
              <ShieldAlert className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Total" : "Purge Data"}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {lang === 'id' ? "Peringatan: Tindakan ini akan " : "Warning: This action will "} <strong className="text-red-500">{lang === 'id' ? "menghapus permanen" : "permanently delete"}</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{aquarium?.name}</span> {lang === 'id' ? "beserta seluruh log yang pernah dicatat. Tidak bisa dibatalkan." : "along with all recorded logs. Cannot be undone."}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "YA, HAPUS SEKARANG" : "YES, DELETE NOW")}
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={loading} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}