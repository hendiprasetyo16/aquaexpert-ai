// app/(dashboard)/dashboard/inventory/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Loader2, Syringe, Droplets, Fish, Wrench, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { getUserInventoryAction, deleteInventoryItemAction, InventoryItemDto } from "@/features/inventory/actions/inventory.actions";
import AddInventoryModal from "@/features/inventory/components/AddInventoryModal";

export default function InventoryPage() {
  const { language } = useLanguage();
  const lang = language as "id" | "en";
  
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItemDto | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<InventoryItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    const res = await getUserInventoryAction();
    if (res.success && res.data) {
      setItems(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItemDto) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const res = await deleteInventoryItemAction(itemToDelete.id);
    if (res.success) {
      toast.success(lang === 'id' ? "Barang berhasil dihapus!" : "Item deleted successfully!");
      fetchInventory();
    } else {
      toast.error(lang === 'id' ? "Gagal menghapus barang." : "Failed to delete item.");
    }
    setIsDeleting(false);
    setItemToDelete(null);
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (category: string) => {
    switch(category) {
      case 'medication': return <Syringe className="w-5 h-5 text-rose-500" />;
      case 'water_care': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'food': return <Fish className="w-5 h-5 text-amber-500" />;
      default: return <Wrench className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'medication': return "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400";
      case 'water_care': return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400";
      case 'food': return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400";
      default: return "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300";
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950 relative">
      
      {/* MODAL KONFIRMASI DELETE */}
      {itemToDelete && (
        <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase">{lang === 'id' ? "Hapus Barang?" : "Delete Item?"}</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              {lang === 'id' ? `Anda yakin ingin menghapus "${itemToDelete.item_name}" dari gudang?` : `Are you sure you want to remove "${itemToDelete.item_name}"?`}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={confirmDelete} disabled={isDeleting} className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS" : "YES, DELETE")}
              </Button>
              <Button variant="ghost" onClick={() => setItemToDelete(null)} disabled={isDeleting} className="w-full h-12 font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-500 flex items-center gap-3">
              <Package className="h-8 w-8 md:h-10 md:w-10"/> 
              {lang === 'id' ? "Gudang Penyimpanan" : "Inventory & Stock"}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base font-medium">
              {lang === 'id' 
                ? "Pantau dan kelola ketersediaan stok obat, pakan, dan cairan perawatan air akuarium Anda." 
                : "Monitor and manage your stock of medications, fish food, and water care products."}
            </p>
          </div>

          <Button onClick={handleOpenAddModal} className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0 w-full md:w-auto z-10 transition-all">
            <Plus className="w-5 h-5 mr-2" /> {lang === 'id' ? "Tambah Barang" : "Add New Item"}
          </Button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'id' ? "Cari nama barang..." : "Search items..."} 
            className="h-14 pl-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm font-bold focus:border-indigo-500" 
          />
        </div>

        {/* INVENTORY GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4"/>
            <p className="font-bold animate-pulse">{lang === 'id' ? "Memuat stok gudang..." : "Loading inventory..."}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4"/>
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">{lang === 'id' ? "Gudang Masih Kosong" : "Inventory is Empty"}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'id' ? "Anda belum mencatat stok barang atau obat apapun." : "You haven't added any stock or medication yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div key={item.id} className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col group overflow-hidden">
                
                {/* 💡 FITUR BARU: NOMOR URUT */}
                <div className="absolute top-0 left-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 px-3 py-1.5 rounded-br-2xl text-[10px] font-black tracking-widest border-r border-b border-indigo-100 dark:border-indigo-800/50">
                  #{index + 1}
                </div>

                {/* 💡 FITUR BARU: TOMBOL EDIT & DELETE (Muncul saat di-hover) */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditModal(item)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setItemToDelete(item)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4 mt-4">
                  <div className={`p-3 rounded-2xl border ${getCategoryColor(item.category)}`}>
                    {getIcon(item.category)}
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-1 line-clamp-2 pr-2">
                  {item.item_name}
                </h3>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {item.category.replace('_', ' ')}
                </span>
                
                <div className="mt-auto pt-6 flex items-end justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'id' ? "Sisa Stok" : "Remaining"}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className={`text-2xl font-black ${item.stock_quantity <= 10 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {item.stock_quantity}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase">{item.unit}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      <AddInventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInventory} 
        lang={lang}
        editData={itemToEdit} 
      />
    </div>
  );
}