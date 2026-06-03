import {
  LayoutDashboard,
  Leaf,
  Fish,
  Bug,
  Activity,
  Users,
  Settings,
} from "lucide-react";

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
  ],
} as const;