// features/aquariums/components/AquariumDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/hooks/useAuth"; // <--- TAMBAHKAN HOOK AUTH
import { getAquariumByIdAction, updateAquariumAction, deleteAquariumAction } from "../actions/aquarium.actions";
import { Aquarium } from "../types/aquarium.types";
import { 
  ArrowLeft, Edit, Archive, Trash2, Container, AlertTriangle, 
  Droplets, Settings2, CalendarDays, Loader2, Info, RefreshCw // <--- TAMBAH ICON REFRESH
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { 
  calculateTankAge, getTankTypeDesc, getSubstrateDesc, 
  getFilterDesc, getLightDesc, getCO2Desc, getFertilizerDesc 
} from "./aquarium-helpers";

export default function AquariumDetail() {
  const { dict, language } = useLanguage();
  const { role } = useAuth(); // <--- MENDAPATKAN ROLE USER
  const params = useParams();
  const router = useRouter();
  const lang = language as "id" | "en";
  const aquariumId = params.id as string;

  const [aquarium, setAquarium] = useState<Aquarium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const safeDict = dict as Record<string, any>;
  const detailDict = safeDict?.aquarium?.detail || {
    back: lang === 'id' ? "Kembali ke Dashboard" : "Back to Dashboard",
    edit: lang === 'id' ? "Edit" : "Edit",
    archive: lang === 'id' ? "Arsipkan" : "Archive",
    restore: lang === 'id' ? "Pulihkan" : "Restore", // <--- TAMBAHAN DICTIONARY
    delete: lang === 'id' ? "Hapus Permanen" : "Delete Permantly",
    overview: lang === 'id' ? "Ringkasan" : "Overview",
    parameters: lang === 'id' ? "Parameter Air" : "Water Parameters",
    floraFauna: lang === 'id' ? "Tanaman & Ikan" : "Flora & Fauna",
    aiDiagnose: lang === 'id' ? "Diagnosa AI" : "AI Diagnose",
    equipment: lang === 'id' ? "Peralatan" : "Equipment",
    maintenance: lang === 'id' ? "Perawatan" : "Maintenance",
    dimensions: lang === 'id' ? "Dimensi" : "Dimensions",
  };

  useEffect(() => {
    async function fetchAquarium() {
      try {
        const res = await getAquariumByIdAction(aquariumId);
        if (res.success && res.data) {
          setAquarium(res.data);
        } else {
          setError(res.error || "Akuarium tidak ditemukan.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (aquariumId) fetchAquarium();
  }, [aquariumId]);

  const handleArchiveToggle = async () => {
    if (!aquarium) return;
    setLoading(true);
    const newStatus = !aquarium.is_active; // Toggle status
    const res = await updateAquariumAction(aquariumId, { is_active: newStatus });
    if (res.success) {
      toast.success(newStatus ? "Akuarium dipulihkan (Aktif)." : "Akuarium diarsipkan.");
      setAquarium({ ...aquarium, is_active: newStatus }); // Update UI tanpa refresh
      setShowArchiveModal(false);
    } else {
      toast.error(res.error || "Gagal mengubah status arsip.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteAquariumAction(aquariumId);
    if (res.success) {
      toast.success("Akuarium dihapus permanen.");
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
        <p className="text-slate-500 font-medium">Memuat data ekosistem...</p>
      </div>
    );
  }

  if (error || !aquarium) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 bg-red-50 rounded-3xl border border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Terjadi Kesalahan</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard/my-aquarium")} variant="outline">
          {detailDict.back}
        </Button>
      </div>
    );
  }

  const tankAge = calculateTankAge(aquarium.setup_date, {}, lang);
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);
  const isArchived = aquarium.is_active === false;

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      
      {/* 1. HERO HEADER */}
      <div className="relative w-full h-[30vh] sm:h-[40vh] bg-slate-900 overflow-hidden">
        {aquarium.image_url ? (
          <Image 
            src={aquarium.image_url} 
            alt={aquarium.name} 
            fill 
            className={`object-cover ${isArchived ? 'opacity-30 grayscale' : 'opacity-60'}`} // Efek abu-abu jika diarsipkan
            unoptimized
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${isArchived ? 'from-amber-900 to-slate-900' : 'from-teal-900 to-slate-900'} opacity-80`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        
        {/* Tombol Back */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 flex gap-2">
          <Button 
            onClick={() => router.push("/dashboard/my-aquarium")}
            variant="outline" 
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {detailDict.back}
          </Button>
        </div>

        {/* Informasi Utama */}
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {isArchived && (
                  <span className="inline-block px-3 py-1 bg-amber-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-1">
                    <Archive className="w-3 h-3" /> DIARSIPKAN
                  </span>
                )}
                {aquarium.is_primary && !isArchived && (
                  <span className="inline-block px-3 py-1 bg-teal-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
                    PRIMARY TANK
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md leading-tight flex items-center gap-3">
                {aquarium.name}
              </h1>
              <p className="text-slate-300 font-medium mt-2 flex items-center gap-2 text-sm sm:text-base">
                <Container className="w-4 h-4" /> {tankType} 
                <span className="opacity-50 text-xl">•</span> 
                {aquarium.volume_liters} Liter
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={() => router.push(`/dashboard/my-aquarium/${aquariumId}/edit`)} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{detailDict.edit}</span>
              </Button>

              {/* Tombol Arsip/Pulihkan */}
              {isArchived ? (
                <Button onClick={handleArchiveToggle} disabled={loading} className="bg-emerald-500/80 hover:bg-emerald-500 text-white border-none backdrop-blur-md">
                  <RefreshCw className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{detailDict.restore}</span>
                </Button>
              ) : (
                <Button onClick={() => setShowArchiveModal(true)} className="bg-amber-500/80 hover:bg-amber-500 text-white border-none backdrop-blur-md">
                  <Archive className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{detailDict.archive}</span>
                </Button>
              )}
              
              {/* TOMBOL DELETE (HANYA UNTUK SUPER ADMIN) */}
              {role === "super_admin" && (
                <Button onClick={() => setShowDeleteModal(true)} className="bg-red-500/80 hover:bg-red-500 text-white border-none backdrop-blur-md">
                  <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{detailDict.delete}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. KONTEN UTAMA */}
      <div className="max-w-6xl mx-auto p-4 sm:p-8 -mt-6 relative z-10">
        
        {/* KERANGKA TAB (Untuk Tahap Berikutnya) */}
        <div className="flex overflow-x-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 p-1">
          <button className="flex-1 min-w-[120px] py-2.5 text-sm font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg transition-colors">
            {detailDict.overview}
          </button>
          <button className="flex-1 min-w-[120px] py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {detailDict.parameters}
          </button>
          <button className="flex-1 min-w-[120px] py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {detailDict.floraFauna}
          </button>
          <button className="flex-1 min-w-[120px] py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {detailDict.aiDiagnose}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Dimensi & Umur */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> {detailDict.dimensions} & Umur
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Umur Sistem</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{tankAge}</p>
                  <p className="text-xs text-slate-500 mt-1">Setup: {aquarium.setup_date}</p>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <div>
                  <p className="text-xs text-slate-400 mb-1">Dimensi (P x L x T)</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                    {aquarium.length_cm} × {aquarium.width_cm} × {aquarium.height_cm} cm
                  </p>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <div>
                  <p className="text-xs text-slate-400 mb-1">Substrat Dasar</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {getSubstrateDesc(aquarium.substrate_type, lang)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Tengah & Kanan: Peralatan & Perawatan */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> {detailDict.equipment}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Filter</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{getFilterDesc(aquarium.filter_type, lang)}</p>
                  {aquarium.filter_capacity_lph && <p className="text-xs text-slate-400 mt-1">{aquarium.filter_capacity_lph} L/H</p>}
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Lampu</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{getLightDesc(aquarium.light_type, lang)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {aquarium.light_wattage ? `${aquarium.light_wattage}W • ` : ''} {aquarium.photoperiod_hours ? `${aquarium.photoperiod_hours} Jam/Hari` : ''}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Sistem CO2</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{getCO2Desc(aquarium.co2_type, lang)}</p>
                  {aquarium.co2_bps && <p className="text-xs text-slate-400 mt-1">{aquarium.co2_bps} BPS</p>}
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Pemanas Air (Heater)</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{aquarium.heater_enabled ? "Gunakan Heater" : "Tanpa Heater"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> {detailDict.maintenance}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1 font-bold uppercase">Ganti Air (Water Change)</p>
                  <p className="font-bold text-blue-900 dark:text-blue-200 text-lg">
                    {aquarium.water_change_percent}% / {aquarium.water_change_interval_days} Hari
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-1 font-bold uppercase">Sistem Pupuk</p>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    {getFertilizerDesc(aquarium.fertilizer_type, lang)}
                  </p>
                  {aquarium.fertilizer_schedule && <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">{aquarium.fertilizer_schedule}</p>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL ARSIP */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-amber-200 dark:border-amber-900/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Arsipkan Akuarium?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Akuarium ini akan disembunyikan dari Tab Aktif, namun semua data riwayat (parameter, tanaman) tetap tersimpan aman.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowArchiveModal(false)} disabled={loading}>Batal</Button>
              <Button onClick={handleArchiveToggle} disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Arsipkan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PERMANEN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-600">Hapus Permanen?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Peringatan: Tindakan ini akan <strong>menghapus total</strong> akuarium ini beserta seluruh log parameter dan data di dalamnya. Gunakan fitur "Arsip" jika ragu.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loading}>Batal</Button>
              <Button onClick={handleDelete} disabled={loading} variant="destructive">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Total"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}