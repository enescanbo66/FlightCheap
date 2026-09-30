"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Radar } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { LocationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export type NearbyAirportOption = {
  code: string;
  name: string;
  distanceKm: number;
  isPrimary: boolean;
  cityCode?: string;
  countryCode?: string;
};

export type NearbyAirportsState = {
  enabled: boolean;
  radiusKm: number;
  /** Selected airport codes included in the search (when enabled). */
  selected: string[];
  options: NearbyAirportOption[];
};

type Props = {
  place: LocationResult | null;
  value: NearbyAirportsState;
  onChange: (next: NearbyAirportsState) => void;
  label: string;
};

function supportsNearby(kind?: string) {
  return kind === "airport" || kind === "city";
}

export function emptyNearbyState(radiusKm = 250): NearbyAirportsState {
  return { enabled: false, radiusKm, selected: [], options: [] };
}

export function NearbyAirportsControl({ place, value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = supportsNearby(place?.kind);
  const placeKey = place ? `${place.kind}:${place.code}` : "";
  const prevPlaceKey = useRef(placeKey);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const selectedRef = useRef(value.selected);
  selectedRef.current = value.selected;
  const optionsLenRef = useRef(value.options.length);
  optionsLenRef.current = value.options.length;

  // Reset selection cache when the place changes
  useEffect(() => {
    if (prevPlaceKey.current === placeKey) return;
    prevPlaceKey.current = placeKey;
    if (!place || !supported) {
      onChangeRef.current(emptyNearbyState(value.radiusKm));
      return;
    }
    onChangeRef.current({
      enabled: value.enabled,
      radiusKm: value.radiusKm,
      options: [],
      selected: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on place identity
  }, [placeKey, place, supported]);

  useEffect(() => {
    if (!place || !supported || !value.enabled) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          code: place.code,
          kind: place.kind,
          radiusKm: String(value.radiusKm),
        });
        const res = await fetch(`/api/nearby-airports?${params}`);
        const data = (await res.json()) as {
          ok: boolean;
          airports: NearbyAirportOption[];
        };
        if (cancelled) return;
        const options = data.airports ?? [];
        const codes = new Set(options.map((a) => a.code));
        const prevSelected = selectedRef.current.filter((c) => codes.has(c));
        const selected =
          optionsLenRef.current === 0 || prevSelected.length === 0
            ? options.map((a) => a.code)
            : prevSelected;
        onChangeRef.current({
          enabled: true,
          radiusKm: value.radiusKm,
          options,
          selected,
        });
      } catch {
        if (!cancelled) {
          onChangeRef.current({
            enabled: true,
            radiusKm: value.radiusKm,
            options: [],
            selected: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [place, supported, value.enabled, value.radiusKm]);

  const selectedCount = value.selected.length;
  const summary = useMemo(() => {
    if (!value.enabled) return null;
    if (loading) return "Loading airports…";
    if (!value.options.length) return "No nearby airports found";
    return `${selectedCount} of ${value.options.length} airports · ${value.radiusKm} km`;
  }, [value.enabled, value.options.length, value.radiusKm, selectedCount, loading]);

  if (!place || !supported) return null;

  const toggleAirport = (code: string, checked: boolean) => {
    const set = new Set(value.selected);
    if (checked) set.add(code);
    else {
      if (set.size <= 1) return;
      set.delete(code);
    }
    onChange({ ...value, selected: [...set] });
  };

  return (
    <div className="rounded-xl bg-sky-50/70 px-3 py-2.5 ring-1 ring-sky-900/5">
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={value.enabled}
          onCheckedChange={(v) => {
            const enabled = Boolean(v);
            onChange({
              ...value,
              enabled,
              options: enabled ? value.options : [],
              selected: enabled ? value.selected : [],
            });
            if (enabled) setOpen(true);
          }}
        />
        <Radar className="size-3.5 text-sky-700" />
        <span className="text-xs font-semibold text-sky-950">
          Nearby airports — {label}
        </span>
      </label>

      {value.enabled ? (
        <div className="mt-2 space-y-2 pl-6">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <Label className="text-[11px] text-slate-500">Radius</Label>
              <span className="text-[11px] font-semibold tabular-nums text-sky-900">
                {value.radiusKm} km
              </span>
            </div>
            <Slider
              min={50}
              max={500}
              step={25}
              value={[value.radiusKm]}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                if (typeof next === "number") {
                  onChange({
                    ...value,
                    radiusKm: next,
                    options: [],
                    selected: [],
                  });
                }
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/90 px-2.5 py-2 text-left text-xs text-slate-600 ring-1 ring-sky-900/5"
          >
            <span>{summary}</span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-slate-400 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200",
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-white/90 p-2 ring-1 ring-sky-900/5">
                {value.options.map((airport) => {
                  const checked = value.selected.includes(airport.code);
                  return (
                    <li key={airport.code}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1.5 hover:bg-sky-50">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleAirport(airport.code, Boolean(v))
                          }
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="font-semibold text-slate-900">
                              {airport.code}
                            </span>
                            <span className="truncate text-slate-600">
                              {airport.name}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {airport.isPrimary
                              ? "Selected location"
                              : `${Math.round(airport.distanceKm)} km away`}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
                {!loading && !value.options.length ? (
                  <li className="px-1.5 py-2 text-xs text-slate-500">
                    No flightable airports in this radius.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
