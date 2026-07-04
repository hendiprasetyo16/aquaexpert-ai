// features/diseases/components/DiseaseForm.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, Save, Info, ImagePlus, AlertTriangle, Archive, Trash2, ShieldAlert, HeartPulse, Stethoscope, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import type { Disease, DiseaseCategory } from "../types/disease.types";
import { createDiseaseAction, updateDiseaseAction, toggleDiseaseArchiveAction, hardDeleteDiseaseAction } from "../actions/disease.actions";
import { uploadDiseaseImage } from "../repositories/disease.repository";

// FUNGSI KOMPRESI GAMBAR
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg", lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else { reject(new Error("Canvas to Blob failed")); }
          }, "image/jpeg", quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

interface Props {
  initialData?: Disease | null;
  mode: "create" | "edit";
}

export function DiseaseForm({ initialData, mode }: Props) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  const { role } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const rootDict = (dict as Record<string, unknown>) || {};
  const diseaseScope = (rootDict.disease as Record<string, unknown>) || {};
  
  const formDict = (diseaseScope.diseaseForm || rootDict.diseaseForm || {}) as Record<string, string>;
  const arcDict = (diseaseScope.diseaseArchiveList || rootDict.diseaseArchiveList || {}) as Record<string, string>;

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(initialData?.image_url || "");

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      if (!validTypes.includes(file.type)) {
        toast.error(lang === 'id' ? "Format harus JPG, PNG atau WEBP." : "Format must be JPG, PNG or WEBP.");
        return;
      }

      try {
        const compressedFile = await compressImage(file);
        setCoverFile(compressedFile);
        setCoverPreview(URL.createObjectURL(compressedFile));
      } catch (err) {
        toast.error(lang === 'id' ? "Gagal mengompresi gambar." : "Failed to compress image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = initialData?.image_url || null;
      
      // 1. Buat SLUG standar untuk database (sesuai skema)
      const finalNameEn = formData.name_en?.trim() || formData.name_id?.trim() || "diseases";
      const diseaseSlug = mode === "edit" && initialData?.slug 
        ? initialData.slug 
        : finalNameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      if (coverFile) {
        toast.loading(lang === 'id' ? "Mengompresi & mengunggah gambar..." : "Compressing & uploading image...", { id: "upload" });
        
        // 2. Format penamaan gambar persis seperti screenshot: slug-cover-timestamp.jpg
        const timestamp = Date.now();
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const newFileName = `${diseaseSlug}-cover-${timestamp}.${ext}`;
        
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
        name_en: finalNameEn,
        slug: diseaseSlug, // Masukkan slug ke payload database
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

  const executeArchive = async () => {
    if (!initialData) return;
    try {
      setLoadingAction(true);
      const res = await toggleDiseaseArchiveAction(initialData.id, initialData.is_active ?? true);
      if (!res.success) throw new Error(res.error);
      toast.success(lang === "id" ? "Status diarsipkan." : "Status updated.");
      router.push("/dashboard/diseases");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingAction(false);
      setIsArchiveModalOpen(false);
    }
  };

  const executeHardDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    const currentName = lang === "en" && initialData.name_en ? initialData.name_en : initialData.name_id;
    if (deleteConfirmText !== currentName) {
      toast.error(lang === "id" ? "Nama tidak cocok." : "Name mismatch.");
      return;
    }
    try {
      setLoadingAction(true);
      const res = await hardDeleteDiseaseAction(initialData.id);
      if (!res.success) throw new Error(res.error);
      toast.success(lang === "id" ? "Dihapus permanen." : "Permanently deleted.");
      router.push("/dashboard/diseases");
      router.refresh();
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
          
          {/* 1. VISUAL / GAMBAR */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.visualSection || (lang === 'id' ? "Visual / Foto Patogen" : "Pathogen Visual / Photo")}
            </h3>
            
            <div className="w-full md:w-1/2 mt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                {formDict.coverLabel || (lang === 'id' ? "Foto Patogen (Akan Otomatis Dikompres)" : "Pathogen Photo (Auto-compressed)")}
              </label>
              
              <div className="relative w-full aspect-video md:aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                <input 
                  id="cover-image" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCoverChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                />

                {coverPreview ? (
                  <>
                    <Image 
                      src={coverPreview} 
                      alt="Cover Preview" 
                      fill 
                      className="object-cover z-0" 
                      unoptimized 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                      <span className="text-white text-sm font-bold">
                        {formDict.changeCover || (lang === 'id' ? "Ganti Foto" : "Change Photo")}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-blue-500 z-10 p-6 transition-colors pointer-events-none">
                    <ImagePlus className="h-10 w-10 mb-2" />
                    <span className="text-sm font-bold text-center">
                      {formDict.uploadCover || (lang === 'id' ? "Klik Untuk Upload Foto" : "Click to Upload Photo")}
                    </span>
                    <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. INFORMASI DASAR */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.basicInfo || (lang === 'id' ? "Informasi Dasar Penyakit" : "Basic Disease Information")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.nameId || "Nama Penyakit (ID) *"}</label>
                <input required type="text" placeholder="Contoh: Bintik Putih" value={formData.name_id || ""} onChange={(e) => handleChange("name_id", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Nama umum penyakit yang dikenal oleh orang Indonesia." : "Common Indonesian name for this disease."}</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{(formDict.nameEn || "Nama Penyakit (EN)").replace(' *', '')}</label>
                <input type="text" placeholder="E.g., White Spot" value={formData.name_en || ""} onChange={(e) => handleChange("name_en", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Dibiarkan kosong pun akan otomatis mengikuti nama (ID)." : "Leave empty to automatically copy the (ID) name."}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Nama Ilmiah (Latin)" : "Scientific Name"}</label>
                <input type="text" placeholder="Cth: Ichthyophthirius" value={formData.scientific_name || ""} onChange={(e) => handleChange("scientific_name", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold italic text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0"/> {lang === 'id' ? "Nama biologis dari bakteri/parasit penyebab penyakit (opsional)." : "Biological name of the pathogen (optional)."}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.category || "Kategori"}</label>
                <select value={formData.disease_category || ""} onChange={(e) => handleChange("disease_category", e.target.value as DiseaseCategory)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors">
                  <option value="Parasitic">Parasitic (Parasit)</option>
                  <option value="Bacterial">Bacterial (Bakteri)</option>
                  <option value="Fungal">Fungal (Jamur)</option>
                  <option value="Viral">Viral (Virus)</option>
                  <option value="Environmental">Environmental (Lingkungan)</option>
                  <option value="Nutritional">Nutritional (Nutrisi)</option>
                  <option value="Protozoan">Protozoan (Protozoa)</option>
                  <option value="Genetic">Genetic (Genetik)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Klasifikasi patogen." : "Pathogen classification."}
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.severity || "Tingkat Keparahan"}</label>
                <input type="number" min="1" max="5" value={formData.severity || 3} onChange={(e) => handleChange("severity", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "1 (Ringan) s/d 5 (Fatal)." : "1 (Mild) to 5 (Lethal)."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.urgency || "Tingkat Urgensi"}</label>
                <select value={formData.urgency_level || ""} onChange={(e) => handleChange("urgency_level", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors">
                  <option value="Low">Low (Bisa ditunda)</option>
                  <option value="Medium">Medium (Segera tangani)</option>
                  <option value="High">High (Berbahaya)</option>
                  <option value="Critical">Critical (Darurat / Karantina)</option>
                  <option value="Emergency">Emergency (Kritis / Fatal)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Tingkat darurat saat terdeteksi." : "Emergency level upon detection."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.difficulty || "Tingkat Kesulitan"}</label>
                <select value={formData.difficulty || ""} onChange={(e) => handleChange("difficulty", e.target.value)} className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors">
                  <option value="Easy">Easy (Mudah)</option>
                  <option value="Medium">Medium (Sedang)</option>
                  <option value="Hard">Hard (Sulit)</option>
                  <option value="Expert">Expert (Sangat Sulit)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Kesulitan dalam pengobatan." : "Treatment difficulty."}
                </p>
              </div>
            </div>
          </div>

          {/* 3. DESKRIPSI & GEJALA */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.clinicalSigns || (lang === 'id' ? "Gejala Klinis & Deskripsi" : "Clinical Signs & Description")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Deskripsi Patologi (ID)" : "Pathology Description (ID)"}</label>
                <textarea rows={3} placeholder="Penjelasan singkat tentang penyakit ini..." value={formData.description_id || ""} onChange={(e) => handleChange("description_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Gambaran naratif tentang penyakit." : "Narrative overview of the disease."}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? "Deskripsi Patologi (EN)" : "Pathology Description (EN)"}</label>
                <textarea rows={3} placeholder="Brief explanation of the disease..." value={formData.description_en || ""} onChange={(e) => handleChange("description_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsId || (lang === 'id' ? "Gejala Fisik (ID)" : "Symptoms (ID)")}</label>
                <textarea rows={4} placeholder="- Ada bintik putih di sirip&#10;- Ikan sering menggesekkan badan" value={formData.symptoms_id || ""} onChange={(e) => handleChange("symptoms_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Ciri-ciri fisik yang terlihat pada tubuh ikan." : "Visible physical traits on the fish body."}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.symptomsEn || (lang === 'id' ? "Gejala Fisik (EN)" : "Symptoms (EN)")}</label>
                <textarea rows={4} placeholder="- White spots on fins&#10;- Fish flashing against objects" value={formData.symptoms_en || ""} onChange={(e) => handleChange("symptoms_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              </div>
            </div>
          </div>

          {/* 4. PROTOKOL PENGOBATAN */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              {formDict.treatmentSection || (lang === 'id' ? "Protokol Pengobatan" : "Treatment Protocol")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 transition-colors">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsId || (lang === 'id' ? "Langkah Pengobatan (ID)" : "Treatment Steps (ID)")}</label>
                <textarea rows={4} placeholder="1. Pindahkan ikan ke tank karantina." value={formData.treatments_id || ""} onChange={(e) => handleChange("treatments_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-1.5 mt-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Langkah pengobatan yang dianjurkan (Gunakan poin nomor)." : "Recommended steps (Use numbering)."}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formDict.treatmentsEn || (lang === 'id' ? "Langkah Pengobatan (EN)" : "Treatment Steps (EN)")}</label>
                <textarea rows={4} placeholder="1. Move fish to quarantine tank." value={formData.treatments_en || ""} onChange={(e) => handleChange("treatments_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
              </div>
            </div>
          </div>

          {/* 5. METRIK LANJUTAN & PENCEGAHAN */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-black text-rose-800 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900/40 pb-2 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-500" />
              {formDict.advancedMetrics || (lang === 'id' ? "Metrik Klinis & Pencegahan" : "Clinical Metrics")}
            </h3>
            
            <div className="bg-rose-50/50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-rose-200 dark:border-slate-800 space-y-6 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-rose-900 dark:text-rose-400 font-bold text-xs uppercase tracking-widest">
                    {formDict.mortalityRisk || (lang === 'id' ? "Mortalitas (1-5)" : "Mortality Risk (1-5)")}
                  </label>
                  <input type="number" min="1" max="5" value={formData.mortality_risk || 3} onChange={(e) => handleChange("mortality_risk", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-rose-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-rose-800/70 dark:text-rose-300/70 leading-snug flex items-start gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Skala 1 (Rendah) hingga 5 (Sangat Mematikan)." : "Scale 1 (Low) to 5 (Extremely Lethal)."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-rose-900 dark:text-rose-400 font-bold text-xs uppercase tracking-widest">
                    {formDict.durationDays || (lang === 'id' ? "Durasi Sembuh (Hari)" : "Recovery Duration (Days)")}
                  </label>
                  <input type="number" min="1" value={formData.treatment_duration_days || 7} onChange={(e) => handleChange("treatment_duration_days", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-rose-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-rose-800/70 dark:text-rose-300/70 leading-snug flex items-start gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Estimasi waktu pengobatan hingga ikan sembuh." : "Estimated treatment time for full recovery."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-rose-900 dark:text-rose-400 font-bold text-xs uppercase tracking-widest">
                    {formDict.recoveryProb || (lang === 'id' ? "Peluang Hidup (%)" : "Survival Rate (%)")}
                  </label>
                  <input type="number" min="1" max="100" value={formData.recovery_probability || 70} onChange={(e) => handleChange("recovery_probability", Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-rose-500 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-rose-800/70 dark:text-rose-300/70 leading-snug flex items-start gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" /> {lang === 'id' ? "Persentase harapan hidup jika diberi penanganan." : "Survival rate percentage if given proper treatment."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl transition-colors">
                  <input type="checkbox" checked={formData.contagious || false} onChange={(e) => handleChange("contagious", e.target.checked)} className="h-4 w-4 rounded accent-rose-600 border-slate-300 dark:border-slate-700" />
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{formDict.contagious || (lang === 'id' ? "Sangat Menular?" : "Highly Contagious?")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl transition-colors">
                  <input type="checkbox" checked={formData.quarantine_required || false} onChange={(e) => handleChange("quarantine_required", e.target.checked)} className="h-4 w-4 rounded accent-amber-500 border-slate-300 dark:border-slate-700" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-500">{formDict.quarantineReq || (lang === 'id' ? "Wajib Karantina?" : "Mandatory Quarantine?")}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">{formDict.preventionId || (lang === 'id' ? "Cara Pencegahan (ID)" : "Prevention (ID)")}</label>
                  <textarea rows={3} placeholder="Jaga kualitas air tetap stabil..." value={formData.prevention_id || ""} onChange={(e) => handleChange("prevention_id", e.target.value)} className="w-full p-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-rose-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
                  <p className="text-[11px] text-rose-800/70 dark:text-rose-300/70 leading-snug flex items-start gap-1.5 mt-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {lang === 'id' ? "Langkah-langkah untuk mencegah penyakit ini kembali." : "Steps to prevent this disease from recurring."}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">{formDict.preventionEn || (lang === 'en' ? "Cara Pencegahan (EN)" : "Prevention (EN)")}</label>
                  <textarea rows={3} placeholder="Keep water parameters stable..." value={formData.prevention_en || ""} onChange={(e) => handleChange("prevention_en", e.target.value)} className="w-full p-3 rounded-xl border-2 border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-rose-500 outline-none font-medium custom-scrollbar text-slate-800 dark:text-slate-100 transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">{formDict.expertNotesId || (lang === 'id' ? "Catatan Pakar (ID)" : "Expert Notes (ID)")}</label>
                  <textarea 
                    rows={2} 
                    placeholder="Perhatian: Gunakan sarung tangan saat menangani ikan." 
                    value={formData.expert_notes_id || ""} 
                    onChange={(e) => handleChange("expert_notes_id", e.target.value)} 
                    className="w-full p-3 rounded-xl border-2 border-amber-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-900 focus:border-amber-500 dark:focus:border-amber-400 outline-none font-medium custom-scrollbar text-amber-900 dark:text-slate-100 placeholder:text-amber-700/50 dark:placeholder:text-slate-500 transition-colors" 
                  />
                  <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 leading-snug flex items-start gap-1.5 mt-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {lang === 'id' ? "Saran atau peringatan khusus dari ahli akuatik (opsional)." : "Special advice or warning from aquatic experts (optional)."}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">{formDict.expertNotesEn || (lang === 'en' ? "Catatan Pakar (EN)" : "Expert Notes (EN)")}</label>
                  <textarea 
                    rows={2} 
                    placeholder="Warning: Wear gloves when handling fish." 
                    value={formData.expert_notes_en || ""} 
                    onChange={(e) => handleChange("expert_notes_en", e.target.value)} 
                    className="w-full p-3 rounded-xl border-2 border-amber-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-900 focus:border-amber-500 dark:focus:border-amber-400 outline-none font-medium custom-scrollbar text-amber-900 dark:text-slate-100 placeholder:text-amber-700/50 dark:placeholder:text-slate-500 transition-colors" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            
            {mode === "edit" && initialData && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsArchiveModalOpen(true)}
                  disabled={loadingAction || isSubmitting}
                  className="h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400 flex items-center gap-2 transition-all"
                >
                  <Archive className="w-4 h-4" />
                  {initialData.is_active === false 
                    ? (arcDict.unarchive || (lang === 'id' ? "Pulihkan" : "Restore")) 
                    : (arcDict.archive || (lang === 'id' ? "Arsipkan" : "Archive"))}
                </Button>

                {role === "super_admin" && (
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
            )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || loadingAction} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors">
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

      {/* MODAL ARCHIVE */}
      {mounted && isArchiveModalOpen && initialData && createPortal(
        <div 
          className="flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200 ease-out"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-amber-500 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              {arcDict.modalArchiveTitle || (lang === 'id' ? "Arsipkan Data?" : "Archive Data?")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {arcDict.modalArchiveDesc || (lang === 'id' ? "Data ini akan disembunyikan dari AI." : "This data will be hidden from the AI.")}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                type="button" 
                onClick={executeArchive} 
                disabled={loadingAction} 
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all"
              >
                {loadingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? "KONFIRMASI" : "CONFIRM")}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsArchiveModalOpen(false)} 
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

      {/* MODAL DELETE */}
      {mounted && isDeleteModalOpen && initialData && createPortal(
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
              {lang === 'id' ? "Data patogen akan dihapus permanen." : "Pathogen data will be permanently deleted."}
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 mb-6">
              <label className="text-[10px] font-black uppercase text-red-500 tracking-widest block mb-2 text-center">
                {lang === 'id' ? "Ketik nama untuk konfirmasi:" : "Type name to confirm:"}
              </label>
              <div className="text-center font-bold text-slate-800 dark:text-slate-200 mb-2 select-all bg-white dark:bg-slate-900 py-1 border border-slate-200 dark:border-slate-700 rounded">
                {lang === 'en' && initialData.name_en ? initialData.name_en : initialData.name_id}
              </div>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="h-11 w-full text-center font-bold bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 focus:border-red-500 outline-none rounded-md transition-colors" />
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                type="button" 
                onClick={executeHardDelete} 
                disabled={loadingAction || deleteConfirmText !== (lang === 'en' && initialData.name_en ? initialData.name_en : initialData.name_id)} 
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