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
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export const mobileNavItems: NavItem[] = [
  { labelKey: "nav.home", href: "/dashboard", icon: Home },
  { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
  { labelKey: "nav.categories", href: "/categories", icon: Grid3X3 },
  { labelKey: "nav.settings", href: "/settings", icon: Settings },
];

export const desktopNavItems: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.allExpenses", href: "/expenses", icon: List },
  { labelKey: "nav.categories", href: "/categories", icon: Grid3X3 },
  { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
];

export const desktopBottomNavItems: NavItem[] = [
  { labelKey: "nav.settings", href: "/settings", icon: Settings },
];
