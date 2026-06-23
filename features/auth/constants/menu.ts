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
  BarChart // <-- TAMBAHKAN ICON INI UNTUK ANALYTICS
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

    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    
    // --- MENU BARU YANG KITA BUAT TADI ---
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" },
    // -------------------------------------
    
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Control Panel", href: "/dashboard/admin-panel", icon: Database }, 
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ],

  admin: [
    // ... (Sesuaikan isinya sama seperti super_admin, kurangi control panel & settings)
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Aquarium", href: "/dashboard/my-aquarium", icon: Container },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" },
    { title: "Users", href: "/dashboard/users", icon: Users },
  ],

  user: [
    // ... (Sesuaikan isinya sama seperti admin, kurangi Users)
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Aquarium", href: "/dashboard/my-aquarium", icon: Container },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert/engine", icon: Cpu, color: AI_COLORS.fishes },
    { title: "Disease Database", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    { title: "Clinical Analytics", href: "/dashboard/analytics", icon: BarChart, color: "text-indigo-500 dark:text-indigo-400" },
  ],
} as const;