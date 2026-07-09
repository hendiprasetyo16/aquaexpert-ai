"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle"; 
import NotificationBell from "@/components/layout/NotificationBell"; 
import { Menu, Globe } from "lucide-react"; // <-- IMPORT IKON GLOBE DITAMBAHKAN
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const { language, setLanguage, dict } = useLanguage(); // <-- PANGGIL KAMUS & SETTER BAHASA

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden transition-colors duration-200">
      
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar 
        className={`fixed inset-y-0 left-0 z-[99999] transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black" : "-translate-x-full"
        }`}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex w-full flex-1 flex-col h-screen overflow-hidden relative">
        
        {/* 💡 FIX: HEADER DIKUNCI DI Z-INDEX 99990 AGAR SELALU DI ATAS MODAL */}
        <header className="flex z-[99990] relative h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
          
          {/* BAGIAN KIRI: Tombol Mobile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          {/* BAGIAN KANAN: Info Sapaan, Theme, Language & Notifikasi */}
          <div className="flex items-center gap-2 ml-auto">
            {profile && (
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:block mr-2">
                {dict.dashboard.welcome} <span className="font-medium text-slate-800 dark:text-slate-200">{profile.full_name.split(" ")[0]}</span>
              </span>
            )}
            
            {/* TOMBOL GANTI BAHASA */}
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="flex items-center gap-1 rounded-md p-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={language === "id" ? "Switch to English" : "Ganti Bahasa Indonesia"}
            >
              <Globe className="h-5 w-5" />
              <span className="uppercase font-bold">{language}</span>
            </button>
            
            {/* TOMBOL TOGGLE TEMA (Gelap/Terang) */}
            <ThemeToggle />

            {/* TOMBOL NOTIFIKASI REAL-TIME */}
            <NotificationBell role={profile?.role || ""} />
          </div>

        </header>
        
        {/* KONTEN HALAMAN */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
          {children}
        </div>
      </main>
      
    </div>
  );
}