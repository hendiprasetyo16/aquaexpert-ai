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
  TankFish, 
  TankPlant 
} from "../actions/inventory.actions";
import { Plus, Trash2, Loader2, Leaf, Fish as FishIcon, Search, CheckCircle2, AlertTriangle } from "lucide-react";
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

export default function InventoryTab({ aquariumId }: InventoryTabProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  // State untuk memastikan komponen sudah termuat di sisi Client (syarat createPortal)
  const [mounted, setMounted] = useState(false);

  // Data State
  const [fishes, setFishes] = useState<TankFish[]>([]);
  const [plants, setPlants] = useState<TankPlant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Master Data untuk Dropdown Form
  const [masterFishes, setMasterFishes] = useState<MasterItem[]>([]);
  const [masterPlants, setMasterPlants] = useState<MasterItem[]>([]);

  // Form UI State
  const [showAddModal, setShowAddModal] = useState<"fish" | "plant" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete UI State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, table: "aquarium_fishes" | "aquarium_plants", name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Input Form
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return toast.error(lang === 'id' ? "Pilih spesies dari daftar terlebih dahulu!" : "Please select a species from the list!");
    
    setSubmitting(true);
    let res;

    if (showAddModal === "fish") {
      res = await addFishToTankAction({ aquarium_id: aquariumId, fish_id: selectedItemId, quantity });
    } else {
      res = await addPlantToTankAction({ aquarium_id: aquariumId, plant_id: selectedItemId, quantity });
    }

    if (res?.success) {
      toast.success(lang === 'id' ? "Berhasil ditambahkan!" : "Successfully added!");
      setShowAddModal(null);
      setSelectedItemId("");
      setQuantity(1);
      setSearchQuery("");
      loadInventory();
    } else {
      toast.error(res?.error || "Gagal menambahkan data.");
    }
    setSubmitting(false);
  };

  const triggerDelete = (table: "aquarium_fishes" | "aquarium_plants", id: string, name: string) => {
    setDeleteTarget({ table, id, name });
  };

  const executeRemove = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    
    const res = await removeInventoryItemAction(deleteTarget.table, deleteTarget.id, aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Berhasil dihapus." : "Successfully removed.");
      loadInventory();
    } else {
      toast.error(lang === 'id' ? "Gagal menghapus." : "Failed to remove.");
    }
    
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  // ==========================================
  // PENCARIAN & PENGURUTAN ABJAD (BILINGUAL)
  // ==========================================
  const filteredMasterFishes = masterFishes
    .filter(f => f.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || f.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const nameA = lang === 'id' ? a.name_id : a.name_en;
      const nameB = lang === 'id' ? b.name_id : b.name_en;
      return nameA.localeCompare(nameB); // Mengurutkan dari A ke Z
    });

  const filteredMasterPlants = masterPlants
    .filter(p => p.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const nameA = lang === 'id' ? a.name_id : a.name_en;
      const nameB = lang === 'id' ? b.name_id : b.name_en;
      return nameA.localeCompare(nameB); // Mengurutkan dari A ke Z
    });

  const currentList = showAddModal === 'fish' ? filteredMasterFishes : filteredMasterPlants;
  const isFish = showAddModal === 'fish';

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SECTION IKAN (FAUNA) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
              <FishIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Fauna / Ikan</h3>
              <p className="text-sm font-medium text-slate-500">Total: {fishes.reduce((acc, curr) => acc + curr.quantity, 0)} {lang === 'id' ? "Ekor" : "Fishes"}</p>
            </div>
          </div>
          <Button onClick={() => { setShowAddModal("fish"); setSelectedItemId(""); setSearchQuery(""); setQuantity(1); }} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 h-11 px-5">
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
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden pl-5">
                
                {/* NOMOR INDEKS */}
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500" />
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-br-lg shadow-sm z-10">
                  {idx + 1}
                </div>

                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border-2 border-transparent group-hover:border-blue-200 ml-1">
                  {item.fish?.image_url ? (
                    <img src={item.fish.image_url} alt="fish" className="w-full h-full object-cover" />
                  ) : <FishIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{fishName}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-black mt-0.5 bg-blue-50 dark:bg-blue-900/30 inline-block px-2 py-0.5 rounded-md">{item.quantity} {lang === 'id' ? "Ekor" : "pcs"}</p>
                </div>
                <button 
                  onClick={() => triggerDelete("aquarium_fishes", item.id, fishName)} 
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                  title={lang === 'id' ? "Hapus" : "Delete"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* SECTION TANAMAN (FLORA) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Flora / Tanaman</h3>
              <p className="text-sm font-medium text-slate-500">Total: {plants.reduce((acc, curr) => acc + curr.quantity, 0)} {lang === 'id' ? "Porsi" : "Portions"}</p>
            </div>
          </div>
          <Button onClick={() => { setShowAddModal("plant"); setSelectedItemId(""); setSearchQuery(""); setQuantity(1); }} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 h-11 px-5">
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
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden pl-5">
                
                {/* NOMOR INDEKS */}
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-br-lg shadow-sm z-10">
                  {idx + 1}
                </div>

                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border-2 border-transparent group-hover:border-emerald-200 ml-1">
                  {item.plant?.image_url ? (
                    <img src={item.plant.image_url} alt="plant" className="w-full h-full object-cover" />
                  ) : <Leaf className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{plantName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black mt-0.5 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded-md">{item.quantity} {lang === 'id' ? "Porsi/Rumpun" : "Portions"}</p>
                </div>
                <button 
                  onClick={() => triggerDelete("aquarium_plants", item.id, plantName)} 
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                  title={lang === 'id' ? "Hapus" : "Delete"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* ========================================================
          1. MODAL TAMBAH INVENTORY (VISUAL PICKER)
      ======================================================== */}
      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl border-t-8 overflow-hidden ${isFish ? 'border-blue-500' : 'border-emerald-500'}`}>
            
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                {isFish ? (lang === 'id' ? "Pilih Fauna (Ikan)" : "Select Fauna") : (lang === 'id' ? "Pilih Flora (Tanaman)" : "Select Flora")}
              </h3>
              
              <div className="relative mt-4">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={lang === 'id' ? "Cari nama atau jenis..." : "Search by name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 outline-none font-semibold transition-colors bg-slate-50 dark:bg-slate-950 ${isFish ? 'border-blue-100 focus:border-blue-500 dark:border-blue-900/50' : 'border-emerald-100 focus:border-emerald-500 dark:border-emerald-900/50'}`}
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {currentList.length === 0 ? (
                <div className="text-center p-10 text-slate-400 font-medium">
                  {lang === 'id' ? "Spesies tidak ditemukan." : "Species not found."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {currentList.map((item, idx) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`relative cursor-pointer rounded-2xl border-2 p-3 flex flex-col items-center gap-3 transition-all duration-200 bg-white dark:bg-slate-900 group ${
                          isSelected 
                            ? (isFish ? "border-blue-500 ring-4 ring-blue-500/20" : "border-emerald-500 ring-4 ring-emerald-500/20") 
                            : "border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600"
                        }`}
                      >
                        {/* INDEKS LIST (SESUAI URUTAN ABJAD SEKARANG) */}
                        <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-400">
                          {idx + 1}
                        </div>
                        
                        {isSelected && (
                          <div className={`absolute top-2 right-2 rounded-full ${isFish ? 'text-blue-500' : 'text-emerald-500'}`}>
                            <CheckCircle2 className="w-5 h-5 fill-white dark:fill-slate-900" />
                          </div>
                        )}

                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 relative transition-transform ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}>
                           {item.image_url ? (
                            <img src={item.image_url} alt="species" className="w-full h-full object-cover" />
                           ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              {isFish ? <FishIcon className="w-8 h-8 text-slate-300" /> : <Leaf className="w-8 h-8 text-slate-300" />}
                            </div>
                           )}
                        </div>
                        
                        <p className={`text-xs sm:text-sm text-center font-bold line-clamp-2 leading-tight ${isSelected ? (isFish ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400') : 'text-slate-700 dark:text-slate-300'}`}>
                          {lang === 'id' ? item.name_id : item.name_en}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Jumlah" : "Quantity"}</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className={`w-full h-12 px-4 rounded-xl border-2 outline-none font-black text-lg bg-slate-50 dark:bg-slate-950 ${isFish ? 'border-blue-100 focus:border-blue-500' : 'border-emerald-100 focus:border-emerald-500'}`}
                  />
                </div>
                
                <div className="flex w-full sm:w-2/3 gap-3 mt-4 sm:mt-0 sm:pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(null)} className="flex-1 h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                    {lang === 'id' ? "Batal" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedItemId} className={`flex-1 h-12 rounded-xl text-white font-black uppercase tracking-wider shadow-lg ${isFish ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? "Simpan" : "Save")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          2. MODAL KONFIRMASI HAPUS
      ======================================================== */}
      {mounted && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600">
            <div className="flex items-center gap-3 mb-5 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Item?" : "Remove Item?"}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {lang === 'id' 
                ? <>Anda yakin ingin menghapus <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.name}</strong> dari akuarium ini?</>
                : <>Are you sure you want to remove <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.name}</strong> from this aquarium?</>
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={executeRemove} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "YA, HAPUS" : "YES, REMOVE")}
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