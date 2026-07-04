// features/profile/actions/profile.actions.ts
"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; 
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type ProfileActionResult = { success: boolean; message?: string; error?: string; };

// 💡 HELPER: Mengambil user sekaligus menyisipkan full_name
async function getAuthenticatedUser(token?: string | null) {
  let currentUser;

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new Error("Sesi token tidak valid dari perangkat ini.");
    currentUser = data.user;
  } else {
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data, error } = await supabaseUser.auth.getUser();
    if (error || !data.user) throw new Error("Sesi tidak terbaca oleh server. Harap login ulang.");
    currentUser = data.user;
  }

  // Ambil nama dari tabel profiles
  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", currentUser.id).single();
  return Object.assign(currentUser, { fullName: profile?.full_name || currentUser.email || "User" });
}

// 1. UPDATE NAMA LENGKAP PROFIL
export async function updateProfileName(newFullName: string, token?: string | null): Promise<ProfileActionResult> {
  try {
    const user = await getAuthenticatedUser(token);

    if (!newFullName || newFullName.trim() === "") throw new Error("Nama lengkap tidak boleh kosong.");

    const { error } = await supabaseAdmin.from("profiles").update({ full_name: newFullName.trim() }).eq("id", user.id);
    if (error) throw new Error(error.message);

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Pembaruan Profil",
      `${user.fullName} mengubah nama lengkapnya menjadi "${newFullName.trim()}".`,
      "user_activity",
      newFullName.trim()
    );

    return { success: true, message: "Profil berhasil diperbarui." };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui profil." };
  }
}

// 2. UPDATE PASSWORD SENDIRI
export async function updateProfilePassword(newPassword: string, token?: string | null): Promise<ProfileActionResult> {
  try {
    const user = await getAuthenticatedUser(token);

    if (newPassword.length < 6) throw new Error("Password minimal 6 karakter.");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) throw new Error(error.message);

    // 💡 NOTIFIKASI PENTING (SECURITY ALERT)
    await pushNotificationAction(
      "Keamanan Akun (Ganti Password)",
      `${user.fullName} baru saja melakukan pembaruan kata sandi.`,
      "alert", // Masuk kategori alert agar terlihat lebih penting
      user.fullName
    );

    return { success: true, message: "Kata sandi berhasil diperbarui." };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui kata sandi." };
  }
}

// 3. UPDATE FOTO PROFIL (AVATAR)
export async function updateProfileAvatar(formData: FormData, token?: string | null) {
  try {
    const user = await getAuthenticatedUser(token);
    const file = formData.get("avatar") as File;
    if (!file) throw new Error("Tidak ada file yang diunggah.");

    const { data: oldProfile } = await supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();

    const safeName = (oldProfile?.full_name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");    
    const folderName = `${safeName}-${user.id.split("-")[0]}`;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const fileName = `${folderName}/avatar-${formattedDate}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(fileName, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (updateError) throw new Error(updateError.message);

    if (oldProfile?.avatar_url && oldProfile.avatar_url.includes('avatars/')) {
      const oldPath = oldProfile.avatar_url.split('avatars/')[1];
      if (oldPath) await supabaseAdmin.storage.from("avatars").remove([oldPath]);
    }

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Pembaruan Avatar",
      `${user.fullName} telah memperbarui foto profilnya.`,
      "user_activity",
      user.fullName
    );

    revalidatePath("/", "layout"); 
    return { success: true, avatarUrl: publicUrl };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal mengunggah foto." };
  }
}