"use client";

import { useMemo, useState } from "react";
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
import {
  categoryPoints,
  enrichTeams,
  type LeagueData,
  type TeamStanding,
} from "@/lib/promotion";
import { PickTradeEditor } from "@/components/pick-trade-editor";

type LeaguePanelProps = {
  title: string;
  description: string;
  accent: "a" | "b";
  data: LeagueData;
  onChange: (data: LeagueData) => void;
};

export function LeaguePanel({
  title,
  description,
  accent,
  data,
  onChange,
}: LeaguePanelProps) {
  const [leagueUrl, setLeagueUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const enriched = useMemo(() => enrichTeams(data.teams), [data.teams]);

  async function fetchFromYahoo() {
    setLoading(true);
    setFetchError(null);
    setNeedsAuth(false);

    try {
      const response = await fetch("/api/yahoo/league", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueUrl, accessToken: accessToken || undefined }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload.needsAuth) {
          setNeedsAuth(true);
          if (payload.parsed?.leagueId) {
            onChange({
              ...data,
              leagueKey: payload.parsed.leagueKey ?? payload.parsed.leagueId,
            });
          }
        }
        throw new Error(payload.error ?? "Veri çekilemedi.");
      }

      onChange({
        leagueKey: payload.league.leagueKey,
        leagueName: payload.league.leagueName,
        teams: payload.teams,
      });
      setLeagueUrl("");
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateTeam(index: number, patch: Partial<TeamStanding>) {
    const teams = data.teams.map((team, i) =>
      i === index ? { ...team, ...patch } : team,
    );
    onChange({ ...data, teams });
  }

  function addManualTeam() {
    const nextRank = data.teams.length + 1;
    onChange({
      ...data,
      teams: [
        ...data.teams,
        {
          name: `Takım ${nextRank}`,
          rank: nextRank,
          wins: 0,
          losses: 0,
          ties: 0,
          pickTradeNet: 0,
        },
      ],
    });
  }

  const accentClass =
    accent === "a"
      ? "border-orange-500/40 bg-orange-500/5"
      : "border-sky-500/40 bg-sky-500/5";

  return (
    <Card className={`${accentClass} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={accent === "a" ? "default" : "secondary"}>
            {accent === "a" ? "A Lig" : "B Lig"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border bg-background/80 p-4">
          <Label htmlFor={`${accent}-url`}>Yahoo Fantasy lig linki</Label>
          <Input
            id={`${accent}-url`}
            placeholder="https://basketball.fantasysports.yahoo.com/nba/123456"
            value={leagueUrl}
            onChange={(e) => setLeagueUrl(e.target.value)}
          />
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              Yahoo API token (isteğe bağlı)
            </summary>
            <p className="mt-2">
              Özel ligler için Yahoo OAuth access token gerekir. Token yoksa
              aşağıdan manuel giriş yapabilirsiniz.
            </p>
            <Input
              className="mt-2"
              type="password"
              placeholder="Access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </details>
          <Button
            onClick={fetchFromYahoo}
            disabled={!leagueUrl.trim() || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Çekiliyor..." : "Yahoo'dan veri çek"}
          </Button>
          {fetchError && (
            <Alert variant="destructive">
              <AlertTitle>Veri alınamadı</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          {needsAuth && (
            <Alert>
              <AlertTitle>Manuel giriş modu</AlertTitle>
              <AlertDescription>
                Yahoo bağlantısı olmadan kategori galibiyeti ve pick-trade
                puanlarını aşağıdaki tablodan girebilirsiniz.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {data.leagueName && (
          <p className="text-sm text-muted-foreground">
            Lig: <span className="font-medium text-foreground">{data.leagueName}</span>
            {data.leagueKey ? ` · ${data.leagueKey}` : null}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Takım</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">M</TableHead>
                <TableHead className="text-right">B</TableHead>
                <TableHead className="text-right">Kat. Puan</TableHead>
                <TableHead className="text-right">Pick ±</TableHead>
                <TableHead className="text-right font-semibold">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Henüz takım yok. Yahoo&apos;dan çekin veya manuel ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                enriched.map((team, index) => (
                  <TableRow key={`${team.name}-${index}`}>
                    <TableCell>
                      <Input
                        className="h-8 w-12 text-center"
                        type="number"
                        min={1}
                        value={team.rank}
                        onChange={(e) =>
                          updateTeam(index, { rank: Number(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 min-w-[140px]"
                        value={team.name}
                        onChange={(e) =>
                          updateTeam(index, { name: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-16 text-right"
                        type="number"
                        min={0}
                        value={team.wins}
                        onChange={(e) =>
                          updateTeam(index, { wins: Number(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-16 text-right"
                        type="number"
                        min={0}
                        value={team.losses}
                        onChange={(e) =>
                          updateTeam(index, { losses: Number(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-16 text-right"
                        type="number"
                        min={0}
                        value={team.ties}
                        onChange={(e) =>
                          updateTeam(index, { ties: Number(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {categoryPoints(team.wins, team.ties).toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-20 text-right"
                        type="number"
                        value={team.pickTradeNet}
                        onChange={(e) =>
                          updateTeam(index, {
                            pickTradeNet: Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {team.totalScore.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addManualTeam}>
            Takım ekle
          </Button>
        </div>

        <PickTradeEditor
          applyLabel={
            accent === "b"
              ? "1. sıradaki takıma uygula"
              : "Son sıradaki takıma uygula"
          }
          onApply={(net) => {
            const targetIndex =
              accent === "b"
                ? data.teams.findIndex((t) => t.rank === 1)
                : data.teams.reduce<number>((idx, team, i) => {
                    if (idx < 0) return i;
                    return team.rank > data.teams[idx].rank ? i : idx;
                  }, -1);

            if (targetIndex >= 0) {
              updateTeam(targetIndex, { pickTradeNet: net });
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
