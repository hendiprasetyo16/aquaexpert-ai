"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Menu, Bell } from "lucide-react"; 
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
      
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black" : "-translate-x-full"
        }`}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex w-full flex-1 flex-col h-screen overflow-hidden relative">
        
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
          
          {/* BAGIAN KIRI: Tombol Mobile (Judul Halaman Telah Dihapus) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-2 -ml-2 rounded-md hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          {/* BAGIAN KANAN: Info Sapaan & Notifikasi */}
          <div className="flex items-center gap-4 ml-auto">
            {profile && (
              <span className="text-sm text-slate-400 hidden md:block">
                Selamat datang, <span className="font-medium text-slate-200">{profile.full_name.split(" ")[0]}</span>
              </span>
            )}
            
            {/* Tombol Notifikasi (Disiapkan untuk pengembangan fitur selanjutnya) */}
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors" title="Notifikasi Sistem">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
            </button>
          </div>

        </header>
        
        {/* KONTEN HALAMAN */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </div>
      </main>
      
    </div>
  );
}