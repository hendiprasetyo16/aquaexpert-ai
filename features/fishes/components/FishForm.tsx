// features/fishes/components/FishForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client"; 
import { deleteFish, uploadFishImage, removeFishImage } from "../repositories/fish.repository";
import { createFishAction, updateFishAction, hardDeleteFishAction } from "../actions/fish.actions";
import { Fish as FishType } from "../types/fish.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus, Archive, Trash2, X, Images, Brain, AlertTriangle, Fish as FishIcon, Droplets } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider"; 

// MENGAMBIL HELPER TANK STYLE
import { getFishTypeDesc, getCompatibilityDesc, getTankStyleDesc } from "./fish-helpers";

interface FishFormProps {
  mode?: "create" | "edit";
  fish?: FishType;
}

const TANK_STYLES_OPTIONS = ["Nature", "Dutch", "Iwagumi", "Biotope", "Blackwater", "Community", "Predator"];

interface FishFormDict {
  visualSection: string; coverLabel: string; changeCover: string; uploadCover: string;
  galleryLabel: string; addGallery: string; saved: string; new: string;
  identitasSection: string; nameIdLabel: string; nameEnLabel: string;
  nameIdPlaceholder: string; nameEnPlaceholder: string; scientificNameLabel: string;
  difficultyLabel: string; fishTypeLabel: string; compatibilityLabel: string;
  waterParamSection: string; tempMin: string; tempMax: string; phMin: string; phMax: string;
  descSectionId: string; descSectionEn: string; descIdPlaceholder: string; descEnPlaceholder: string;
  expertEngineSection: string; minTankSize: string; adultSize: string; bioloadFactor: string;
  schoolingFish: string; minGroupSize: string; expertNotesId: string; expertNotesEn: string;
  expertNotesIdPlaceholder: string; expertNotesEnPlaceholder: string;
  btnArchive: string; btnHardDelete: string; btnCancel: string; btnSave: string; btnUpdate: string; processing: string;
  modalArchiveTitle: string; modalArchiveDesc1: string; modalArchiveDesc2: string; btnConfirmArchive: string;
  modalDeleteTitle: string; modalDeleteDesc1: string; modalDeleteDesc2: string; modalDeleteDesc3: string;
  modalDeleteDesc4: string; typeFishName: string; btnConfirmDelete: string;
}

// Letakkan sebelum export default function FishForm(...) {
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

