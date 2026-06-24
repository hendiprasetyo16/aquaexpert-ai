// features/aquariums/components/InventoryTab.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

import { 
  getTankInventoryAction, 
  addFishToTankAction, 
  addPlantToTankAction, 
  removeInventoryItemAction,
  updateFishInventoryAction 
} from "../actions/inventory.actions";
import type { TankFish, TankPlant } from "../types/inventory.types"; 

import { Plus, Trash2, Loader2, Leaf, Fish as FishIcon, Search, CheckCircle2, AlertTriangle, Edit2, ShieldAlert, HeartPulse, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface MasterItem {
  id: string;
  name_id: string;
  name_en: string;
  image_url: string | null;
}

interface InventoryTabProps {
  aquariumId: string;
}

type HealthType = "Healthy" | "Sick" | "Quarantined";
type SizeType = "Juvenile" | "Adult";

export default function InventoryTab({ aquariumId }: InventoryTabProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [mounted, setMounted] = useState(false);

  const [fishes, setFishes] = useState<TankFish[]>([]);
  const [plants, setPlants] = useState<TankPlant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [masterFishes, setMasterFishes] = useState<MasterItem[]>([]);
  const [masterPlants, setMasterPlants] = useState<MasterItem[]>([]);

  const [showAddModal, setShowAddModal] = useState<"fish" | "plant" | null>(null);
  const [showEditFishModal, setShowEditFishModal] = useState<TankFish | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, table: "aquarium_fishes" | "aquarium_plants", name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [healthStatus, setHealthStatus] = useState<HealthType>("Healthy");
  const [sizeCategory, setSizeCategory] = useState<SizeType>("Adult");
  const [addedAt, setAddedAt] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadInventory = async () => {
    setLoading(true);
    const res = await getTankInventoryAction(aquariumId);
    if (res.success) {
      setFishes(res.fishes || []);
      setPlants(res.plants || []);
    }
    setLoading(false);
  };

  const loadMasterData = async () => {
    const supabase = createClient();
    const [fishRes, plantRes] = await Promise.all([
      supabase.from("fishes").select("id, name_id, name_en, image_url").eq("is_active", true),
      supabase.from("plants").select("id, name_id, name_en, image_url").eq("is_active", true)
    ]);
    if (fishRes.data) setMasterFishes(fishRes.data as MasterItem[]);
    if (plantRes.data) setMasterPlants(plantRes.data as MasterItem[]);
  };

  useEffect(() => {
    setMounted(true);
    loadInventory();
    loadMasterData();
  }, [aquariumId]);

  const resetForm = () => {
    setShowAddModal(null);
    setShowEditFishModal(null);
    setSelectedItemId("");
    setQuantity(1);
    setSearchQuery("");
    setHealthStatus("Healthy");
    setSizeCategory("Adult");
    setAddedAt(new Date().toISOString().split('T')[0]);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return toast.error(lang === 'id' ? "Pilih spesies dari daftar terlebih dahulu!" : "Please select a species from the list!");
    
    setSubmitting(true);
    let res;

    if (showAddModal === "fish") {
      res = await addFishToTankAction({ 
        aquarium_id: aquariumId, fish_id: selectedItemId, quantity, 
        health_status: healthStatus, size_category: sizeCategory,
        added_at: addedAt
      });
    } else {
      res = await addPlantToTankAction({ aquarium_id: aquariumId, plant_id: selectedItemId, quantity, added_at: addedAt });
    }

    if (res?.success) {
      toast.success(lang === 'id' ? "Berhasil ditambahkan!" : "Successfully added!");
      resetForm();
      loadInventory();
    } else {
      toast.error(res?.error || (lang === 'id' ? "Gagal menambahkan data." : "Failed to add data."));
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditFishModal) return;
    
    setSubmitting(true);
    const res = await updateFishInventoryAction(showEditFishModal.id, aquariumId, {
      quantity, health_status: healthStatus, size_category: sizeCategory, added_at: addedAt
    });

    if (res?.success) {
      toast.success(lang === 'id' ? "Status diperbarui!" : "Status updated!");
      resetForm();
      loadInventory();
    } else {
      toast.error(res?.error || (lang === 'id' ? "Gagal memperbarui data." : "Failed to update data."));
    }
    setSubmitting(false);
  };

  const triggerDelete = (table: "aquarium_fishes" | "aquarium_plants", id: string, name: string) => { setDeleteTarget({ table, id, name }); };
  const executeRemove = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await removeInventoryItemAction(deleteTarget.table, deleteTarget.id, aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Berhasil dihapus." : "Successfully removed.");
      loadInventory();
    } else { toast.error(lang === 'id' ? "Gagal menghapus." : "Failed to remove."); }
    setIsDeleting(false); setDeleteTarget(null);
  };

  const getHealthBadge = (status: string | null | undefined) => {
    if (status === "Sick") return <span className="flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase"><ShieldAlert className="w-3 h-3"/> {lang === 'id' ? "Sakit" : "Sick"}</span>;
    if (status === "Quarantined") return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase"><AlertTriangle className="w-3 h-3"/> {lang === 'id' ? "Karantina" : "Quarantine"}</span>;
    return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase"><HeartPulse className="w-3 h-3"/> {lang === 'id' ? "Sehat" : "Healthy"}</span>;
  };

  const formatAddedDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredMasterFishes = masterFishes.filter(f => f.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || f.name_en.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => { const nameA = lang === 'id' ? a.name_id : a.name_en; const nameB = lang === 'id' ? b.name_id : b.name_en; return nameA.localeCompare(nameB); });
  const filteredMasterPlants = masterPlants.filter(p => p.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name_en.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => { const nameA = lang === 'id' ? a.name_id : a.name_en; const nameB = lang === 'id' ? b.name_id : b.name_en; return nameA.localeCompare(nameB); });

  const currentList = showAddModal === 'fish' ? filteredMasterFishes : filteredMasterPlants;
  const isFish = showAddModal === 'fish';

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SECTION IKAN (FAUNA) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
              <FishIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{lang === 'id' ? "Fauna / Ikan" : "Fauna / Fishes"}</h3>
              <p className="text-sm font-medium text-slate-500">Total: {fishes.reduce((acc, curr) => acc + curr.quantity, 0)} {lang === 'id' ? "Ekor" : "pcs"}</p>
            </div>
          </div>
          <Button onClick={() => { setShowAddModal("fish"); setSelectedItemId(""); setSearchQuery(""); setQuantity(1); setAddedAt(new Date().toISOString().split('T')[0]); }} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 h-11 px-5">
            <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Ikan" : "Add Fish"}
          </Button>
        </div>

        {fishes.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 font-medium">
            {lang === 'id' ? "Belum ada ikan di akuarium ini." : "No fishes in this aquarium yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fishes.map((item, idx) => {
              const fishName = lang === 'id' ? item.fish?.name_id || "" : item.fish?.name_en || "";
              return (
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden pl-4 sm:pl-5">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500" />
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-br-lg shadow-sm z-10">
                  {idx + 1}
                </div>

                <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border-2 border-transparent group-hover:border-blue-200 ml-1">
                  {item.fish?.image_url ? (
                    <img src={item.fish.image_url} alt="fish" className="w-full h-full object-cover" />
                  ) : <FishIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{fishName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">{item.quantity} {lang === 'id' ? "Ekor" : "pcs"}</span>
                    {getHealthBadge(item.health_status)}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[9px] font-semibold text-slate-400">
                    <Calendar className="w-2.5 h-2.5" /> {lang === 'id' ? "Masuk:" : "Added:"} {formatAddedDate(item.added_at)}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button 
                    onClick={() => {
                      setShowEditFishModal(item);
                      setQuantity(item.quantity);
                      setHealthStatus((item.health_status as HealthType) || "Healthy");
                      setSizeCategory((item.size_category as SizeType) || "Adult");
                      setAddedAt(item.added_at ? new Date(item.added_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                    }} 
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200" title={lang === 'id' ? "Edit" : "Edit"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => triggerDelete("aquarium_fishes", item.id, fishName)} 
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200" title={lang === 'id' ? "Hapus" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* SECTION TANAMAN (FLORA) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{lang === 'id' ? "Flora / Tanaman" : "Flora / Plants"}</h3>
              <p className="text-sm font-medium text-slate-500">Total: {plants.reduce((acc, curr) => acc + curr.quantity, 0)} {lang === 'id' ? "Porsi" : "Portions"}</p>
            </div>
          </div>
          <Button onClick={() => { setShowAddModal("plant"); setSelectedItemId(""); setSearchQuery(""); setQuantity(1); setAddedAt(new Date().toISOString().split('T')[0]); }} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 h-11 px-5">
            <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Tanaman" : "Add Plant"}
          </Button>
        </div>

        {plants.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 font-medium">
            {lang === 'id' ? "Belum ada tanaman di akuarium ini." : "No plants in this aquarium yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map((item, idx) => {
              const plantName = lang === 'id' ? item.plant?.name_id || "" : item.plant?.name_en || "";
              return (
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden pl-4 sm:pl-5">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-br-lg shadow-sm z-10">{idx + 1}</div>

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border-2 border-transparent group-hover:border-emerald-200 ml-1">
                  {item.plant?.image_url ? ( <img src={item.plant.image_url} alt="plant" className="w-full h-full object-cover" /> ) : <Leaf className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{plantName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black mt-0.5 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded-md mb-1">{item.quantity} {lang === 'id' ? "Porsi" : "Portions"}</p>
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                    <Calendar className="w-2.5 h-2.5" /> {lang === 'id' ? "Tanam:" : "Planted:"} {formatAddedDate(item.added_at)}
                  </div>
                </div>
                <button onClick={() => triggerDelete("aquarium_plants", item.id, plantName)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200" title={lang === 'id' ? "Hapus" : "Delete"}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: TAMBAH DATA (VISUAL PICKER)
      ======================================================== */}
      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={resetForm}>
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl border-t-8 overflow-hidden ${isFish ? 'border-blue-500' : 'border-emerald-500'}`} onClick={e => e.stopPropagation()}>
            
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-start sm:items-center justify-between gap-4">
              <div className="w-full">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {isFish ? (lang === 'id' ? "Pilih Fauna (Ikan)" : "Select Fauna") : (lang === 'id' ? "Pilih Flora (Tanaman)" : "Select Flora")}
                </h3>
                <div className="relative mt-2">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder={lang === 'id' ? "Cari nama spesies..." : "Search species..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full h-11 sm:h-12 pl-12 pr-4 rounded-xl border-2 outline-none font-semibold transition-colors bg-slate-50 dark:bg-slate-950 ${isFish ? 'border-blue-100 focus:border-blue-500' : 'border-emerald-100 focus:border-emerald-500'}`} />
                </div>
              </div>
              <button onClick={resetForm} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              {currentList.length === 0 ? (
                <div className="text-center p-10 text-slate-400 font-medium">{lang === 'id' ? "Spesies tidak ditemukan." : "Species not found."}</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {currentList.map((item, idx) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div key={item.id} onClick={() => setSelectedItemId(item.id)} className={`relative cursor-pointer rounded-2xl border-2 p-2 sm:p-3 flex flex-col items-center gap-2.5 transition-all duration-200 bg-white dark:bg-slate-900 group ${isSelected ? (isFish ? "border-blue-500 bg-blue-50/30" : "border-emerald-500 bg-emerald-50/30") : "border-slate-100 hover:border-slate-300 dark:border-slate-800"}`}>
                        <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm text-[9px] font-black text-slate-500 z-10">{idx + 1}</div>
                        {isSelected && (<div className={`absolute top-2 right-2 rounded-full bg-white dark:bg-slate-900 z-10 ${isFish ? 'text-blue-500' : 'text-emerald-500'}`}><CheckCircle2 className="w-5 h-5" /></div>)}
                        
                        {/* FIX MOBILE FLICKER: Menggunakan ukuran pixel absolut agar tidak layout-thrashing di HP */}
                        <div className={`${isFish ? 'w-full aspect-[4/3] rounded-xl' : 'w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto'} overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform duration-300 ${isSelected ? 'scale-95' : 'group-hover:scale-95'}`}>
                           {item.image_url ? ( 
                             <img src={item.image_url} alt="species" className="w-full h-full object-cover" /> 
                           ) : ( 
                             isFish ? <FishIcon className="w-8 h-8 text-slate-300" /> : <Leaf className="w-8 h-8 text-slate-300" /> 
                           )}
                        </div>
                        
                        <div className="flex-1 flex items-start justify-center w-full px-1">
                          <p className={`text-[11px] sm:text-xs text-center font-bold leading-snug line-clamp-2 ${isSelected ? (isFish ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400') : 'text-slate-700 dark:text-slate-300'}`}>
                            {lang === 'id' ? item.name_id : item.name_en}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 sm:p-5 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex flex-col gap-3">
                <div className={`grid grid-cols-2 ${isFish ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-3`}>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Jumlah" : "Qty"}</label>
                    <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={`w-full h-11 px-3 rounded-lg border-2 outline-none font-black text-base bg-slate-50 dark:bg-slate-950 ${isFish ? 'border-blue-100 focus:border-blue-500' : 'border-emerald-100 focus:border-emerald-500'}`} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Tgl Masuk" : "Date Added"}</label>
                    <input required type="date" value={addedAt} onChange={(e) => setAddedAt(e.target.value)} className={`w-full h-11 px-2.5 rounded-lg border-2 outline-none font-bold text-xs bg-slate-50 dark:bg-slate-950 ${isFish ? 'border-blue-100 focus:border-blue-500' : 'border-emerald-100 focus:border-emerald-500'}`} />
                  </div>

                  {isFish && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Kesehatan" : "Health"}</label>
                        <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value as HealthType)} className="w-full h-11 px-2.5 rounded-lg border-2 outline-none font-bold text-xs bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500 cursor-pointer">
                          <option value="Healthy">{lang === 'id' ? "Sehat" : "Healthy"}</option>
                          <option value="Sick">{lang === 'id' ? "Sakit" : "Sick"}</option>
                          <option value="Quarantined">{lang === 'id' ? "Karantina" : "Quarantine"}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Ukuran" : "Size"}</label>
                        <select value={sizeCategory} onChange={(e) => setSizeCategory(e.target.value as SizeType)} className="w-full h-11 px-2.5 rounded-lg border-2 outline-none font-bold text-xs bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500 cursor-pointer">
                          <option value="Juvenile">{lang === 'id' ? "Anakan" : "Juvenile"}</option>
                          <option value="Adult">{lang === 'id' ? "Dewasa" : "Adult"}</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" onClick={resetForm} className="flex-1 h-11 rounded-lg text-slate-500 font-bold uppercase bg-slate-100 hover:bg-slate-200 dark:bg-slate-800">{lang === 'id' ? "Batal" : "Cancel"}</Button>
                  <Button type="submit" disabled={submitting || !selectedItemId} className={`flex-1 h-11 rounded-lg text-white font-black uppercase tracking-wider shadow-lg ${isFish ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "Simpan" : "Save")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: EDIT IKAN (STATUS KESEHATAN)
      ======================================================== */}
      {mounted && showEditFishModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={resetForm}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border-t-8 border-blue-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{lang === 'id' ? "Update Status Ikan" : "Update Fish Status"}</h3>
              <button onClick={resetForm} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-full transition-colors"><X className="w-4 h-4"/></button>
            </div>

            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white">
                {showEditFishModal.fish?.image_url ? <img src={showEditFishModal.fish.image_url} alt="fish" className="w-full h-full object-cover" /> : <FishIcon className="w-full h-full p-2 text-slate-300" />}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none">{lang === 'id' ? showEditFishModal.fish?.name_id : showEditFishModal.fish?.name_en}</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Kesehatan Terkini" : "Current Health"}</label>
                  <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value as HealthType)} className="w-full h-11 px-3 rounded-lg border-2 outline-none font-bold text-sm bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500 cursor-pointer">
                    <option value="Healthy">{lang === 'id' ? "Sehat" : "Healthy"}</option>
                    <option value="Sick">{lang === 'id' ? "Sakit" : "Sick"}</option>
                    <option value="Quarantined">{lang === 'id' ? "Karantina" : "Quarantine"}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Ukuran" : "Size"}</label>
                  <select value={sizeCategory} onChange={(e) => setSizeCategory(e.target.value as SizeType)} className="w-full h-11 px-3 rounded-lg border-2 outline-none font-bold text-sm bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500 cursor-pointer">
                    <option value="Juvenile">{lang === 'id' ? "Anakan" : "Juvenile"}</option>
                    <option value="Adult">{lang === 'id' ? "Dewasa" : "Adult"}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Jumlah" : "Qty"}</label>
                  <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full h-11 px-3 rounded-lg border-2 outline-none font-black text-base bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Tgl Masuk" : "Date Added"}</label>
                  <input required type="date" value={addedAt} onChange={(e) => setAddedAt(e.target.value)} className="w-full h-11 px-3 rounded-lg border-2 outline-none font-bold text-xs bg-slate-50 dark:bg-slate-950 border-blue-100 focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <Button type="button" variant="ghost" onClick={resetForm} className="flex-1 h-11 rounded-lg text-slate-500 font-bold uppercase bg-slate-100 hover:bg-slate-200">{lang === 'id' ? "Batal" : "Cancel"}</Button>
                <Button type="submit" disabled={submitting} className="flex-1 h-11 rounded-lg text-white font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "Perbarui" : "Update")}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS
      ======================================================== */}
      {mounted && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-800 dark:text-slate-100">
              {lang === 'id' ? "Hapus Data?" : "Delete Data?"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {lang === 'id' 
                ? <>Anda yakin ingin menghapus <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.name}</strong> dari akuarium ini?</>
                : <>Are you sure you want to remove <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.name}</strong> from this aquarium?</>
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={executeRemove} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS" : "YES, REMOVE")}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}