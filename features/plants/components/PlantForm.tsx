"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client"; 
import { deletePlant, uploadPlantImage, removePlantImage } from "../repositories/plant.repository";
import { createPlantAction, updatePlantAction, hardDeletePlantAction } from "../actions/plant.actions";
import { Plant } from "../types/plant.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus, Archive, Trash2, X, Images } from "lucide-react";
import toast from "react-hot-toast";

interface PlantFormProps {
  mode?: "create" | "edit";
  plant?: Plant;
}

// Opsi statis untuk Checkbox
const TANK_SIZES = ["Nano (≤40cm)", "Small (45-60cm)", "Medium (60-90cm)", "Large (90-120cm)", "Extra Large (>120cm)"];
const AQUASCAPE_STYLES = ["Nature", "Dutch", "Iwagumi", "Jungle", "Biotope", "Taiwan"];
const RECOMMENDATIONS = ["Pemula", "Low Tech", "High Tech", "Shrimp Tank", "Nano Tank", "Dutch Style", "Nature Style"];

export default function PlantForm({ mode = "create", plant }: PlantFormProps) {
  const router = useRouter();
  const { role } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // STATE COVER
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  
  // STATE GALLERY (Dipecah agar bisa hapus satu-satu - MAKSIMAL 5)
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [newGallery, setNewGallery] = useState<{file: File, preview: string}[]>([]);
  
  // TRACKING GAMBAR YANG HARUS DIHAPUS DARI STORAGE MENGGUNAKAN useRef
  const imagesToDeleteRef = useRef<string[]>([]);

  // V2: 9 FIELD EXPERT ENGINE (Ubah aquascape_style, tank_size, & recommended_for menjadi Array)
  const [formData, setFormData] = useState({
    name: "", scientific_name: "", placement: "Midground", difficulty: "Easy", 
    light_requirement: "Medium", co2_requirement: "Low", fertilizer_requirement: "Medium",
    growth_rate: "Medium", temperature_min: "", temperature_max: "", ph_min: "", ph_max: "",
    origin_country: "", max_height_cm: "", description: "", source_name: "Tropica", 
    source_url: "", 
    recommended_for: [] as string[], 
    plant_type: "Stem", beginner_score: "", maintenance_level: "Medium",
    carpet_potential: false, shrimp_safe: true, growth_control: "Moderate",
    aquascape_style: [] as string[], 
    tank_size_recommendation: [] as string[], 
    expert_notes: ""
  });

  useEffect(() => {
    if (mode === "edit" && plant) {
      setFormData({
        name: plant.name || "", scientific_name: plant.scientific_name || "",
        placement: plant.placement || "Midground", difficulty: plant.difficulty || "Easy",
        light_requirement: plant.light_requirement || "Medium", co2_requirement: plant.co2_requirement || "Low",
        fertilizer_requirement: plant.fertilizer_requirement || "Medium", growth_rate: plant.growth_rate || "Medium",
        temperature_min: plant.temperature_min != null ? plant.temperature_min.toString() : "",
        temperature_max: plant.temperature_max != null ? plant.temperature_max.toString() : "",
        ph_min: plant.ph_min != null ? plant.ph_min.toString() : "", ph_max: plant.ph_max != null ? plant.ph_max.toString() : "",
        origin_country: plant.origin_country || "", max_height_cm: plant.max_height_cm != null ? plant.max_height_cm.toString() : "",
        description: plant.description || "", source_name: plant.source_name || "",
        source_url: plant.source_url || "", 
        recommended_for: plant.recommended_for || [], // Format array
        plant_type: plant.plant_type || "Stem", 
        aquascape_style: plant.aquascape_style || [], // Format array
        beginner_score: plant.beginner_score != null ? plant.beginner_score.toString() : "",
        maintenance_level: plant.maintenance_level || "Medium", carpet_potential: plant.carpet_potential || false,
        shrimp_safe: plant.shrimp_safe !== false, growth_control: plant.growth_control || "Moderate",
        tank_size_recommendation: plant.tank_size_recommendation || [], // Format array
        expert_notes: plant.expert_notes || ""
      });

      if (plant.image_url) setCoverPreview(plant.image_url);
      if (plant.gallery_urls) setExistingGallery(plant.gallery_urls);
    }
  }, [plant, mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  // KHUSUS UNTUK CHECKBOX ARRAY
  function handleArrayCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, field: "aquascape_style" | "tank_size_recommendation" | "recommended_for") {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentArray = prev[field];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter((item) => item !== value) };
      }
    });
  }

  // --- LOGIKA COVER ---
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

      if (!validTypes.includes(file.type)) {
        setError("Format Cover harus JPG, PNG atau WEBP."); return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran Cover maksimal 2MB."); return;
      }

      setError(null);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));

      // Jika sebelumnya ada cover lama dari DB, masukkan ke daftar hapus via useRef
      if (
        mode === "edit" &&
        plant?.image_url &&
        !imagesToDeleteRef.current.includes(plant.image_url)
      ) {
        imagesToDeleteRef.current.push(plant.image_url);
      }
    }
  }

  // --- LOGIKA GALLERY BARU (MAKS 5) ---
  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      const newValidFiles = filesArray.filter(f => validTypes.includes(f.type) && f.size <= 2 * 1024 * 1024);
      
      if (newValidFiles.length !== filesArray.length) {
        toast.error("Beberapa gambar diabaikan karena format tidak valid atau melebihi 2MB.");
      }

      // BATAS MAKSIMAL 5
      const spaceLeft = 5 - (existingGallery.length + newGallery.length);
      if (spaceLeft <= 0) {
        toast.error("Maksimal 5 gambar galeri."); return;
      }

      const filesToAdd = newValidFiles.slice(0, spaceLeft).map(file => ({
        file, preview: URL.createObjectURL(file)
      }));

      setNewGallery([...newGallery, ...filesToAdd]);
    }
  }

  function removeExistingGallery(index: number) {
    const urlToRemove = existingGallery[index];
    
    // Gunakan useRef untuk melacak file yang dihapus
    if (!imagesToDeleteRef.current.includes(urlToRemove)) {
      imagesToDeleteRef.current.push(urlToRemove);
    }

    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  }

  function removeNewGallery(index: number) {
    setNewGallery(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // --- ARRAY ROLLBACK: Melacak semua file baru yang sukses di-upload ---
    const uploadedImagesToRollback: string[] = [];

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const cleanName = formData.name.trim();

      // VALIDASI NAMA UNIK
      let query = supabase.from("plants").select("id").ilike("name", cleanName).eq("is_active", true);
      if (mode === "edit" && plant) query = query.neq("id", plant.id);

      const { data: existingPlant, error: checkError } = await query.maybeSingle();
      if (checkError) throw new Error(checkError.message);
      if (existingPlant) {
        setError(`Tanaman "${cleanName}" sudah ada di database.`);
        toast.error(`Tanaman "${cleanName}" sudah ada di database.`);
        return; 
      }

      let finalCoverUrl = mode === "edit" ? (plant?.image_url || "") : "";
      let finalGalleryUrls = [...existingGallery];

      // Fix Slug agar tidak buat folder baru jika direname saat mode edit
      const plantSlug =
        mode === "edit"
          ? plant?.slug ||
            cleanName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
          : cleanName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

      // 1. UPLOAD COVER BARU
      if (coverFile) {
        finalCoverUrl = await uploadPlantImage(coverFile, plantSlug, `cover`);
        uploadedImagesToRollback.push(finalCoverUrl); // Catat untuk potensi rollback
      }

      // 2. UPLOAD GALLERY BARU
      for (let i = 0; i < newGallery.length; i++) {
         const gUrl = await uploadPlantImage(newGallery[i].file, plantSlug, `gallery`);
         finalGalleryUrls.push(gUrl);
         uploadedImagesToRollback.push(gUrl); // Catat untuk potensi rollback
      }

      const payload: Partial<Plant> = {
        name: cleanName,
        scientific_name: formData.scientific_name,
        placement: formData.placement,
        difficulty: formData.difficulty,
        light_requirement: formData.light_requirement,
        co2_requirement: formData.co2_requirement,
        fertilizer_requirement: formData.fertilizer_requirement,
        growth_rate: formData.growth_rate,
        temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : null,
        temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : null,
        ph_min: formData.ph_min ? parseFloat(formData.ph_min) : null,
        ph_max: formData.ph_max ? parseFloat(formData.ph_max) : null,
        origin_country: formData.origin_country,
        max_height_cm: formData.max_height_cm ? parseInt(formData.max_height_cm) : null,
        description: formData.description,
        source_name: formData.source_name,
        source_url: formData.source_url,
        recommended_for: formData.recommended_for.length > 0 ? formData.recommended_for : null,
        image_url: finalCoverUrl,
        gallery_urls: finalGalleryUrls,
        plant_type: formData.plant_type,
        aquascape_style: formData.aquascape_style.length > 0 ? formData.aquascape_style : null,
        beginner_score: formData.beginner_score ? parseInt(formData.beginner_score) : null,
        maintenance_level: formData.maintenance_level,
        carpet_potential: formData.carpet_potential,
        shrimp_safe: formData.shrimp_safe,
        growth_control: formData.growth_control,
        tank_size_recommendation: formData.tank_size_recommendation.length > 0 ? formData.tank_size_recommendation : null,
        expert_notes: formData.expert_notes
      };

      // 3. SIMPAN KE DATABASE
      if (mode === "create") {
        const result = await createPlantAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Tanaman berhasil ditambahkan!");
      } else {
        const result = await updatePlantAction(plant!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Data tanaman berhasil diperbarui!");
      }

      // 4. CLEANUP STORAGE: Eksekusi hapus file lama HANYA JIKA save DB sukses
      for (const urlToDelete of imagesToDeleteRef.current) {
        try {
          await removePlantImage(urlToDelete);
        } catch (err) {
          console.error("Gagal menghapus file lama:", urlToDelete, err);
        }
      }
      
      // Reset ref setelah cleanup
      imagesToDeleteRef.current = [];

      router.push("/dashboard/plants");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan saat menyimpan data.");
      toast.error(err?.message || "Terjadi kesalahan saat menyimpan data.");
      
      // --- LOGIKA ROLLBACK STORAGE ---
      if (uploadedImagesToRollback.length > 0) {
        console.log("Melakukan rollback pada file yang baru diupload...", uploadedImagesToRollback);
        for (const orphanUrl of uploadedImagesToRollback) {
          await removePlantImage(orphanUrl);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!plant || mode !== "edit") return;
    const confirmDelete = window.confirm(`Yakin ingin mengarsipkan tanaman ${plant.name}?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deletePlant(plant.id); 
      toast.success("Tanaman berhasil diarsipkan.");
      router.push("/dashboard/plants");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengarsipkan tanaman.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHardDelete() {
    if (!plant) return;
    const confirmText = window.prompt(`Ketik nama tanaman "${plant.name}" untuk menghapus permanen:`);
    if (confirmText !== plant.name) {
      toast.error("Penghapusan dibatalkan."); return;
    }

    try {
      setLoading(true);
      const result = await hardDeletePlantAction(plant.id);
      if (!result.success) throw new Error(result.error);
      
      toast.success("Tanaman dihapus permanen.");
      router.push("/dashboard/plants");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus permanen.");
    } finally {
      setLoading(false);
    }
  }

  const totalGalleryCount = existingGallery.length + newGallery.length;

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-xl max-w-4xl mx-auto mb-20">
      <CardContent className="p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN 1: UPLOAD GAMBAR FINAL */}
          <div className="space-y-4 bg-slate-950/50 p-4 sm:p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Images className="h-5 w-5 text-teal-500" /> Visual Tanaman
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* UPLOAD COVER */}
              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold text-sm">Cover Utama (1 Gambar)</Label>
                <input id="cover-image" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                <label htmlFor="cover-image" className="cursor-pointer block">
                  <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-700 hover:border-teal-500 transition-all group">
                    {coverPreview ? (
                      <div className="relative h-48 w-full">
                        <Image src={coverPreview} alt="Cover Preview" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Ganti Cover</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center bg-slate-900/50 text-slate-500 group-hover:text-teal-400 transition-colors">
                        <ImagePlus className="h-10 w-10 mb-2" />
                        <span className="text-sm font-medium">Klik untuk upload Cover</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* UPLOAD GALERI */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-300 font-semibold text-sm">Galeri Tambahan (Maks 5)</Label>
                  <span className="text-xs text-slate-500">{totalGalleryCount}/5</span>
                </div>
                
                {totalGalleryCount < 5 && (
                  <>
                    <input id="gallery-image" type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                    <label htmlFor="gallery-image" className="cursor-pointer block mb-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-900/50 py-3 text-center text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-teal-400 transition-colors">
                        + Tambah Gambar Galeri
                      </div>
                    </label>
                  </>
                )}

                {(existingGallery.length > 0 || newGallery.length > 0) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {/* Render Existing */}
                    {existingGallery.map((url, index) => (
                      <div key={`exist-${index}`} className="relative aspect-square rounded-md overflow-hidden border border-slate-700 group">
                        <Image src={url} alt={`Gallery DB ${index+1}`} fill className="object-cover opacity-80" unoptimized />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-slate-300 py-0.5 z-10">Tersimpan</div>
                        <button type="button" onClick={() => removeExistingGallery(index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {/* Render New */}
                    {newGallery.map((item, index) => (
                      <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border border-teal-700 group">
                        <Image src={item.preview} alt={`Gallery Baru ${index+1}`} fill className="object-cover" unoptimized />
                        <div className="absolute bottom-0 inset-x-0 bg-teal-600/80 text-[9px] text-center text-white py-0.5 font-bold z-10">Baru</div>
                        <button type="button" onClick={() => removeNewGallery(index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BAGIAN 2: IDENTITAS & PARAMETER DASAR */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Tanaman <span className="text-red-500">*</span></Label>
              <Input name="name" required value={formData.name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Ilmiah (Latin)</Label>
              <Input name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500 italic" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Tingkat Kesulitan</Label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option value="Easy">Easy (Mudah)</option>
                <option value="Medium">Medium (Sedang)</option>
                <option value="Hard">Hard (Sulit)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Posisi Penanaman</Label>
              <select name="placement" value={formData.placement} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option value="Foreground">Foreground</option>
                <option value="Midground">Midground</option>
                <option value="Background">Background</option>
                <option value="Floating">Floating</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Tingkat Perawatan (Maintenance)</Label>
              <select name="maintenance_level" value={formData.maintenance_level} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option value="Low">Low (Jarang Trimming/Perawatan)</option>
                <option value="Medium">Medium (Perawatan Rutin)</option>
                <option value="High">High (Sering Trimming/Replant)</option>
              </select>
            </div>
          </div>

          {/* BAGIAN 3: PARAMETER AIR (WATER PARAMETERS) */}
          <div className="bg-slate-950/30 p-4 sm:p-6 rounded-xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-slate-300 mb-2">Parameter Air & Perawatan</h3>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Cahaya</Label>
                <select name="light_requirement" value={formData.light_requirement} onChange={handleChange} className="h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Injeksi CO2</Label>
                <select name="co2_requirement" value={formData.co2_requirement} onChange={handleChange} className="h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Kebutuhan Nutrisi</Label>
                <select name="fertilizer_requirement" value={formData.fertilizer_requirement} onChange={handleChange} className="h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Laju Pertumbuhan</Label>
                <select name="growth_rate" value={formData.growth_rate} onChange={handleChange} className="h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 outline-none">
                  <option value="Slow">Slow</option><option value="Medium">Medium</option><option value="Fast">Fast</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Suhu Min (°C)</Label>
                <Input type="number" step="0.1" name="temperature_min" value={formData.temperature_min} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Suhu Max (°C)</Label>
                <Input type="number" step="0.1" name="temperature_max" value={formData.temperature_max} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">pH Min</Label>
                <Input type="number" step="0.1" name="ph_min" value={formData.ph_min} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">pH Max</Label>
                <Input type="number" step="0.1" name="ph_max" value={formData.ph_max} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
            </div>
          </div>

          {/* BAGIAN 4: DESKRIPSI & INFO TAMBAHAN */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Deskripsi Ilmiah (Ensiklopedia)</Label>
              <textarea 
                name="description" 
                rows={4} 
                value={formData.description} 
                onChange={handleChange} 
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-slate-100 focus:border-teal-500 outline-none leading-relaxed resize-y" 
                placeholder="Tulis deskripsi detail tanaman, sejarah, atau karakter biologi..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Tinggi Max (cm)</Label>
                <Input type="number" name="max_height_cm" value={formData.max_height_cm} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Asal Negara/Wilayah</Label>
                <Input name="origin_country" placeholder="Contoh: Asia, Cultivar" value={formData.origin_country} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Sumber Data (Kredit)</Label>
                <Input name="source_name" placeholder="Contoh: Tropica" value={formData.source_name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              {/* PERBAIKAN: TAMBAHAN FIELD URL SUMBER */}
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">URL Sumber (Link)</Label>
                <Input name="source_url" type="url" placeholder="https://tropica.com/..." value={formData.source_url} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
            </div>
          </div>

          {/* BAGIAN 5: PARAMETER SISTEM PAKAR (EXPERT ENGINE V2) */}
          <div className="bg-teal-950/20 p-4 sm:p-6 rounded-xl border border-teal-900/50 space-y-6">
            <h3 className="text-lg font-bold text-teal-400 mb-2">Konfigurasi Expert Engine (V2)</h3>
            
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Tipe Tanaman (Plant Type)</Label>
                <select name="plant_type" value={formData.plant_type} onChange={handleChange} className="h-10 w-full rounded-md border border-teal-800/50 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                  <option value="Stem">Stem (Batang)</option>
                  <option value="Rhizome">Rhizome (Rimpang)</option>
                  <option value="Runner">Runner (Menjalar)</option>
                  <option value="Rosette">Rosette (Roset)</option>
                  <option value="Epiphyte">Epiphyte (Menempel)</option>
                  <option value="Moss">Moss (Lumut)</option>
                  <option value="Floating">Floating (Apung)</option>
                  <option value="Bulb">Bulb (Umbi)</option>
                  <option value="Carpet">Carpet (Karpet)</option>
                  <option value="Crypt">Crypt (Cryptocoryne)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Beginner Score (1-10)</Label>
                <select name="beginner_score" value={formData.beginner_score} onChange={handleChange} className="h-10 w-full rounded-md border border-teal-800/50 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                  <option value="">-- Pilih --</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} {num === 10 ? "(Sangat Mudah)" : num === 1 ? "(Sangat Sulit)" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sifat Penyebaran (Growth Control)</Label>
                <select name="growth_control" value={formData.growth_control} onChange={handleChange} className="h-10 w-full rounded-md border border-teal-800/50 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                  <option value="Slow">Slow (Terpusat)</option>
                  <option value="Moderate">Moderate (Wajar)</option>
                  <option value="Fast">Fast (Cepat)</option>
                  <option value="Aggressive">Aggressive (Menyebar Liar)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-2">
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-teal-900/30">
                <Label className="text-slate-300 font-medium">Gaya Aquascape (Bisa pilih lebih dari satu)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AQUASCAPE_STYLES.map(style => (
                    <label key={style} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" value={style} checked={formData.aquascape_style.includes(style)} onChange={(e) => handleArrayCheckboxChange(e, "aquascape_style")} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900 cursor-pointer" />
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{style}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-teal-900/30">
                <Label className="text-slate-300 font-medium">Rekomendasi Ukuran Tank</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TANK_SIZES.map(size => (
                    <label key={size} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" value={size} checked={formData.tank_size_recommendation.includes(size)} onChange={(e) => handleArrayCheckboxChange(e, "tank_size_recommendation")} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900 cursor-pointer" />
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* PERBAIKAN: TAMBAHAN CHECKBOX DIREKOMENDASIKAN UNTUK */}
            <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-teal-900/30 mt-2">
              <Label className="text-slate-300 font-medium">Direkomendasikan Untuk (Kategori Spesifik)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {RECOMMENDATIONS.map(rec => (
                  <label key={rec} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" value={rec} checked={formData.recommended_for.includes(rec)} onChange={(e) => handleArrayCheckboxChange(e, "recommended_for")} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900 cursor-pointer" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{rec}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-6 mt-4 p-3 bg-slate-950/50 rounded-lg border border-teal-900/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="carpet_potential" checked={formData.carpet_potential} onChange={handleChange} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900" />
                <span className="text-sm font-medium text-slate-300">Potensi Jadi Karpet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="shrimp_safe" checked={formData.shrimp_safe} onChange={handleChange} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900" />
                <span className="text-sm font-medium text-slate-300">Aman untuk Udang (Shrimp Safe)</span>
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-slate-300 font-bold text-teal-400">Catatan Pakar (Expert Notes)</Label>
              <textarea 
                name="expert_notes" 
                rows={3} 
                value={formData.expert_notes} 
                onChange={handleChange} 
                className="w-full rounded-md border border-teal-800/50 bg-slate-950 p-3 text-slate-100 focus:border-teal-500 outline-none leading-relaxed resize-y" 
                placeholder="Contoh: Sangat rakus menyerap nitrat, waspadai defisiensi kalium (K)..."
              />
            </div>
          </div>

          {error && <div className="rounded border border-red-900 bg-red-950/50 p-3 text-red-400 font-medium text-sm text-center animate-pulse">{error}</div>}

          {/* KELOMPOK TOMBOL AKSI RESPONSIF MOBILE */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between border-t border-slate-800 pt-6 mt-8">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {mode === "edit" && (
                <>
                  <Button type="button" variant="secondary" onClick={handleDelete} disabled={loading} className="w-full sm:w-auto bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">
                    <Archive className="mr-2 h-4 w-4" /> Arsipkan
                  </Button>

                  {role === "super_admin" && (
                    <Button type="button" variant="destructive" onClick={handleHardDelete} disabled={loading} className="w-full sm:w-auto bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-800">
                      <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
              <Button type="button" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-lg shadow-teal-900/20">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Simpan Tanaman" : "Update Tanaman"}
              </Button>
            </div>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}