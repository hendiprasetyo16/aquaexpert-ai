"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client";
import { MENU_BY_ROLE } from "@/features/auth/constants/menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ShieldAlert, Loader2, X } from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = "", onClose }: SidebarProps) {
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

  const getInitials = (name: string) => {
    if (!name) return "U"; 
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menus = role ? MENU_BY_ROLE[role] : [];

  return (
    // Menggunakan bg-white (terang) dan dark:bg-slate-950 (gelap)
    <div className={`flex h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 transition-colors ${className}`}>
      
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 transition-colors">
        <Link href="/dashboard" className="transition-transform hover:scale-105" onClick={onClose}>
          <h1 className="text-xl font-bold dark:text-white text-slate-800">
            <span className="text-teal-600 dark:text-teal-400">Aqua</span>Expert
          </h1>
        </Link>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white md:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = pathname === menu.href || pathname.startsWith(menu.href + "/");

          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  // Warna saat menu aktif (Terang: bg-teal-100, Gelap: bg-teal-900/50)
                  ? "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400"
                  // Warna saat menu tidak aktif (Terang: hover abu-abu muda, Gelap: hover abu-abu tua)
                  : "hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {menu.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4 transition-colors">
        {isLoading ? (
          <div className="mb-4 flex h-14 items-center justify-center rounded-md bg-slate-50 dark:bg-slate-900 p-3">
             <Loader2 className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-500" />
          </div>
        ) : profile ? (
          <Link 
            href="/dashboard/profile"
            onClick={onClose}
            className="mb-4 flex items-center gap-3 rounded-md bg-slate-50 dark:bg-slate-900 p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group"
            title="Buka Pengaturan Profil Saya"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 font-bold text-white shadow-md group-hover:bg-teal-500 transition-colors">
              {getInitials(profile.full_name)}
            </div>

            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                {profile.full_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                <ShieldAlert className="h-3 w-3 shrink-0" />
                <span className="truncate">{formatRole(profile.role)}</span>
              </div>
            </div>
          </Link>
        ) : null}

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Keluar Akun
        </button>
      </div>
    </div>
  );
}