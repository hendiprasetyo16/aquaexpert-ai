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

export const MENU_BY_ROLE = {
  super_admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: "text-teal-500" }, // <-- TAMBAHAN MENU AI ALGAE
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Control Panel", href: "/dashboard/admin-panel", icon: Database }, 
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ],

  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: "text-teal-500" }, // <-- TAMBAHAN
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Users", href: "/dashboard/users", icon: Users },
  ],

  user: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Algae Expert AI", href: "/dashboard/algae-expert", icon: Cpu, color: "text-teal-500" }, // <-- TAMBAHAN
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
  ],
} as const;