import {
  Home,
  Settings,
  LayoutDashboard,
  List,
  Grid3X3,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mobileNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const desktopNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "All Expenses", href: "/expenses", icon: List },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export const desktopBottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];
