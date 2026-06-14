// features/algae/actions/algae.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Algae } from "../types/algae.types";
import { removeAlgaeImage } from "../repositories/algae.repository";

export async function createAlgaeAction(payload: Partial<Algae>) {
  try {
    const supabase = await createClient();
    
    // Auto-generate slug dari nama Inggris jika ada, atau nama Indo
    const nameForSlug = payload.name_en || payload.name_id || "unknown";
    const slug = nameForSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    
    const { data, error } = await supabase
      .from("algae")
      .insert([{ ...payload, slug, is_active: true }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/algae");
    return { success: true, data };
  // REFAKTOR: Hapus any, ganti unknown + Type Guard
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function updateAlgaeAction(id: string, payload: Partial<Algae>) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("algae")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/algae");
    revalidatePath(`/dashboard/algae/${id}`);
    return { success: true, data };
  // REFAKTOR: Hapus any, ganti unknown + Type Guard
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function restoreAlgaeAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("algae")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/algae");
    revalidatePath("/dashboard/algae/archive");
    return { success: true };
  // REFAKTOR: Hapus any, ganti unknown + Type Guard
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function hardDeleteAlgaeAction(id: string) {
  try {
    const supabase = await createClient();
    
    // 1. Ambil data untuk tahu URL gambarnya
    const { data: algae } = await supabase.from("algae").select("image_url, gallery_urls").eq("id", id).single();
    
    // 2. Hapus data dari database
    const { error } = await supabase.from("algae").delete().eq("id", id);
    if (error) throw new Error(error.message);

    // 3. Hapus gambar fisik dari Storage
    if (algae?.image_url) await removeAlgaeImage(algae.image_url);
    if (algae?.gallery_urls) {
      for (const url of algae.gallery_urls) {
        await removeAlgaeImage(url);
      }
    }

    revalidatePath("/dashboard/algae");
    revalidatePath("/dashboard/algae/archive");
    return { success: true };
  // REFAKTOR: Hapus any, ganti unknown + Type Guard
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}