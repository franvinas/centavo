"use client";

import { Check } from "lucide-react";

const COLORS = [
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
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {value === color && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
