// features/algae/components/AlgaeForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client"; 
import { deleteAlgae, uploadAlgaeImage, removeAlgaeImage } from "../repositories/algae.repository";
import { createAlgaeAction, updateAlgaeAction, hardDeleteAlgaeAction } from "../actions/algae.actions";
import { Algae } from "../types/algae.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus, Archive, Trash2, X, Images, Brain, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider"; 
// PERBAIKAN: Memanggil Helper Baru
import { getAlgaeDifficultyDesc, getAlgaeTagDesc } from "./algae-helpers";

const COLOR_TAGS = ["green", "brown", "black", "gray", "white", "light_green", "blue_green", "dark_green", "dark_gray", "reddish"];
const TEXTURE_TAGS = ["tuft", "hairy", "dust", "hard_spot", "slime", "branching", "brush", "flat", "powdery", "easily_wiped", "wiry", "long_thread", "soft", "sheet", "smelly"];
const LOCATION_TAGS = ["glass", "hardscape", "leaf_edges", "plants", "substrate", "slow_leaves", "equipment", "moss", "everywhere", "high_flow"];
const TRIGGER_TAGS = ["new_tank", "co2_fluctuation", "high_light", "poor_circulation", "nutrient_imbalance", "low_phosphate", "low_flow", "high_ammonia", "iron_imbalance", "low_co2", "low_nitrate", "high_silicate", "high_organics"];
const AFFECTED_CONDITIONS_TAGS = ["plant_melt", "stunted_growth", "oxygen_depletion", "fish_gasping", "foul_odor", "cloudy_water", "filter_clogged"];

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

interface AlgaeFormProps {
  mode?: "create" | "edit";
  algae?: Algae;
  onSuccess?: () => void; 
}

