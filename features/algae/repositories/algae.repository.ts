// features/algae/repositories/algae.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Algae } from "../types/algae.types";

export async function getAlgaeList(): Promise<Algae[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("algae")
    .select("*")
    .eq("is_active", true)
    .order("severity", { ascending: false });

  if (error) {
    console.error("Error fetching algae:", error);
    return [];
  }
  return data || [];
}

export async function getAlgaeBySlug(slug: string): Promise<Algae | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("algae")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching algae by slug:", error);
    return null;
  }
  return data;
}

export async function getArchivedAlgae(): Promise<Algae[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("algae")
    .select("*")
    .eq("is_active", false)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching archived algae:", error);
    return [];
  }
  return data || [];
}

export async function deleteAlgae(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("algae")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("Gagal mengarsipkan data alga");
}

export async function uploadAlgaeImage(file: File, slug: string, prefix: "cover" | "gallery"): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${slug}-${prefix}-${Date.now()}.${fileExt}`;
  
  // PERBAIKAN: Gunakan bucket algae-images tanpa membuat sub-folder tambahan yang membingungkan.
  // Semua gambar langsung masuk ke algae-images dengan format nama: slug-cover-12345.jpg
  const { error: uploadError } = await supabase.storage
    .from("algae-images") 
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`);

  const { data } = supabase.storage.from("algae-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function removeAlgaeImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;
  const supabase = createClient();
  
  // Ekstrak file path dari public URL
  // Contoh URL: https://[project-id].supabase.co/storage/v1/object/public/algae-images/bba-cover-123.jpg
  const parts = imageUrl.split("/algae-images/");
  if (parts.length === 2) {
    const fileName = parts[1];
    const { error } = await supabase.storage.from("algae-images").remove([fileName]);
    if (error) console.error("Gagal menghapus gambar:", error);
  }
}