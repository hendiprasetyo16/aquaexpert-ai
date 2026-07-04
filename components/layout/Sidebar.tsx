// components/layout/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client";
import { MENU_BY_ROLE } from "@/features/auth/constants/menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ShieldAlert, Loader2, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = "", onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, role, isLoading } = useAuth();
  const { dict } = useLanguage();

  // STATE UNTUK MODAL LOGOUT
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // FUNGSI EKSEKUSI LOGOUT
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const formatRole = (roleStr: string) => {
    if (roleStr === "super_admin") return "Super Admin";
    if (roleStr === "admin") return "Admin";
    return "User";
  };

  const menus = role ? MENU_BY_ROLE[role] : [];

  // 💡 LOGIKA AVATAR KONSISTEN DENGAN HALAMAN PROFIL
  const avatarUrl = profile?.avatar_url || (profile?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0D9488&color=fff&rounded=true&bold=true&size=128`
    : `https://ui-avatars.com/api/?name=User&background=random&rounded=true`);

  return (
    <>
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

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = pathname === menu.href || pathname.startsWith(menu.href + "/");
            const iconColor = "color" in menu ? menu.color : "";

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400" : "hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
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
              title={dict.sidebar.profileTooltip}
            >
              {/* 💡 UPDATE: MENGGUNAKAN TAG IMG UNTUK MENAMPILKAN AVATAR */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {dict.sidebar.logout}
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI LOGOUT */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {dict.sidebar.logoutModalTitle || "Konfirmasi Keluar"}
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {dict.sidebar.logoutModalDesc || "Apakah Anda yakin ingin keluar dari sesi ini?"}
            </p>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button 
                type="button" 
                disabled={isLoggingOut} 
                onClick={() => setIsLogoutModalOpen(false)} 
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {dict.sidebar.logoutCancel || "Batal"}
              </button>
              <button 
                type="button" 
                disabled={isLoggingOut} 
                onClick={confirmLogout} 
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center"
              >
                {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoggingOut ? (dict.sidebar.logoutProcessing || "Keluar...") : (dict.sidebar.logoutConfirm || "Ya, Keluar")}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}