export default function AlgaeForm({ mode = "create", algae, onSuccess }: AlgaeFormProps) {
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
    name_id: "", name_en: "", alias: "", scientific_name: "",
    difficulty: "Easy", severity: 1,
    description_id: "", description_en: "", 
    causes_id: "", causes_en: "", 
    solutions_id: "", solutions_en: "",
    color_tags: [] as string[], texture_tags: [] as string[], 
    location_tags: [] as string[], trigger_tags: [] as string[],
    affected_conditions: [] as string[]
  });

  useEffect(() => {
    if (mode === "edit" && algae) {
      setFormData({
        name_id: algae.name_id || "", name_en: algae.name_en || "", 
        alias: algae.alias || "", scientific_name: algae.scientific_name || "",
        difficulty: algae.difficulty || "Easy", severity: algae.severity || 1,
        description_id: algae.description_id || "", description_en: algae.description_en || "",
        causes_id: (algae.causes_id || []).join("\n"), causes_en: (algae.causes_en || []).join("\n"),
        solutions_id: (algae.solutions_id || []).join("\n"), solutions_en: (algae.solutions_en || []).join("\n"),
        color_tags: algae.color_tags || [], texture_tags: algae.texture_tags || [],
        location_tags: algae.location_tags || [], trigger_tags: algae.trigger_tags || [],
        affected_conditions: algae.affected_conditions || []
      });

      if (algae.image_url) setCoverPreview(algae.image_url);
      if (algae.gallery_urls) setExistingGallery(algae.gallery_urls);
    }
  }, [algae, mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;
    if (type === "number") {
      finalValue = value === "" ? "" : Number(value);
      if (name === "severity" && finalValue !== "") finalValue = Math.min(5, Math.max(1, finalValue as number));
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  }

  function handleArrayCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, field: "color_tags" | "texture_tags" | "location_tags" | "trigger_tags" | "affected_conditions") {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentArray = prev[field];
      return checked ? { ...prev, [field]: [...currentArray, value] } : { ...prev, [field]: currentArray.filter((item) => item !== value) };
    });
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      if (!validTypes.includes(originalFile.type)) { 
        setError(formDict.errInvalidFormat || "Format Cover harus JPG, PNG atau WEBP."); 
        return; 
      }

      setError(null);
      
      try {
        const compressedFile = await compressImage(originalFile);
        
        setCoverFile(compressedFile); 
        setCoverPreview(URL.createObjectURL(compressedFile));
        
        if (mode === "edit" && algae?.image_url && !imagesToDeleteRef.current.includes(algae.image_url)) {
          imagesToDeleteRef.current.push(algae.image_url);
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
      
      const validFiles = filesArray.filter(f => validTypes.includes(f.type));
      if (validFiles.length !== filesArray.length) {
        toast.error(formDict.errInvalidFormat || "Beberapa file diabaikan karena format bukan JPG/PNG/WEBP.");
      }

      const spaceLeft = 8 - (existingGallery.length + newGallery.length);
      if (spaceLeft <= 0) { 
        toast.error(formDict.errMaxGallery || "Maksimal 8 gambar pada galeri."); 
        return; 
      }

      const filesToProcess = validFiles.slice(0, spaceLeft);
      
      try {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const uploadedImagesToRollback: string[] = [];

    try {
      setLoading(true); setError(null);
      const supabase = createClient();
      const cleanNameId = formData.name_id.trim();

      // Cek Duplikat
      let query = supabase.from("algae").select("id").ilike("name_id", cleanNameId).eq("is_active", true);
      if (mode === "edit" && algae) query = query.neq("id", algae.id);
      const { data: existingAlgae, error: checkError } = await query.maybeSingle();
      if (checkError) throw new Error(checkError.message);
      if (existingAlgae) { setError(`Nama alga sudah ada.`); toast.error(`Nama alga duplikat.`); return; }

      let finalCoverUrl = mode === "edit" ? (algae?.image_url || "") : "";
      let finalGalleryUrls = [...existingGallery];
      const algaeSlug = mode === "edit" ? algae?.slug || cleanNameId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : cleanNameId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // 🔥 1. Buat string tanggal hari ini (Format: YYYYMMDD)
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, "");

      if (coverFile) {
        // 🔥 2. Buat nama baru untuk Cover dan Rename file-nya
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const newFileName = `${algaeSlug}-cover-${dateStr}-${uniqueId}.${ext}`;
        const renamedCover = new File([coverFile], newFileName, { type: coverFile.type });

        // Kirim file yang sudah di-rename
        finalCoverUrl = await uploadAlgaeImage(renamedCover, algaeSlug, `cover`);
        uploadedImagesToRollback.push(finalCoverUrl);
      }

      for (let i = 0; i < newGallery.length; i++) {
         // 🔥 3. Buat nama baru untuk Gallery dan Rename file-nya
         const uniqueId = Math.random().toString(36).substring(2, 8);
         const fileItem = newGallery[i].file;
         const ext = fileItem.name.split('.').pop() || 'jpg';
         const newFileName = `${algaeSlug}-gallery-${dateStr}-${uniqueId}-${i}.${ext}`;
         const renamedGallery = new File([fileItem], newFileName, { type: fileItem.type });

         // Kirim file yang sudah di-rename
         const gUrl = await uploadAlgaeImage(renamedGallery, algaeSlug, `gallery`);
         finalGalleryUrls.push(gUrl);
         uploadedImagesToRollback.push(gUrl);
      }

      const parseList = (text: string) => text.split("\n").map(s => s.trim()).filter(s => s.length > 0);

      const payload: Partial<Algae> = {
        name_id: cleanNameId,
        name_en: formData.name_en.trim() || cleanNameId,
        alias: formData.alias.trim() || null,
        scientific_name: formData.scientific_name.trim() || null,
        difficulty: formData.difficulty,
        severity: formData.severity,
        description_id: formData.description_id || null,
        description_en: formData.description_en || null,
        causes_id: parseList(formData.causes_id),
        causes_en: parseList(formData.causes_en),
        solutions_id: parseList(formData.solutions_id),
        solutions_en: parseList(formData.solutions_en),
        color_tags: formData.color_tags,
        texture_tags: formData.texture_tags,
        location_tags: formData.location_tags,
        trigger_tags: formData.trigger_tags,
        affected_conditions: formData.affected_conditions,
        image_url: finalCoverUrl || null,
        gallery_urls: finalGalleryUrls.length > 0 ? finalGalleryUrls : null,
      };

      if (mode === "create") {
        const result = await createAlgaeAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Data berhasil disimpan!");
      } else {
        const result = await updateAlgaeAction(algae!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Data berhasil diperbarui!");
      }

      for (const urlToDelete of imagesToDeleteRef.current) {
        try { await removeAlgaeImage(urlToDelete); } catch (err) {}
      }
      imagesToDeleteRef.current = [];
      router.push("/dashboard/algae");
      router.refresh();

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error saving data.";
      setError(errorMessage);
      toast.error(errorMessage);
      if (uploadedImagesToRollback.length > 0) {
        for (const orphanUrl of uploadedImagesToRollback) { await removeAlgaeImage(orphanUrl); }
      }
    } finally { setLoading(false); }
  }

  function triggerArchiveModal() { if (!algae || mode !== "edit") return; setIsArchiveModalOpen(true); }
  
  async function executeArchive() {
    if (!algae || mode !== "edit") return;
    try { setLoading(true); await deleteAlgae(algae.id); toast.success("Diarsipkan."); router.push("/dashboard/algae"); router.refresh();
    } catch (error: unknown) { 
      const msg = error instanceof Error ? error.message : "Gagal.";
      toast.error(msg); 
    } finally { setLoading(false); setIsArchiveModalOpen(false); }
  }

  function triggerHardDeleteModal() { if (!algae) return; setDeleteConfirmText(""); setIsDeleteModalOpen(true); }
  
  async function executeHardDelete(e: React.FormEvent) {
    e.preventDefault(); 
    if (!algae) return;
    
    const currentName = language === 'en' && algae.name_en ? algae.name_en : algae.name_id;
    if (deleteConfirmText !== currentName) { 
      toast.error("Nama tidak cocok."); 
      return; 
    }
    
    try { 
      setLoading(true); 

      // 1. BERSIHKAN STORAGE DULU SEBELUM DATABASE DIHAPUS (PERBAIKAN PEMOTONGAN PATH)
      const allUrls: string[] = [];
      if (algae.image_url) allUrls.push(algae.image_url);
      if (algae.gallery_urls && Array.isArray(algae.gallery_urls)) {
        allUrls.push(...algae.gallery_urls);
      }

      if (allUrls.length > 0) {
        const pathsToDelete = allUrls.map((url) => {
          if (!url) return "";
          // Memotong string secara presisi tepat setelah bucket name "algae"
          const parts = url.split("/public/algae/");
          return parts.length > 1 ? parts[1].split('?')[0] : "";
        }).filter((path) => path !== "");

        if (pathsToDelete.length > 0) {
          const supabase = createClient();
          const { error: storageErr } = await supabase.storage.from("algae").remove(pathsToDelete);
            
          if (storageErr) {
            console.error("Gagal membersihkan gambar dari storage:", storageErr.message);
          }
        }
      }

      // 2. HAPUS DATA DI DATABASE
      const result = await hardDeleteAlgaeAction(algae.id); 
      if (!result.success) throw new Error(result.error);
      
      toast.success("Dihapus permanen."); 
      router.push("/dashboard/algae"); 
      router.refresh();
      
    } catch (error: unknown) { 
      const msg = error instanceof Error ? error.message : "Gagal.";
      toast.error(msg); 
    } finally { 
      setLoading(false); 
      setIsDeleteModalOpen(false); 
      setDeleteConfirmText("");
    }
  }

  if (!dict.algaeExpert?.algaeForm) return null; 
  const formDict = (dict.algaeExpert?.algaeForm as Record<string, string>) || {};
  const totalGalleryCount = existingGallery.length + newGallery.length;

  return (
    <div className="w-full transition-colors duration-300">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl w-full transition-colors duration-300">
        <CardContent className="p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BAGIAN 1: VISUAL ALGA */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 transition-colors">
                <Images className="h-5 w-5 text-teal-600 dark:text-teal-500" /> {formDict.visualSection}
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{formDict.coverLabel}</Label>
                  <input id="cover-image" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  <label htmlFor="cover-image" className="cursor-pointer block">
                    <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 transition-all group bg-white dark:bg-slate-900">
                      {coverPreview ? (
                        <div className="relative h-48 w-full">
                          <Image src={coverPreview} alt="Cover Preview" fill className="object-cover" unoptimized />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{formDict.changeCover}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-48 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          <ImagePlus className="h-10 w-10 mb-2" />
                          <span className="text-sm font-medium">{formDict.uploadCover}</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{formDict.galleryLabel}</Label>
                    <span className="text-xs text-slate-500">{totalGalleryCount}/8</span>
                  </div>
                  
                  {totalGalleryCount < 8 && (
                    <>
                      <input id="gallery-image" type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                      <label htmlFor="gallery-image" className="cursor-pointer block mb-3">
                        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                          {formDict.addGallery}
                        </div>
                      </label>
                    </>
                  )}

                  {(existingGallery.length > 0 || newGallery.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {existingGallery.map((url, index) => (
                        <div key={`exist-${index}`} className="relative aspect-square rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 group bg-white dark:bg-slate-900">
                          <Image src={url} alt={`Gallery DB ${index+1}`} fill className="object-cover opacity-80" unoptimized />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-slate-200 py-0.5 z-10">{formDict.saved}</div>
                          <button type="button" onClick={() => removeExistingGallery(index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      {newGallery.map((item, index) => (
                        <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border border-teal-500 dark:border-teal-700 group bg-white dark:bg-slate-900">
                          <Image src={item.preview} alt={`Gallery Baru ${index+1}`} fill className="object-cover" unoptimized />
                          <div className="absolute bottom-0 inset-x-0 bg-teal-600/80 text-[9px] text-center text-white py-0.5 font-bold z-10">{formDict.new}</div>
                          <button type="button" onClick={() => removeNewGallery(index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BAGIAN 2: IDENTITAS & PARAMETER */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2 bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">{formDict.identitasSection}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">{formDict.nameIdLabel}</Label>
                    <Input name="name_id" required value={formData.name_id} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-teal-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">{formDict.nameEnLabel}</Label>
                    <Input name="name_en" value={formData.name_en} onChange={handleChange} placeholder={formDict.nameEnPlaceholder} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-teal-500" />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">{formDict.aliasLabel}</Label>
                    <Input name="alias" value={formData.alias} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-teal-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">{formDict.scientificNameLabel}</Label>
                    <Input name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-teal-500 italic" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">{formDict.difficultyLabel}</Label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-slate-900 dark:text-slate-100 focus:border-teal-500 outline-none">
                  <option value="Easy">{getAlgaeDifficultyDesc("Easy", language)}</option>
                  <option value="Medium">{getAlgaeDifficultyDesc("Medium", language)}</option>
                  <option value="Hard">{getAlgaeDifficultyDesc("Hard", language)}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">{formDict.severityLabel}</Label>
                <Input type="number" name="severity" min="1" max="5" required value={formData.severity} onChange={handleChange} className="h-10 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-teal-500" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">💡 {formDict.severityHint}</p>
              </div>
            </div>

            {/* BAGIAN 3: DESKRIPSI UTAMA */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">{formDict.descSection}</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">{formDict.descId}</Label>
                  <textarea name="description_id" rows={4} value={formData.description_id} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">{formDict.descEn}</Label>
                  <textarea name="description_en" rows={4} value={formData.description_en} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y" />
                </div>
              </div>
            </div>

            {/* BAGIAN 4: PENYEBAB & SOLUSI */}
            <div className="space-y-6 bg-slate-50 dark:bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> {formDict.causesSolutionsSection}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">{formDict.causesId}</Label>
                  <textarea name="causes_id" rows={5} value={formData.causes_id} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-amber-500 outline-none resize-y" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">{formDict.causesEn}</Label>
                  <textarea name="causes_en" rows={5} value={formData.causes_en} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-amber-500 outline-none resize-y" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">{formDict.solutionsId}</Label>
                  <textarea name="solutions_id" rows={5} value={formData.solutions_id} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">{formDict.solutionsEn}</Label>
                  <textarea name="solutions_en" rows={5} value={formData.solutions_en} onChange={handleChange} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-teal-500 outline-none resize-y" />
                </div>
              </div>
            </div>

            {/* BAGIAN 5: PARAMETER SISTEM PAKAR AI */}
            <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 sm:p-6 rounded-xl border border-teal-200 dark:border-teal-900/50 space-y-6">
              
              <div className="border-b border-teal-200 dark:border-teal-900/50 pb-3 mb-2">
                <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                  <Brain className="w-5 h-5" /> {formDict.expertEngineSection}
                </h3>
                <p className="text-sm text-teal-600/80 dark:text-teal-400/80 mt-1">{formDict.expertEngineHint}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-teal-700 dark:text-teal-400 font-bold uppercase">{formDict.colors}</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">💡 {formDict.colorHint}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-teal-200 dark:border-teal-900/50">
                  {COLOR_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" value={tag} checked={formData.color_tags.includes(tag)} onChange={(e) => handleArrayCheckboxChange(e, "color_tags")} className="h-4 w-4 accent-teal-600 rounded shrink-0 border-slate-300 dark:border-slate-700" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getAlgaeTagDesc(tag, language)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 mt-4">
                <div>
                  <Label className="text-teal-700 dark:text-teal-400 font-bold uppercase">{formDict.textures}</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">💡 {formDict.textureHint}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-teal-200 dark:border-teal-900/50">
                  {TEXTURE_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" value={tag} checked={formData.texture_tags.includes(tag)} onChange={(e) => handleArrayCheckboxChange(e, "texture_tags")} className="h-4 w-4 accent-teal-600 rounded shrink-0 border-slate-300 dark:border-slate-700" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getAlgaeTagDesc(tag, language)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 mt-4">
                <div>
                  <Label className="text-teal-700 dark:text-teal-400 font-bold uppercase">{formDict.locations}</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">💡 {formDict.locationHint}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-teal-200 dark:border-teal-900/50">
                  {LOCATION_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" value={tag} checked={formData.location_tags.includes(tag)} onChange={(e) => handleArrayCheckboxChange(e, "location_tags")} className="h-4 w-4 accent-teal-600 rounded shrink-0 border-slate-300 dark:border-slate-700" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getAlgaeTagDesc(tag, language)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 mt-4">
                <div>
                  <Label className="text-teal-700 dark:text-teal-400 font-bold uppercase">{formDict.triggers}</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">💡 {formDict.triggerHint}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-teal-200 dark:border-teal-900/50">
                  {TRIGGER_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" value={tag} checked={formData.trigger_tags.includes(tag)} onChange={(e) => handleArrayCheckboxChange(e, "trigger_tags")} className="h-4 w-4 accent-teal-600 rounded shrink-0 border-slate-300 dark:border-slate-700" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getAlgaeTagDesc(tag, language)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* BAGIAN AFFECTED CONDITIONS */}
              <div className="space-y-3 pt-2 mt-4">
                <div>
                  <Label className="text-teal-700 dark:text-teal-400 font-bold uppercase">
                    {language === "id" ? "Dampak Ekosistem" : "Affected Conditions"}
                  </Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    💡 {language === "id" ? "Dampak/kerusakan sekunder yang ditimbulkan alga ini." : "Secondary damages caused by this algae."}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-teal-200 dark:border-teal-900/50">
                  {AFFECTED_CONDITIONS_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        value={tag} 
                        checked={formData.affected_conditions.includes(tag)} 
                        onChange={(e) => handleArrayCheckboxChange(e, "affected_conditions")} 
                        className="h-4 w-4 accent-teal-600 rounded shrink-0 border-slate-300 dark:border-slate-700" 
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {getAlgaeTagDesc(tag, language)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            {error && <div className="rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {/* ACTION BUTTONS UTAMA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                {mode === "edit" && algae && (
                  <>
                    <button type="button" onClick={triggerArchiveModal} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 flex items-center justify-center">
                      <Archive className="mr-2 h-4 w-4" /> {formDict.btnArchive}
                    </button>
                    {role === "super_admin" && (
                      <button type="button" onClick={triggerHardDeleteModal} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-400 disabled:opacity-50 flex items-center justify-center">
                        <Trash2 className="mr-2 h-4 w-4" /> {formDict.btnHardDelete}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button type="button" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50 flex items-center justify-center">
                  {formDict.btnCancel}
                </button>
                <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold transition-colors bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 flex items-center justify-center">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "create" ? formDict.btnSave : formDict.btnUpdate}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MODAL ARSIP */}
      {isArchiveModalOpen && algae && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Archive className="h-6 w-6" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{formDict.modalArchiveTitle}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {formDict.modalArchiveDesc1} <strong className="text-gray-900 dark:text-slate-200">{language === 'en' && algae.name_en ? algae.name_en : algae.name_id}</strong>{formDict.modalArchiveDesc2}
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

      {/* MODAL HAPUS PERMANEN */}
      {isDeleteModalOpen && algae && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-500">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{formDict.modalDeleteTitle}</h3>
            </div>
            
            <form onSubmit={executeHardDelete} className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {formDict.modalDeleteDesc1} <strong>{formDict.modalDeleteDesc2}</strong> {formDict.modalDeleteDesc3} <strong className="text-gray-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/30 px-1 py-0.5 rounded select-all">{language === 'en' && algae.name_en ? algae.name_en : algae.name_id}</strong> {formDict.modalDeleteDesc4}
              </p>
              
              <Input 
                required 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder={formDict.typeAlgaeName} 
                className="h-12 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-red-500 font-bold mb-4" 
              />
              
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading || deleteConfirmText !== (language === 'en' && algae.name_en ? algae.name_en : algae.name_id)} 
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