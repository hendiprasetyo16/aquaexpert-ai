// features/auth/constants/menu.ts
import {
  LayoutDashboard,
  Container, 
  Leaf,
  Fish,
  Bug,
  Activity,
  Users,
  Settings,
  Database, 
  Cpu,
  BarChart,     
  HeartPulse,   
  Pill, 
  Network, 
  Package,
  ShieldCheck // <-- IMPORT ICON BARU UNTUK LOG AKTIVITAS
} from "lucide-react";

const AI_COLORS = {
  plants: "text-green-500 dark:text-green-400",
  algae: "text-teal-500 dark:text-teal-400",
  fishes: "text-blue-500 dark:text-blue-400",
  diseases: "text-red-500 dark:text-red-400"
};

export interface MenuItem {
  title_en: string;
  title_id: string;
  href: string;
  icon: any;
  color?: string;
}

export const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  super_admin: [
    { title_en: "Dashboard", title_id: "Dasbor Utama", href: "/dashboard", icon: LayoutDashboard },
    { title_en: "My Aquarium", title_id: "Akuarium Saya", href: "/dashboard/my-aquarium", icon: Container },
    
    // --- FITUR RUTINITAS & MEDIS ---
    { title_en: "Inventory & Stock", title_id: "Gudang & Obat", href: "/dashboard/inventory", icon: Package, color: "text-amber-500 dark:text-amber-400" },
    { title_en: "Treatment Ward", title_id: "Ruang Perawatan", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" },

    // --- MASTER DATA & AI ---
    { title_en: "Plant Database", title_id: "Database Tanaman", href: "/dashboard/plants", icon: Leaf },
    { title_en: "Plant Expert", title_id: "Sistem Pakar Tanaman", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title_en: "Algae Database", title_id: "Database Alga", href: "/dashboard/algae", icon: Bug },
    { title_en: "Algae Expert", title_id: "Sistem Pakar Alga", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title_en: "Fish Database", title_id: "Database Ikan", href: "/dashboard/fishes", icon: Fish },
    { title_en: "Fish Expert", title_id: "Sistem Pakar Ikan", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    
    { title_en: "Disease Database", title_id: "Database Penyakit", href: "/dashboard/diseases", icon: Activity },
    { title_en: "Disease Expert", title_id: "Sistem Pakar Penyakit", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    
    { title_en: "Medication Database", title_id: "Database Obat", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },
    { title_en: "Treatment Protocols", title_id: "Protokol Pengobatan", href: "/dashboard/protocols", icon: Network, color: "text-indigo-500 dark:text-indigo-400" },

    // --- ANALITIK & PENGATURAN ---
    { title_en: "Clinical Analytics", title_id: "Analitik Klinis", href: "/dashboard/analytics", icon: BarChart, color: "text-fuchsia-500 dark:text-fuchsia-400" },
    { title_en: "Users", title_id: "Pengguna", href: "/dashboard/users", icon: Users },
    { title_en: "Audit Logs", title_id: "Log Aktivitas", href: "/dashboard/audit-logs", icon: ShieldCheck, color: "text-rose-500 dark:text-rose-400" }, // <-- TAMBAHAN UNTUK SUPER ADMIN
    { title_en: "Control Panel", title_id: "Panel Kendali", href: "/dashboard/admin-panel", icon: Database }, 
  ],

  admin: [
    { title_en: "Dashboard", title_id: "Dasbor Utama", href: "/dashboard", icon: LayoutDashboard },
    { title_en: "My Aquarium", title_id: "Akuarium Saya", href: "/dashboard/my-aquarium", icon: Container },
    { title_en: "Inventory & Stock", title_id: "Gudang & Obat", href: "/dashboard/inventory", icon: Package, color: "text-amber-500 dark:text-amber-400" },
    { title_en: "Treatment Ward", title_id: "Ruang Perawatan", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" },
    
    { title_en: "Plant Database", title_id: "Database Tanaman", href: "/dashboard/plants", icon: Leaf },
    { title_en: "Plant Expert", title_id: "Sistem Pakar Tanaman", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title_en: "Algae Database", title_id: "Database Alga", href: "/dashboard/algae", icon: Bug },
    { title_en: "Algae Expert", title_id: "Sistem Pakar Alga", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title_en: "Fish Database", title_id: "Database Ikan", href: "/dashboard/fishes", icon: Fish },
    { title_en: "Fish Expert", title_id: "Sistem Pakar Ikan", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title_en: "Disease Database", title_id: "Database Penyakit", href: "/dashboard/diseases", icon: Activity },
    { title_en: "Disease Expert", title_id: "Sistem Pakar Penyakit", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title_en: "Medication Database", title_id: "Database Obat", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },
    { title_en: "Clinical Analytics", title_id: "Analitik Klinis", href: "/dashboard/analytics", icon: BarChart, color: "text-fuchsia-500 dark:text-fuchsia-400" },
    { title_en: "Users", title_id: "Pengguna", href: "/dashboard/users", icon: Users },
    { title_en: "Audit Logs", title_id: "Log Aktivitas", href: "/dashboard/audit-logs", icon: ShieldCheck, color: "text-rose-500 dark:text-rose-400" }, // <-- TAMBAHAN UNTUK ADMIN
  ],

  user: [
    { title_en: "Dashboard", title_id: "Dasbor Utama", href: "/dashboard", icon: LayoutDashboard },
    { title_en: "My Aquarium", title_id: "Akuarium Saya", href: "/dashboard/my-aquarium", icon: Container },
    { title_en: "Inventory & Stock", title_id: "Gudang & Obat", href: "/dashboard/inventory", icon: Package, color: "text-amber-500 dark:text-amber-400" },
    { title_en: "Treatment Ward", title_id: "Ruang Perawatan", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" },
    
    { title_en: "Plant Database", title_id: "Database Tanaman", href: "/dashboard/plants", icon: Leaf },
    { title_en: "Plant Expert", title_id: "Sistem Pakar Tanaman", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title_en: "Algae Database", title_id: "Database Alga", href: "/dashboard/algae", icon: Bug },
    { title_en: "Algae Expert", title_id: "Sistem Pakar Alga", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title_en: "Fish Database", title_id: "Database Ikan", href: "/dashboard/fishes", icon: Fish },
    { title_en: "Fish Expert", title_id: "Sistem Pakar Ikan", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title_en: "Disease Database", title_id: "Database Penyakit", href: "/dashboard/diseases", icon: Activity },
    { title_en: "Disease Expert", title_id: "Sistem Pakar Penyakit", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title_en: "Medication Database", title_id: "Database Obat", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },
    { title_en: "Clinical Analytics", title_id: "Analitik Klinis", href: "/dashboard/analytics", icon: BarChart, color: "text-fuchsia-500 dark:text-fuchsia-400" },
  ],
};