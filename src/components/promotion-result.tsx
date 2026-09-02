"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PromotionVerdict } from "@/lib/promotion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

type PromotionResultProps = {
  verdict: PromotionVerdict | null;
};

function ScoreBreakdown({
  label,
  teamName,
  categoryScore,
  pickTradeNet,
  totalScore,
  highlight,
}: {
  label: string;
  teamName: string;
  categoryScore: number;
  pickTradeNet: number;
  totalScore: number;
  highlight: "promote" | "relegate" | "neutral";
}) {
  const ring =
    highlight === "promote"
      ? "ring-2 ring-emerald-500/60"
      : highlight === "relegate"
        ? "ring-2 ring-rose-500/60"
        : "";

  return (
    <div className={`rounded-xl border bg-background/90 p-4 ${ring}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-lg font-semibold">{teamName}</p>
        </div>
        <p className="text-3xl font-bold tabular-nums">{totalScore.toFixed(1)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">Kategori puanı</p>
          <p className="font-medium tabular-nums">{categoryScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">Pick-trade</p>
          <p className="font-medium tabular-nums">
            {pickTradeNet > 0 ? "+" : ""}
            {pickTradeNet}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PromotionResult({ verdict }: PromotionResultProps) {
  if (!verdict) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yükselme / Düşme Kararı</CardTitle>
          <CardDescription>
            Her iki ligde de en az bir takım ve B liginde 1., A liginde son
            sıra takımı gerekir.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { bChampion, aLastPlace, margin, promoted } = verdict;

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader
        className={
          promoted
            ? "bg-emerald-500/10"
            : "bg-amber-500/10"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {promoted ? (
                <>
                  <ArrowUp className="h-6 w-6 text-emerald-600" />
                  Yükselme gerçekleşir
                </>
              ) : (
                <>
                  <Minus className="h-6 w-6 text-amber-600" />
                  Yükselme gerçekleşmez
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-base">
              B lig şampiyonu, A lig sonuncusundan{" "}
              <span className="font-semibold text-foreground">
                {Math.abs(margin).toFixed(1)} puan
              </span>{" "}
              {margin >= 0 ? "önde" : "geride"}.
            </CardDescription>
          </div>
          <Badge
            variant={promoted ? "default" : "secondary"}
            className="text-sm"
          >
            Fark: {margin > 0 ? "+" : ""}
            {margin.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ScoreBreakdown
            label="B Lig — 1. sıra (yükselme adayı)"
            teamName={bChampion.name}
            categoryScore={bChampion.categoryScore}
            pickTradeNet={bChampion.pickTradeNet}
            totalScore={bChampion.totalScore}
            highlight={promoted ? "promote" : "neutral"}
          />
          <ScoreBreakdown
            label="A Lig — son sıra (düşme adayı)"
            teamName={aLastPlace.name}
            categoryScore={aLastPlace.categoryScore}
            pickTradeNet={aLastPlace.pickTradeNet}
            totalScore={aLastPlace.totalScore}
            highlight={!promoted ? "relegate" : "neutral"}
          />
        </div>

        <Separator />

        <Alert>
          <ArrowDown className="h-4 w-4" />
          <AlertTitle>Hesaplama formülü</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              <strong>Toplam puan</strong> = kategori galibiyetleri + (beraberlik
              × 0.5) + net pick-trade puanı
            </p>
            <p>
              B lig 1.&apos;sinin toplamı &gt; A lig sonuncusunun toplamı ise B
              lig şampiyonu A lige yükselir.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
