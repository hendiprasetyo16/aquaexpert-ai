"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client";
import { MENU_BY_ROLE } from "@/features/auth/constants/menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ShieldAlert, Loader2 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, role, isLoading } = useAuth();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const formatRole = (roleStr: string) => {
    if (roleStr === "super_admin") return "Super Admin";
    if (roleStr === "admin") return "Admin";
    return "User";
  };

  // FUNGSI BARU: Membuat Avatar Inisial (Misal: "Budi Santoso" -> "BS")
  const getInitials = (name: string) => {
    if (!name) return "U"; // Default U untuk User
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menus = role ? MENU_BY_ROLE[role] : [];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <Link href="/dashboard" className="transition-transform hover:scale-105">
          <h1 className="text-xl font-bold">
            <span className="text-teal-400">Aqua</span>Expert
          </h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = pathname === menu.href || pathname.startsWith(menu.href + "/");

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-900/50 text-teal-400"
                  : "hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {menu.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        {isLoading ? (
          <div className="mb-4 flex h-14 items-center justify-center rounded-md bg-slate-900 p-3">
             <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          </div>
        ) : profile ? (
          /* PERUBAHAN DISINI: Kotak profil sekarang adalah sebuah Link yang bisa diklik */
          <Link 
            href="/dashboard/profile"
            className="mb-4 flex items-center gap-3 rounded-md bg-slate-900 p-3 transition-colors hover:bg-slate-800 group"
            title="Buka Pengaturan Profil Saya"
          >
            {/* AVATAR INISIAL (Zero Cost Database) */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 font-bold text-white shadow-md group-hover:bg-teal-500 transition-colors">
              {getInitials(profile.full_name)}
            </div>

            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                {profile.full_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-teal-400">
                <ShieldAlert className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatRole(profile.role)}</span>
              </div>
            </div>
          </Link>
        ) : null}

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-950/30 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50"
        >
          <LogOut className="h-4 w-4" />
          Keluar Akun
        </button>
      </div>
    </div>
  );
}