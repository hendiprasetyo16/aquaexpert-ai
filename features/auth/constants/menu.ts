import {
  LayoutDashboard,
  Leaf,
  Fish,
  Bug,
  Activity,
  Users,
  Settings,
} from "lucide-react";
import { UserCircle } from "lucide-react"; // Tambahkan icon ini di atas

export const MENU_BY_ROLE = {
  super_admin: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Plant Expert",
      href: "/dashboard/plants",
      icon: Leaf,
    },
    {
      title: "Fish Expert",
      href: "/dashboard/fishes",
      icon: Fish,
    },
    {
      title: "Algae Expert",
      href: "/dashboard/algae",
      icon: Bug,
    },
    {
      title: "Disease Expert",
      href: "/dashboard/diseases",
      icon: Activity,
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      title: "Profil Saya",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
  ],

  admin: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Plant Expert",
      href: "/dashboard/plants",
      icon: Leaf,
    },
    {
      title: "Fish Expert",
      href: "/dashboard/fishes",
      icon: Fish,
    },
    {
      title: "Algae Expert",
      href: "/dashboard/algae",
      icon: Bug,
    },
    {
      title: "Disease Expert",
      href: "/dashboard/diseases",
      icon: Activity,
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Profil Saya",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
  ],

  user: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Plant Expert",
      href: "/dashboard/plants",
      icon: Leaf,
    },
    {
      title: "Fish Expert",
      href: "/dashboard/fishes",
      icon: Fish,
    },
    {
      title: "Profil Saya",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
  ],
} as const;