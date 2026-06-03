"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // <-- Panggil useAuth
import { deletePlant, uploadPlantImage, removePlantImage } from "../repositories/plant.repository";
import { createPlantAction, updatePlantAction, hardDeletePlantAction } from "../actions/plant.actions"; // <-- Import Hard Delete
import { Plant } from "../types/plant.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus, Archive, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface PlantFormProps {
  mode?: "create" | "edit";
  plant?: Plant;
}

export default function PlantForm({ mode = "create", plant }: PlantFormProps) {
  const router = useRouter();
  const { role } = useAuth(); // <-- Ambil role

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    placement: "Midground",
    difficulty: "Mudah",
    light_requirement: "Sedang",
    co2_requirement: "Rendah",
    source_name: "", 
    source_url: "",
    recommended_for: "", 
  });

  useEffect(() => {
    if (mode === "edit" && plant) {
      setFormData({
        name: plant.name || "",
        scientific_name: plant.scientific_name || "",
        placement: plant.placement || "Midground",
        difficulty: plant.difficulty || "Mudah",
        light_requirement: plant.light_requirement || "Sedang",
        co2_requirement: plant.co2_requirement || "Rendah",
        source_name: plant.source_name || "",
        source_url: plant.source_url || "",
        recommended_for: plant.recommended_for?.join(", ") || "", 
      });

      if (plant.image_url) setPreviewImage(plant.image_url);
    }
  }, [plant, mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

      if (!validTypes.includes(file.type)) {
        setError("Format gambar harus JPG, PNG atau WEBP."); return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 2MB."); return;
      }

      setError(null);
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      let finalImageUrl = plant?.image_url || "";
      const oldImageUrl = plant?.image_url || "";

      // Upload gambar baru
      if (imageFile) {
        finalImageUrl = await uploadPlantImage(imageFile, formData.name);
      }

      const payloadArrayRecommended = formData.recommended_for
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const payload: Partial<Plant> = {
        ...formData,
        recommended_for: payloadArrayRecommended,
        image_url: finalImageUrl,
      };

      if (mode === "create") {
        const result = await createPlantAction(payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Tanaman berhasil ditambahkan!");
      } else {
        const result = await updatePlantAction(plant!.id, payload);
        if (!result.success) throw new Error(result.error);
        toast.success("Data tanaman berhasil diperbarui!");

        // Hapus gambar lama jika upload baru sukses
        if (imageFile && oldImageUrl) {
          await removePlantImage(oldImageUrl);
        }
      }

      router.replace("/dashboard/plants");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      const message = err?.message || "Terjadi kesalahan saat menyimpan data.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // 1. FUNGSI SOFT DELETE (ARSIP)
  async function handleDelete() {
    if (!plant || mode !== "edit") return;
    if (loading) return; 

    const confirmDelete = window.confirm(`Yakin ingin mengarsipkan tanaman ${plant.name}?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deletePlant(plant.id); 
      toast.success("Tanaman berhasil diarsipkan.");
      router.replace("/dashboard/plants");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Gagal mengarsipkan tanaman.");
    } finally {
      setLoading(false);
    }
  }

  // 2. FUNGSI HARD DELETE (HAPUS PERMANEN)
  async function handleHardDelete() {
    if (!plant) return;
    if (loading) return;

    const confirmed = window.confirm(
      `PERMANEN HAPUS ${plant.name}? Tindakan ini tidak bisa dibatalkan dan akan menghapus data ini dari sistem pakar.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await hardDeletePlantAction(plant.id);

      if (!result.success) throw new Error(result.error);
      
      // Hapus gambar dari storage jika ada saat hard delete
      if (plant.image_url) {
        await removePlantImage(plant.image_url);
      }

      toast.success("Tanaman berhasil dihapus permanen.");
      router.replace("/dashboard/plants");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menghapus permanen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* AREA GAMBAR */}
          <div className="space-y-4">
            <Label className="text-slate-300">Gambar Tanaman</Label>
            <input id="plant-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" key={fileInputKey} />
            <label htmlFor="plant-image" className="cursor-pointer block">
              <div className="overflow-hidden rounded-lg border border-slate-700 hover:border-teal-500 transition">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="h-64 w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-slate-500" />
                      <p className="mt-2 text-sm text-slate-400">Klik untuk memilih gambar</p>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Tanaman</Label>
              <Input name="name" required value={formData.name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Ilmiah</Label>
              <Input name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Tingkat Kesulitan</Label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option>Mudah</option><option>Sedang</option><option>Sulit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Posisi (Placement)</Label>
              <select name="placement" value={formData.placement} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option>Foreground</option><option>Midground</option><option>Background</option><option>Epiphyte / Floating</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Kebutuhan Cahaya</Label>
              <select name="light_requirement" value={formData.light_requirement} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kebutuhan CO2</Label>
              <select name="co2_requirement" value={formData.co2_requirement} onChange={handleChange} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 focus:border-teal-500 outline-none">
                <option>Tanpa Injeksi</option><option>Rendah</option><option>Tinggi</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">Rekomendasi Gaya / Tank (Pisahkan dengan koma)</Label>
              <Input name="recommended_for" placeholder="Contoh: Beginner, Dutch, Iwagumi" value={formData.recommended_for} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Sumber Data</Label>
              <Input name="source_name" placeholder="Contoh: Tropica" value={formData.source_name} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">URL Sumber Data</Label>
              <Input name="source_url" type="url" placeholder="https://..." value={formData.source_url} onChange={handleChange} className="bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500" />
            </div>
          </div>

          {error && <div className="rounded border border-red-900 bg-red-950/50 p-3 text-red-400">{error}</div>}

          {/* KELOMPOK TOMBOL AKSI */}
          <div className="flex justify-between border-t border-slate-800 pt-6">
            
            {/* RENDER TOMBOL DELETE BERDASARKAN ROLE */}
            <div>
              {mode === "edit" && (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleDelete} disabled={loading} className="bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 border border-slate-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                    Arsipkan
                  </Button>

                  {role === "super_admin" && (
                    <Button type="button" variant="destructive" onClick={handleHardDelete} disabled={loading} className="disabled:opacity-50 bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-800">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Hapus Permanen
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={() => router.back()} disabled={loading} className="bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 transition-all">
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