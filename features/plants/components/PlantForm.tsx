"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlant, uploadPlantImage } from "../repositories/plant.repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus } from "lucide-react";

export default function PlantForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    placement: "Midground",
    difficulty: "Mudah",
    light_requirement: "Sedang",
    co2_requirement: "Rendah",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // VALIDASI KETAT FILE GAMBAR
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 1. Validasi Tipe File (Hanya Gambar)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError("Format file ditolak! Hanya menerima JPG, PNG, atau WEBP.");
        setImageFile(null);
        return;
      }

      // 2. Validasi Ukuran File (Maksimal 2MB)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        setError("Ukuran gambar terlalu besar! Maksimal 2MB.");
        setImageFile(null);
        return;
      }

      setError(null); // Bersihkan pesan error jika file aman
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl = "";

      // Kirim file dan nama tanaman untuk dijadikan folder
      if (imageFile) {
        imageUrl = await uploadPlantImage(imageFile, formData.name);
      }

      await createPlant({
        ...formData,
        image_url: imageUrl || null, 
      });
      
      router.push("/plants");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan data.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center transition-colors hover:bg-slate-900/80">
            <Label htmlFor="image_upload" className="flex cursor-pointer flex-col items-center gap-2 text-slate-400 hover:text-teal-400">
              <ImagePlus className="h-8 w-8" />
              <span className="font-medium text-slate-300">
                {imageFile ? imageFile.name : "Klik untuk mengunggah gambar tanaman"}
              </span>
              <span className="text-xs">Maksimal 2MB (JPG, PNG, WEBP)</span>
            </Label>
            <Input 
              id="image_upload" 
              type="file" 
              accept="image/jpeg, image/png, image/webp"
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Nama Tanaman *</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="border-slate-700 bg-slate-950 text-slate-200" placeholder="Cth: Anubias Nana"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientific_name" className="text-slate-300">Nama Ilmiah</Label>
              <Input id="scientific_name" name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="border-slate-700 bg-slate-950 text-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-slate-300">Tingkat Kesulitan</Label>
              <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placement" className="text-slate-300">Penempatan</Label>
              <select id="placement" name="placement" value={formData.placement} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <option value="Foreground">Foreground</option>
                <option value="Midground">Midground</option>
                <option value="Background">Background</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="light_requirement" className="text-slate-300">Kebutuhan Cahaya</Label>
              <select id="light_requirement" name="light_requirement" value={formData.light_requirement} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="co2_requirement" className="text-slate-300">Kebutuhan CO2</Label>
              <select id="co2_requirement" name="co2_requirement" value={formData.co2_requirement} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <option value="Tanpa Injeksi">Tanpa Injeksi</option>
                <option value="Rendah">Rendah</option>
                <option value="Tinggi">Tinggi</option>
              </select>
            </div>
          </div>

          {error && <p className="rounded border border-red-900 bg-red-950/50 p-3 text-sm font-medium text-red-400">{error}</p>}

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => router.back()} className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">Batal</Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 text-white hover:bg-teal-500">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Tanaman
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}