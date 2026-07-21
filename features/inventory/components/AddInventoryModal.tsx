// features/inventory/components/AddInventoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2, PackageOpen, Info, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { addInventoryItemAction, updateInventoryItemAction, InventoryItemDto } from "../actions/inventory.actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: "id" | "en";
  editData?: InventoryItemDto | null; 
}

// 💡 STRUKTUR DATA OBAT BEBAS 'ANY'
interface MedOption {
  id: string;
  name_id: string;
  name_en: string;
}

export default function AddInventoryModal({ isOpen, onClose, onSuccess, lang, editData }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medOptions, setMedOptions] = useState<MedOption[]>([]);

  const [formData, setFormData] = useState({
    itemName: "",
    category: "medication",
    stockQuantity: "",
    unit: "ml",
    medicationId: "",
    notes: ""
  });

  useEffect(() => {
    const fetchMedications = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('medications').select('id, name_id, name_en').order('name_en');
      if (data) setMedOptions(data);
    };
    if (isOpen) fetchMedications();
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setFormData({
        itemName: editData.item_name,
        category: editData.category,
        stockQuantity: editData.stock_quantity.toString(),
        unit: editData.unit,
        medicationId: editData.medication_id || "", 
        notes: editData.notes || ""
      });
    } else {
      setFormData({ itemName: "", category: "medication", stockQuantity: "", unit: "ml", medicationId: "", notes: "" });
    }
  }, [editData, isOpen]);

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
      const payloadData = {
        itemName: formData.itemName,
        category: formData.category,
        stockQuantity: Number(formData.stockQuantity),
        unit: formData.unit,
        notes: formData.notes,
        medicationId: formData.medicationId || undefined 
      };

      const res = editData 
        ? await updateInventoryItemAction(editData.id, payloadData)
        : await addInventoryItemAction(payloadData);

      if (res.success) {
        toast.success(lang === 'id' ? "Data berhasil disimpan!" : "Data saved successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error("Gagal menyimpan barang.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wide">
              {editData ? (lang === 'id' ? "Edit Barang" : "Edit Item") : (lang === 'id' ? "Tambah Stok Baru" : "Add New Stock")}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          <form id="inventory-form" onSubmit={handleSubmit} className="p-5 space-y-5">
            
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex gap-2.5 items-start shadow-sm">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                <strong className="block mb-0.5">{lang === 'id' ? "Cara Pengisian yang Benar:" : "How to Fill Correctly:"}</strong>
                {lang === 'id' 
                  ? "Masukkan TOTAL ISI/BERAT, bukan jumlah botol. Jika Anda beli 1 botol isi 250ml, ketik 250 dan pilih ml. Sistem memotong stok dalam satuan terkecil." 
                  : "Input TOTAL VOLUME/WEIGHT, not bottle count. For a 250ml bottle, type 250 and select ml. System deducts in lowest units."}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Nama Barang" : "Item Name"}</label>
              <Input required value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} placeholder={lang === 'id' ? "Cth: Seachem Prime..." : "e.g., Seachem Prime..."} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950" />
            </div>

            {/* 💡 PERBAIKAN UI: Desain Jembatan Obat yang lebih bersahabat untuk Mode Gelap */}
            {(formData.category === "medication" || formData.category === "water_care") && (
              <div className="space-y-2 bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-inner">
                <label className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4" /> {lang === 'id' ? "Kaitkan ke Master Obat (Sangat Disarankan)" : "Link to Master Meds (Highly Recommended)"}
                </label>
                <select value={formData.medicationId} onChange={(e) => setFormData({...formData, medicationId: e.target.value})} className="w-full h-12 px-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-bold text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
                  <option value="">{lang === 'id' ? "-- Belum Dikaitkan (Pilih Obat) --" : "-- Not Linked (Select Med) --"}</option>
                  {medOptions.map(med => (
                    <option key={med.id} value={med.id}>{lang === 'id' ? med.name_id : med.name_en}</option>
                  ))}
                </select>
                
                {/* 💡 Hint yang jauh lebih jelas fungsinya */}
                <div className="flex gap-2 items-start mt-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300/80 leading-relaxed">
                    {lang === 'id' 
                      ? "PENTING: Pilih nama obat di atas agar stok botol ini otomatis berkurang setiap kali Anda menekan tombol 'Gunakan Dosis Ini' di Ruang Perawatan." 
                      : "IMPORTANT: Select a medication above so this bottle's stock automatically decreases when you use it in the Treatment Ward."}
                  </p>
                </div>
              </div>
            )}

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
                  <option value="ml">{lang === 'id' ? "ml (Mililiter)" : "ml (Milliliter)"}</option>
                  <option value="gram">{lang === 'id' ? "gram (g)" : "gram (g)"}</option>
                  <option value="pcs">{lang === 'id' ? "Pcs / Buah" : "Pcs / Items"}</option>
                  <option value="capsule">{lang === 'id' ? "Kapsul" : "Capsules"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Total Isi / Sisa Stok" : "Total Volume / Stock"}</label>
              <Input required type="number" step="any" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} placeholder="0" className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 text-lg" />
            </div>
          </form>
        </div>

        <div className="shrink-0 p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Button type="submit" form="inventory-form" disabled={isSubmitting} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> {lang === 'id' ? "Simpan Barang" : "Save Item"}</>}
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}