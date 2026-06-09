import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserRole } from "@/features/users/types/user.types";

export async function getUsers(): Promise<UserProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      last_login_at
    `)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data users:", error);
    return [];
  }

  return (data ?? []) as UserProfile[];
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<boolean> {
  const allowedRoles: UserRole[] = ["super_admin", "admin", "user"];

  if (!allowedRoles.includes(newRole)) {
    console.error("Role tidak valid!");
    return false;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Gagal mengubah role:", error);
    return false;
  }

  return true;
}