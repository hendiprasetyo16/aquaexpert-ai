// features/users/actions/user.actions.ts
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
// VERIFIKASI AKSES ADMIN (BERSIH DARI LOG)
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

  const { data, error } = await supabaseUser.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sesi tidak terbaca. Harap login ulang.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profil admin tidak ditemukan.");
  }

  if (!profile.is_active) {
    throw new Error("Akun Anda sedang dinonaktifkan.");
  }

  if (profile.role !== "super_admin" && profile.role !== "admin") {
    throw new Error("Akses ditolak. Anda bukan Admin.");
  }

  return {
    userId: data.user.id,
    role: profile.role as UserRole,
  };
}

export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    if (currentUser.role !== "super_admin") {
      throw new Error("Hanya Super Admin yang berhak mengubah jabatan.");
    }

    const allowedRoles: UserRole[] = ["super_admin", "admin", "user"];
    if (!allowedRoles.includes(newRole)) {
      throw new Error("Role tidak valid.");
    }

    if (currentUser.userId === userId && newRole !== "super_admin") {
      throw new Error("Super Admin tidak dapat menurunkan rolenya sendiri.");
    }

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      throw new Error("Pengguna target tidak ditemukan.");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: `Jabatan diubah menjadi ${newRole.toUpperCase()}.`,
    };
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengubah role pengguna.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: boolean,
  targetRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    if (currentUser.userId === userId) {
      throw new Error("Anda tidak dapat mengubah status akun sendiri.");
    }

    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat mengelola user biasa.");
    }

    if (targetRole === "super_admin") {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (currentStatus && (count || 0) <= 1) {
        throw new Error("Minimal harus ada satu Super Admin aktif.");
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: currentStatus
        ? "Pengguna berhasil diblokir."
        : "Pengguna berhasil diaktifkan.",
    };
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengubah status pengguna.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function createUser(
  data: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
  }
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    const email = data.email.trim().toLowerCase();
    const fullName = data.full_name.trim();

    if (!email.includes("@")) throw new Error("Format email tidak valid.");
    if (data.password.length < 6) throw new Error("Password minimal 6 karakter.");
    if (!fullName) throw new Error("Nama lengkap wajib diisi.");

    if (currentUser.role === "admin" && data.role !== "user") {
      throw new Error("Admin hanya dapat membuat user biasa.");
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Gagal membuat akun auth.");

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: authData.user.id,
        email,
        full_name: fullName,
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
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat user.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateUserProfile(
  userId: string,
  newFullName: string
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();
    const fullName = newFullName.trim();

    if (!fullName) {
      throw new Error("Nama lengkap tidak boleh kosong.");
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      throw new Error("Pengguna target tidak ditemukan.");
    }

    if (currentUser.role === "admin" && targetUser.role !== "user") {
      throw new Error("Admin hanya dapat mengubah data user biasa.");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Profil berhasil diperbarui.",
    };
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui profil pengguna.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

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
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mereset password.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function hardDeleteUser(
  userId: string,
  targetRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await verifyAdminAccess();

    if (currentUser.userId === userId) {
      throw new Error("Anda tidak dapat menghapus akun sendiri.");
    }

    if (currentUser.role === "admin" && targetRole !== "user") {
      throw new Error("Admin hanya dapat menghapus permanen user biasa.");
    }

    if (targetRole === "super_admin") {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");

      if ((count || 0) <= 1) {
        throw new Error("Minimal harus ada satu Super Admin tersisa.");
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Akun pengguna berhasil dihapus secara permanen.",
    };
  // REFAKTOR: Mengganti any menjadi unknown dan menggunakan type guard
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal menghapus pengguna secara permanen.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}