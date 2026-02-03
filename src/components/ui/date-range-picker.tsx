"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type { DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const rdpLocales: Record<string, object> = { es };

function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Return all dates between two dates (exclusive of endpoints). */
function daysBetween(a: Date, b: Date): Date[] {
  const [start, end] = a < b ? [a, b] : [b, a];
  const days: Date[] = [];
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur < end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder,
  className,
}: DateRangePickerProps) {
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [hoveredDay, setHoveredDay] = React.useState<Date | undefined>();

  const selected: DateRange | undefined = React.useMemo(() => {
    const f = parseIso(from);
    const t = parseIso(to);
    if (!f && !t) return undefined;
    return { from: f, to: t };
  }, [from, to]);

  // When the user has picked a start date but not yet an end date,
  // highlight the range between start and the day under the cursor.
  const isSelectingEnd = !!selected?.from && !selected.to;

  const previewDays =
    isSelectingEnd && hoveredDay && selected?.from
      ? daysBetween(selected.from, hoveredDay)
      : [];

  const previewEnd = isSelectingEnd && hoveredDay ? [hoveredDay] : [];

  const formatted = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    });
    const f = parseIso(from);
    const t = parseIso(to);
    if (!f && !t) return null;
    if (f && t) return `${fmt.format(f)} – ${fmt.format(t)}`;
    if (f) return `${fmt.format(f)} –`;
    return `– ${fmt.format(t!)}`;
  }, [from, to, locale]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {formatted ?? <span>{placeholder ?? "Pick dates"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            onChange(
              range?.from ? toIso(range.from) : "",
              range?.to ? toIso(range.to) : "",
            );
          }}
          onDayMouseEnter={(day) => setHoveredDay(day)}
          onDayMouseLeave={() => setHoveredDay(undefined)}
          modifiers={{
            range_preview: previewDays,
            range_preview_end: previewEnd,
          }}
          modifiersClassNames={{
            range_preview: "bg-accent/50 rounded-none",
            range_preview_end: "bg-accent rounded-none",
          }}
          locale={rdpLocales[locale]}
          defaultMonth={parseIso(from)}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
