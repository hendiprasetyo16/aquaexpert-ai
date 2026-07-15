// features/treatments/components/MedicationForm.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Info, 
  AlertTriangle, 
  Trash2, 
  Pill, 
  FlaskConical, 
  Gauge, 
  Activity, 
  ShieldCheck, 
  Leaf, 
  Shell,
  Hourglass // 👈 Tambahkan ikon ini
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import type { MedicationDto } from "../actions/medication.actions";
import { deleteMedicationAction } from "../actions/medication.actions"; 

interface Props {
  initialData?: MedicationDto | null;
  mode: "create" | "edit";
  onSaveAction?: (payload: Partial<MedicationDto>) => Promise<{ success: boolean; error?: string }>;
  onUpdateAction?: (id: string, payload: Partial<MedicationDto>) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void; 
  onCancel?: () => void;  
}

export function MedicationForm({ initialData, mode, onSaveAction, onUpdateAction, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const rootDict = (dict as Record<string, unknown>) || {};
  const medScope = (rootDict.medication || {}) as Record<string, unknown>;
  const formDict = (medScope.form || rootDict.medicationForm || {}) as Record<string, string>;
  const arcDict = (medScope.archiveList || rootDict.medicationArchiveList || {}) as Record<string, string>;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [formData, setFormData] = useState<Partial<MedicationDto>>({
    name_id: initialData?.name_id || "",
    name_en: initialData?.name_en || "",
    active_ingredient: initialData?.active_ingredient || "",
    description_id: initialData?.description_id || "",
    description_en: initialData?.description_en || "",
    base_dosage_per_100l: initialData?.base_dosage_per_100l || 0,
    dosage_unit: initialData?.dosage_unit || "ml",
    treatment_duration_days: initialData?.treatment_duration_days || 7,
    reuse_interval_days: initialData?.reuse_interval_days || 7, // 👈 TAMBAHKAN INISIALISASI INI
    clinical_score_baseline: initialData?.clinical_score_baseline || 3,
    success_rate_baseline_pct: initialData?.success_rate_baseline_pct || 70,
    avg_recovery_days_baseline: initialData?.avg_recovery_days_baseline || 7,
    safe_for_plants: initialData?.safe_for_plants ?? true,
    safe_for_inverts: initialData?.safe_for_inverts ?? true,
  });

  const handleChange = (field: keyof MedicationDto, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalNameEn = formData.name_en?.trim() || formData.name_id?.trim() || "Medication";
      
      const payload: Partial<MedicationDto> = {
        name_id: formData.name_id?.trim() || "Nama Obat",
        name_en: finalNameEn,
        active_ingredient: formData.active_ingredient?.trim() || "",
        description_id: formData.description_id?.trim() || "", 
        description_en: formData.description_en?.trim() || "",
        base_dosage_per_100l: Number(formData.base_dosage_per_100l) || 0,
        dosage_unit: formData.dosage_unit?.trim() || "ml",
        treatment_duration_days: Number(formData.treatment_duration_days) || 0,
        reuse_interval_days: Number(formData.reuse_interval_days) || 7, // 👈 PASTIKAN INI TERKIRIM
        clinical_score_baseline: Number(formData.clinical_score_baseline) || 3,
        success_rate_baseline_pct: Number(formData.success_rate_baseline_pct) || 0,
        avg_recovery_days_baseline: Number(formData.avg_recovery_days_baseline) || 0,
        safe_for_plants: Boolean(formData.safe_for_plants),
        safe_for_inverts: Boolean(formData.safe_for_inverts),
      };

      let res;
      if (mode === "create") {
        if (onSaveAction) {
          res = await onSaveAction(payload);
        } else {
          throw new Error("Action pembuatan data (create) belum diregistrasikan.");
        }
      } else {
        if (!initialData?.id) throw new Error("ID obat tidak ditemukan.");
        if (onUpdateAction) {
          res = await onUpdateAction(initialData.id, payload);
        } else {
          throw new Error("Action pembaharuan data (update) belum diregistrasikan.");
        }
      }

      if (res.success) {
        toast.success(lang === 'id' ? "Data obat berhasil disimpan!" : "Medication data saved successfully!");
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/medications");
          router.refresh();
        }
      } else {
        toast.error(res.error || (lang === 'id' ? "Gagal menyimpan data obat." : "Failed to save medication data."));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeHardDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    const currentName = lang === "en" && initialData.name_en ? initialData.name_en : (initialData.name_id || "");
    
    if (deleteConfirmText !== currentName) {
      toast.error(lang === "id" ? "Nama tidak cocok." : "Name mismatch.");
      return;
    }

    try {
      setLoadingAction(true);
      const res = await deleteMedicationAction(initialData.id);
      if (!res.success) throw new Error(res.error);
      
      toast.success(lang === "id" ? "Obat dihapus permanen." : "Medication permanently deleted.");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/medications");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingAction(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="w-full transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-in fade-in duration-500 relative transition-colors">
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          
          {/* 1. INFORMASI UTAMA OBAT */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.primaryInfo || (lang === 'id' ? "Informasi Utama Obat" : "Primary Medication Info")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.nameId || "Nama Obat (ID) *"}</label>
                <input required type="text" placeholder="Contoh: Blitz Icht" value={formData.name_id || ""} onChange={(e) => handleChange("name_id", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Nama komersial/lokal obat di Indonesia." : "Commercial or local product name."}</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.nameEn || "Nama Obat (EN)"}</label>
                <input type="text" placeholder="E.g., Blitz Icht Premium" value={formData.name_en || ""} onChange={(e) => handleChange("name_en", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Dibiarkan kosong akan mengikuti nama (ID)." : "Leave empty to follow the Indonesian name."}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Bahan Aktif (Kandungan)" : "Active Ingredient"}</label>
                <input required type="text" placeholder="Cth: Methylene Blue, Malachite Green" value={formData.active_ingredient || ""} onChange={(e) => handleChange("active_ingredient", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Zat kimia aktif/farmasi inti pengobatan." : "Core chemical or pharmaceutical component."}</p>
              </div>
            </div>
          </div>

          {/* 2. DESKRIPSI FARMAKOLOGI */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.descriptionSection || (lang === 'id' ? "Deskripsi & Cara Kerja Obat" : "Description & Mechanism")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Deskripsi Obat (ID)" : "Medication Description (ID)"}</label>
                <textarea rows={3} placeholder="Penjelasan mengenai obat dan kegunaannya..." value={formData.description_id || ""} onChange={(e) => handleChange("description_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? "Deskripsi Obat (EN)" : "Medication Description (EN)"}</label>
                <textarea rows={3} placeholder="Explanation about this medicine and its utility..." value={formData.description_en || ""} onChange={(e) => handleChange("description_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              </div>
            </div>
          </div>

          {/* 3. DOSIS & ATURAN PAKAI */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.dosageSection || (lang === 'id' ? "Protokol Takaran & Dosis" : "Dosage & Protocol")}
            </h3>
            
            {/* 🌟 KOTAK INI DIUBAH MENJADI 4 KOLOM AGAR MUAT 🌟 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Dosis (Per 100L Air)" : "Base Dosage (100L)"}</label>
                <input type="number" min="0" step="any" value={formData.base_dosage_per_100l || 0} onChange={(e) => handleChange("base_dosage_per_100l", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Satuan Dosis" : "Dosage Unit"}</label>
                <input type="text" placeholder="Cth: ml, gr, tetes" value={formData.dosage_unit || ""} onChange={(e) => handleChange("dosage_unit", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Info className="w-3.5 h-3.5" />{lang === 'id' ? "Durasi (Hari)" : "Duration (Days)"}</label>
                <input type="number" min="1" value={formData.treatment_duration_days || 7} onChange={(e) => handleChange("treatment_duration_days", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
              </div>

              {/* 🌟 INI INPUT BARU UNTUK WAKTU JEDA 🌟 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1"><Hourglass className="w-3.5 h-3.5" />{lang === 'id' ? "Jeda Ulang (Hari)" : "Reuse Interval"}</label>
                <input type="number" min="1" value={formData.reuse_interval_days || 7} onChange={(e) => handleChange("reuse_interval_days", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 focus:border-amber-500 outline-none font-bold text-amber-700 dark:text-amber-400 transition-colors" title={lang === 'id' ? "Waktu tunggu sebelum obat ini aman diberikan kembali." : "Waiting period before this medication can be safely redosed."} />
              </div>
            </div>
          </div>

          {/* 4. METRIK KLINIS & EFIKASI */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-900/40 pb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              {formDict.metricsSection || (lang === 'id' ? "Efikasi & Indikator Klinis" : "Clinical Efficacy & Metrics")}
            </h3>
            
            <div className="bg-emerald-50/30 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-emerald-200 dark:border-slate-800 space-y-6 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-emerald-900 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">{lang === 'id' ? "Skor Klinis Baseline (1-5)" : "Clinical Score Baseline (1-5)"}</label>
                  <input type="number" min="1" max="5" value={formData.clinical_score_baseline || 3} onChange={(e) => handleChange("clinical_score_baseline", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-1 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Kekuatan terapeutik obat (1: Lemah, 5: Sangat Keras)." : "Therapeutic strength coefficient (1: Weak, 5: Aggressive)."}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-900 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">{lang === 'id' ? "Tingkat Kesembuhan (%)" : "Success Rate (%)"}</label>
                  <input type="number" min="0" max="100" value={formData.success_rate_baseline_pct || 0} onChange={(e) => handleChange("success_rate_baseline_pct", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-1 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Persentase kesembuhan rata-rata pada ikan." : "Baseline success statistics probability."}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-emerald-900 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">{lang === 'id' ? "Rata-rata Hari Pulih" : "Avg Recovery Days"}</label>
                  <input type="number" min="1" value={formData.avg_recovery_days_baseline || 0} onChange={(e) => handleChange("avg_recovery_days_baseline", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-1 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Waktu yang dibutuhkan hingga ikan pulih total." : "Typical duration for tissue regeneration/healing."}</p>
                </div>
              </div>

              {/* KEAMANAN BIOTA / LINGKUNGAN */}
              <div className="border-t border-emerald-200 dark:border-slate-800 pt-4">
                <label className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'id' ? "Keamanan Ekosistem Tank" : "Aquarium Ecosystem Safety"}
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl transition-colors select-none">
                    <input type="checkbox" checked={formData.safe_for_plants || false} onChange={(e) => handleChange("safe_for_plants", e.target.checked)} className="h-4 w-4 rounded accent-emerald-600 border-slate-300 dark:border-slate-700" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-green-500" /> {lang === 'id' ? "Aman untuk Tanaman Hidup?" : "Safe for Live Plants?"}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl transition-colors select-none">
                    <input type="checkbox" checked={formData.safe_for_inverts || false} onChange={(e) => handleChange("safe_for_inverts", e.target.checked)} className="h-4 w-4 rounded accent-teal-600 border-slate-300 dark:border-slate-700" />
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <Shell className="w-3.5 h-3.5 text-amber-600" /> {lang === 'id' ? "Aman untuk Invertebrata (Udang/Siput)?" : "Safe for Invertebrates (Shrimp/Snails)?"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS & SUBMIT BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              {mode === "edit" && initialData && isSuperAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={loadingAction || isSubmitting}
                  className="h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-slate-900 hover:bg-red-100 dark:hover:bg-slate-800 text-red-600 dark:text-red-400 flex items-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  {arcDict.deletePermanent || (lang === 'id' ? "Hapus Permanen" : "Delete Permanently")}
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    router.push("/dashboard/medications");
                  }
                }} 
                disabled={isSubmitting || loadingAction} 
                className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {formDict.btnCancel || (lang === 'id' ? "Batal" : "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingAction} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting 
                  ? (formDict.processing || (lang === 'id' ? "MEMPROSES..." : "PROCESSING...")) 
                  : (mode === "create" 
                      ? (formDict.btnSave || (lang === 'id' ? "SIMPAN" : "SAVE")) 
                      : (formDict.btnUpdate || (lang === 'id' ? "PERBAHARUI" : "UPDATE")))}
              </Button>
            </div>
          </div>

        </form>
      </div>

      {/* MODAL HARD DELETE PORTAL (Khusus Super Admin) */}
      {mounted && isDeleteModalOpen && initialData && isSuperAdmin && createPortal(
        <div 
          className="flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200 ease-out"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-slate-800 text-red-600 flex items-center justify-center rounded-full mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-center text-red-600 mb-2">
              {arcDict.modalDeleteTitle || (lang === 'id' ? "Hapus Permanen" : "Permanent Delete")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 font-medium leading-relaxed">
              {lang === 'id' ? "Data spesifikasi obat ini akan dihapus permanen dari sistem." : "This medication record will be completely expunged."}
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 mb-6">
              <label className="text-[10px] font-black uppercase text-red-500 tracking-widest block mb-2 text-center">
                {lang === 'id' ? "Ketik nama obat untuk konfirmasi:" : "Type medication name to confirm:"}
              </label>
              <div className="text-center font-bold text-slate-800 dark:text-slate-200 mb-2 select-all bg-white dark:bg-slate-900 py-1 border border-slate-200 dark:border-slate-700 rounded">
                {lang === 'en' && initialData.name_en ? initialData.name_en : (initialData.name_id || "")}
              </div>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="h-11 w-full text-center font-bold bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 focus:border-red-500 outline-none rounded-md transition-colors" />
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                type="button" 
                onClick={executeHardDelete} 
                disabled={loadingAction || deleteConfirmText !== (lang === 'en' && initialData.name_en ? initialData.name_en : (initialData.name_id || ""))} 
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 font-black uppercase tracking-widest text-white shadow-lg transition-all"
              >
                {loadingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? "HAPUS SEKARANG" : "DELETE NOW")}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(""); }} 
                disabled={loadingAction} 
                className="w-full h-12 rounded-xl font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                {arcDict.cancel || (lang === 'id' ? "Batal" : "Cancel")}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}