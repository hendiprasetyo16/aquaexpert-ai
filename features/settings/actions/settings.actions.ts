// features/settings/actions/settings.actions.ts
// tidak karena sama dengan menu profil punya saya sebelumnya, 
// jadi saya hapus saja. Tapi saya simpan dulu di sini untuk referensi.
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(fullName: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Sesi login telah berakhir.");

    // 1. Update di tabel profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (profileError) throw profileError;

    // 2. Update di metadata Auth Supabase bawaan
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (authError) throw authError;

    // Refresh halaman agar nama baru langsung muncul di pojok kanan atas
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return { success: false, error: errorMessage };
  }
}