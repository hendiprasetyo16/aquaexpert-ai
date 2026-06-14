// features/aquariums/components/InventoryTab.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Loader2, Leaf, Fish as FishIcon, AlertTriangle, Search } from "lucide-react";
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
    loadInventory();
    loadMasterData();
  }, [aquariumId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return toast.error(lang === 'id' ? "Pilih spesies terlebih dahulu!" : "Please select a species!");
    
    setSubmitting(true);
    let res;

    if (showAddModal === "fish") {
      res = await addFishToTankAction({
        aquarium_id: aquariumId,
        fish_id: selectedItemId,
        quantity: quantity
      });
    } else {
      res = await addPlantToTankAction({
        aquarium_id: aquariumId,
        plant_id: selectedItemId,
        quantity: quantity
      });
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

  const handleRemove = async (table: "aquarium_fishes" | "aquarium_plants", id: string) => {
    if (!confirm(lang === 'id' ? "Hapus dari akuarium?" : "Remove from aquarium?")) return;
    const res = await removeInventoryItemAction(table, id, aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Terhapus." : "Removed.");
      loadInventory();
    }
  };

  // Filter Dropdown Master List berdasarkan Search Query
  const filteredMasterFishes = masterFishes.filter(f => 
    f.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || f.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredMasterPlants = masterPlants.filter(p => 
    p.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-8">
      
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
          <Button onClick={() => setShowAddModal("fish")} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Ikan" : "Add Fish"}
          </Button>
        </div>

        {fishes.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
            {lang === 'id' ? "Belum ada ikan di akuarium ini." : "No fishes in this aquarium yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fishes.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-blue-300 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                  {item.fish?.image_url ? (
                    <img src={item.fish.image_url} alt="fish" className="w-full h-full object-cover" />
                  ) : <FishIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 opacity-50" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{lang === 'id' ? item.fish?.name_id : item.fish?.name_en}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-black">{item.quantity} {lang === 'id' ? "Ekor" : "pcs"}</p>
                </div>
                <button onClick={() => handleRemove("aquarium_fishes", item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
          <Button onClick={() => setShowAddModal("plant")} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Tanaman" : "Add Plant"}
          </Button>
        </div>

        {plants.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
            {lang === 'id' ? "Belum ada tanaman di akuarium ini." : "No plants in this aquarium yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-emerald-300 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                  {item.plant?.image_url ? (
                    <img src={item.plant.image_url} alt="plant" className="w-full h-full object-cover" />
                  ) : <Leaf className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 opacity-50" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{lang === 'id' ? item.plant?.name_id : item.plant?.name_en}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black">{item.quantity} {lang === 'id' ? "Porsi/Rumpun" : "Portions"}</p>
                </div>
                <button onClick={() => handleRemove("aquarium_plants", item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH FLORA/FAUNA ELEGAN */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${showAddModal === 'fish' ? 'border-blue-500' : 'border-emerald-500'}`}>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
              {showAddModal === 'fish' ? (lang === 'id' ? "Tambah Fauna" : "Add Fauna") : (lang === 'id' ? "Tambah Flora" : "Add Flora")}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {lang === 'id' ? "Cari spesies dari database dan tentukan jumlahnya." : "Search database and set quantity."}
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-5">
              
              {/* Kolom Pencarian Cepat (Membantu memilih di Dropdown) */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={lang === 'id' ? "Ketik nama untuk mencari cepat..." : "Type to filter..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-teal-500 font-medium"
                />
              </div>

              {/* Dropdown Spesies Utama */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Pilih Spesies" : "Select Species"} *</label>
                <div className="relative">
                  <select 
                    required 
                    value={selectedItemId} 
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-teal-500 font-bold appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{lang === 'id' ? "-- Silakan Pilih --" : "-- Please Select --"}</option>
                    {showAddModal === 'fish' 
                      ? filteredMasterFishes.map(f => <option key={f.id} value={f.id}>{lang === 'id' ? f.name_id : f.name_en}</option>)
                      : filteredMasterPlants.map(p => <option key={p.id} value={p.id}>{lang === 'id' ? p.name_id : p.name_en}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{lang === 'id' ? "Jumlah (Ekor/Porsi)" : "Quantity"} *</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-teal-500 font-black text-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(null)} className="flex-1 h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800">
                  {lang === 'id' ? "Batal" : "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting} className={`flex-1 h-12 rounded-xl text-white font-black uppercase tracking-wider shadow-lg ${showAddModal === 'fish' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? "Simpan" : "Save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}