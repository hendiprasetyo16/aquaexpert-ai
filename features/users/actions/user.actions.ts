"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UserRole } from "../types/user.types";

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

export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

// =====================================================
// CEK HAK AKSES (BUG MOBILE PWA & NEXT.JS SERIALIZATION FIXED)
// =====================================================
async function verifyAdminAccess(token?: string | null) {
  let user;

  if (token) {
    // BACKUP UNTUK HP/PWA: Menggunakan saran Anda (supabaseAdmin.auth.getUser)
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data.user) {
      throw new Error("Sesi token dari HP tidak valid atau kedaluwarsa.");
    }
    user = data.user;
  } else {
    // METODE STANDARD: Verifikasi via Cookies (Desktop)
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
      throw new Error("Sesi tidak terbaca. Harap login ulang.");
    }
    user = data.user;
  }

  // Bypass RLS untuk mengecek role asli
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
    throw new Error("Akses ditolak. Anda bukan Admin.");
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
  };
}

// =====================================================
// UBAH ROLE
// =====================================================
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole,
  token?: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);
    
    if (currentUser.role !== "super_admin") {
      throw new Error("Hanya Super Admin yang berhak mengubah jabatan.");
    }

    const allowedRoles: UserRole[] = ["super_admin", "admin", "user"];
    if (!allowedRoles.includes(newRole)) {
      throw new Error("Role tidak valid!");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return { success: true, message: `Jabatan diubah menjadi ${newRole.toUpperCase()}.` };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal mengubah role pengguna." };
  }
}

// =====================================================
// ENABLE / DISABLE USER
// =====================================================
export async function toggleUserStatus(
  userId: string,
  currentStatus: boolean,
  targetRole: UserRole,
  token?: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);

    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat mengelola user biasa.");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: currentStatus ? "Pengguna berhasil diblokir." : "Pengguna berhasil diaktifkan.",
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal mengubah status pengguna." };
  }
}

// =====================================================
// CREATE USER
// =====================================================
export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}, token?: string | null): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);

    if (!data.email.includes("@")) throw new Error("Format email tidak valid.");
    if (currentUser.role === "admin" && data.role !== "user") {
      throw new Error("Admin hanya dapat membuat user biasa.");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Gagal membuat akun.");

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([{
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      is_active: true,
    }]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    return { success: true, message: "Pengguna berhasil ditambahkan." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Terjadi kesalahan saat membuat user." };
  }
}

// =====================================================
// EDIT PROFILE
// =====================================================
export async function updateUserProfile(
  userId: string,
  newFullName: string,
  token?: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);

    if (currentUser.role === "admin") {
      const { data: targetUser } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
      if (targetUser?.role !== "user") throw new Error("Admin hanya dapat mengubah data user biasa.");
    }

    const { error } = await supabaseAdmin.from("profiles").update({ full_name: newFullName }).eq("id", userId);
    if (error) throw new Error(error.message);

    return { success: true, message: "Profil berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal memperbarui profil pengguna." };
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  targetRole: UserRole,
  token?: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);

    if (newPassword.length < 6) throw new Error("Password minimal 6 karakter.");
    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat mereset password user biasa.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error(error.message);

    return { success: true, message: "Password berhasil di-reset." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal mereset password." };
  }
}

// =====================================================
// HARD DELETE USER PERMANENTLY
// =====================================================
export async function hardDeleteUser(
  userId: string,
  targetRole: UserRole,
  token?: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess(token);

    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat menghapus permanen user biasa.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { success: true, message: "Akun pengguna berhasil dihapus secara permanen." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Gagal menghapus pengguna secara permanen." };
  }
}