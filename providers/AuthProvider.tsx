// providers/AuthProvider.tsx
"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "user";

export interface Profile {
  id: string; // 💡 Pastikan ini ada
  full_name: string;
  role: UserRole;
  is_active: boolean;
  ip_address?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  avatar_url?: string | null;
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

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchUserAndProfile(isInitialLoad = false) {
      try {
        if (isInitialLoad) setIsLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (isMounted) setUser(currentUser);

        if (!currentUser) {
          if (isMounted) setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id, 
            full_name,
            role,
            is_active,
            ip_address,
            last_login_at,
            created_at,
            avatar_url
          `) // 💡 FIX: Menambahkan "id," di dalam select agar ditarik dari database
          .eq("id", currentUser.id)
          .single();

        if (error) throw error;

        // AUTO KICK USER NONAKTIF
        if (data?.is_active === false) {
          await supabase.auth.signOut();
          window.location.replace("/login?error=account_disabled");
          return;
        }

        if (isMounted && data) {
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error("Gagal memuat auth:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUserAndProfile(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        fetchUserAndProfile(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}