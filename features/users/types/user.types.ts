export type UserRole = "super_admin" | "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean; 
  avatar_url?: string; // 💡 Pastikan baris ini ada
  created_at?: string;
  last_login_at?: string; // <-- TAMBAHAN BARU
  ip_address?: string | null; // <-- TAMBAHKAN BARIS INI
  last_sign_in_ip?: string; // <-- TAMBAHAN BARU
}