import {
  Home,
  Settings,
  LayoutDashboard,
  List,
  Grid3X3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mobileNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const desktopNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "All Expenses", href: "/expenses", icon: List },
  { label: "Categories", href: "/categories", icon: Grid3X3 },
];

export const desktopBottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];
