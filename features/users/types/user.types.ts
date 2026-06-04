export type UserRole = "super_admin" | "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean; 
  created_at?: string;
  last_login_at?: string; // <-- TAMBAHAN BARU
}