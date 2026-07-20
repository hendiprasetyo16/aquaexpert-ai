// features/inventory/components/AddInventoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // 💡 FIX 2: Kita gunakan Portal
import { X, Save, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { addInventoryItemAction } from "../actions/inventory.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: "id" | "en";
}

export default function AddInventoryModal({ isOpen, onClose, onSuccess, lang }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "medication",
    stockQuantity: "",
    unit: "ml",
    notes: ""
  });

  // 💡 Mencegah Hydration Mismatch dan Kunci Scroll Halaman
  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.stockQuantity) {
      toast.error(lang === 'id' ? "Nama dan jumlah wajib diisi!" : "Name and quantity are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addInventoryItemAction({
        itemName: formData.itemName,
        category: formData.category,
        stockQuantity: Number(formData.stockQuantity),
        unit: formData.unit,
        notes: formData.notes
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Barang berhasil ditambahkan!" : "Item added successfully!");
        onSuccess();
        onClose();
        setFormData({ itemName: "", category: "medication", stockQuantity: "", unit: "ml", notes: "" });
      } else {
        toast.error(res.error || "Gagal menyimpan barang.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 💡 FIX 2: Render UI-nya menggunakan createPortal langsung ke document.body
  return createPortal(
    <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wide">
              {lang === 'id' ? "Tambah Stok Baru" : "Add New Stock"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Nama Barang" : "Item Name"}</label>
            <Input required value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} placeholder={lang === 'id' ? "Cth: Seachem Prime, Pelet Mutiara..." : "e.g., Seachem Prime..."} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Kategori" : "Category"}</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100">
                <option value="medication">{lang === 'id' ? "Obat-obatan" : "Medication"}</option>
                <option value="water_care">{lang === 'id' ? "Perawatan Air" : "Water Care"}</option>
                <option value="food">{lang === 'id' ? "Pakan Ikan" : "Fish Food"}</option>
                <option value="equipment">{lang === 'id' ? "Peralatan" : "Equipment"}</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Satuan" : "Unit"}</label>
              <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100">
                <option value="ml">ml (Mili)</option>
                <option value="gram">Gram</option>
                <option value="pcs">Pcs / Biji</option>
                <option value="capsule">Kapsul</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Jumlah Stok Saat Ini" : "Current Stock"}</label>
            <Input required type="number" step="any" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} placeholder="0" className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 text-lg" />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> {lang === 'id' ? "Simpan Barang" : "Save Item"}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}