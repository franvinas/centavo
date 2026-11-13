"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hexToHsv, hsvToHex, normalizeHex, type Hsv } from "@/lib/color";

export const PRESET_COLORS = [
  "#E67E22",
  "#3498DB",
  "#3D8A5A",
  "#9B59B6",
  "#E74C3C",
  "#2ECC71",
  "#1ABC9C",
  "#F39C12",
  "#34495E",
  "#E91E63",
  "#607D8B",
  "#795548",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const t = useTranslations("categories");
  const [open, setOpen] = useState(false);
  const current = normalizeHex(value) ?? value;
  const isCustom = !PRESET_COLORS.includes(current);

  return (
    <div className="grid grid-cols-6 gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`flex h-9 w-9 items-center justify-center justify-self-center rounded-full transition-all hover:scale-110 ${current === color ? "ring-offset-bg-surface ring-2 ring-offset-2" : ""}`}
          style={
            {
              backgroundColor: color,
              "--tw-ring-color": color,
            } as React.CSSProperties
          }
          aria-label={t("selectColor", { color })}
          aria-pressed={current === color}
        >
          {current === color && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center justify-self-center rounded-full transition-all hover:scale-110 ${isCustom ? "ring-offset-bg-surface ring-2 ring-offset-2" : ""}`}
            style={
              {
                background: isCustom
                  ? current
                  : "conic-gradient(#F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00)",
                "--tw-ring-color": isCustom ? current : undefined,
              } as React.CSSProperties
            }
            aria-label={t("customColor")}
            aria-pressed={isCustom}
            data-testid="custom-color-trigger"
          >
            {isCustom ? (
              <Check className="h-4 w-4 text-white drop-shadow" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90">
                <Plus className="h-3.5 w-3.5 text-neutral-700" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          className="w-64 space-y-3 p-3"
          aria-label={t("customColor")}
        >
          <ColorPalette value={current} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function relativePosition(e: PointerEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: clamp((e.clientX - rect.left) / (rect.width || 1)),
    y: clamp((e.clientY - rect.top) / (rect.height || 1)),
  };
}

function dragHandlers(onMove: (pos: { x: number; y: number }) => void) {
  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.focus();
      onMove(relativePosition(e));
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        onMove(relativePosition(e));
      }
    },
  };
}

/** Saturation/brightness area + hue slider + hex input. Mounted only while open. */
export function ColorPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const t = useTranslations("categories");
  // HSV is kept locally so the hue survives when saturation or brightness hit 0.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [hexDraft, setHexDraft] = useState(value);

  function update(next: Hsv) {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexDraft(hex);
    onChange(hex);
  }

  function handleHexChange(input: string) {
    setHexDraft(input);
    const hex = normalizeHex(input);
    if (hex) {
      setHsv(hexToHsv(hex));
      onChange(hex);
    }
  }

  function handleAreaKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    update({ ...hsv, s: clamp(hsv.s + d[0]), v: clamp(hsv.v + d[1]) });
  }

  function handleHueKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 1;
    const delta: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
    };
    const d = delta[e.key];
    if (d === undefined) return;
    e.preventDefault();
    update({ ...hsv, h: clamp(hsv.h + d, 0, 359) });
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const hexIsValid = normalizeHex(hexDraft) !== null;

  return (
    <>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("saturationBrightness")}
        aria-valuetext={hsvToHex(hsv)}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="color-area"
        onKeyDown={handleAreaKey}
        {...dragHandlers(({ x, y }) => update({ ...hsv, s: x, v: 1 - y }))}
        className="focus-visible:ring-accent-primary/50 relative h-36 w-full cursor-crosshair touch-none rounded-md outline-none select-none focus-visible:ring-2"
        style={{
          backgroundColor: hueColor,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hsvToHex(hsv),
          }}
        />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={t("hue")}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuemin={0}
        aria-valuemax={359}
        data-testid="hue-slider"
        onKeyDown={handleHueKey}
        {...dragHandlers(({ x }) => update({ ...hsv, h: x * 359 }))}
        className="focus-visible:ring-accent-primary/50 relative h-3 w-full cursor-pointer touch-none rounded-full outline-none select-none focus-visible:ring-2"
        style={{
          background:
            "linear-gradient(to right, #F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00)",
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
          style={{ left: `${(hsv.h / 359) * 100}%`, backgroundColor: hueColor }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span
          className="border-border-subtle h-8 w-8 shrink-0 rounded-md border"
          style={{
            backgroundColor: hexIsValid ? normalizeHex(hexDraft)! : value,
          }}
        />
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => handleHexChange(e.target.value)}
          onBlur={() => setHexDraft(value)}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label={t("hexCode")}
          aria-invalid={!hexIsValid}
          className="border-border-subtle text-text-primary focus-visible:ring-accent-primary/40 aria-invalid:border-status-negative h-8 w-full rounded-md border bg-transparent px-2 font-mono text-sm uppercase outline-none focus-visible:ring-2"
        />
      </div>
    </>
  );
}
