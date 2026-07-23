// features/users/actions/user.actions.ts
"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UserRole } from "../types/user.types";
import { logAuditTrail } from "./audit.actions"; // <-- IMPORT LOGGER

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
// VERIFIKASI AKSES ADMIN (DIPERBARUI)
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

  // 💡 KITA AMBIL JUGA EMAIL & FULL NAME UNTUK KEBUTUHAN AUDIT LOG
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active, email, full_name") 
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
    email: profile.email,
    fullName: profile.full_name,
  };
}

// =====================================================
// AKSI PENGGUNA TERINTEGRASI AUDIT TRAIL
// =====================================================

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
      .select("id, role, email") // 💡 AMBIL EMAIL UNTUK LOG
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

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      "CHANGE_ROLE",
      targetProfile.email || "Unknown Email",
      `Mengubah peran dari ${targetProfile.role} menjadi ${newRole}.`
    );

    return {
      success: true,
      message: `Jabatan diubah menjadi ${newRole.toUpperCase()}.`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengubah role pengguna.";
    return { success: false, error: errorMessage };
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

    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      currentStatus ? "BLOCK" : "UNBLOCK",
      targetProfile?.email || "Unknown Email",
      currentStatus ? "Memblokir akses login pengguna." : "Membuka akses login pengguna."
    );

    return {
      success: true,
      message: currentStatus
        ? "Pengguna berhasil diblokir."
        : "Pengguna berhasil diaktifkan.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mengubah status pengguna.";
    return { success: false, error: errorMessage };
  }
}

export async function createUser(
  data: { email: string; password: string; full_name: string; role: UserRole; }
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

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      "CREATE_USER",
      email,
      `Membuat akun baru dengan peran ${data.role}.`
    );

    return {
      success: true,
      message: "Pengguna berhasil ditambahkan.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat user.";
    return { success: false, error: errorMessage };
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
      .select("role, email")
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

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      "UPDATE_PROFILE",
      targetUser.email || "Unknown Email",
      `Memperbarui nama pengguna menjadi ${fullName}.`
    );

    return {
      success: true,
      message: "Profil berhasil diperbarui.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui profil pengguna.";
    return { success: false, error: errorMessage };
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

    const { data: targetUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      "RESET_PASSWORD",
      targetUser?.email || "Unknown Email",
      "Mereset kata sandi pengguna secara manual."
    );

    return {
      success: true,
      message: "Password berhasil di-reset.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal mereset password.";
    return { success: false, error: errorMessage };
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

    const { data: targetUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw new Error(error.message);

    // 💡 CATAT KE AUDIT LOG
    await logAuditTrail(
      currentUser.fullName,
      currentUser.email,
      "DELETE",
      targetUser?.email || "Unknown Email",
      "Menghapus akun pengguna secara permanen dari sistem."
    );

    return {
      success: true,
      message: "Akun pengguna berhasil dihapus secara permanen.",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Gagal menghapus pengguna secara permanen.";
    return { success: false, error: errorMessage };
  }
}