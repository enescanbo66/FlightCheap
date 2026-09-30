"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronsUpDown, Globe2, MapPin, Plane } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { placeLabel } from "@/lib/regions";
import { cn } from "@/lib/utils";
import type { LocationResult } from "@/lib/types";

type Props = {
  label: string;
  value: LocationResult | null;
  onChange: (value: LocationResult | null) => void;
  placeholder?: string;
};

function PlaceIcon({ kind }: { kind: LocationResult["kind"] }) {
  if (kind === "airport") return <Plane className="size-4 shrink-0 text-sky-700" />;
  if (kind === "city") return <Plane className="size-4 shrink-0 text-sky-700" />;
  if (kind === "country" || kind === "region" || kind === "anywhere") {
    return <Globe2 className="size-4 shrink-0 text-sky-700" />;
  }
  return <MapPin className="size-4 shrink-0 text-sky-700" />;
}

function formatSelected(place: LocationResult) {
  const label = placeLabel(place);
  return (
    <>
      <span className="font-semibold text-slate-900">{label.primary}</span>
      <span className="ml-1.5 text-slate-500">{label.secondary}</span>
    </>
  );
}

export function LocationPicker({
  label,
  value,
  onChange,
  placeholder = "City, airport, country…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const listId = useId();

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { results: LocationResult[] };
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-800/70">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 w-full justify-between border-sky-900/10 bg-white px-3 font-normal shadow-none hover:bg-sky-50/80"
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {value ? <PlaceIcon kind={value.kind} /> : <MapPin className="size-4 shrink-0 text-sky-700" />}
            <span className="truncate text-left">
              {value ? (
                formatSelected(value)
              ) : (
                <span className="text-slate-400">{placeholder}</span>
              )}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[min(380px,calc(100vw-2rem))] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList id={listId}>
              <CommandEmpty>{loading ? "Searching…" : "No places found."}</CommandEmpty>
              <CommandGroup>
                {results.map((place) => {
                  const labelBits = placeLabel(place);
                  return (
                    <CommandItem
                      key={`${place.kind}-${place.code}-${place.id}`}
                      value={`${place.name} ${place.code} ${place.subtitle ?? ""}`}
                      onSelect={() => {
                        onChange(place);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          value?.id === place.id && value?.kind === place.kind
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <PlaceIcon kind={place.kind} />
                      <div className="min-w-0 flex-1 pl-2">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium">{labelBits.primary}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {place.code}
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {place.subtitle ?? labelBits.secondary}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
