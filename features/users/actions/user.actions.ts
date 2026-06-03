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

// Tipe pengembalian yang konsisten untuk menghindari "any" di Frontend
export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

// =====================================================
// CEK HAK AKSES ADMIN / SUPER ADMIN
// =====================================================
async function verifyAdminAccess() {
  const cookieStore = await cookies();

  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user) {
    throw new Error("Tidak ada sesi yang aktif.");
  }

  const { data: profile } = await supabaseUser
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
    throw new Error("Akses ditolak.");
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
  };
}

// =====================================================
// CREATE USER
// =====================================================
export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    if (!data.email.includes("@")) {
      throw new Error("Format email tidak valid.");
    }

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

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          is_active: true,
        },
      ]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    return {
      success: true,
      message: "Pengguna berhasil ditambahkan.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat membuat user.",
    };
  }
}

// =====================================================
// EDIT PROFILE (NAMA LENGKAP)
// =====================================================
export async function updateUserProfile(
  userId: string,
  newFullName: string
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    // Proteksi Server: Jika Admin yang edit, pastikan targetnya adalah 'user'
    if (currentUser.role === "admin") {
      const { data: targetUser } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
        
      if (targetUser?.role !== "user") {
        throw new Error("Admin hanya dapat mengubah data user biasa.");
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: newFullName })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Profil berhasil diperbarui.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal memperbarui profil pengguna.",
    };
  }
}

// =====================================================
// ENABLE / DISABLE USER
// =====================================================
export async function toggleUserStatus(
  userId: string,
  currentStatus: boolean,
  targetRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

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
      message: currentStatus ? "Pengguna berhasil dinonaktifkan." : "Pengguna berhasil diaktifkan.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal mengubah status pengguna.",
    };
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  targetRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    if (newPassword.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat mereset password user biasa.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Password berhasil di-reset.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal mereset password.",
    };
  }
}