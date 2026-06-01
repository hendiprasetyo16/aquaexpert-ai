// src/services/user.service.ts
import { getProfile } from "@/features/auth/repositories/user.repository";
import { UserRole } from "@/features/auth/types/auth.types";

export async function getCurrentUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await getProfile(userId);

  if (error || !data) {
    console.error("Gagal mengambil data profil:", error);
    return null;
  }

  return data.role as UserRole;
}