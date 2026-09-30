"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
};

export function DateRangePicker({ label, range, onChange, disabled }: Props) {
  const summary =
    range?.from && range?.to
      ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
      : range?.from
        ? `${format(range.from, "MMM d, yyyy")} – …`
        : "Select dates";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-800/70">
        {label}
      </span>
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 w-full justify-start border-sky-900/10 bg-white px-3 font-normal shadow-none hover:bg-sky-50/80",
            !range?.from && "text-slate-400"
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-sky-700" />
          <span className="truncate">{summary}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
            defaultMonth={range?.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
