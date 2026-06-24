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
  Stethoscope, Fish, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Tabs & Panels
import ParameterTab from "./ParameterTab";
import InventoryTab from "./InventoryTab"; 
import MaintenanceTab from "./MaintenanceTab"; 
import HealthDashboard from "./health/HealthDashboard"; 
import AIDeepDiagnosisPanel from "./health/AIDeepDiagnosisPanel";
import { AquariumSpecsPanel } from "./AquariumSpecsPanel"; 

import { getParametersAction } from "../actions/parameter.actions";
import { getTankInventoryAction } from "../actions/inventory.actions";
import { getMaintenanceDashboardAction } from "../actions/maintenance.actions";
import type { AquariumParameterLog } from "../types/parameter.types";
import type { TankFish, TankPlant } from "../types/inventory.types";
import { analyzeAquariumHealth, HealthAnalysisResult } from "../utils/health-engine";
import { getTankTypeDesc, AquariumDictionary } from "./aquarium-helpers";

interface DetailDictionary {
  back: string; edit: string; archive: string; restore: string;
  delete: string; overview: string; parameters: string;
  floraFauna: string; aiDiagnose: string; equipment: string;
  maintenance: string; dimensions: string;
}

type TabId = "overview" | "parameters" | "flora" | "maintenance" | "ai";

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
  };

  const TABS = [
    { id: "overview" as TabId, label: detailDict.overview, icon: LayoutDashboard },
    { id: "parameters" as TabId, label: detailDict.parameters, icon: Activity },
    { id: "flora" as TabId, label: detailDict.floraFauna, icon: Leaf },
    { id: "maintenance" as TabId, label: detailDict.maintenance, icon: RefreshCw }, 
    { id: "ai" as TabId, label: detailDict.aiDiagnose, icon: Stethoscope }, 
  ];

  useEffect(() => {
    async function fetchAllData() {
      if (!aquariumId) return;
      try {
        const aqRes = await getAquariumByIdAction(aquariumId);
        if (!aqRes.success || !aqRes.data) throw new Error(aqRes.error || "Akuarium tidak ditemukan.");
        setAquarium(aqRes.data);

        const [paramRes, invRes, maintRes] = await Promise.all([
          getParametersAction(aquariumId),
          getTankInventoryAction(aquariumId),
          getMaintenanceDashboardAction(aquariumId)
        ]);

        const paramData = paramRes.success ? (paramRes.data as AquariumParameterLog[]) : [];
        const plantData = invRes.success ? (invRes.plants as TankPlant[]) : [];
        const fishData = invRes.success ? (invRes.fishes as TankFish[]) : [];
        const maintData = maintRes.success ? maintRes.tasksStatus : [];

        setTotalFishes(fishData.reduce((acc, curr) => acc + curr.quantity, 0));
        setTotalPlants(plantData.reduce((acc, curr) => acc + curr.quantity, 0));

        const result = analyzeAquariumHealth({
          aquarium: aqRes.data,
          parameters: paramData,
          plants: plantData,
          fishes: fishData,
          maintenanceStatus: maintData
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
      if (["overview", "parameters", "flora", "maintenance", "ai"].includes(hash)) setActiveTab(hash);
    }
    fetchAllData();
  }, [aquariumId]);

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
  const bioloadColor = bioloadPercent < 50 ? "text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400" : bioloadPercent < 80 ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      
      {/* HERO NAVIGATION */}
      <div className="w-full bg-transparent px-4 sm:px-6 pt-4 pb-4 max-w-[1400px] mx-auto">
        <Button onClick={handleGoBack} variant="ghost" className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 pl-2 pr-4 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> {detailDict.back}
        </Button>
      </div>

      {/* =========================================
          HERO HEADER (MODERN & ELEGAN)
      ========================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
          
          {/* BAGIAN 1: GAMBAR COVER (100% BEBAS TEKS) */}
          <div className="relative w-full h-48 sm:h-64 md:h-[35vh] bg-slate-100 dark:bg-slate-900 overflow-hidden">
            {aquarium.image_url && !imgError ? (
              <Image 
                src={aquarium.image_url} 
                alt={aquarium.name} 
                fill 
                className={`object-cover transition-all duration-1000 ${isArchived ? 'opacity-50 grayscale' : ''}`} 
                onError={() => setImgError(true)} 
                unoptimized 
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${isArchived ? 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900' : 'from-teal-100 to-blue-50 dark:from-teal-950 dark:to-slate-900'}`} />
            )}
          </div>

          {/* BAGIAN 2: KONTROL PANEL (Teks & Tombol Tergabung Rapi) */}
          <div className="p-5 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
            
            {/* KIRI: Judul, Badges, Spesifikasi yang menyatu */}
            <div className="flex flex-col gap-3.5 w-full lg:w-auto">
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none break-words">
                {aquarium.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                
                {/* Status Badges */}
                {isArchived ? (
                  <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 text-[10px] font-black tracking-widest uppercase rounded-md items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    <Archive className="w-3.5 h-3.5" /> ARCHIVED
                  </span>
                ) : (
                  <span className="inline-flex px-2.5 py-1 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 text-[10px] font-black tracking-widest uppercase rounded-md items-center gap-1.5 border border-teal-200 dark:border-teal-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> ACTIVE
                  </span>
                )}
                
                {aquarium.is_primary && !isArchived && (
                  <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase rounded-md border border-blue-200 dark:border-blue-500/20">
                    PRIMARY TANK
                  </span>
                )}

                {/* Garis Pemisah (Hanya di layar besar) */}
                <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Spesifikasi Tangki (Kecil, Rapi, Menyatu) */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <Container className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 
                  <span className="text-xs font-semibold">{tankType}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                  <span className="text-xs font-semibold">{aquarium.volume_liters} L</span>
                </div>

              </div>
            </div>

            {/* KANAN: Tombol Aksi */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              <Button onClick={() => router.push(`/dashboard/my-aquarium/${aquariumId}/edit`)} variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-xl font-bold bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 shadow-sm transition-all">
                <Edit className="w-4 h-4 sm:mr-2 text-slate-400" /> <span className="hidden sm:inline">{detailDict.edit}</span><span className="sm:hidden">{detailDict.edit}</span>
              </Button>
              
              <Button onClick={() => setShowArchiveModal(true)} variant="outline" className={`flex-1 sm:flex-none h-11 px-5 rounded-xl font-bold shadow-sm transition-all ${isArchived ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20"}`}>
                {isArchived ? <RefreshCw className="w-4 h-4 sm:mr-2" /> : <Archive className="w-4 h-4 sm:mr-2" />} 
                <span className="hidden sm:inline">{isArchived ? detailDict.restore : detailDict.archive}</span><span className="sm:hidden">{isArchived ? detailDict.restore : detailDict.archive}</span>
              </Button>
              
              {isSuperAdmin && (
                <Button onClick={() => setShowDeleteModal(true)} variant="outline" className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/20 shadow-sm transition-all mt-1 sm:mt-0">
                  <Trash2 className="w-4 h-4 mr-2" /> {detailDict.delete}
                </Button>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6 relative z-20">
        <div className="flex items-center justify-start sm:justify-between bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 p-1.5 overflow-x-auto custom-scrollbar">
          <div className="flex gap-1 min-w-max w-full">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center justify-center gap-2 flex-1 min-w-[130px] px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-teal-600"}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce' : ''}`} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[40vh]">
          
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* GRID RINGKASAN YANG LEBIH BERSIH & MODERN */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                
                <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-2xl text-blue-600 dark:text-blue-400 mb-3 shrink-0">
                    <Fish className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">{lang === 'id' ? "Total Ikan" : "Fish Stock"}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {totalFishes} <span className="text-xs font-bold text-slate-500">{lang === 'id' ? "Ekor" : "pcs"}</span>
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-3 shrink-0">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">{lang === 'id' ? "Total Flora" : "Plants"}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                    {totalPlants} <span className="text-xs font-bold text-slate-500">{lang === 'id' ? "Porsi" : "pts"}</span>
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
                  <div className="bg-cyan-50 dark:bg-cyan-500/10 p-3 rounded-2xl text-cyan-600 dark:text-cyan-400 mb-3 shrink-0">
                    <Container className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">{lang === 'id' ? "Volume Air" : "Capacity"}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{aquarium.volume_liters} <span className="text-xs font-bold text-slate-500">L</span></p>
                </div>
                
                <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
                  <div className={`p-3 rounded-2xl mb-3 shrink-0 ${bioloadColor}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">{lang === 'id' ? "Beban Ekologi" : "Bioload"}</p>
                  <p className={`text-xl sm:text-2xl font-black leading-none ${bioloadPercent > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {bioloadPercent}%
                  </p>
                </div>
              </div>

              {/* KOMPONEN MODULAR HEALTH DASHBOARD */}
              {healthResult && (
                <HealthDashboard healthResult={healthResult} lang={lang} />
              )}

              {/* KOMPONEN MODULAR SPECS PANEL */}
              <div className="mt-2">
                <AquariumSpecsPanel aquarium={aquarium} lang={lang} />
              </div>

            </div>
          )}

          {activeTab === "parameters" && <div className="animate-in slide-in-from-right-4 duration-500"><ParameterTab aquariumId={aquariumId} /></div>}
          {activeTab === "flora" && <div className="animate-in slide-in-from-right-4 duration-500"><InventoryTab aquariumId={aquariumId} /></div>}
          {activeTab === "maintenance" && <div className="animate-in slide-in-from-right-4 duration-500"><MaintenanceTab aquariumId={aquariumId} /></div>}
          
          {activeTab === "ai" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <AIDeepDiagnosisPanel aquariumId={aquariumId} lang={lang} />
            </div>
          )}

        </div>
      </div>

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