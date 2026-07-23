// features/users/actions/audit.actions.ts
"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper internal untuk mengecek akses admin di server action
async function verifyAuditAccess() {
  const cookieStore = await cookies();
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  );

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
    throw new Error("Forbidden");
  }

  return { userId: user.id, role: profile.role };
}

// 1. FUNGSI MENCATAT LOG (Yang tadi sudah kita buat)
export async function logAuditTrail(
  actorName: string,
  actorEmail: string,
  actionType: "BLOCK" | "UNBLOCK" | "DELETE" | "CHANGE_ROLE" | "CREATE_USER" | "UPDATE_PROFILE" | "RESET_PASSWORD",
  targetUserEmail: string,
  details: string
) {
  try {
    const { error: insertError } = await supabaseAdmin.from("audit_logs").insert({
      actor_name: actorName,
      actor_email: actorEmail,
      action_type: actionType,
      target_user_email: targetUserEmail,
      details: details,
    });
    if (insertError) console.error("Gagal mencatat audit log:", insertError);
    return true;
  } catch (error) {
    console.error("Terjadi kesalahan pada sistem audit:", error);
    return false;
  }
}

// 2. FUNGSI MENGAMBIL DATA LOG UNTUK UI
export async function getAuditLogsAction() {
  try {
    await verifyAuditAccess();
    
    // Mengambil 500 log terakhir agar memori tidak berat
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengambil log";
    return { success: false, error: msg };
  }
}

// 3. FUNGSI MEMBERSIHKAN LOG YANG MENUMPUK
export async function clearAuditLogsAction(keepDays: number) {
  try {
    const admin = await verifyAuditAccess();
    if (admin.role !== "super_admin") {
      throw new Error("Hanya Super Admin yang berhak menghapus log aktivitas.");
    }

    // Jika keepDays = 0, artinya hapus semua. 
    // Jika keepDays = 30, hapus yang umurnya lebih dari 30 hari.
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let query = supabaseAdmin.from("audit_logs").delete();
    
    // Kalau bukan hapus semua, gunakan filter tanggal
    if (keepDays > 0) {
      query = query.lt("created_at", cutoffDate.toISOString());
    } else {
      // Trik Supabase untuk hapus semua baris: 
      query = query.neq("id", "00000000-0000-0000-0000-000000000000"); 
    }

    const { error } = await query;
    if (error) throw new Error(error.message);

    return { 
      success: true, 
      message: keepDays === 0 ? "Seluruh log berhasil dikosongkan." : `Log yang lebih tua dari ${keepDays} hari berhasil dibersihkan.` 
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membersihkan log";
    return { success: false, error: msg };
  }
}