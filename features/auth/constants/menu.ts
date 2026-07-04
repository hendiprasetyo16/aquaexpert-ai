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
  BarChart,     // <-- Icon untuk Analytics
  HeartPulse,    // <-- Icon untuk Treatment Ward
  Pill // <-- IMPORT ICON INI UNTUK DATABASE OBAT
} from "lucide-react";

const AI_COLORS = {
  plants: "text-green-500 dark:text-green-400",
  algae: "text-teal-500 dark:text-teal-400",
  fishes: "text-blue-500 dark:text-blue-400",
  diseases: "text-red-500 dark:text-red-400"
};

export const MENU_BY_ROLE = {
  super_admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Aquarium", href: "/dashboard/my-aquarium", icon: Container },

    // --- MENU BARU RAWAT INAP (TREATMENT) ---
    { title: "Treatment Ward", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" },

    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    
    // --- MENU BARU: DATABASE OBAT ---
    { title: "Medication Database", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },

    // --- MENU BARU ANALISIS KLINIS (ANALYTICS) ---
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" },
    
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Control Panel", href: "/dashboard/admin-panel", icon: Database }, 
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ],

  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Aquarium", href: "/dashboard/my-aquarium", icon: Container },
    { title: "Treatment Ward", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" }, // Tambahan
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title: "Medication Database", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" }, // Tambahan
    { title: "Users", href: "/dashboard/users", icon: Users },
  ],

  user: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Aquarium", href: "/dashboard/my-aquarium", icon: Container },
    { title: "Treatment Ward", href: "/dashboard/treatments", icon: HeartPulse, color: "text-rose-500 dark:text-rose-400" }, // Tambahan
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title: "Medication Database", href: "/dashboard/medications", icon: Pill, color: "text-sky-500 dark:text-sky-400" },
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" }, // Tambahan
  ],
} as const;