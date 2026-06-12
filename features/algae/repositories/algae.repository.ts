// features/algae/repositories/algae.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Algae } from "../types/algae.types";

export async function getAlgaeList(): Promise<Algae[]> {
  // Panggil fungsi createClient() untuk membuat instance supabase
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
  // Panggil fungsi createClient() untuk membuat instance supabase
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