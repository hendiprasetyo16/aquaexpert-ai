// features/profile/actions/profile.actions.ts
"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; // 💡 FIX: Import revalidatePath untuk refresh halaman

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
    const user = await getAuthenticatedUser(token);

    if (newPassword.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Kata sandi berhasil diperbarui.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui kata sandi.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =====================================================
// UPDATE FOTO PROFIL (AVATAR)
// =====================================================
export async function updateProfileAvatar(
  formData: FormData, 
  token?: string | null
) {
  try {
    // 💡 FIX: Gunakan helper anti-bug milik Bapak
    const user = await getAuthenticatedUser(token);

    const file = formData.get("avatar") as File;
    if (!file) throw new Error("Tidak ada file yang diunggah.");

    // 1. Cek apakah pengguna sudah punya foto profil lama menggunakan supabaseAdmin
    const { data: oldProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    // 2. FORMAT NAMA FOLDER: Bersihkan nama dari spasi/simbol, gabung dengan 8 karakter awal ID User
    // Contoh Hasil: "hendi-prasetyo-38ea926f"
    const safeName = (oldProfile?.full_name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Ubah spasi/simbol jadi strip (-)
      .replace(/(^-|-$)/g, "");    // Buang strip di awal/akhir
    
    const folderName = `${safeName}-${user.id.split("-")[0]}`;

    // 3. FORMAT NAMA FILE: YYYYMMDD-HHMM
    // Contoh Hasil: "avatar-20260705-1530.jpg"
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const formattedDate = `${yyyy}${mm}${dd}-${hours}${mins}`;

    const fileExt = "jpg"; 
    const fileName = `${folderName}/avatar-${formattedDate}.${fileExt}`;

    // 4. Upload ke Supabase
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) throw new Error(updateError.message);

    // 5. [OPTIMASI] Hapus foto lama agar Storage tidak penuh!
    if (oldProfile?.avatar_url && oldProfile.avatar_url.includes('avatars/')) {
      const oldPath = oldProfile.avatar_url.split('avatars/')[1];
      if (oldPath) {
        await supabaseAdmin.storage.from("avatars").remove([oldPath]);
      }
    }

    revalidatePath("/", "layout"); // Refresh tampilan secara instan
    return { success: true, avatarUrl: publicUrl };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengunggah foto.";
    return { success: false, error: errorMessage };
  }
}