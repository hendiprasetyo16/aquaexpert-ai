// src/repositories/user.repository.ts
import { createClient } from "@/lib/supabase/client";

export async function getProfile(userId: string) {
  // Memanggil fungsi jembatan database yang sudah kita buat sebelumnya
  const supabase = createClient();
  
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}