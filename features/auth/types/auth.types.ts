// src/types/roles.ts

export type UserRole = "super_admin" | "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}