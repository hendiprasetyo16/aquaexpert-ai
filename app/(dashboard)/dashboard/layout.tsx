"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, Leaf, Fish, Bug, Activity, 
  CalendarClock, Calculator, LogOut 
} from "lucide-react";

const menuItems = [
  { name: "Ringkasan", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Plant Expert", icon: Leaf, href: "/dashboard/plants" },
  { name: "Fish Expert", icon: Fish, href: "/dashboard/fishes" },
  { name: "Algae Expert", icon: Bug, href: "/dashboard/algae" },
  { name: "Disease Expert", icon: Activity, href: "/dashboard/diseases" },
  { name: "Jadwal Perawatan", icon: CalendarClock, href: "/dashboard/maintenance" },
  { name: "Kalkulator", icon: Calculator, href: "/dashboard/calculator" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Fungsi untuk Logout
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login"); // Arahkan kembali ke halaman login
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/50 md:flex">
        <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-teal-400">Aqua</span>Expert
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-teal-400"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Tombol Logout di Bawah Sidebar */}
        <div className="border-t border-slate-800 p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-400 transition-all hover:bg-red-950 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-950/50 px-6">
          <h2 className="text-lg font-semibold text-slate-200">Panel Kontrol</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
      
    </div>
  );
}