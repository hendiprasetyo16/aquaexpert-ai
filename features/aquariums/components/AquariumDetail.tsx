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
  Droplets, Settings2, CalendarDays, Loader2, RefreshCw, 
  LayoutDashboard, Activity, Leaf, ShieldAlert, Fish
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// IMPORT TAB PARAMETER
import ParameterTab from "./ParameterTab";

import { 
  calculateTankAge, getTankTypeDesc, getSubstrateDesc, 
  getFilterDesc, getLightDesc, getCO2Desc, getFertilizerDesc,
  AquariumDictionary
} from "./aquarium-helpers";

// DEFINE INTERFACE UNTUK DICTIONARY AGAR TIDAK PAKAI 'ANY'
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

// DEFINE TIPE UNTUK ID TAB AGAR TYPE-SAFE
type TabId = "overview" | "parameters" | "flora" | "ai";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

export default function AquariumDetail() {
  const { dict, language } = useLanguage();
  const { role } = useAuth(); 
  
  // useParams di Client Component mengembalikan string secara langsung
  const params = useParams<{ id: string }>(); 
  const router = useRouter();
  const lang = language as "id" | "en";
  
  const aquariumId = params?.id || "";
  
  const [aquarium, setAquarium] = useState<Aquarium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false); 
  
  // State untuk Tab (Type-Safe)
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // State untuk Modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // STRICT TYPING DICTIONARY (100% BEBAS ANY)
  const rootDict = dict as { aquarium?: { detail?: DetailDictionary } };
  const detailDict: DetailDictionary = rootDict?.aquarium?.detail || {
    back: lang === 'id' ? "Kembali" : "Back",
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

  // DAFTAR TAB INTERAKTIF
  const TABS: TabItem[] = [
    { id: "overview", label: detailDict.overview, icon: LayoutDashboard },
    { id: "parameters", label: detailDict.parameters, icon: Activity },
    { id: "flora", label: detailDict.floraFauna, icon: Leaf },
    { id: "ai", label: detailDict.aiDiagnose, icon: ShieldAlert },
  ];

  useEffect(() => {
    async function fetchAquarium() {
      if (!aquariumId) return;
      try {
        const res = await getAquariumByIdAction(aquariumId);
        if (res.success && res.data) {
          setAquarium(res.data);
        } else {
          setError(res.error || "Akuarium tidak ditemukan.");
        }
      } catch (err: unknown) {
        // Bebas any: Menggunakan instanceof Error
        setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
      } finally {
        setLoading(false);
      }
    }
    fetchAquarium();
  }, [aquariumId]);

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
      toast.error(res.error || "Gagal mengubah status.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteAquariumAction(aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Akuarium dihapus." : "Aquarium deleted.");
      router.push("/dashboard/my-aquarium");
    } else {
      toast.error(res.error || "Gagal menghapus.");
      setLoading(false);
    }
  };

  if (loading && !aquarium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Ecosystem Data...</p>
      </div>
    );
  }

  if (error || !aquarium) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 bg-red-50 rounded-3xl border border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error 404</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard/my-aquarium")} variant="outline">
          {detailDict.back}
        </Button>
      </div>
    );
  }

  const isArchived = aquarium.is_active === false;
  const tankAge = calculateTankAge(aquarium.setup_date, {} as AquariumDictionary, lang);
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);

  return (
    <div className="w-full pb-24 animate-in fade-in duration-700">
      
      {/* 1. HERO HEADER - PREMIUM DESIGN */}
      <div className="relative w-full min-h-[45vh] flex flex-col bg-slate-900 overflow-hidden">
        {aquarium.image_url && !imgError ? (
          <Image 
            src={aquarium.image_url} 
            alt={aquarium.name} 
            fill 
            className={`object-cover transition-all duration-1000 ${isArchived ? 'opacity-30 grayscale' : 'opacity-60'}`}
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${isArchived ? 'from-slate-800 to-slate-950' : 'from-teal-900 via-slate-900 to-slate-950'} opacity-90`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
        
        {/* Tombol Back */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
          <Button 
            onClick={() => router.push("/dashboard/my-aquarium")}
            variant="outline" 
            className="bg-slate-950/50 hover:bg-teal-600 text-white border-white/10 hover:border-teal-400 backdrop-blur-md transition-all shadow-xl rounded-full"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{detailDict.back}</span>
          </Button>
        </div>

        {/* Info & Action Buttons */}
        <div className="relative z-10 mt-auto p-6 sm:p-12 pt-24 w-full max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {isArchived ? (
                  <span className="inline-flex px-4 py-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-black tracking-widest uppercase rounded-full border border-amber-500/30 backdrop-blur-md items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5" /> {lang === 'id' ? "DATA DIARSIPKAN" : "DATA ARCHIVED"}
                  </span>
                ) : (
                  <span className="inline-flex px-4 py-1.5 bg-teal-500/20 text-teal-400 text-[10px] font-black tracking-widest uppercase rounded-full border border-teal-500/30 backdrop-blur-md items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> {lang === 'id' ? "EKOSISTEM AKTIF" : "ACTIVE ECOSYSTEM"}
                  </span>
                )}
                {aquarium.is_primary && !isArchived && (
                  <span className="inline-flex px-4 py-1.5 bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg border border-blue-400">
                    PRIMARY TANK
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black text-white drop-shadow-2xl tracking-tight">
                {aquarium.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-slate-300 font-medium">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <Container className="w-4 h-4 text-teal-400" /> 
                  <span className="text-sm sm:text-base">{tankType}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <Droplets className="w-4 h-4 text-blue-400" /> 
                  <span className="text-sm sm:text-base">{aquarium.volume_liters} L</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button 
                onClick={() => router.push(`/dashboard/my-aquarium/${aquariumId}/edit`)} 
                className="bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 transition-all backdrop-blur-md h-11 px-6 rounded-xl font-bold"
              >
                <Edit className="w-4 h-4 mr-2" /> {detailDict.edit}
              </Button>

              <Button 
                onClick={() => setShowArchiveModal(true)} 
                className={`h-11 px-6 rounded-xl font-bold border transition-all backdrop-blur-md ${
                  isArchived 
                  ? "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/30" 
                  : "bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white border-amber-500/30"
                }`}
              >
                {isArchived ? <RefreshCw className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />} 
                {isArchived ? detailDict.restore : detailDict.archive}
              </Button>
              
              {role === 'super_admin' && (
                <Button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 backdrop-blur-md h-11 px-6 rounded-xl font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> {detailDict.delete}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT - MODERN TAB SYSTEM */}
      <div className="max-w-[1400px] mx-auto p-4 sm:p-8 -mt-10 relative z-20">
        
        {/* TAB NAVBAR */}
        <div className="flex items-center justify-start sm:justify-between bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-8 p-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max w-full">
            {TABS.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-3 text-sm font-black rounded-xl transition-all duration-300 ${
                  activeTab === tab.id 
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT RENDERER */}
        <div className="min-h-[40vh]">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Kolom Kiri: Dimensi (WARNA TEAL) */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border-l-8 border-teal-500 border-y border-r border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> {detailDict.dimensions} & Age
                </h3>
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">System Maturity</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{tankAge}</p>
                    <p className="text-xs text-slate-500 mt-1">Est. Setup: {aquarium.setup_date}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Glass Dimensions</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {aquarium.length_cm} <span className="text-slate-400 mx-1">×</span> {aquarium.width_cm} <span className="text-slate-400 mx-1">×</span> {aquarium.height_cm} <span className="text-xs text-slate-400 ml-1">cm</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Substrate Foundation</p>
                    <p className="font-black text-slate-700 dark:text-slate-300">
                      {getSubstrateDesc(aquarium.substrate_type, lang)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Tengah: Equipment (WARNA INDIGO) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border-l-8 border-indigo-500 border-y border-r border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" /> {detailDict.equipment} Configuration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Filtration</p>
                      <p className="font-black text-lg text-slate-800 dark:text-slate-100">{getFilterDesc(aquarium.filter_type, lang)}</p>
                      {aquarium.filter_capacity_lph && <p className="text-xs font-bold text-indigo-500 mt-1 bg-indigo-500/10 inline-block px-2 py-0.5 rounded-md">{aquarium.filter_capacity_lph} L/H Pump</p>}
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Lighting System</p>
                      <p className="font-black text-lg text-slate-800 dark:text-slate-100">{getLightDesc(aquarium.light_type, lang)}</p>
                      <div className="flex gap-2 mt-1">
                        {aquarium.light_wattage && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md">{aquarium.light_wattage} Watt</span>}
                        {aquarium.photoperiod_hours && <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md">{aquarium.photoperiod_hours} Hrs/Day</span>}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">CO2 Supply</p>
                      <p className="font-black text-lg text-slate-800 dark:text-slate-100">{getCO2Desc(aquarium.co2_type, lang)}</p>
                      {aquarium.co2_bps && <p className="text-xs font-bold text-emerald-500 mt-1">{aquarium.co2_bps} Bubbles per Second</p>}
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-colors">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Thermal Control</p>
                      <p className="font-black text-lg text-slate-800 dark:text-slate-100">{aquarium.heater_enabled ? "Heater Active" : "No Heater"}</p>
                    </div>
                  </div>
                </div>

                {/* Baris Bawah: Maintenance (WARNA BLUE) */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border-l-8 border-blue-500 border-y border-r border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Droplets className="w-5 h-5" /> {detailDict.maintenance} Routine
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2">Water Change Frequency</p>
                      <p className="font-black text-2xl text-blue-900 dark:text-blue-100">
                        {aquarium.water_change_percent}% <span className="text-sm font-bold opacity-60">Every</span> {aquarium.water_change_interval_days} <span className="text-sm font-bold opacity-60">Days</span>
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2">Fertilizer Regimen</p>
                      <p className="font-black text-lg text-emerald-900 dark:text-emerald-100">
                        {getFertilizerDesc(aquarium.fertilizer_type, lang)}
                      </p>
                      {aquarium.fertilizer_schedule && <p className="text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70 mt-2 bg-white/50 dark:bg-black/20 p-2 rounded-lg italic">"{aquarium.fertilizer_schedule}"</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PARAMETER AIR */}
          {activeTab === "parameters" && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <ParameterTab aquariumId={aquariumId} />
            </div>
          )}

          {/* TAB: FLORA FAUNA */}
          {activeTab === "flora" && (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
               <div className="flex gap-4 mb-6 text-slate-200">
                  <Leaf className="w-16 h-16" />
                  <Fish className="w-16 h-16" />
               </div>
               <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">Flora & Fauna Inventory</h4>
               <p className="text-slate-500 mt-2">Segera hadir: Kelola daftar tanaman dan ikan Anda untuk simulasi beban biologis.</p>
            </div>
          )}

          {/* TAB: AI DIAGNOSIS */}
          {activeTab === "ai" && (
            <div className="flex flex-col items-center justify-center p-20 bg-teal-50/30 dark:bg-teal-950/10 rounded-3xl border-2 border-dashed border-teal-200 dark:border-teal-900/50 animate-in zoom-in-95 duration-500">
               <ShieldAlert className="w-20 h-20 text-teal-500/40 mb-6" />
               <h4 className="text-xl font-black text-teal-800 dark:text-teal-200">AI Deep Diagnosis</h4>
               <p className="text-teal-600/70 dark:text-teal-400/70 mt-2 text-center max-w-md">AI akan menganalisis tren parameter air Anda selama 30 hari terakhir untuk memberikan saran pencegahan alga dan penyakit.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ARSIP / RESTORE */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${isArchived ? 'border-emerald-500' : 'border-amber-500'}`}>
            <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-2">
              {isArchived ? (lang === 'id' ? "Pulihkan?" : "Restore?") : (lang === 'id' ? "Arsipkan?" : "Archive?")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {isArchived 
                ? (lang === 'id' ? "Data akuarium akan kembali aktif di Dashboard utama." : "Aquarium data will be reactivated on the main Dashboard.")
                : (lang === 'id' ? "Data akan disembunyikan tapi riwayat tetap aman tersimpan." : "Data will be hidden but history remains safely stored.")
              }
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleArchiveToggle} disabled={loading} className={`w-full h-12 rounded-xl font-black uppercase tracking-widest ${isArchived ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Action"}
              </Button>
              <Button variant="ghost" onClick={() => setShowArchiveModal(false)} disabled={loading} className="w-full text-slate-400">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PERMANEN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <ShieldAlert className="h-10 w-10" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Total" : "Purge Data"}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Peringatan: Tindakan ini akan <strong>menghapus permanen</strong> {aquarium.name} beserta seluruh log parameter yang pernah dicatat. Tidak bisa dibatalkan.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleDelete} disabled={loading} variant="destructive" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "YES, PURGE EVERYTHING"}
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={loading} className="w-full text-slate-400">Abort</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}