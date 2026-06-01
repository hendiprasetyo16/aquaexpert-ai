import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

// 1. Fungsi mengambil data tanaman
export async function getPlants(): Promise<Plant[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data tanaman:", error);
    return [];
  }
  return data ?? [];
}

// 2. Fungsi upload gambar ke Supabase Storage (Dengan Struktur Folder)
export async function uploadPlantImage(file: File, plantName: string): Promise<string> {
  const supabase = createClient();
  
  // Membersihkan nama tanaman untuk dijadikan nama folder (contoh: "Anubias Nana" -> "anubias-nana")
  const folderSlug = plantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const folderName = folderSlug || 'lain-lain'; // Jaga-jaga jika nama kosong

  // Membuat nama file yang bersih
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  
  // Menggabungkan folder dan nama file
  const filePath = `${folderName}/${fileName}`;

  // Upload ke bucket 'plant-images'
  const { error: uploadError } = await supabase.storage
    .from('plant-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Gagal upload gambar:", uploadError);
    throw new Error("Gagal mengunggah gambar ke server.");
  }

  // Ambil URL Publik
  const { data } = supabase.storage.from('plant-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// 3. Fungsi menambah data tanaman baru
export async function createPlant(plantData: Partial<Plant>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .insert([{ ...plantData, is_active: true }])
    .select()
    .single();

  if (error) {
    console.error("Gagal menambah tanaman:", error);
    throw new Error(error.message);
  }
  return data;
}