export default function FishForm({ mode = "create", fish }: FishFormProps) {
  const router = useRouter();
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [newGallery, setNewGallery] = useState<{file: File, preview: string}[]>([]);
  const imagesToDeleteRef = useRef<string[]>([]);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [formData, setFormData] = useState({
    name_id: "", name_en: "", 
    description_id: "", description_en: "", 
    expert_notes_id: "", expert_notes_en: "",
    scientific_name: "", 
    min_tank_size: "", 
    ideal_ph_min: "", ideal_ph_max: "",
    ideal_temp_min: "", ideal_temp_max: "",
    hardness_min: "", hardness_max: "", 
    lifespan_years: "", 
    compatibility: "Peaceful",
    temperament_score: "2", 
    water_layer: "Middle", 
    origin_region: "Asia", 
    adult_behavior: "Schooling", 
    activity_level: "Medium", 
    schooling: false, 
    min_group_size: "", max_group_size: "", 
    fish_type: "Tetra", 
    difficulty: "Easy",
    estimated_adult_size_cm: "", bioload_factor: "",
    shrimp_safe: true, plant_safe: true,
    recommended_tank_styles: [] as string[],
    breeding_difficulty: "2", // Diubah ke string numerik "2"
    is_egg_layer: false, is_livebearer: false,
    
    // NEW EXPERT METRICS COLUMNS
    minimum_tank_length_cm: "",
    territorial: false,
    predatory: false,
    mouth_size_factor: "1",
    activity_period: "Diurnal",
    shrimp_predation_risk: "0",
    native_biotope: "",
    uproots_plants: false,
    oxygen_requirement_score: "5",
    current_preference: "Medium",
    waste_production_score: "5",
    jump_risk: false,
    sensitive_to_nitrate: false,
    conservation_status: "Least Concern"
  });

  useEffect(() => {
    if (mode === "edit" && fish) {
      setFormData({
        name_id: fish.name_id || "", name_en: fish.name_en || "",
        description_id: fish.description_id || "", description_en: fish.description_en || "",
        expert_notes_id: fish.expert_notes_id || "", expert_notes_en: fish.expert_notes_en || "",
        scientific_name: fish.scientific_name || "", 
        min_tank_size: fish.min_tank_size != null ? fish.min_tank_size.toString() : "",
        ideal_ph_min: fish.ideal_ph_min != null ? fish.ideal_ph_min.toString() : "", 
        ideal_ph_max: fish.ideal_ph_max != null ? fish.ideal_ph_max.toString() : "",
        ideal_temp_min: fish.ideal_temp_min != null ? fish.ideal_temp_min.toString() : "",
        ideal_temp_max: fish.ideal_temp_max != null ? fish.ideal_temp_max.toString() : "",
        hardness_min: fish.hardness_min != null ? fish.hardness_min.toString() : "", 
        hardness_max: fish.hardness_max != null ? fish.hardness_max.toString() : "", 
        lifespan_years: fish.lifespan_years != null ? fish.lifespan_years.toString() : "", 
        compatibility: fish.compatibility || "Peaceful",
        temperament_score: fish.temperament_score != null ? fish.temperament_score.toString() : "2", 
        water_layer: fish.water_layer || "Middle", 
        origin_region: fish.origin_region || "Asia", 
        adult_behavior: fish.adult_behavior || "Schooling", 
        activity_level: fish.activity_level || "Medium", 
        schooling: fish.schooling || false,
        min_group_size: fish.min_group_size != null ? fish.min_group_size.toString() : "",
        max_group_size: fish.max_group_size != null ? fish.max_group_size.toString() : "", 
        fish_type: fish.fish_type || "Tetra",
        difficulty: fish.difficulty || "Easy",
        estimated_adult_size_cm: fish.estimated_adult_size_cm != null ? fish.estimated_adult_size_cm.toString() : "",
        bioload_factor: fish.bioload_factor != null ? fish.bioload_factor.toString() : "",
        shrimp_safe: fish.shrimp_safe ?? true,
        plant_safe: fish.plant_safe ?? true,
        recommended_tank_styles: fish.recommended_tank_styles || [],
        breeding_difficulty: fish.breeding_difficulty?.toString() || "2",
        is_egg_layer: fish.is_egg_layer || false,
        is_livebearer: fish.is_livebearer || false,
        
        // NEW EXPERT METRICS COLUMNS
        minimum_tank_length_cm: fish.minimum_tank_length_cm != null ? fish.minimum_tank_length_cm.toString() : "",
        territorial: fish.territorial || false,
        predatory: fish.predatory || false,
        mouth_size_factor: fish.mouth_size_factor != null ? fish.mouth_size_factor.toString() : "1",
        activity_period: fish.activity_period || "Diurnal",
        shrimp_predation_risk: fish.shrimp_predation_risk != null ? fish.shrimp_predation_risk.toString() : "0",
        native_biotope: fish.native_biotope || "",
        uproots_plants: fish.uproots_plants || false,
        oxygen_requirement_score: fish.oxygen_requirement_score != null ? fish.oxygen_requirement_score.toString() : "5",
        current_preference: fish.current_preference || "Medium",
        waste_production_score: fish.waste_production_score != null ? fish.waste_production_score.toString() : "5",
        jump_risk: fish.jump_risk || false,
        sensitive_to_nitrate: fish.sensitive_to_nitrate || false,
        conservation_status: fish.conservation_status || "Least Concern"
      });

      if (fish.image_url) setCoverPreview(fish.image_url);
      if (fish.gallery_urls) setExistingGallery(fish.gallery_urls);
    }
  }, [fish, mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean | string[] = value;
    if (type === "checkbox") finalValue = (e.target as HTMLInputElement).checked;
    else if (type === "number") finalValue = value === "" ? "" : Number(value);
    
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  }

  function handleStyleToggle(style: string) {
    setFormData(prev => {
      const exists = prev.recommended_tank_styles.includes(style);
      if (exists) return { ...prev, recommended_tank_styles: prev.recommended_tank_styles.filter(s => s !== style) };
      return { ...prev, recommended_tank_styles: [...prev.recommended_tank_styles, style] };
    });
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      if (!validTypes.includes(originalFile.type)) { 
        // Sesuaikan state error ini dengan state error yang kamu gunakan di FishForm
        toast.error("Format Cover harus JPG, PNG atau WEBP."); 
        return; 
      }

      try {
        // 🔥 Lakukan kompresi otomatis
        const compressedFile = await compressImage(originalFile);
        
        setCoverFile(compressedFile); 
        setCoverPreview(URL.createObjectURL(compressedFile));
        
        if (mode === "edit" && fish?.image_url && !imagesToDeleteRef.current.includes(fish.image_url)) {
          imagesToDeleteRef.current.push(fish.image_url);
        }
      } catch (err) {
        toast.error("Gagal memproses kompresi gambar.");
      }
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      // Hanya terima yang formatnya valid, abaikan ukuran file karena akan dikompres
      const validFiles = filesArray.filter(f => validTypes.includes(f.type));
      if (validFiles.length !== filesArray.length) {
        toast.error("Beberapa file diabaikan karena format bukan JPG/PNG/WEBP.");
      }

      const spaceLeft = 8 - (existingGallery.length + newGallery.length);
      if (spaceLeft <= 0) { 
        toast.error("Maksimal 8 gambar pada galeri."); 
        return; 
      }

      // Ambil file yang cukup untuk mengisi sisa slot
      const filesToProcess = validFiles.slice(0, spaceLeft);
      
      try {
        // 🔥 Kompres seluruh gambar galeri yang dipilih pengguna secara paralel
        const compressedFiles = await Promise.all(
          filesToProcess.map(file => compressImage(file))
        );

        const filesToAdd = compressedFiles.map(file => ({ 
          file, 
          preview: URL.createObjectURL(file) 
        }));
        
        setNewGallery([...newGallery, ...filesToAdd]);
      } catch (err) {
        toast.error("Gagal memproses kompresi galeri gambar.");
      }
    }
  }

  function removeExistingGallery(index: number) {
    const urlToRemove = existingGallery[index];
    if (!imagesToDeleteRef.current.includes(urlToRemove)) imagesToDeleteRef.current.push(urlToRemove);
    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  }
  function removeNewGallery(index: number) { setNewGallery(prev => prev.filter((_, i) => i !== index)); }

  function validateBiologicalData() {
    if (formData.ideal_ph_min && formData.ideal_ph_max && Number(formData.ideal_ph_min) > Number(formData.ideal_ph_max)) {
      throw new Error(lang === 'id' ? "Validasi Gagal: pH Min tidak boleh lebih besar dari pH Max." : "Validation Failed: Min pH cannot be greater than Max pH.");
    }
    if (formData.ideal_temp_min && formData.ideal_temp_max && Number(formData.ideal_temp_min) > Number(formData.ideal_temp_max)) {
      throw new Error(lang === 'id' ? "Validasi Gagal: Suhu Min tidak boleh lebih besar dari Suhu Max." : "Validation Failed: Min Temp cannot be greater than Max Temp.");
    }
    if (formData.hardness_min && formData.hardness_max && Number(formData.hardness_min) > Number(formData.hardness_max)) {
      throw new Error(lang === 'id' ? "Validasi Gagal: GH Min tidak boleh lebih besar dari GH Max." : "Validation Failed: Min GH cannot be greater than Max GH.");
    }
    if (formData.min_group_size && formData.max_group_size && Number(formData.min_group_size) > Number(formData.max_group_size)) {
      throw new Error(lang === 'id' ? "Validasi Gagal: Group Size Min tidak boleh melebihi Max." : "Validation Failed: Min Group Size cannot exceed Max.");
    }
    if (formData.min_tank_size && Number(formData.min_tank_size) < 0) {
      throw new Error(lang === 'id' ? "Validasi Gagal: Volume Tangki tidak boleh minus." : "Validation Failed: Tank Volume cannot be negative.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const uploadedImagesToRollback: string[] = [];

    try {
      setLoading(true); setError(null);
      validateBiologicalData(); 
      
      const supabase = createClient();
      const cleanNameId = formData.name_id.trim();

      let query = supabase.from("fishes").select("id").ilike("name_id", cleanNameId).eq("is_active", true);
      if (mode === "edit" && fish) query = query.neq("id", fish.id);

      const { data: existingFish, error: checkError } = await query.maybeSingle();
      if (checkError) throw new Error(checkError.message);
      if (existingFish) { 
        setError(lang === 'id' ? "Nama ikan duplikat." : "Duplicate fish name."); 
        return; 
      }

      let finalCoverUrl = mode === "edit" ? (fish?.image_url || "") : "";
      let finalGalleryUrls = [...existingGallery];
      const fishSlug = mode === "edit" ? fish?.slug || cleanNameId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : cleanNameId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      if (coverFile) {
        finalCoverUrl = await uploadFishImage(coverFile, fishSlug, `cover`);
        uploadedImagesToRollback.push(finalCoverUrl);
      }

      for (let i = 0; i < newGallery.length; i++) {
         const gUrl = await uploadFishImage(newGallery[i].file, fishSlug, `gallery`);
         finalGalleryUrls.push(gUrl);
         uploadedImagesToRollback.push(gUrl);
      }

      const payload: Partial<FishType> = {
        name_id: cleanNameId,
        name_en: formData.name_en.trim(),
        description_id: formData.description_id,
        description_en: formData.description_en,
        expert_notes_id: formData.expert_notes_id,
        expert_notes_en: formData.expert_notes_en,
        scientific_name: formData.scientific_name,
        min_tank_size: formData.min_tank_size ? parseInt(formData.min_tank_size.toString()) : null,
        ideal_ph_min: formData.ideal_ph_min ? parseFloat(formData.ideal_ph_min.toString()) : null,
        ideal_ph_max: formData.ideal_ph_max ? parseFloat(formData.ideal_ph_max.toString()) : null,
        ideal_temp_min: formData.ideal_temp_min ? parseFloat(formData.ideal_temp_min.toString()) : null,
        ideal_temp_max: formData.ideal_temp_max ? parseFloat(formData.ideal_temp_max.toString()) : null,
        hardness_min: formData.hardness_min ? parseFloat(formData.hardness_min.toString()) : null, 
        hardness_max: formData.hardness_max ? parseFloat(formData.hardness_max.toString()) : null, 
        lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years.toString()) : null, 
        compatibility: formData.compatibility,
        temperament_score: formData.temperament_score ? parseInt(formData.temperament_score.toString()) : null, 
        water_layer: formData.water_layer, 
        origin_region: formData.origin_region, 
        adult_behavior: formData.adult_behavior, 
        activity_level: formData.activity_level, 
        schooling: formData.schooling,
        min_group_size: formData.min_group_size ? parseInt(formData.min_group_size.toString()) : null,
        max_group_size: formData.max_group_size ? parseInt(formData.max_group_size.toString()) : null, 
        fish_type: formData.fish_type,
        difficulty: formData.difficulty,
        estimated_adult_size_cm: formData.estimated_adult_size_cm ? parseFloat(formData.estimated_adult_size_cm.toString()) : null,
        bioload_factor: formData.bioload_factor ? parseFloat(formData.bioload_factor.toString()) : null,
        shrimp_safe: formData.shrimp_safe,
        plant_safe: formData.plant_safe,
        recommended_tank_styles: formData.recommended_tank_styles,
        breeding_difficulty: formData.breeding_difficulty ? parseInt(formData.breeding_difficulty.toString()) : null,
        is_egg_layer: formData.is_egg_layer,
        is_livebearer: formData.is_livebearer,
        
        // NEW EXPERT METRICS COLUMNS
        minimum_tank_length_cm: formData.minimum_tank_length_cm ? parseInt(formData.minimum_tank_length_cm.toString()) : null,
        territorial: formData.territorial,
        predatory: formData.predatory,
        mouth_size_factor: formData.mouth_size_factor ? parseFloat(formData.mouth_size_factor.toString()) : null,
        activity_period: formData.activity_period,
        shrimp_predation_risk: formData.shrimp_predation_risk ? parseInt(formData.shrimp_predation_risk.toString()) : null,
        native_biotope: formData.native_biotope,
        uproots_plants: formData.uproots_plants,
        oxygen_requirement_score: formData.oxygen_requirement_score ? parseInt(formData.oxygen_requirement_score.toString()) : null,
        current_preference: formData.current_preference,
        waste_production_score: formData.waste_production_score ? parseInt(formData.waste_production_score.toString()) : null,
        jump_risk: formData.jump_risk,
        sensitive_to_nitrate: formData.sensitive_to_nitrate,
        conservation_status: formData.conservation_status,

        image_url: finalCoverUrl,
        gallery_urls: finalGalleryUrls,
      };

      if (mode === "create") {
        const result = await createFishAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success(lang === 'id' ? "Ikan berhasil ditambahkan!" : "Fish added successfully!");
      } else {
        const result = await updateFishAction(fish!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success(lang === 'id' ? "Ikan berhasil diperbarui!" : "Fish updated successfully!");
      }

      for (const urlToDelete of imagesToDeleteRef.current) {
        try { await removeFishImage(urlToDelete); } catch (err) {}
      }
      imagesToDeleteRef.current = [];
      router.push("/dashboard/fishes");
      router.refresh();

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (lang === 'id' ? "Gagal menyimpan data." : "Failed to save data.");
      setError(errMsg);
      toast.error(errMsg);
      if (uploadedImagesToRollback.length > 0) {
        for (const orphanUrl of uploadedImagesToRollback) { await removeFishImage(orphanUrl); }
      }
    } finally { setLoading(false); }
  }

  function triggerArchiveModal() { if (!fish || mode !== "edit") return; setIsArchiveModalOpen(true); }
  async function executeArchive() {
    if (!fish || mode !== "edit") return;
    try { 
      setLoading(true); await deleteFish(fish.id); toast.success(lang === 'id' ? "Diarsipkan." : "Archived."); 
      router.push("/dashboard/fishes"); router.refresh();
    } catch (error: unknown) { toast.error(lang === 'id' ? "Gagal mengarsipkan." : "Failed to archive."); } finally { setLoading(false); setIsArchiveModalOpen(false); }
  }

  function triggerHardDeleteModal() { if (!fish) return; setDeleteConfirmText(""); setIsDeleteModalOpen(true); }
  async function executeHardDelete(e: React.FormEvent) {
    e.preventDefault(); if (!fish) return;
    const currentName = lang === 'en' && fish.name_en ? fish.name_en : fish.name_id;
    if (deleteConfirmText !== currentName) { toast.error(lang === 'id' ? "Nama tidak cocok." : "Name mismatch."); return; }
    try { 
      setLoading(true); 
      const result = await hardDeleteFishAction(fish.id); 
      if (!result.success) throw new Error(result.error);
      toast.success(lang === 'id' ? "Dihapus permanen." : "Deleted permanently."); router.push("/dashboard/fishes"); router.refresh();
    } catch (error: unknown) { toast.error(lang === 'id' ? "Gagal menghapus." : "Failed to delete."); } finally { setLoading(false); setIsDeleteModalOpen(false); }
  }

  const rootDict = dict as unknown as { fishForm: FishFormDict };
  if (!rootDict.fishForm) return null; 
  const formDict = rootDict.fishForm;

  return (
    <div className="w-full transition-colors duration-300">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl w-full transition-colors duration-300">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BAGIAN 1: VISUAL IKAN */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Images className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {formDict.visualSection}
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.coverLabel}</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                    {lang === 'id' ? "Foto rasio lanskap/lebar (Max 2MB). Akan jadi foto utama." : "Landscape ratio photo (Max 2MB). Will be the main cover."}
                  </p>
                  <input id="cover-image" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  <label htmlFor="cover-image" className="cursor-pointer block">
                    <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-white dark:bg-slate-900 h-48 flex flex-col items-center justify-center">
                      {coverPreview ? (
                        <div className="relative h-full w-full">
                           <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-white text-sm font-medium">{formDict.changeCover}</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500">
                          <ImagePlus className="h-10 w-10 mb-2" />
                          <span className="text-sm font-medium">{formDict.uploadCover}</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.galleryLabel}</Label>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({existingGallery.length + newGallery.length}/8 Max)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                    {lang === 'id' ? "Foto rasio persegi/kotak sangat disarankan (Max 2MB/foto)." : "Square ratio photos highly recommended (Max 2MB/photo)."}
                  </p>
                  
                  {existingGallery.length + newGallery.length < 8 && (
                    <>
                      <input id="gallery-image" type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                      <label htmlFor="gallery-image" className="cursor-pointer block mb-3 border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors font-medium text-sm">
                        {formDict.addGallery}
                      </label>
                    </>
                  )}

                  {(existingGallery.length > 0 || newGallery.length > 0) && (
                    <div className="grid grid-cols-4 gap-2">
                       {existingGallery.map((url, i) => (
                         <div key={`exist-${i}`} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 group border border-slate-300 dark:border-slate-700">
                            <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-slate-200 py-0.5 z-10">{formDict.saved}</div>
                            <button type="button" onClick={() => removeExistingGallery(i)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="h-3 w-3"/></button>
                         </div>
                       ))}
                       {newGallery.map((item, i) => (
                         <div key={`new-${i}`} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 group border-2 border-blue-500">
                            <Image src={item.preview} alt={`New ${i}`} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[9px] text-center text-white py-0.5 font-bold z-10">{formDict.new}</div>
                            <button type="button" onClick={() => removeNewGallery(i)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="h-3 w-3"/></button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BAGIAN 2: IDENTITAS & ASAL-USUL */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2 bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-gray-900 dark:text-slate-200 flex items-center gap-2">
                  <FishIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {formDict.identitasSection}
                </h3>
                <div className="grid gap-5 md:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.nameIdLabel}</Label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Nama umum ikan di pasar Indonesia." : "Common fish name in Indonesian market."}</p>
                    <Input name="name_id" required value={formData.name_id} onChange={handleChange} placeholder={formDict.nameIdPlaceholder} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.nameEnLabel}</Label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Nama umum ikan dalam bahasa Inggris." : "Common fish name in English."}</p>
                    <Input name="name_en" value={formData.name_en} onChange={handleChange} placeholder={formDict.nameEnPlaceholder} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100 h-11" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/50">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.scientificNameLabel}</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Nama latin untuk identifikasi akurat secara global." : "Latin name for accurate global identification."}</p>
                  <Input name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="italic bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100 h-11" placeholder="Cth: Paracheirodon innesi" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.fishTypeLabel}</Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Pilih keluarga besar ikan." : "Select the fish family."}</p>
                <select name="fish_type" value={formData.fish_type} onChange={handleChange} className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 font-medium">
                  <option value="Tetra">{getFishTypeDesc("Tetra", lang)}</option>
                  <option value="Cichlid">{getFishTypeDesc("Cichlid", lang)}</option>
                  <option value="Livebearer">{getFishTypeDesc("Livebearer", lang)}</option>
                  <option value="Betta">{getFishTypeDesc("Betta", lang)}</option>
                  <option value="Labyrinth">{getFishTypeDesc("Labyrinth", lang)}</option>
                  <option value="Loach">{getFishTypeDesc("Loach", lang)}</option>
                  <option value="Catfish">{getFishTypeDesc("Catfish", lang)}</option>
                  <option value="Rasbora">{getFishTypeDesc("Rasbora", lang)}</option>
                  <option value="Invertebrate">{getFishTypeDesc("Invertebrate", lang)}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">{lang === 'id' ? "Wilayah Asal (Origin Region)" : "Origin Region"}</Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Berguna untuk setup tank bertema biotope." : "Useful for biotope themed tank setups."}</p>
                <select name="origin_region" value={formData.origin_region} onChange={handleChange} className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 font-medium">
                  <option value="South America">{lang === 'id' ? "Amerika Selatan (Amazon)" : "South America (Amazon)"}</option>
                  <option value="Asia">Asia</option>
                  <option value="Africa">{lang === 'id' ? "Afrika" : "Africa"}</option>
                  <option value="Central America">{lang === 'id' ? "Amerika Tengah" : "Central America"}</option>
                  <option value="North America">{lang === 'id' ? "Amerika Utara" : "North America"}</option>
                  <option value="Australia">{lang === 'id' ? "Australia & Oceania" : "Australia & Oceania"}</option>
                  <option value="Global (Bred)">{lang === 'id' ? "Global (Hasil Budidaya)" : "Global (Captive Bred)"}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">{lang === 'id' ? "Zona Renang (Water Layer)" : "Swimming Zone"}</Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Area utama ikan ini berenang di dalam akuarium." : "Primary area where the fish swims in the tank."}</p>
                <select name="water_layer" value={formData.water_layer} onChange={handleChange} className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 font-medium">
                  <option value="Top">{lang === 'id' ? "Top (Permukaan Atas)" : "Top (Surface)"}</option>
                  <option value="Middle">{lang === 'id' ? "Middle (Area Tengah)" : "Middle (Mid-water)"}</option>
                  <option value="Bottom">{lang === 'id' ? "Bottom (Dasar Pasir)" : "Bottom (Substrate)"}</option>
                  <option value="All Levels">{lang === 'id' ? "Semua Level (Aktif ke Atas & Bawah)" : "All Levels"}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">{lang === 'id' ? "Usia Maksimal" : "Max Lifespan"}</Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Angka estimasi dalam hitungan Tahun." : "Estimated numbers in Years."}</p>
                <div className="relative">
                  <Input type="number" min="0" name="lifespan_years" value={formData.lifespan_years} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100 h-11 pr-16" placeholder="Cth: 5" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{lang === 'id' ? 'Tahun' : 'Years'}</span>
                </div>
              </div>
            </div>

            {/* BAGIAN 3: PARAMETER LINGKUNGAN AIR */}
            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {formDict.waterParamSection}
                </h3>
                <p className="text-[11px] mt-2 text-slate-500 dark:text-slate-400 leading-tight">
                  {lang === 'id' 
                    ? "Isikan batas minimum dan maksimum toleransi air agar sistem AI dapat menghitung kecocokan akuarium user." 
                    : "Fill in the minimum and maximum water tolerance limits so the AI can calculate tank suitability."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">{formDict.tempMin}</Label><Input type="number" step="0.1" name="ideal_temp_min" value={formData.ideal_temp_min} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="22.0"/></div>
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">{formDict.tempMax}</Label><Input type="number" step="0.1" name="ideal_temp_max" value={formData.ideal_temp_max} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="28.0"/></div>
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">{formDict.phMin}</Label><Input type="number" step="0.1" name="ideal_ph_min" value={formData.ideal_ph_min} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="6.0"/></div>
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">{formDict.phMax}</Label><Input type="number" step="0.1" name="ideal_ph_max" value={formData.ideal_ph_max} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="7.5"/></div>
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">GH Min (Hardness)</Label><Input type="number" step="0.1" name="hardness_min" value={formData.hardness_min} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="2"/></div>
                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">GH Max (Hardness)</Label><Input type="number" step="0.1" name="hardness_max" value={formData.hardness_max} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-10" placeholder="10"/></div>
              </div>
            </div>

            {/* BAGIAN DESKRIPSI SPESIES */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.descSectionId}</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{lang === 'id' ? "Penjelasan singkat tentang ikan ini untuk dibaca pengguna berbahasa Indonesia." : "Short explanation for Indonesian readers."}</p>
                  <textarea name="description_id" rows={4} value={formData.description_id} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 outline-none resize-y focus:border-blue-500 text-sm text-slate-900 dark:text-slate-100" placeholder={formDict.descIdPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold">{formDict.descSectionEn}</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">A short explanation about this fish for English-speaking users.</p>
                  <textarea name="description_en" rows={4} value={formData.description_en} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 outline-none resize-y focus:border-blue-500 text-sm text-slate-900 dark:text-slate-100" placeholder={formDict.descEnPlaceholder} />
                </div>
            </div>

            {/* BAGIAN 4: FISH EXPERT SYSTEM KUSTOMISASI KETAT */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-6 shadow-inner">
              <div>
                <h3 className="text-lg font-black text-blue-800 dark:text-blue-400 flex items-center gap-2">
                  <Brain className="h-5 w-5" /> {formDict.expertEngineSection}
                </h3>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 mb-2">{lang === 'id' ? "Parameter tingkat lanjut. Diperlukan agar mesin rekomendasi AI (Fish Expert) bekerja 100% akurat." : "Advanced parameters. Required for the AI recommendation engine to work 100% accurately."}</p>
              </div>
              
              <div className="grid gap-5 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{formDict.minTankSize}</Label>
                  <Input type="number" min="0" name="min_tank_size" value={formData.min_tank_size} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="Cth: 60" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "P. Tangki Min (cm)" : "Min Tank Length (cm)"}</Label>
                  <Input type="number" min="0" name="minimum_tank_length_cm" value={formData.minimum_tank_length_cm} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="Cth: 45" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{formDict.adultSize}</Label>
                  <Input type="number" min="0" step="0.1" name="estimated_adult_size_cm" value={formData.estimated_adult_size_cm} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="Cth: 4.5" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{formDict.bioloadFactor}</Label>
                  <Input type="number" min="0" step="0.1" name="bioload_factor" value={formData.bioload_factor} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="Cth: 1.5" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Skor Agresi (1-5)" : "Aggression Score (1-5)"}</Label>
                  <select name="temperament_score" value={formData.temperament_score} onChange={handleChange} className="h-11 w-full rounded-md border border-blue-300 dark:border-blue-800/60 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 font-medium text-sm text-slate-900 dark:text-slate-100">
                    <option value="1">{lang === 'id' ? "1 - Sangat Damai (Pemalu)" : "1 - Very Peaceful (Shy)"}</option>
                    <option value="2">{lang === 'id' ? "2 - Damai (Normal)" : "2 - Peaceful (Normal)"}</option>
                    <option value="3">{lang === 'id' ? "3 - Semi-Agresif / Teritorial" : "3 - Semi-Aggressive / Territorial"}</option>
                    <option value="4">{lang === 'id' ? "4 - Pemarah / Usil Gigit Sirip" : "4 - Aggressive / Fin Nipper"}</option>
                    <option value="5">{lang === 'id' ? "5 - Predator Mutlak" : "5 - Absolute Predator"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{formDict.compatibilityLabel}</Label>
                  <select name="compatibility" value={formData.compatibility} onChange={handleChange} className="h-11 w-full rounded-md border border-blue-300 dark:border-blue-800/60 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 font-medium text-sm text-slate-900 dark:text-slate-100">
                    <option value="Peaceful">{getCompatibilityDesc("Peaceful", lang)}</option>
                    <option value="Semi-Aggressive">{getCompatibilityDesc("Semi-Aggressive", lang)}</option>
                    <option value="Aggressive">{getCompatibilityDesc("Aggressive", lang)}</option>
                    <option value="Species Only">{getCompatibilityDesc("Species Only", lang)}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Gaya Hidup Dewasa" : "Adult Behavior"}</Label>
                  <select name="adult_behavior" value={formData.adult_behavior} onChange={handleChange} className="h-11 w-full rounded-md border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 font-medium text-sm text-slate-900 dark:text-slate-100">
                    <option value="Schooling">{lang === 'id' ? "Schooling (Berkerumun)" : "Schooling (Swarm)"}</option>
                    <option value="Pair">{lang === 'id' ? "Pair (Sepasang Jantan Betina)" : "Pair (Male & Female)"}</option>
                    <option value="Solitary">{lang === 'id' ? "Solitary (Menyendiri / Penguasa)" : "Solitary (Loner / Boss)"}</option>
                    <option value="Harem">{lang === 'id' ? "Harem (1 Jantan Banyak Betina)" : "Harem (1 Male Many Females)"}</option>
                    <option value="Colony">{lang === 'id' ? "Colony (Berkoloni bebas)" : "Colony (Free roaming)"}</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-sm h-11 md:h-auto mt-0 md:mt-[22px]">
                  <input type="checkbox" name="schooling" checked={formData.schooling} onChange={handleChange} className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0" />
                  <Label className="font-bold text-sm cursor-pointer whitespace-nowrap">{formDict.schoolingFish}</Label>
                </div>
                <div className={`space-y-2 transition-opacity ${!formData.schooling ? 'opacity-40 pointer-events-none' : ''}`}>
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{formDict.minGroupSize}</Label>
                  <Input type="number" min="1" name="min_group_size" value={formData.min_group_size} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="Cth: 6" />
                </div>
                <div className={`space-y-2 transition-opacity ${!formData.schooling ? 'opacity-40 pointer-events-none' : ''}`}>
                  <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Group Size Maksimum" : "Max Group Size"}</Label>
                  <Input type="number" min="1" name="max_group_size" value={formData.max_group_size} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder={lang === 'id' ? "Cth: 20 (opsional)" : "Ex: 20 (optional)"} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                 <div className="space-y-2">
                   <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Mouth Size Factor" : "Mouth Size Factor"}</Label>
                   <Input type="number" min="0" step="0.1" name="mouth_size_factor" value={formData.mouth_size_factor} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="1.0" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Risiko Makan Udang (0-10)" : "Shrimp Predation Risk"}</Label>
                   <Input type="number" min="0" max="10" name="shrimp_predation_risk" value={formData.shrimp_predation_risk} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="0" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Kebutuhan Oksigen (1-10)" : "Oxygen Req. Score"}</Label>
                   <Input type="number" min="1" max="10" name="oxygen_requirement_score" value={formData.oxygen_requirement_score} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="5" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Produksi Kotoran (1-10)" : "Waste Prod. Score"}</Label>
                   <Input type="number" min="1" max="10" name="waste_production_score" value={formData.waste_production_score} onChange={handleChange} className="bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800/60 h-11" placeholder="5" />
                 </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-blue-200 dark:border-blue-900/50">
                 <label className="flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                   <input type="checkbox" name="territorial" checked={formData.territorial} onChange={handleChange} className="h-4 w-4 accent-red-600 rounded" />
                   <span className="text-xs font-bold text-red-600 dark:text-red-400">{lang === 'id' ? 'Teritorial' : 'Territorial'}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                   <input type="checkbox" name="predatory" checked={formData.predatory} onChange={handleChange} className="h-4 w-4 accent-red-600 rounded" />
                   <span className="text-xs font-bold text-red-600 dark:text-red-400">{lang === 'id' ? 'Predator / Pemangsa' : 'Predatory'}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                   <input type="checkbox" name="uproots_plants" checked={formData.uproots_plants} onChange={handleChange} className="h-4 w-4 accent-amber-600 rounded" />
                   <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{lang === 'id' ? 'Merusak Tanaman' : 'Uproots Plants'}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                   <input type="checkbox" name="jump_risk" checked={formData.jump_risk} onChange={handleChange} className="h-4 w-4 accent-orange-600 rounded" />
                   <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{lang === 'id' ? 'Suka Melompat' : 'Jump Risk'}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                   <input type="checkbox" name="sensitive_to_nitrate" checked={formData.sensitive_to_nitrate} onChange={handleChange} className="h-4 w-4 accent-indigo-600 rounded" />
                   <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{lang === 'id' ? 'Sensitif Nitrat' : 'Nitrate Sensitive'}</span>
                 </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2 pt-6 border-t border-blue-200 dark:border-blue-900/50">
                 <div className="flex flex-col gap-3 p-5 bg-white dark:bg-slate-950 rounded-xl border border-blue-100 dark:border-blue-800/60 shadow-sm">
                   <Label className="text-blue-800 dark:text-blue-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2.5">{lang === 'id' ? "Aman Untuk Fauna Lain?" : "Safe for other fauna?"}</Label>
                   <label className="flex items-center gap-3 cursor-pointer group mt-1">
                     <input type="checkbox" name="shrimp_safe" checked={formData.shrimp_safe} onChange={handleChange} className="w-5 h-5 accent-emerald-600 rounded" />
                     <span className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">{lang === 'id' ? "Shrimp Safe (Aman untuk Udang)" : "Shrimp Safe"}</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" name="plant_safe" checked={formData.plant_safe} onChange={handleChange} className="w-5 h-5 accent-teal-600 rounded" />
                     <span className="font-semibold text-sm group-hover:text-teal-600 transition-colors">{lang === 'id' ? "Plant Safe (Aman untuk Tanaman)" : "Plant Safe"}</span>
                   </label>
                 </div>
                 
                 <div className="flex flex-col gap-2 p-5 bg-white dark:bg-slate-950 rounded-xl border border-blue-100 dark:border-blue-800/60 shadow-sm">
                   <Label className="text-blue-800 dark:text-blue-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2.5">{lang === 'id' ? "Rekomendasi Tema Tank (Styles)" : "Recommended Tank Styles"}</Label>
                   <div className="flex flex-wrap gap-2 pt-3">
                     {TANK_STYLES_OPTIONS.map(style => (
                       <button
                         key={style} type="button"
                         onClick={() => handleStyleToggle(style)}
                         className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all border ${formData.recommended_tank_styles.includes(style) ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 scale-105" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                       >
                         {getTankStyleDesc(style, lang)}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3 pt-6 border-t border-blue-200 dark:border-blue-900/50">
                 <div className="space-y-2">
                   <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Kesulitan Pemijahan (Breeding)" : "Breeding Difficulty"}</Label>
                   <select name="breeding_difficulty" value={formData.breeding_difficulty} onChange={handleChange} className="h-11 w-full rounded-md border border-blue-300 dark:border-blue-800/60 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 font-medium text-sm text-slate-900 dark:text-slate-100">
                     <option value="1">{lang === 'id' ? "Mudah" : "Easy"}</option>
                     <option value="2">{lang === 'id' ? "Sedang" : "Medium"}</option>
                     <option value="3">{lang === 'id' ? "Sulit / Butuh Perlakuan Khusus" : "Hard / Needs Special Treatment"}</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Tipe Reproduksi" : "Reproduction Type"}</Label>
                    <div className="flex gap-4 mt-3 bg-white dark:bg-slate-950 px-3 py-3 rounded-md border border-blue-300 dark:border-blue-800/60 h-11 items-center">
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" name="is_egg_layer" checked={formData.is_egg_layer} onChange={handleChange} className="w-4 h-4 accent-blue-600" /> {lang === 'id' ? "Bertelur (Egg)" : "Egg Layer"}</label>
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" name="is_livebearer" checked={formData.is_livebearer} onChange={handleChange} className="w-4 h-4 accent-blue-600" /> {lang === 'id' ? "Beranak (Live)" : "Livebearer"}</label>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">{lang === 'id' ? "Tingkat Aktivitas Gerak" : "Activity Level"}</Label>
                    <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="h-11 w-full rounded-md border border-blue-300 dark:border-blue-800/60 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500 font-medium text-sm text-slate-900 dark:text-slate-100">
                      <option value="Low">{lang === 'id' ? "Low (Suka Berdiam diri / Lambat)" : "Low (Static / Slow)"}</option>
                      <option value="Medium">{lang === 'id' ? "Medium (Renang Normal)" : "Medium (Normal Swimming)"}</option>
                      <option value="High">{lang === 'id' ? "High (Perenang Cepat / Hiperaktif)" : "High (Fast / Hyperactive)"}</option>
                    </select>
                 </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-blue-200 dark:border-blue-900/50">
                <div className="space-y-2">
                  <Label className="text-teal-700 dark:text-teal-400 flex items-center gap-2 font-bold"><Brain className="h-4 w-4" /> {formDict.expertNotesId}</Label>
                  <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 leading-tight">Tips spesifik yang akan dimunculkan oleh AI saat memberi rekomendasi (Bahasa Indonesia).</p>
                  <textarea name="expert_notes_id" rows={3} value={formData.expert_notes_id} onChange={handleChange} className="w-full rounded-md border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-3 text-teal-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y text-sm" placeholder={formDict.expertNotesIdPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label className="text-teal-700 dark:text-teal-400 flex items-center gap-2 font-bold"><Brain className="h-4 w-4" /> {formDict.expertNotesEn}</Label>
                  <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 leading-tight">Specific tips that AI will reveal when making recommendations (English).</p>
                  <textarea name="expert_notes_en" rows={3} value={formData.expert_notes_en} onChange={handleChange} className="w-full rounded-md border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-3 text-teal-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y text-sm" placeholder={formDict.expertNotesEnPlaceholder} />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/50 p-4 text-sm text-red-700 dark:text-red-400 font-bold flex items-start shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5"/> 
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                {mode === "edit" && fish && (
                  <>
                    <button type="button" onClick={triggerArchiveModal} disabled={loading} className="w-full sm:w-auto h-12 rounded-xl px-5 text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95">
                      <Archive className="mr-2 h-4 w-4" /> {formDict.btnArchive}
                    </button>
                    {role === "super_admin" && (
                      <button type="button" onClick={triggerHardDeleteModal} disabled={loading} className="w-full sm:w-auto h-12 rounded-xl px-5 text-sm font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center border border-red-200 dark:border-red-900 shadow-sm active:scale-95">
                        <Trash2 className="mr-2 h-4 w-4" /> {formDict.btnHardDelete}
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button type="button" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto h-12 rounded-xl px-6 text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95">
                  {formDict.btnCancel}
                </button>
                <button type="submit" disabled={loading} className="w-full sm:w-auto h-12 rounded-xl px-8 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : mode === "create" ? formDict.btnSave : formDict.btnUpdate}
                </button>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>

      {isArchiveModalOpen && fish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl scale-in-95">
            <div className="mb-5 flex items-center gap-3">
              <div className="p-3 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Archive className="h-6 w-6" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{formDict.modalArchiveTitle}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {formDict.modalArchiveDesc1} <strong className="text-gray-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{lang === 'en' && fish?.name_en ? fish.name_en : fish?.name_id}</strong> {formDict.modalArchiveDesc2}
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" disabled={loading} onClick={() => setIsArchiveModalOpen(false)} className="rounded-xl px-5 h-11 text-sm font-bold transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {formDict.btnCancel}
              </button>
              <button type="button" disabled={loading} onClick={executeArchive} className="rounded-xl px-5 h-11 text-sm font-bold transition-colors bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white disabled:opacity-50 flex items-center justify-center shadow-lg shadow-black/10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formDict.btnConfirmArchive}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && fish && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-500 scale-in-95">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{formDict.modalDeleteTitle}</h3>
            </div>
            
            <form onSubmit={executeHardDelete} className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {formDict.modalDeleteDesc1} <strong>{formDict.modalDeleteDesc2}</strong> {formDict.modalDeleteDesc3} <strong className="text-gray-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/30 px-1 py-0.5 rounded select-all">{lang === 'en' && fish?.name_en ? fish.name_en : fish?.name_id}</strong> {formDict.modalDeleteDesc4}
              </p>
              
              <Input 
                required 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder={formDict.typeFishName} 
                className="h-12 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-red-500 font-bold mb-4" 
              />
              
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading || deleteConfirmText !== (lang === 'en' && fish?.name_en ? fish.name_en : fish?.name_id)} 
                  className="w-full h-12 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formDict.btnConfirmDelete}
                </button>
                <button 
                  type="button" 
                  disabled={loading} 
                  onClick={() => {setIsDeleteModalOpen(false); setDeleteConfirmText("");}} 
                  className="w-full h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {formDict.btnCancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}