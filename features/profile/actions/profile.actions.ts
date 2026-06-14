// features/profile/actions/profile.actions.ts
"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type ProfileActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

// =====================================================
// FUNGSI HELPER: MENDAPATKAN USER AKTIF (ANTI BUG HP)
// =====================================================
async function getAuthenticatedUser(token?: string | null) {
  if (token) {
    // Jalur HP: Verifikasi via Token JWT dari Client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new Error("Sesi token tidak valid dari perangkat ini.");
    return data.user;
  }

  // Jalur Desktop: Verifikasi via Cookies
  const cookieStore = await cookies();
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  
  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data.user) {
    throw new Error("Sesi tidak terbaca oleh server. Harap login ulang.");
  }
  
  return data.user;
}

// =====================================================
// UPDATE NAMA LENGKAP PROFIL
// =====================================================
export async function updateProfileName(
  newFullName: string,
  token?: string | null
): Promise<ProfileActionResult> {
  try {
    // Gunakan fungsi helper yang sudah kebal dari bug HP
    const user = await getAuthenticatedUser(token);

    if (!newFullName || newFullName.trim() === "") {
      throw new Error("Nama lengkap tidak boleh kosong.");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: newFullName.trim() })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Profil berhasil diperbarui.",
    };
  // REFAKTOR: Mengubah any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui profil.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =====================================================
// UPDATE PASSWORD SENDIRI
// =====================================================
export async function updateProfilePassword(
  newPassword: string,
  token?: string | null
): Promise<ProfileActionResult> {
  try {
    // Gunakan fungsi helper yang sudah kebal dari bug HP
    const user = await getAuthenticatedUser(token);

    if (newPassword.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    // Update password di sistem Auth Supabase
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Kata sandi berhasil diperbarui.",
    };
  // REFAKTOR: Mengubah any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui kata sandi.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}