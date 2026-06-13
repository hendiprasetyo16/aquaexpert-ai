// features/auth/constants/menu.ts
import {
  LayoutDashboard,
  Leaf,
  Fish,
  Bug,
  Activity,
  Users,
  Settings,
  Database, 
  Cpu
} from "lucide-react";

// WARNA KHUSUS UNTUK ICON AI AGAR MUDAH DIBEDAKAN
const AI_COLORS = {
  plants: "text-green-500 dark:text-green-400",
  algae: "text-teal-500 dark:text-teal-400",
  fishes: "text-blue-500 dark:text-blue-400",
  diseases: "text-red-500 dark:text-red-400"
};

export const MENU_BY_ROLE = {
  super_admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert", icon: Cpu, color: AI_COLORS.fishes },
    
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Control Panel", href: "/dashboard/admin-panel", icon: Database }, 
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ],

  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert", icon: Cpu, color: AI_COLORS.fishes },
    
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
    
    { title: "Users", href: "/dashboard/users", icon: Users },
  ],

  user: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: AI_COLORS.plants },
    
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: AI_COLORS.algae }, 
    
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Fish Expert AI", href: "/dashboard/fish-expert", icon: Cpu, color: AI_COLORS.fishes },
    
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Disease Expert AI", href: "/dashboard/disease-expert", icon: Cpu, color: AI_COLORS.diseases },
  ],
} as const;