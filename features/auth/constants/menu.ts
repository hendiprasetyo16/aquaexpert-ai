import {
  LayoutDashboard,
  Leaf,
  Fish,
  Bug,
  Activity,
  Users,
  Settings,
  Database // <-- Tambahan ikon baru
} from "lucide-react";
import { Cpu } from "lucide-react";

export const MENU_BY_ROLE = {
  super_admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" }, // <-- Menu AI dengan ikon CPU
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Users", href: "/dashboard/users", icon: Users },
    { title: "Control Panel", href: "/dashboard/admin-panel", icon: Database }, // <-- Menu khusus Super Admin
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ],

  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" },
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
    { title: "Algae Expert", href: "/dashboard/algae", icon: Bug },
    { title: "Disease Expert", href: "/dashboard/diseases", icon: Activity },
    { title: "Users", href: "/dashboard/users", icon: Users },
  ],

  user: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Plant Expert", href: "/dashboard/plants", icon: Leaf },
    { title: "Plant Expert AI", href: "/dashboard/plant-expert/engine", icon: Cpu, color: "text-green-500" },
    { title: "Fish Expert", href: "/dashboard/fishes", icon: Fish },
  ],
} as const;