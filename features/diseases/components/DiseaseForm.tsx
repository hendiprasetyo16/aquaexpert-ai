// features/diseases/components/DiseaseForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { Loader2, ArrowLeft, Save, Info, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import type { Disease, DiseaseCategory } from "../types/disease.types";
import { createDiseaseAction, updateDiseaseAction } from "../actions/disease.actions";
import { uploadDiseaseImage } from "../repositories/disease.repository";

interface Props {
  initialData?: Disease | null;
  mode: "create" | "edit";
}

export function DiseaseForm({ initialData, mode }: Props) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Akses kamus
  const rootDict = (dict as Record<string, unknown>) || {};
  const diseaseScope = (rootDict.disease as Record<string, unknown>) || {};
  const formDict = (diseaseScope.diseaseForm || rootDict.diseaseForm || {}) as Record<string, string>;

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(initialData?.image_url || "");

  const [formData, setFormData] = useState<Partial<Disease>>({
    name_id: initialData?.name_id || "",
    name_en: initialData?.name_en || "",
    scientific_name: initialData?.scientific_name || "",
    disease_category: initialData?.disease_category || "Bacterial",
    severity: initialData?.severity || 3,
    urgency_level: initialData?.urgency_level || "Medium",
    difficulty: initialData?.difficulty || "Medium",
    description_id: initialData?.description_id || "",
    description_en: initialData?.description_en || "",
    symptoms_id: initialData?.symptoms_id || "",
    symptoms_en: initialData?.symptoms_en || "",
    treatments_id: initialData?.treatments_id || "",
    treatments_en: initialData?.treatments_en || "",
    prevention_id: initialData?.prevention_id || "",
    prevention_en: initialData?.prevention_en || "",
    expert_notes_id: initialData?.expert_notes_id || "",
    expert_notes_en: initialData?.expert_notes_en || "",
    mortality_risk: initialData?.mortality_risk || 3,
    contagious: initialData?.contagious || false,
    quarantine_required: initialData?.quarantine_required || false,
    treatment_duration_days: initialData?.treatment_duration_days || 7,
    recovery_probability: initialData?.recovery_probability || 70,
  });

  const handleChange = (field: keyof Disease, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = initialData?.image_url || null;
      if (coverFile) {
        toast.loading(lang === 'id' ? "Mengompresi & mengunggah gambar..." : "Compressing & uploading image...", { id: "upload" });
        
        const baseName = formData.name_id || formData.name_en || "Penyakit";
        const safeName = baseName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const timestamp = new Date().getTime();
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const newFileName = `${safeName}_${timestamp}.${ext}`;
        
        const renamedFile = new File([coverFile], newFileName, { type: coverFile.type });
        const uploadedUrl = await uploadDiseaseImage(renamedFile, initialData?.image_url);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          toast.success(lang === 'id' ? "Gambar berhasil diunggah!" : "Image uploaded!", { id: "upload" });
        } else {
          toast.error(lang === 'id' ? "Gagal mengunggah gambar." : "Failed to upload image.", { id: "upload" });
        }
      }

      const payload: Partial<Disease> = {
        name_id: formData.name_id?.trim() || "Penyakit",
        name_en: formData.name_en?.trim() || formData.name_id?.trim() || "Disease",
        slug: (formData.name_en?.trim() || formData.name_id?.trim() || "disease").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        scientific_name: formData.scientific_name?.trim() || null,
        description_id: formData.description_id?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        disease_category: formData.disease_category,
        severity: Number(formData.severity) || 3,
        difficulty: formData.difficulty,
        urgency_level: formData.urgency_level,
        symptoms_id: formData.symptoms_id?.trim() || null,
        symptoms_en: formData.symptoms_en?.trim() || null,
        treatments_id: formData.treatments_id?.trim() || null,
        treatments_en: formData.treatments_en?.trim() || null,
        prevention_id: formData.prevention_id?.trim() || null,
        prevention_en: formData.prevention_en?.trim() || null,
        expert_notes_id: formData.expert_notes_id?.trim() || null,
        expert_notes_en: formData.expert_notes_en?.trim() || null,
        mortality_risk: Number(formData.mortality_risk) || 3,
        contagious: Boolean(formData.contagious),
        quarantine_required: Boolean(formData.quarantine_required),
        treatment_duration_days: Number(formData.treatment_duration_days) || null,
        recovery_probability: Number(formData.recovery_probability) || null,
        image_url: finalImageUrl,
      };

      let res;
      if (mode === "create") {
        res = await createDiseaseAction(payload);
      } else {
        if (!initialData?.id) throw new Error("ID tidak ditemukan.");
        res = await updateDiseaseAction(initialData.id, payload);
      }

      if (res.success) {
        toast.success(lang === 'id' ? "Data berhasil disimpan!" : "Data saved successfully!");
        router.push("/dashboard/diseases");
        router.refresh();
      } else {
        toast.error(res.error || (lang === 'id' ? "Gagal menyimpan data." : "Failed to save data."));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* 1. VISUAL / GAMBAR */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {formDict.visualSection || (lang === 'id' ? "Visual / Foto Patogen" : "Pathogen Visual / Photo")}
        </h3>
        <div className="w-full md:w-1/2 mt-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
            {formDict.coverLabel || (lang === 'id' ? "Foto Patogen (Akan Otomatis Dikompres)" : "Pathogen Photo (Auto-compressed)")}
          </label>
          <input id="cover-image" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          <label htmlFor="cover-image" className="cursor-pointer block w-full mt-2">
            <div 
              className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center"
              style={{ minHeight: "250px" }} 
            >
              {coverPreview ? (
                <>
                   <Image src={coverPreview} alt="Cover Preview" fill className="object-contain p-2" unoptimized />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl z-10">
                     <span className="text-white text-sm font-bold">{formDict.changeCover || (lang === 'id' ? "Ganti Foto" : "Change Photo")}</span>
                   </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500 z-10 p-6">
                  <ImagePlus className="h-10 w-10 mb-2" />
                  <span className="text-sm font-bold text-center">{formDict.uploadCover || (lang === 'id' ? "Klik Untuk Upload Foto" : "Click to Upload Photo")}</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* 2. INFORMASI DASAR */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {formDict.basicInfo || (lang === 'id' ? "Informasi Dasar Penyakit" : "Basic Disease Information")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.nameId || "Nama Penyakit (ID) *"}</label>
            <input required type="text" placeholder="Contoh: Bintik Putih" value={formData.name_id} onChange={(e) => handleChange("name_id", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Nama umum penyakit yang dikenal oleh orang Indonesia." : "Common Indonesian name for this disease."}
            </p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{(formDict.nameEn || "Nama Penyakit (EN)").replace(' *', '')}</label>
            <input type="text" placeholder="E.g., White Spot, Dropsy" value={formData.name_en} onChange={(e) => handleChange("name_en", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Dibiarkan kosong pun akan otomatis mengikuti nama (ID)." : "Leave empty to automatically copy the (ID) name."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Nama Ilmiah (Latin)" : "Scientific Name"}</label>
            <input type="text" placeholder="Cth: Ichthyophthirius multifiliis" value={formData.scientific_name || ""} onChange={(e) => handleChange("scientific_name", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold italic text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Nama biologis dari patogen penyebab penyakit (opsional)." : "Biological name of the pathogen (optional)."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.category || (lang === 'id' ? "Kategori" : "Category")}</label>
            <select value={formData.disease_category || ""} onChange={(e) => handleChange("disease_category", e.target.value as DiseaseCategory)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100">
              <option value="Parasitic">Parasitic (Parasit)</option><option value="Bacterial">Bacterial (Bakteri)</option>
              <option value="Fungal">Fungal (Jamur)</option><option value="Viral">Viral (Virus)</option>
              <option value="Environmental">Environmental (Lingkungan)</option><option value="Nutritional">Nutritional (Nutrisi)</option>
            </select>
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Klasifikasi jenis patogen untuk menentukan arah pengobatan." : "Pathogen classification to determine treatment path."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.severity || (lang === 'id' ? "Tingkat Keparahan" : "Severity")}</label>
            <input type="number" min="1" max="5" value={formData.severity || 3} onChange={(e) => handleChange("severity", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Skala 1 (Ringan) hingga 5 (Sangat Mematikan)." : "Scale 1 (Mild) to 5 (Extremely Lethal)."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.urgency || (lang === 'id' ? "Tingkat Urgensi" : "Urgency Level")}</label>
            <select value={formData.urgency_level || ""} onChange={(e) => handleChange("urgency_level", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100">
              <option value="Low">Low (Bisa ditunda)</option><option value="Medium">Medium (Segera tangani)</option><option value="High">High (Berbahaya)</option><option value="Critical">Critical (Darurat / Karantina)</option>
            </select>
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Tindakan apa yang harus segera dilakukan saat penyakit terdeteksi." : "What action should be taken immediately upon detection."}
            </p>
          </div>
        </div>
      </div>

      {/* 3. DESKRIPSI & GEJALA */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {formDict.clinicalSigns || (lang === 'id' ? "Gejala Klinis & Deskripsi" : "Clinical Signs & Description")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Deskripsi Patologi (ID)" : "Pathology Description (ID)"}</label>
            <textarea rows={3} placeholder="Penjelasan umum..." value={formData.description_id || ""} onChange={(e) => handleChange("description_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Gambaran umum tentang apa itu penyakit ini." : "General overview of the disease."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? "Deskripsi Patologi (EN)" : "Pathology Description (EN)"}</label>
            <textarea rows={3} placeholder="Brief explanation..." value={formData.description_en || ""} onChange={(e) => handleChange("description_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsId || (lang === 'id' ? "Detail Gejala Klinis (ID)" : "Symptoms (ID)")}</label>
            <textarea rows={4} placeholder="- Ada bintik putih" value={formData.symptoms_id || ""} onChange={(e) => handleChange("symptoms_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Ciri fisik/perilaku ikan." : "Physical/behavioral signs."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsEn || (lang === 'id' ? "Detail Gejala Klinis (EN)" : "Symptoms (EN)")}</label>
            <textarea rows={4} placeholder="- White spots" value={formData.symptoms_en || ""} onChange={(e) => handleChange("symptoms_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {/* 4. PROTOKOL PENGOBATAN */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {formDict.treatmentSection || (lang === 'id' ? "Protokol Pengobatan" : "Treatment Protocol")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsId || (lang === 'id' ? "Langkah Pengobatan (ID)" : "Treatment Steps (ID)")}</label>
            <textarea rows={4} value={formData.treatments_id || ""} onChange={(e) => handleChange("treatments_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
            <p className="text-[11px] text-slate-500 leading-snug flex gap-1.5 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Langkah pengobatan." : "Step-by-step procedure."}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsEn || (lang === 'id' ? "Langkah Pengobatan (EN)" : "Treatment Steps (EN)")}</label>
            <textarea rows={4} value={formData.treatments_en || ""} onChange={(e) => handleChange("treatments_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {/* 5. METRIK LANJUTAN & PENCEGAHAN */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {formDict.advancedMetrics || (lang === 'id' ? "Metrik Lanjutan & Pencegahan" : "Advanced Metrics")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.mortalityRisk || "Risiko Kematian (1-5)"}</label>
            <input type="number" min="1" max="5" value={formData.mortality_risk || 3} onChange={(e) => handleChange("mortality_risk", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.durationDays || "Estimasi Sembuh (Hari)"}</label>
            <input type="number" min="1" value={formData.treatment_duration_days || 7} onChange={(e) => handleChange("treatment_duration_days", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.recoveryProb || "Peluang Sembuh (%)"}</label>
            <input type="number" min="1" max="100" value={formData.recovery_probability || 70} onChange={(e) => handleChange("recovery_probability", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0B1120] px-4 py-2 rounded-xl">
            <input type="checkbox" checked={formData.contagious || false} onChange={(e) => handleChange("contagious", e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formDict.contagious || "Sangat Menular?"}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0B1120] px-4 py-2 rounded-xl">
            <input type="checkbox" checked={formData.quarantine_required || false} onChange={(e) => handleChange("quarantine_required", e.target.checked)} className="h-4 w-4 rounded accent-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-500">{formDict.quarantineReq || "Wajib Karantina?"}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.preventionId || "Cara Pencegahan (ID)"}</label>
            <textarea rows={3} value={formData.prevention_id || ""} onChange={(e) => handleChange("prevention_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.preventionEn || "Prevention (EN)"}</label>
            <textarea rows={3} value={formData.prevention_en || ""} onChange={(e) => handleChange("prevention_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-amber-600 dark:text-amber-500">{formDict.expertNotesId || "Catatan Pakar (ID)"}</label>
            <textarea rows={2} value={formData.expert_notes_id || ""} onChange={(e) => handleChange("expert_notes_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 focus:border-amber-500 outline-none font-medium custom-scrollbar text-amber-900 dark:text-amber-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-amber-600 dark:text-amber-500">{formDict.expertNotesEn || "Expert Notes (EN)"}</label>
            <textarea rows={2} value={formData.expert_notes_en || ""} onChange={(e) => handleChange("expert_notes_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 focus:border-amber-500 outline-none font-medium custom-scrollbar text-amber-900 dark:text-amber-100" />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/60">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-4 h-4" /> {formDict.btnCancel || "Batal"}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? (formDict.processing || "PROCESSING...") : (mode === "create" ? (formDict.btnSave || "SIMPAN") : (formDict.btnUpdate || "UPDATE"))}
        </Button>
      </div>
    </form>
  );
}