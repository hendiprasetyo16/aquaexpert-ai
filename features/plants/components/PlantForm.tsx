"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function PlantForm({ mode = "create", plant }: PlantFormProps) {
  const router = useRouter();
  const { role } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // STATES UNTUK GAMBAR (COVER & GALLERY)
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // V2: DITAMBAHKAN 9 FIELD EXPERT ENGINE
  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    placement: "Midground",
    difficulty: "Easy", 
    light_requirement: "Medium",
    co2_requirement: "Low",
    fertilizer_requirement: "Medium",
    growth_rate: "Medium",
    temperature_min: "",
    temperature_max: "",
    ph_min: "",
    ph_max: "",
    origin_country: "",
    max_height_cm: "",
    description: "",
    source_name: "Tropica", 
    source_url: "https://tropica.com",
    recommended_for: "", 
    // Expert Fields
    plant_type: "Stem",
    aquascape_style: "",
    beginner_score: "",
    maintenance_level: "Medium",
    carpet_potential: false,
    shrimp_safe: true,
    growth_control: "Moderate",
    tank_size_recommendation: "",
    expert_notes: ""
  });

  useEffect(() => {
    if (mode === "edit" && plant) {
      setFormData({
        name: plant.name || "",
        scientific_name: plant.scientific_name || "",
        placement: plant.placement || "Midground",
        difficulty: plant.difficulty || "Easy",
        light_requirement: plant.light_requirement || "Medium",
        co2_requirement: plant.co2_requirement || "Low",
        fertilizer_requirement: plant.fertilizer_requirement || "Medium",
        growth_rate: plant.growth_rate || "Medium",
        temperature_min: plant.temperature_min != null ? plant.temperature_min.toString() : "",
        temperature_max: plant.temperature_max != null ? plant.temperature_max.toString() : "",
        ph_min: plant.ph_min != null ? plant.ph_min.toString() : "",
        ph_max: plant.ph_max != null ? plant.ph_max.toString() : "",
        origin_country: plant.origin_country || "",
        max_height_cm: plant.max_height_cm != null ? plant.max_height_cm.toString() : "",
        description: plant.description || "",
        source_name: plant.source_name || "",
        source_url: plant.source_url || "",
        recommended_for: plant.recommended_for?.join(", ") || "", 
        // Expert Fields
        plant_type: plant.plant_type || "Stem",
        aquascape_style: plant.aquascape_style?.join(", ") || "",
        beginner_score: plant.beginner_score != null ? plant.beginner_score.toString() : "",
        maintenance_level: plant.maintenance_level || "Medium",
        carpet_potential: plant.carpet_potential || false,
        shrimp_safe: plant.shrimp_safe !== false, // Default true if null
        growth_control: plant.growth_control || "Moderate",
        tank_size_recommendation: plant.tank_size_recommendation?.join(", ") || "",
        expert_notes: plant.expert_notes || ""
      });

      if (plant.image_url) setCoverPreview(plant.image_url);
      if (plant.gallery_urls) setGalleryPreviews(plant.gallery_urls);
    }
  }, [plant, mode]);

  // HANDLER: UPDATE UNTUK MENDUKUNG CHECKBOX (BOOLEAN)
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  // HANDLER: UPLOAD COVER IMAGE
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
    }
  }

  // HANDLER: UPLOAD GALLERY IMAGES (Maksimal 3)
  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      
      const newValidFiles = filesArray.filter(f => validTypes.includes(f.type) && f.size <= 2 * 1024 * 1024);
      
      if (newValidFiles.length !== filesArray.length) {
        toast.error("Beberapa gambar diabaikan karena format tidak valid atau melebihi 2MB.");
      }

      const totalFiles = [...galleryFiles, ...newValidFiles].slice(0, 3);
      setGalleryFiles(totalFiles);
      
      const newPreviews = newValidFiles.map(f => URL.createObjectURL(f));
      const totalPreviews = [...galleryPreviews.filter(p => !p.startsWith('blob:')), ...newPreviews].slice(0, 3);
      setGalleryPreviews(totalPreviews);
    }
  }

  function removeGalleryImage(index: number) {
    const newFiles = [...galleryFiles];
    if (index < newFiles.length) {
       newFiles.splice(index, 1);
       setGalleryFiles(newFiles);
    }
    
    const newPreviews = [...galleryPreviews];
    newPreviews.splice(index, 1);
    setGalleryPreviews(newPreviews);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

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

      let finalCoverUrl = plant?.image_url || "";
      let finalGalleryUrls = [...(plant?.gallery_urls || [])];

      const plantSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      if (coverFile) {
        const ext = coverFile.name.split(".").pop(); 
        finalCoverUrl = await uploadPlantImage(coverFile, plantSlug, `cover.${ext}`);
      }

      if (galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
           const ext = galleryFiles[i].name.split(".").pop();
           const gUrl = await uploadPlantImage(galleryFiles[i], plantSlug, `gallery-${i+1}.${ext}`);
           finalGalleryUrls.push(gUrl);
        }
        finalGalleryUrls = finalGalleryUrls.slice(0, 3);
      }

      const payloadArrayRecommended = formData.recommended_for.split(",").map((item) => item.trim()).filter(Boolean);
      const payloadStyle = formData.aquascape_style.split(",").map((item) => item.trim()).filter(Boolean);
      const payloadTank = formData.tank_size_recommendation.split(",").map((item) => item.trim()).filter(Boolean);

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
        recommended_for: payloadArrayRecommended.length > 0 ? payloadArrayRecommended : null,
        image_url: finalCoverUrl,
        gallery_urls: finalGalleryUrls.length > 0 ? finalGalleryUrls : [],
        // Payload Expert Fields V2
        plant_type: formData.plant_type,
        aquascape_style: payloadStyle.length > 0 ? payloadStyle : null,
        beginner_score: formData.beginner_score ? parseInt(formData.beginner_score) : null,
        maintenance_level: formData.maintenance_level,
        carpet_potential: formData.carpet_potential,
        shrimp_safe: formData.shrimp_safe,
        growth_control: formData.growth_control,
        tank_size_recommendation: payloadTank.length > 0 ? payloadTank : null,
        expert_notes: formData.expert_notes
      };

      if (mode === "create") {
        const result = await createPlantAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Tanaman berhasil ditambahkan!");
      } else {
        const result = await updatePlantAction(plant!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Data tanaman berhasil diperbarui!");
      }

      router.push("/dashboard/plants");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan saat menyimpan data.");
      toast.error(err?.message || "Terjadi kesalahan saat menyimpan data.");
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

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-xl max-w-4xl mx-auto mb-20">
      <CardContent className="p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN 1: UPLOAD GAMBAR FINAL (COVER + 3 GALLERY) */}
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
                        <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
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
                  <Label className="text-slate-300 font-semibold text-sm">Galeri Tambahan (Maks 3)</Label>
                  <span className="text-xs text-slate-500">{galleryPreviews.length}/3</span>
                </div>
                
                {galleryPreviews.length < 3 && (
                  <>
                    <input id="gallery-image" type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                    <label htmlFor="gallery-image" className="cursor-pointer block mb-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-900/50 py-3 text-center text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-teal-400 transition-colors">
                        + Tambah Gambar Galeri
                      </div>
                    </label>
                  </>
                )}

                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-700 group">
                        <img src={preview} alt={`Gallery ${index+1}`} className="h-full w-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
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
                <option value="Foreground">Foreground</option><option value="Midground">Midground</option><option value="Background">Background</option><option value="Epiphyte">Epiphyte</option><option value="Floating">Floating</option>
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
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input type="number" step="0.1" name="temperature_min" value={formData.temperature_min} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Suhu Max (°C)</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input type="number" step="0.1" name="temperature_max" value={formData.temperature_max} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">pH Min</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input type="number" step="0.1" name="ph_min" value={formData.ph_min} onChange={handleChange} className="h-9 bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">pH Max</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Tinggi Max (cm)</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input type="number" name="max_height_cm" value={formData.max_height_cm} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Asal Negara/Wilayah</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input name="origin_country" placeholder="Contoh: Asia, Cultivar" value={formData.origin_country} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Sumber Data (Kredit)</Label>
                {/* DITAMBAHKAN class text-slate-100 AGAR TEKS TERLIHAT */}
                <Input name="source_name" value={formData.source_name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 text-sm focus:border-teal-500" />
              </div>
            </div>
          </div>

          {/* BAGIAN 5: PARAMETER SISTEM PAKAR (EXPERT ENGINE V2) */}
          <div className="bg-teal-950/20 p-4 sm:p-6 rounded-xl border border-teal-900/50 space-y-6">
            <h3 className="text-lg font-bold text-teal-400 mb-2">Konfigurasi Expert Engine (V2)</h3>
            <p className="text-xs text-teal-500/70 mb-4 -mt-2">Parameter di bawah ini adalah "Otak" yang akan digunakan AI untuk memberikan rekomendasi pintar.</p>
            
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Tipe Tanaman (Plant Type)</Label>
                <select name="plant_type" value={formData.plant_type} onChange={handleChange} className="h-10 w-full rounded-md border border-teal-800/50 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                  <option value="Stem">Stem (Batang)</option><option value="Rosette">Rosette (Roset)</option><option value="Epiphyte">Epiphyte (Menempel)</option>
                  <option value="Moss">Moss (Lumut)</option><option value="Floating">Floating (Apung)</option><option value="Bulb">Bulb (Umbi)</option><option value="Carpet">Carpet (Karpet)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Beginner Score (1-10)</Label>
                <Input type="number" min="1" max="10" name="beginner_score" placeholder="10 = Sangat Mudah" value={formData.beginner_score} onChange={handleChange} className="bg-slate-950 border-teal-800/50 text-slate-100 focus:border-teal-500" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sifat Penyebaran (Growth Control)</Label>
                <select name="growth_control" value={formData.growth_control} onChange={handleChange} className="h-10 w-full rounded-md border border-teal-800/50 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                  <option value="Slow">Slow (Terpusat)</option><option value="Moderate">Moderate (Wajar)</option><option value="Aggressive">Aggressive (Menyebar Liar)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Gaya Aquascape (Pisahkan koma)</Label>
                <Input name="aquascape_style" placeholder="Dutch, Iwagumi, Nature..." value={formData.aquascape_style} onChange={handleChange} className="bg-slate-950 border-teal-800/50 text-slate-100 focus:border-teal-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rekomendasi Ukuran Tank (Pisahkan koma)</Label>
                <Input name="tank_size_recommendation" placeholder="Nano, Medium, Large" value={formData.tank_size_recommendation} onChange={handleChange} className="bg-slate-950 border-teal-800/50 text-slate-100 focus:border-teal-500" />
              </div>
            </div>

            <div className="flex gap-6 mt-2 p-3 bg-slate-950/50 rounded-lg border border-teal-900/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="carpet_potential" checked={formData.carpet_potential} onChange={handleChange} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900" />
                <span className="text-sm font-medium text-slate-300">Potensi Jadi Karpet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="shrimp_safe" checked={formData.shrimp_safe} onChange={handleChange} className="h-4 w-4 accent-teal-600 rounded border-slate-700 bg-slate-900" />
                <span className="text-sm font-medium text-slate-300">Aman untuk Udang (Shrimp Safe)</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-bold text-teal-400">Catatan Pakar (Expert Notes)</Label>
              <textarea 
                name="expert_notes" 
                rows={3} 
                value={formData.expert_notes} 
                onChange={handleChange} 
                className="w-full rounded-md border border-teal-800/50 bg-slate-950 p-3 text-slate-100 focus:border-teal-500 outline-none leading-relaxed resize-y" 
                placeholder="Contoh: Sangat rakus menyerap nitrat, waspadai defisiensi kalium (K) yang menyebabkan daun berlubang..."
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