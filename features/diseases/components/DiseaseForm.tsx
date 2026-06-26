// features/diseases/components/DiseaseForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { Loader2, ArrowLeft, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import type { Disease, DiseaseCategory } from "../types/disease.types";
import { createDiseaseAction, updateDiseaseAction } from "../actions/disease.actions";

interface Props {
  initialData?: Disease | null;
  mode: "create" | "edit";
}

export function DiseaseForm({ initialData, mode }: Props) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil kamus secara aman (Bilingual)
  const rootDict = dict as Record<string, any>;
  const formDict = rootDict?.diseaseForm || {};

  const [formData, setFormData] = useState<Partial<Disease>>({
    name_id: initialData?.name_id || "",
    name_en: initialData?.name_en || "",
    scientific_name: initialData?.scientific_name || "",
    disease_category: initialData?.disease_category || "Bacterial",
    severity: initialData?.severity || 3,
    urgency_level: initialData?.urgency_level || "Medium",
    description_id: initialData?.description_id || "",
    description_en: initialData?.description_en || "",
    symptoms_id: initialData?.symptoms_id || "",
    symptoms_en: initialData?.symptoms_en || "",
    treatments_id: initialData?.treatments_id || "",
    treatments_en: initialData?.treatments_en || "",
  });

  const handleChange = (field: keyof Disease, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // LOGIKA FALLBACK: Jika name_en kosong, samakan dengan name_id
    const finalData = { ...formData };
    if (!finalData.name_en || finalData.name_en.trim() === "") {
      finalData.name_en = finalData.name_id;
    }

    let res;
    if (mode === "create") {
      res = await createDiseaseAction(finalData);
    } else {
      res = await updateDiseaseAction(initialData!.id, finalData);
    }

    if (res.success) {
      toast.success(lang === 'id' ? "Data berhasil disimpan!" : "Data saved successfully!");
      router.push("/dashboard/diseases");
      router.refresh();
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal menyimpan data." : "Failed to save data."));
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-in fade-in duration-500">
      
      {/* 1. INFORMASI DASAR */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          {formDict.basicInfo || "Informasi Dasar Penyakit"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.nameId || "Nama Penyakit (ID) *"}</label>
            <input required type="text" placeholder="Contoh: Bintik Putih" value={formData.name_id} onChange={(e) => handleChange("name_id", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Nama umum penyakit yang dikenal oleh orang Indonesia." : "Common Indonesian name for this disease."}</p>
          </div>
          <div className="space-y-1.5">
            {/* Hapus required dari input EN agar sistem fallback bisa bekerja */}
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{(formDict.nameEn || "Nama Penyakit (EN)").replace(' *', '')}</label>
            <input type="text" placeholder="E.g., White Spot, Dropsy" value={formData.name_en} onChange={(e) => handleChange("name_en", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Dibiarkan kosong pun akan otomatis mengikuti nama (ID)." : "Leave empty to automatically copy the (ID) name."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Nama Ilmiah (Latin)" : "Scientific Name"}</label>
            <input type="text" placeholder="Cth: Ichthyophthirius multifiliis" value={formData.scientific_name || ""} onChange={(e) => handleChange("scientific_name", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold italic text-slate-800 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Nama biologis dari bakteri/parasit penyebab penyakit (opsional)." : "Biological name of the pathogen (optional)."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.category || "Kategori"}</label>
            <select value={formData.disease_category || ""} onChange={(e) => handleChange("disease_category", e.target.value as DiseaseCategory)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100">
              <option value="Parasitic">Parasitic (Parasit)</option><option value="Bacterial">Bacterial (Bakteri)</option>
              <option value="Fungal">Fungal (Jamur)</option><option value="Viral">Viral (Virus)</option>
              <option value="Environmental">Environmental (Lingkungan)</option><option value="Nutritional">Nutritional (Nutrisi)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.severity || "Tingkat Keparahan"}</label>
            <input type="number" min="1" max="5" value={formData.severity || 3} onChange={(e) => handleChange("severity", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Skala 1 (Ringan) sampai 5 (Sangat Mematikan)." : "Scale 1 (Mild) to 5 (Extremely Lethal)."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.urgency || "Tingkat Urgensi"}</label>
            <select value={formData.urgency_level || ""} onChange={(e) => handleChange("urgency_level", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100">
              <option value="Low">Low (Bisa ditunda)</option><option value="Medium">Medium (Segera tangani)</option><option value="High">High (Berbahaya)</option><option value="Critical">Critical (Darurat / Karantina)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Tindakan apa yang harus segera dilakukan saat penyakit terdeteksi." : "What action should be taken immediately upon detection."}</p>
          </div>
        </div>
      </div>

      {/* 2. DESKRIPSI & GEJALA */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          {formDict.clinicalSigns || "Gejala Klinis & Deskripsi"}
        </h3>
        <p className="text-xs text-slate-500 mb-4">{lang === 'id' ? "Beri penjelasan rinci tentang penyakit dan gejala kasat mata untuk panduan deteksi pengguna." : "Provide detailed explanation of the disease and visual symptoms for user detection guidance."}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Deskripsi Patologi (ID)" : "Pathology Description (ID)"}</label>
            <textarea rows={3} placeholder="Penjelasan singkat tentang penyakit ini..." value={formData.description_id || ""} onChange={(e) => handleChange("description_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? "Deskripsi Patologi (EN)" : "Pathology Description (EN)"}</label>
            <textarea rows={3} placeholder="Brief explanation of the disease..." value={formData.description_en || ""} onChange={(e) => handleChange("description_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsId || "Detail Gejala Klinis (ID)"}</label>
            <textarea rows={4} placeholder="- Ada bintik putih di sirip&#10;- Ikan sering menggesekkan badan" value={formData.symptoms_id || ""} onChange={(e) => handleChange("symptoms_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsEn || "Clinical Symptoms Detail (EN)"}</label>
            <textarea rows={4} placeholder="- White spots on fins&#10;- Fish flashing against objects" value={formData.symptoms_en || ""} onChange={(e) => handleChange("symptoms_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {/* 3. PROTOKOL PENGOBATAN */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          {formDict.treatmentSection || "Protokol Pengobatan Klinis"}
        </h3>
        <p className="text-xs text-slate-500 mb-4">{lang === 'id' ? "Urutan tata cara pengobatan dari ahli yang akan ditampilkan di aplikasi." : "Sequential treatment procedures from experts to be displayed in the app."}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsId || "Langkah Pengobatan (ID)"}</label>
            <textarea rows={4} placeholder="1. Pindahkan ikan ke tank karantina.&#10;2. Berikan Methylene Blue sesuai dosis." value={formData.treatments_id || ""} onChange={(e) => handleChange("treatments_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsEn || "Treatment Steps (EN)"}</label>
            <textarea rows={4} placeholder="1. Move fish to quarantine tank.&#10;2. Apply Methylene Blue as per dosage." value={formData.treatments_en || ""} onChange={(e) => handleChange("treatments_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/diseases")} disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {formDict.btnCancel || "Batal"}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? (formDict.processing || "PROCESSING...") : (mode === "create" ? (formDict.btnSave || "SIMPAN") : (formDict.btnUpdate || "UPDATE"))}
        </Button>
      </div>

    </form>
  );
}