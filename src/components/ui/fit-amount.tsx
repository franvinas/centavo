"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FitAmountProps {
  /** Text to show on one line, usually a formatted amount. */
  children: string;
  className?: string;
  /** Smallest scale applied to the inherited font size before giving up. */
  minScale?: number;
}

/**
 * Shows an amount on a single line and shrinks its font just enough to fit
 * the available width, so large totals stay whole instead of overflowing or
 * being cut off with an ellipsis. Font size, weight and colour come from
 * `className` (or the parent); this only scales them down.
 */
export function FitAmount({
  children,
  className,
  minScale = 0.5,
}: FitAmountProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  const [wrap, setWrap] = useState(false);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const fit = () => {
      // Measure at full size, then scale down to the available width.
      text.style.fontSize = "";
      text.style.whiteSpace = "nowrap";
      const natural = text.scrollWidth;
      const available = box.clientWidth;
      const ideal = natural > 0 ? available / natural : 1;
      let next =
        ideal < 1 ? Math.max(minScale, Math.floor(ideal * 100) / 100) : 1;
      text.style.fontSize = next < 1 ? `${next}em` : "";
      // Glyph widths do not scale perfectly linearly; nudge down until it fits.
      while (next > minScale && text.scrollWidth > available) {
        next = Math.max(minScale, Math.round((next - 0.02) * 100) / 100);
        text.style.fontSize = `${next}em`;
      }
      text.style.whiteSpace = "";
      setScale(next);
      // Even the smallest size does not fit: let it wrap rather than clip.
      setWrap(ideal < minScale);
    };

    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [children, minScale]);

  return (
    <span ref={boxRef} className={cn("block max-w-full min-w-0", className)}>
      <span
        ref={textRef}
        className={cn(
          "inline-block max-w-full",
          wrap ? "break-words whitespace-normal" : "whitespace-nowrap",
        )}
        style={scale < 1 ? { fontSize: `${scale}em` } : undefined}
      >
        {children}
      </span>
    </span>
  );
}
