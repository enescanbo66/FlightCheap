"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  computePickTradeNet,
  PICK_TRADE_VALUES,
  TRADABLE_PICKS,
  type PickTradeEntry,
} from "@/lib/promotion";

type PickTradeEditorProps = {
  applyLabel: string;
  onApply: (net: number) => void;
};

export function PickTradeEditor({ applyLabel, onApply }: PickTradeEditorProps) {
  const [entries, setEntries] = useState<PickTradeEntry[]>([]);
  const [pick, setPick] = useState<string>("5");
  const [direction, setDirection] = useState<"given" | "received">("given");

  const net = useMemo(() => computePickTradeNet(entries), [entries]);

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      { pick: Number(pick), direction },
    ]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div>
        <p className="font-medium">Pick-trade hesaplayıcı</p>
        <p className="text-sm text-muted-foreground">
          Verilen pick hakları eksi, alınan pick hakları artı değerdedir (Tablo 4).
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Pick sırası</Label>
          <Select value={pick} onValueChange={(v) => v && setPick(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADABLE_PICKS.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {p}. sıra ({PICK_TRADE_VALUES[p]} puan)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Yön</Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as "given" | "received")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="given">Verildi (−)</SelectItem>
              <SelectItem value="received">Alındı (+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" onClick={addEntry}>
          Ekle
        </Button>
      </div>

      {entries.length > 0 && (
        <ul className="space-y-1 text-sm">
          {entries.map((entry, index) => (
            <li
              key={`${entry.pick}-${entry.direction}-${index}`}
              className="flex items-center justify-between rounded bg-muted/60 px-3 py-1.5"
            >
              <span>
                {entry.pick}. sıra{" "}
                {entry.direction === "given" ? "verildi" : "alındı"} (
                {entry.direction === "given" ? "−" : "+"}
                {PICK_TRADE_VALUES[entry.pick]})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(index)}
              >
                Sil
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium tabular-nums">
          Net pick-trade: {net > 0 ? "+" : ""}
          {net}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={entries.length === 0}
          onClick={() => onApply(net)}
        >
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}
