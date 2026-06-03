"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type ProfileActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

// =====================================================
// UPDATE NAMA LENGKAP PROFIL
// =====================================================
export async function updateProfileName(newFullName: string): Promise<ProfileActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Pastikan user valid dan ambil ID-nya
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Sesi tidak valid atau telah kedaluwarsa.");
    }

    // Update tabel profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: newFullName })
      .eq("id", user.id);

    if (updateError) throw new Error(updateError.message);

    return { success: true, message: "Nama lengkap berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal memperbarui profil." };
  }
}

// =====================================================
// UPDATE PASSWORD SENDIRI
// =====================================================
export async function updateProfilePassword(newPassword: string): Promise<ProfileActionResult> {
  try {
    if (newPassword.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Sesi tidak valid atau telah kedaluwarsa.");
    }

    // Update password di sistem Auth Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw new Error(updateError.message);

    return { success: true, message: "Kata sandi berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal memperbarui kata sandi." };
  }
}