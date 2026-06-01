"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LayoutDashboard, Leaf, LogOut, ShieldAlert, User as UserIcon, Fish, Bug, Activity, CalendarClock, Calculator } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Ambil data nama dan role dari tabel profiles
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
          
        if (data) setProfile(data);
      }
    }
    loadProfile();
  }, []);

  // Fungsi Logout yang sesungguhnya
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh(); // Ini kunci agar halaman ter-reset sempurna
  };

  // Format teks role agar lebih rapi
  const formatRole = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    return 'User Biasa';
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      {/* Logo Area */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          <span className="text-teal-400">Aqua</span>Expert
        </h1>
      </div>

      {/* Menu Area */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>
        <Link 
          href="/plants" 
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/plants') ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <Leaf className="h-4 w-4" /> Plant Expert
        </Link>
        <Link 
          href="/fishes" 
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/fishes') ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <Fish className="h-4 w-4" /> Fish Expert
        </Link>
        <Link 
          href="/algae" 
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/algae') ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <Bug className="h-4 w-4" /> Algae Expert
        </Link>
        <Link 
          href="/diseases" 
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/diseases') ? 'bg-teal-900/50 text-teal-400' : 'hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <Activity className="h-4 w-4" /> Disease Expert
        </Link>
      </nav>

      {/* User Profile & Logout Area */}
      <div className="border-t border-slate-800 p-4">
        {profile ? (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-slate-900 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-900/50 text-teal-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-200">{profile.full_name || 'Pengguna'}</p>
              <div className="flex items-center gap-1 text-xs text-teal-400">
                <ShieldAlert className="h-3 w-3" />
                <span>{formatRole(profile.role)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 h-12 animate-pulse rounded-md bg-slate-900"></div>
        )}

        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-950/30 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Keluar Akun
        </button>
      </div>
    </div>
  );
}