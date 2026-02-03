import { defaultLocale } from "@/i18n/config";

const DEFAULT_CATEGORY_DEFS = [
  { key: "foodDining", color: "#E67E22", icon: "UtensilsCrossed" },
  { key: "transport", color: "#3498DB", icon: "Car" },
  { key: "groceries", color: "#3D8A5A", icon: "ShoppingCart" },
  { key: "entertainment", color: "#9B59B6", icon: "Film" },
  { key: "health", color: "#E74C3C", icon: "Heart" },
  { key: "housing", color: "#2ECC71", icon: "Home" },
  { key: "shopping", color: "#1ABC9C", icon: "ShoppingBag" },
  { key: "utilities", color: "#F39C12", icon: "Zap" },
] as const;

export async function getDefaultCategories(locale: string) {
  let messages: Record<string, string>;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default
      .defaultCategories;
  } catch {
    messages = (await import(`@/messages/${defaultLocale}.json`)).default
      .defaultCategories;
  }

  return DEFAULT_CATEGORY_DEFS.map((def) => ({
    name: messages[def.key] ?? def.key,
    color: def.color,
    icon: def.icon,
  }));
}
