"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeamStanding } from "@/lib/promotion";

type PickTradeAnalysisProps = {
  onApplyToTeams: (teams: TeamStanding[]) => void;
};

type AnalysisTeam = TeamStanding & {
  pickTradeNet: number;
};

type TradeDetail = {
  transactionKey: string;
  timestamp: number;
  tradeNote: string;
  traderTeamName?: string;
  tradeeTeamName?: string;
  assignments: Array<{
    teamName: string;
    netPoints: number;
    entries: Array<{ pick: number; direction: string; confidence: string }>;
  }>;
  unresolvedPicks: number[];
  warnings: string[];
};

export function PickTradeAnalysis({ onApplyToTeams }: PickTradeAnalysisProps) {
  const [leagueUrl, setLeagueUrl] = useState(
    "https://basketball.fantasysports.yahoo.com/2024/nba/35466",
  );
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [summary, setSummary] = useState<{
    leagueName: string;
    leagueKey: string;
    totalTrades: number;
    tradesWithNotes: number;
    tradesWithoutNotes: number;
    perTeam: Array<{
      teamName: string;
      netPoints: number;
      trades: Array<{ tradeNote: string; picks: string; net: number }>;
    }>;
    tradeDetails: TradeDetail[];
    teams: AnalysisTeam[];
  } | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setNeedsAuth(false);

    try {
      const response = await fetch("/api/yahoo/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueUrl,
          accessToken: accessToken || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.needsAuth) setNeedsAuth(true);
        throw new Error(payload.error ?? "Analiz başarısız.");
      }
      setSummary(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-violet-500/30 bg-violet-500/5">
      <CardHeader>
        <CardTitle>Pick-Trade Analizi (Yahoo Transactions)</CardTitle>
        <CardDescription>
          Onaylanmış takasların trade notlarından pick haklarını okur ve Kural
          Kitabı Tablo 4&apos;e göre puanlar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="tx-url">Lig linki</Label>
            <Input
              id="tx-url"
              value={leagueUrl}
              onChange={(e) => setLeagueUrl(e.target.value)}
              placeholder="https://basketball.fantasysports.yahoo.com/2024/nba/35466"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={analyze} disabled={loading || !leagueUrl.trim()}>
              {loading ? "Analiz ediliyor..." : "Takaslardan hesapla"}
            </Button>
          </div>
        </div>

        <Input
          type="password"
          placeholder="Yahoo OAuth access token (zorunlu)"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Analiz yapılamadı</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {needsAuth && (
          <Alert>
            <AlertTitle>Yahoo OAuth gerekli</AlertTitle>
            <AlertDescription>
              Transactions sayfası giriş yapılmadan veri döndürmez. Yahoo
              Fantasy API token&apos;ı ile onaylanmış takaslar ve trade notları
              çekilebilir. Pick bilgisi trade notunda yazılı olmalıdır — Yahoo
              pick takasını native olarak kaydetmez.
            </AlertDescription>
          </Alert>
        )}

        {summary && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{summary.leagueName}</Badge>
              <Badge variant="outline">{summary.leagueKey}</Badge>
              <Badge>{summary.totalTrades} onaylı takas</Badge>
              <Badge variant="outline">
                {summary.tradesWithNotes} notlu / {summary.tradesWithoutNotes}{" "}
                notsuz
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Takım</TableHead>
                    <TableHead className="text-right">Net pick-trade</TableHead>
                    <TableHead>İşlem sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.perTeam.map((team) => (
                    <TableRow key={team.teamName}>
                      <TableCell className="font-medium">
                        {team.teamName}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {team.netPoints > 0 ? "+" : ""}
                        {team.netPoints}
                      </TableCell>
                      <TableCell>{team.trades.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              onClick={() =>
                onApplyToTeams(
                  summary.teams.map((team) => ({
                    teamKey: team.teamKey,
                    name: team.name,
                    rank: team.rank,
                    wins: team.wins,
                    losses: team.losses,
                    ties: team.ties,
                    pickTradeNet: team.pickTradeNet,
                  })),
                )
              }
            >
              Sonuçları lig tablosuna uygula
            </Button>

            <div className="space-y-3">
              <h3 className="font-semibold">Takas detayları</h3>
              {summary.tradeDetails.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Pick içeren trade notu bulunamadı.
                </p>
              ) : (
                summary.tradeDetails.map((trade) => (
                  <div
                    key={trade.transactionKey}
                    className="rounded-lg border bg-background/80 p-3 text-sm"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {new Date(trade.timestamp * 1000).toLocaleDateString(
                          "tr-TR",
                        )}
                      </Badge>
                      {trade.traderTeamName && trade.tradeeTeamName ? (
                        <span>
                          {trade.traderTeamName} ↔ {trade.tradeeTeamName}
                        </span>
                      ) : null}
                    </div>
                    {trade.tradeNote ? (
                      <p className="italic text-muted-foreground">
                        &quot;{trade.tradeNote}&quot;
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Trade notu yok</p>
                    )}
                    {trade.assignments.map((row) => (
                      <p key={row.teamName} className="mt-1">
                        <strong>{row.teamName}:</strong> {row.netPoints > 0 ? "+" : ""}
                        {row.netPoints} (
                        {row.entries
                          .map(
                            (e) =>
                              `${e.pick}. sıra ${e.direction} (${e.confidence})`,
                          )
                          .join(", ")}
                        )
                      </p>
                    ))}
                    {trade.unresolvedPicks.length > 0 && (
                      <p className="mt-1 text-amber-700">
                        Çözümlenemeyen pick: {trade.unresolvedPicks.join(", ")}
                      </p>
                    )}
                    {trade.warnings.map((warning) => (
                      <p key={warning} className="mt-1 text-amber-700">
                        {warning}
                      </p>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
