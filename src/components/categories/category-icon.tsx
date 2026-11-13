import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { categoryIconMap } from "@/lib/category-icon-map";
import { isEmojiIcon } from "@/lib/category-icon";

interface CategoryIconProps {
  icon: string | null | undefined;
  color: string;
  className?: string;
}

/**
 * Background for the square tile behind a category icon. Emojis keep their own
 * colors, so their tile gets a stronger tint to show the category color.
 */
export function categoryTileStyle(
  icon: string | null | undefined,
  color: string,
): CSSProperties {
  return isEmojiIcon(icon)
    ? { backgroundColor: color + "33" }
    : { backgroundColor: color + "1F" };
}

/**
 * Renders a category's built-in icon (tinted with its color) or its emoji.
 * Unknown legacy values fall back to the generic "more" icon.
 */
export function CategoryIcon({ icon, color, className }: CategoryIconProps) {
  if (!isEmojiIcon(icon)) {
    const Icon =
      (icon && categoryIconMap[icon]) || categoryIconMap.MoreHorizontal;
    return (
      <Icon
        className={cn("h-5 w-5 shrink-0", className)}
        style={{ color }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center text-lg leading-none",
        className,
      )}
      aria-hidden="true"
      data-emoji-icon
    >
      {icon}
    </span>
  );
}
