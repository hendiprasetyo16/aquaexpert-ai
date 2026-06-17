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
import { Loader2, ImagePlus, Archive, Trash2, X, Images, Brain, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider"; 

import { getDifficultyDesc, getFishTypeDesc, getCompatibilityDesc } from "./fish-helpers";

interface FishFormProps {
  mode?: "create" | "edit";
  fish?: FishType;
}

const TANK_STYLES_OPTIONS = ["Nature", "Dutch", "Iwagumi", "Biotope", "Blackwater", "Community", "Predator"];

// DEFINISI TYPE-SAFE UNTUK KAMUS FISH FORM
interface FishFormDict {
  fishForm?: {
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
  };
}

export default function FishForm({ mode = "create", fish }: FishFormProps) {
  const router = useRouter();
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 

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
    hardness_min: "", hardness_max: "", // Kolom Baru
    lifespan_years: "", // Kolom Baru
    compatibility: "Peaceful",
    temperament_score: "2", // Kolom Baru
    water_layer: "Middle", // Kolom Baru
    origin_region: "Asia", // Kolom Baru
    adult_behavior: "Schooling", // Kolom Baru
    activity_level: "Medium", // Kolom Baru (Mengganti feeding_frequency)
    schooling: false, 
    min_group_size: "", 
    max_group_size: "", // Kolom Baru
    fish_type: "Tetra", 
    difficulty: "Easy",
    estimated_adult_size_cm: "", 
    bioload_factor: "",
    shrimp_safe: true,
    plant_safe: true,
    recommended_tank_styles: [] as string[],
    breeding_difficulty: "Medium",
    is_egg_layer: false,
    is_livebearer: false
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
        hardness_min: fish.hardness_min != null ? fish.hardness_min.toString() : "", // Kolom Baru
        hardness_max: fish.hardness_max != null ? fish.hardness_max.toString() : "", // Kolom Baru
        lifespan_years: fish.lifespan_years != null ? fish.lifespan_years.toString() : "", // Kolom Baru
        compatibility: fish.compatibility || "Peaceful",
        temperament_score: fish.temperament_score != null ? fish.temperament_score.toString() : "2", // Kolom Baru
        water_layer: fish.water_layer || "Middle", // Kolom Baru
        origin_region: fish.origin_region || "Asia", // Kolom Baru
        adult_behavior: fish.adult_behavior || "Schooling", // Kolom Baru
        activity_level: fish.activity_level || "Medium", // Kolom Baru
        schooling: fish.schooling || false,
        min_group_size: fish.min_group_size != null ? fish.min_group_size.toString() : "",
        max_group_size: fish.max_group_size != null ? fish.max_group_size.toString() : "", // Kolom Baru
        fish_type: fish.fish_type || "Tetra",
        difficulty: fish.difficulty || "Easy",
        estimated_adult_size_cm: fish.estimated_adult_size_cm != null ? fish.estimated_adult_size_cm.toString() : "",
        bioload_factor: fish.bioload_factor != null ? fish.bioload_factor.toString() : "",
        shrimp_safe: fish.shrimp_safe ?? true,
        plant_safe: fish.plant_safe ?? true,
        recommended_tank_styles: fish.recommended_tank_styles || [],
        breeding_difficulty: fish.breeding_difficulty || "Medium",
        is_egg_layer: fish.is_egg_layer || false,
        is_livebearer: fish.is_livebearer || false
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

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) { setError("Format harus JPG, PNG atau WEBP."); return; }
      if (file.size > 2 * 1024 * 1024) { setError("Ukuran maksimal 2MB."); return; }

      setError(null); setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
      if (mode === "edit" && fish?.image_url && !imagesToDeleteRef.current.includes(fish.image_url)) imagesToDeleteRef.current.push(fish.image_url);
    }
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const newValidFiles = filesArray.filter(f => validTypes.includes(f.type) && f.size <= 2 * 1024 * 1024);

      const spaceLeft = 8 - (existingGallery.length + newGallery.length);
      if (spaceLeft <= 0) { toast.error("Maksimal 8 gambar galeri."); return; }

      const filesToAdd = newValidFiles.slice(0, spaceLeft).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      setNewGallery([...newGallery, ...filesToAdd]);
    }
  }

  function removeExistingGallery(index: number) {
    const urlToRemove = existingGallery[index];
    if (!imagesToDeleteRef.current.includes(urlToRemove)) imagesToDeleteRef.current.push(urlToRemove);
    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  }
  function removeNewGallery(index: number) { setNewGallery(prev => prev.filter((_, i) => i !== index)); }

  // VALIDASI BIOLOGIS SEBELUM SUBMIT
  function validateBiologicalData() {
    if (formData.ideal_ph_min && formData.ideal_ph_max && Number(formData.ideal_ph_min) > Number(formData.ideal_ph_max)) {
      throw new Error("Validasi Gagal: pH Minimum tidak boleh lebih besar dari pH Maksimum.");
    }
    if (formData.ideal_temp_min && formData.ideal_temp_max && Number(formData.ideal_temp_min) > Number(formData.ideal_temp_max)) {
      throw new Error("Validasi Gagal: Suhu Minimum tidak boleh lebih besar dari Suhu Maksimum.");
    }
    if (formData.hardness_min && formData.hardness_max && Number(formData.hardness_min) > Number(formData.hardness_max)) {
      throw new Error("Validasi Gagal: GH (Hardness) Minimum tidak boleh lebih besar dari GH Maksimum.");
    }
    if (formData.min_group_size && formData.max_group_size && Number(formData.min_group_size) > Number(formData.max_group_size)) {
      throw new Error("Validasi Gagal: Group Size Minimum tidak boleh melebihi Group Size Maksimum.");
    }
    if (formData.min_tank_size && Number(formData.min_tank_size) < 0) {
      throw new Error("Validasi Gagal: Volume Tangki tidak boleh minus.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const uploadedImagesToRollback: string[] = [];

    try {
      setLoading(true); setError(null);
      validateBiologicalData(); // Panggil fungsi validasi di sini
      
      const supabase = createClient();
      const cleanNameId = formData.name_id.trim();

      let query = supabase.from("fishes").select("id").ilike("name_id", cleanNameId).eq("is_active", true);
      if (mode === "edit" && fish) query = query.neq("id", fish.id);

      const { data: existingFish, error: checkError } = await query.maybeSingle();
      if (checkError) throw new Error(checkError.message);
      if (existingFish) { setError("Nama ikan duplikat."); return; }

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
        hardness_min: formData.hardness_min ? parseFloat(formData.hardness_min.toString()) : null, // Kolom Baru
        hardness_max: formData.hardness_max ? parseFloat(formData.hardness_max.toString()) : null, // Kolom Baru
        lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years.toString()) : null, // Kolom Baru
        compatibility: formData.compatibility,
        temperament_score: formData.temperament_score ? parseInt(formData.temperament_score.toString()) : null, // Kolom Baru
        water_layer: formData.water_layer, // Kolom Baru
        origin_region: formData.origin_region, // Kolom Baru
        adult_behavior: formData.adult_behavior, // Kolom Baru
        activity_level: formData.activity_level, // Kolom Baru (Mengganti feeding_frequency)
        schooling: formData.schooling,
        min_group_size: formData.min_group_size ? parseInt(formData.min_group_size.toString()) : null,
        max_group_size: formData.max_group_size ? parseInt(formData.max_group_size.toString()) : null, // Kolom Baru
        fish_type: formData.fish_type,
        difficulty: formData.difficulty,
        estimated_adult_size_cm: formData.estimated_adult_size_cm ? parseFloat(formData.estimated_adult_size_cm.toString()) : null,
        bioload_factor: formData.bioload_factor ? parseFloat(formData.bioload_factor.toString()) : null,
        shrimp_safe: formData.shrimp_safe,
        plant_safe: formData.plant_safe,
        recommended_tank_styles: formData.recommended_tank_styles,
        breeding_difficulty: formData.breeding_difficulty,
        is_egg_layer: formData.is_egg_layer,
        is_livebearer: formData.is_livebearer,
        image_url: finalCoverUrl,
        gallery_urls: finalGalleryUrls,
      };

      if (mode === "create") {
        const result = await createFishAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success(language === 'id' ? "Ikan berhasil ditambahkan!" : "Fish added successfully!");
      } else {
        const result = await updateFishAction(fish!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success(language === 'id' ? "Ikan berhasil diperbarui!" : "Fish updated successfully!");
      }

      for (const urlToDelete of imagesToDeleteRef.current) {
        try { await removeFishImage(urlToDelete); } catch (err) {}
      }
      imagesToDeleteRef.current = [];
      router.push("/dashboard/fishes");
      router.refresh();

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal menyimpan data.";
      setError(errMsg);
      toast.error(errMsg);
      if (uploadedImagesToRollback.length > 0) {
        for (const orphanUrl of uploadedImagesToRollback) { await removeFishImage(orphanUrl); }
      }
    } finally { setLoading(false); }
  }

  // EKSEKUSI ARSIP
  function triggerArchiveModal() { if (!fish || mode !== "edit") return; setIsArchiveModalOpen(true); }
  async function executeArchive() {
    if (!fish || mode !== "edit") return;
    try { 
      setLoading(true); await deleteFish(fish.id); toast.success(language === 'id' ? "Diarsipkan." : "Archived."); 
      router.push("/dashboard/fishes"); router.refresh();
    } catch (error: unknown) { toast.error("Gagal."); } finally { setLoading(false); setIsArchiveModalOpen(false); }
  }

  // EKSEKUSI HAPUS PERMANEN
  function triggerHardDeleteModal() { if (!fish) return; setDeleteConfirmText(""); setIsDeleteModalOpen(true); }
  async function executeHardDelete(e: React.FormEvent) {
    e.preventDefault(); if (!fish) return;
    const currentName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;
    if (deleteConfirmText !== currentName) { toast.error(language === 'id' ? "Nama tidak cocok." : "Name mismatch."); return; }
    try { 
      setLoading(true); 
      const result = await hardDeleteFishAction(fish.id); 
      if (!result.success) throw new Error(result.error);
      toast.success(language === 'id' ? "Dihapus permanen." : "Deleted permanently."); router.push("/dashboard/fishes"); router.refresh();
    } catch (error: unknown) { toast.error("Gagal."); } finally { setLoading(false); setIsDeleteModalOpen(false); }
  }

  // PENGGUNAAN KAMUS SECARA TYPE-SAFE
  const dictionary = dict as unknown as FishFormDict;
  const formDict = dictionary.fishForm || {
    visualSection: "Visual Ikan", coverLabel: "Foto Utama", changeCover: "Ganti Foto", uploadCover: "Upload Foto",
    galleryLabel: "Galeri", addGallery: "+ Tambah Galeri", saved: "Tersimpan", new: "Baru",
    identitasSection: "Identitas", nameIdLabel: "Nama (ID)", nameEnLabel: "Nama (EN)", nameIdPlaceholder: "Contoh: Neon Tetra", nameEnPlaceholder: "Example: Neon Tetra",
    scientificNameLabel: "Nama Ilmiah", difficultyLabel: "Tingkat Kesulitan", fishTypeLabel: "Klasifikasi", compatibilityLabel: "Kompatibilitas",
    waterParamSection: "Parameter Air", tempMin: "Suhu Min", tempMax: "Suhu Max", phMin: "pH Min", phMax: "pH Max",
    descSectionId: "Deskripsi (ID)", descSectionEn: "Deskripsi (EN)", descIdPlaceholder: "Tulis...", descEnPlaceholder: "Write...",
    expertEngineSection: "Expert Engine", minTankSize: "Volume Min (L)", adultSize: "Ukuran Dewasa", bioloadFactor: "Bioload",
    schoolingFish: "Ikan Kawanan", minGroupSize: "Minimal Jumlah", expertNotesId: "Catatan Pakar (ID)", expertNotesEn: "Catatan Pakar (EN)",
    expertNotesIdPlaceholder: "Catatan...", expertNotesEnPlaceholder: "Notes...",
    btnArchive: "Arsipkan", btnHardDelete: "Hapus Permanen", btnCancel: "Batal", btnSave: "Simpan Ikan", btnUpdate: "Perbarui Data", processing: "Memproses...",
    modalArchiveTitle: "Arsipkan Ikan", modalArchiveDesc1: "Anda yakin ingin mengarsipkan", modalArchiveDesc2: "?", btnConfirmArchive: "Ya, Arsipkan",
    modalDeleteTitle: "Hapus Permanen", modalDeleteDesc1: "Tindakan ini", modalDeleteDesc2: "tidak dapat dibatalkan", modalDeleteDesc3: "dan akan menghapus foto. Ketik nama ikan", modalDeleteDesc4: "untuk konfirmasi:", typeFishName: "Ketik nama ikan...", btnConfirmDelete: "Hapus Permanen"
  };

  return (
    <div className="w-full transition-colors duration-300">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl w-full transition-colors duration-300">
        <CardContent className="p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BAGIAN 1: VISUAL IKAN */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Images className="h-5 w-5 text-blue-600" /> {formDict.visualSection}
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{formDict.coverLabel}</Label>
                  <input id="cover-image" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  <label htmlFor="cover-image" className="cursor-pointer block">
                    <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all group bg-white h-48 flex flex-col items-center justify-center">
                      {coverPreview ? <Image src={coverPreview} alt="Cover" fill className="object-cover" /> : <ImagePlus className="h-10 w-10 text-slate-400 group-hover:text-blue-500" />}
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>{formDict.galleryLabel}</Label>
                  <input id="gallery-image" type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                  <label htmlFor="gallery-image" className="cursor-pointer block mb-3 border border-slate-300 py-3 text-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{formDict.addGallery}</label>
                  <div className="grid grid-cols-4 gap-2">
                     {existingGallery.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-slate-800 group border border-slate-300 dark:border-slate-700">
                           <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" />
                           <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-slate-200 py-0.5 z-10">{formDict.saved}</div>
                           <button type="button" onClick={() => removeExistingGallery(i)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="h-3 w-3"/></button>
                        </div>
                     ))}
                     {newGallery.map((item, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-slate-800 group border-2 border-blue-500">
                           <Image src={item.preview} alt={`New ${i}`} fill className="object-cover" />
                           <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[9px] text-center text-white py-0.5 font-bold z-10">{formDict.new}</div>
                           <button type="button" onClick={() => removeNewGallery(i)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="h-3 w-3"/></button>
                        </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BAGIAN 2: IDENTITAS & ASAL-USUL */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2 bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-2">{formDict.identitasSection}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2"><Label>{formDict.nameIdLabel}</Label><Input name="name_id" required value={formData.name_id} onChange={handleChange} placeholder={formDict.nameIdPlaceholder} className="bg-white dark:bg-slate-950" /></div>
                  <div className="space-y-2"><Label>{formDict.nameEnLabel}</Label><Input name="name_en" value={formData.name_en} onChange={handleChange} placeholder={formDict.nameEnPlaceholder} className="bg-white dark:bg-slate-950" /></div>
                </div>
                <div className="space-y-2"><Label>{formDict.scientificNameLabel}</Label><Input name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="italic bg-white dark:bg-slate-950" /></div>
              </div>

              <div className="space-y-2">
                <Label>{formDict.fishTypeLabel}</Label>
                <select name="fish_type" value={formData.fish_type} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                  <option value="Tetra">{getFishTypeDesc("Tetra", language)}</option>
                  <option value="Cichlid">{getFishTypeDesc("Cichlid", language)}</option>
                  <option value="Livebearer">{getFishTypeDesc("Livebearer", language)}</option>
                  <option value="Betta">{getFishTypeDesc("Betta", language)}</option>
                  <option value="Labyrinth">{getFishTypeDesc("Labyrinth", language)}</option>
                  <option value="Loach">{getFishTypeDesc("Loach", language)}</option>
                  <option value="Catfish">{getFishTypeDesc("Catfish", language)}</option>
                  <option value="Rasbora">{getFishTypeDesc("Rasbora", language)}</option>
                  <option value="Invertebrate">{getFishTypeDesc("Invertebrate", language)}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Wilayah Asal (Origin Region)</Label>
                <select name="origin_region" value={formData.origin_region} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                  <option value="South America">Amerika Selatan (Amazon)</option>
                  <option value="Asia">Asia</option>
                  <option value="Africa">Afrika</option>
                  <option value="Central America">Amerika Tengah</option>
                  <option value="North America">Amerika Utara</option>
                  <option value="Australia">Australia & Oceania</option>
                  <option value="Global (Bred)">Global (Hasil Budidaya)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Zona Renang (Water Layer)</Label>
                <select name="water_layer" value={formData.water_layer} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                  <option value="Top">Top (Atas)</option>
                  <option value="Middle">Middle (Tengah)</option>
                  <option value="Bottom">Bottom (Bawah)</option>
                  <option value="All Levels">Semua Level</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Usia Maksimal (Lifespan dalam Tahun)</Label>
                <Input type="number" name="lifespan_years" value={formData.lifespan_years} onChange={handleChange} className="bg-white dark:bg-slate-950" placeholder="Cth: 5" />
              </div>
            </div>

            {/* BAGIAN 3: PARAMETER LINGKUNGAN */}
            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-2">{formDict.waterParamSection}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-2"><Label>{formDict.tempMin}</Label><Input type="number" step="0.1" name="ideal_temp_min" value={formData.ideal_temp_min} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>{formDict.tempMax}</Label><Input type="number" step="0.1" name="ideal_temp_max" value={formData.ideal_temp_max} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>{formDict.phMin}</Label><Input type="number" step="0.1" name="ideal_ph_min" value={formData.ideal_ph_min} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>{formDict.phMax}</Label><Input type="number" step="0.1" name="ideal_ph_max" value={formData.ideal_ph_max} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>GH Min (Hardness)</Label><Input type="number" step="0.1" name="hardness_min" value={formData.hardness_min} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>GH Max (Hardness)</Label><Input type="number" step="0.1" name="hardness_max" value={formData.hardness_max} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
              </div>
            </div>

            {/* BAGIAN DESKRIPSI SPESIES */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{formDict.descSectionId}</Label>
                  <textarea name="description_id" rows={4} value={formData.description_id} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 outline-none resize-y focus:border-blue-500" placeholder={formDict.descIdPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label>{formDict.descSectionEn}</Label>
                  <textarea name="description_en" rows={4} value={formData.description_en} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 outline-none resize-y focus:border-blue-500" placeholder={formDict.descEnPlaceholder} />
                </div>
            </div>

            {/* BAGIAN 4: FISH EXPERT SYSTEM KUSTOMISASI KETAT */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-6">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900/50 pb-2">Kalkulasi Fish Expert V2</h3>
              
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2"><Label>{formDict.minTankSize}</Label><Input type="number" name="min_tank_size" value={formData.min_tank_size} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>{formDict.adultSize}</Label><Input type="number" step="0.1" name="estimated_adult_size_cm" value={formData.estimated_adult_size_cm} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
                <div className="space-y-2"><Label>{formDict.bioloadFactor}</Label><Input type="number" step="0.1" name="bioload_factor" value={formData.bioload_factor} onChange={handleChange} className="bg-white dark:bg-slate-950" /></div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Skor Agresivitas (Temperament Score)</Label>
                  <select name="temperament_score" value={formData.temperament_score} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                    <option value="1">1 - Very Peaceful (Sangat Damai)</option>
                    <option value="2">2 - Peaceful (Damai)</option>
                    <option value="3">3 - Semi-Aggressive (Teritorial)</option>
                    <option value="4">4 - Aggressive (Pemarah)</option>
                    <option value="5">5 - Predator (Memakan Ikan Lain)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{formDict.compatibilityLabel}</Label>
                  <select name="compatibility" value={formData.compatibility} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                    <option value="Peaceful">{getCompatibilityDesc("Peaceful", language)}</option>
                    <option value="Semi-Aggressive">{getCompatibilityDesc("Semi-Aggressive", language)}</option>
                    <option value="Aggressive">{getCompatibilityDesc("Aggressive", language)}</option>
                    <option value="Species Only">{getCompatibilityDesc("Species Only", language)}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Gaya Hidup (Adult Behavior)</Label>
                  <select name="adult_behavior" value={formData.adult_behavior} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                    <option value="Schooling">Schooling (Kawanan)</option>
                    <option value="Pair">Pair (Sepasang)</option>
                    <option value="Solitary">Solitary (Menyendiri)</option>
                    <option value="Harem">Harem (1 Jantan Banyak Betina)</option>
                    <option value="Colony">Colony (Koloni Besar)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                  <input type="checkbox" name="schooling" checked={formData.schooling} onChange={handleChange} className="w-5 h-5 accent-blue-600 rounded" />
                  <Label>Ikan Kawanan (Schooling Fish)</Label>
                </div>
                <div className={`space-y-2 ${!formData.schooling ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Label>Group Size Minimum</Label>
                  <Input type="number" name="min_group_size" value={formData.min_group_size} onChange={handleChange} className="bg-white dark:bg-slate-950" />
                </div>
                <div className={`space-y-2 ${!formData.schooling ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Label>Group Size Maksimum</Label>
                  <Input type="number" name="max_group_size" value={formData.max_group_size} onChange={handleChange} className="bg-white dark:bg-slate-950" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 pt-4 border-t border-blue-200 dark:border-blue-900/50">
                 <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                   <Label className="text-blue-800 dark:text-blue-400 font-bold border-b pb-2">Aman Untuk Fauna Lain?</Label>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" name="shrimp_safe" checked={formData.shrimp_safe} onChange={handleChange} className="w-5 h-5 accent-emerald-600 rounded" />
                     <span className="font-semibold">Shrimp Safe (Aman untuk Udang)</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" name="plant_safe" checked={formData.plant_safe} onChange={handleChange} className="w-5 h-5 accent-teal-600 rounded" />
                     <span className="font-semibold">Plant Safe (Aman untuk Tanaman)</span>
                   </label>
                 </div>
                 
                 <div className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                   <Label className="text-blue-800 dark:text-blue-400 font-bold border-b pb-2">Rekomendasi Tema Tank (Aquascape Style)</Label>
                   <div className="flex flex-wrap gap-2 pt-2">
                     {TANK_STYLES_OPTIONS.map(style => (
                       <button
                         key={style} type="button"
                         onClick={() => handleStyleToggle(style)}
                         className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors border ${formData.recommended_tank_styles.includes(style) ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
                       >
                         {style}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3 pt-4 border-t border-blue-200 dark:border-blue-900/50">
                 <div className="space-y-2"><Label>Kesulitan Pemijahan (Breeding)</Label>
                  <select name="breeding_difficulty" value={formData.breeding_difficulty} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                    <option value="Easy">Mudah</option><option value="Medium">Sedang</option><option value="Hard">Sulit/Butuh Perlakuan Khusus</option>
                  </select>
                 </div>
                 <div className="space-y-2"><Label>Tipe Reproduksi</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2"><input type="checkbox" name="is_egg_layer" checked={formData.is_egg_layer} onChange={handleChange} className="w-4 h-4 accent-blue-600" /> Bertelur (Egg Layer)</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="is_livebearer" checked={formData.is_livebearer} onChange={handleChange} className="w-4 h-4 accent-blue-600" /> Beranak (Livebearer)</label>
                    </div>
                 </div>
                 <div className="space-y-2"><Label>Tingkat Aktivitas (Activity Level)</Label>
                    <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 outline-none focus:border-blue-500">
                      <option value="Low">Low (Berdiam diri/Lambat)</option>
                      <option value="Medium">Medium (Normal)</option>
                      <option value="High">High (Perenang Cepat/Hiperaktif)</option>
                    </select>
                 </div>
              </div>
            </div>

            {error && <div className="rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 font-bold flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> {error}</div>}

            {/* ACTION BUTTONS UTAMA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                {mode === "edit" && fish && (
                  <>
                    <button type="button" onClick={triggerArchiveModal} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors">
                      <Archive className="mr-2 h-4 w-4" /> {formDict.btnArchive}
                    </button>
                    {role === "super_admin" && (
                      <button type="button" onClick={triggerHardDeleteModal} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-400 transition-colors">
                        <Trash2 className="mr-2 h-4 w-4" /> {formDict.btnHardDelete}
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button type="button" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 transition-colors">
                  {formDict.btnCancel}
                </button>
                <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "create" ? formDict.btnSave : formDict.btnUpdate}
                </button>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>

      {/* =======================================================
          MODAL ARSIP
          ======================================================= */}
      {isArchiveModalOpen && fish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Archive className="h-6 w-6" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{formDict.modalArchiveTitle}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {formDict.modalArchiveDesc1} <strong className="text-gray-900 dark:text-slate-200">{language === 'en' && fish.name_en ? fish.name_en : fish.name_id}</strong>{formDict.modalArchiveDesc2}
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={loading} onClick={() => setIsArchiveModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 flex items-center justify-center">
                {formDict.btnCancel}
              </button>
              <button type="button" disabled={loading} onClick={executeArchive} className="rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white disabled:opacity-50 flex items-center justify-center">
                {loading ? formDict.processing : formDict.btnConfirmArchive}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL HAPUS PERMANEN (HANYA SUPER ADMIN)
          ======================================================= */}
      {isDeleteModalOpen && fish && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-500">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{formDict.modalDeleteTitle}</h3>
            </div>
            
            <form onSubmit={executeHardDelete} className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {formDict.modalDeleteDesc1} <strong>{formDict.modalDeleteDesc2}</strong> {formDict.modalDeleteDesc3} <strong className="text-gray-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/30 px-1 py-0.5 rounded select-all">{language === 'en' && fish.name_en ? fish.name_en : fish.name_id}</strong> {formDict.modalDeleteDesc4}
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
                  disabled={loading || deleteConfirmText !== (language === 'en' && fish.name_en ? fish.name_en : fish.name_id)} 
                  className="w-full h-12 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : formDict.btnConfirmDelete}
                </button>
                <button 
                  type="button" 
                  disabled={loading} 
                  onClick={() => {setIsDeleteModalOpen(false); setDeleteConfirmText("");}} 
                  className="w-full h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider transition-colors"
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