"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "user";

export interface Profile {
  full_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // Tambahkan parameter `isInitialLoad`
    async function fetchUserAndProfile(isInitialLoad = false) {
      try {
        // HANYA nyalakan loading jika ini pertama kali web dibuka
        if (isInitialLoad) {
          setIsLoading(true); 
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (isMounted) setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", currentUser.id)
            .single();

          if (isMounted && data) {
            setProfile(data as Profile);
          }
        } else {
          if (isMounted) setProfile(null);
        }
      } catch (error) {
        console.error("Gagal memuat auth:", error);
      } finally {
        if (isMounted) setIsLoading(false); // Pastikan loading selalu dimatikan di akhir
      }
    }

    // 1. Jalankan dengan "true" saat komponen baru pertama kali dimuat
    fetchUserAndProfile(true);

    // 2. Pantau perubahan nyata di latar belakang
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Abaikan INITIAL_SESSION agar tidak bertabrakan
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // Jalankan dengan "false" agar TIDAK MEMUNCULKAN layar loading lagi (Anti Bug Tombol Back)
        fetchUserAndProfile(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}