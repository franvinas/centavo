"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
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

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
}: DatePickerProps) {
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);

  // Parse ISO date string (YYYY-MM-DD) to Date in local timezone
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  const formatted = React.useMemo(() => {
    if (!selected) return null;
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(selected);
  }, [selected, locale]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {formatted ?? <span>{placeholder ?? "Pick a date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            if (day) {
              const iso = [
                day.getFullYear(),
                String(day.getMonth() + 1).padStart(2, "0"),
                String(day.getDate()).padStart(2, "0"),
              ].join("-");
              onChange(iso);
            }
            setOpen(false);
          }}
          locale={rdpLocales[locale]}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
