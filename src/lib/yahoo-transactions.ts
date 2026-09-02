import {
  assignmentsToEntries,
  parseTradeNoteForPicks,
  type TeamRef,
  type TradePickAssignment,
} from "@/lib/pick-parser";
import { computePickTradeNet } from "@/lib/promotion";
import {
  buildLeagueKey,
  parseYahooLeagueUrl,
  resolveNbaGameKey,
  type ParsedYahooLeague,
} from "@/lib/yahoo";

export type YahooTrade = {
  transactionKey: string;
  type: string;
  status: string;
  timestamp: number;
  tradeNote: string;
  traderTeamKey?: string;
  tradeeTeamKey?: string;
  traderTeamName?: string;
  tradeeTeamName?: string;
};

export type TeamPickTradeSummary = {
  teamKey: string;
  teamName: string;
  netPoints: number;
  trades: Array<{
    transactionKey: string;
    timestamp: number;
    tradeNote: string;
    picks: string;
    net: number;
    warnings: string[];
    unresolvedPicks: number[];
  }>;
};

async function yahooFetch(path: string, accessToken: string): Promise<unknown> {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/${path}?format=json`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Yahoo API hatası (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenYahooArray(node: any): Record<string, unknown> {
  if (!node) return {};
  if (Array.isArray(node)) {
    return node.reduce<Record<string, unknown>>((acc, item) => {
      if (typeof item === "object" && item !== null) {
        return { ...acc, ...flattenYahooArray(item) };
      }
      return acc;
    }, {});
  }
  if (typeof node === "object") return node as Record<string, unknown>;
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTradesFromResponse(json: any): YahooTrade[] {
  const trades: YahooTrade[] = [];
  const league = json?.fantasy_content?.league;
  const transactionsBlock = Array.isArray(league) ? league[1] : league;
  const transactionsNode =
    transactionsBlock?.transactions ??
    transactionsBlock?.[0]?.transactions ??
    transactionsBlock;

  if (!transactionsNode) return trades;

  const count = Number(transactionsNode.count ?? 0);
  for (let i = 0; i < count; i++) {
    const transactionWrapper = transactionsNode[i.toString()]?.transaction;
    if (!transactionWrapper) continue;

    const tx = flattenYahooArray(transactionWrapper);
    const type = String(tx.type ?? "");
    const status = String(tx.status ?? "");

    if (!type.includes("trade")) continue;
    if (status && status !== "successful") continue;

    const playersNode = transactionWrapper?.[1]?.players ?? tx.players;
    let traderTeamKey = String(tx.trader_team_key ?? "");
    let tradeeTeamKey = String(tx.tradee_team_key ?? "");
    let traderTeamName = String(tx.trader_team_name ?? "");
    let tradeeTeamName = String(tx.tradee_team_name ?? "");

    if (playersNode?.count) {
      const playerCount = Number(playersNode.count);
      const teamKeys = new Set<string>();
      const teamNames = new Map<string, string>();

      for (let p = 0; p < playerCount; p++) {
        const playerWrapper = playersNode[p.toString()]?.player;
        const player = flattenYahooArray(playerWrapper);
        const txData = flattenYahooArray(player.transaction_data);
        const sourceKey = String(txData.source_team_key ?? "");
        const destKey = String(txData.destination_team_key ?? "");
        const sourceName = String(txData.source_team_name ?? "");
        const destName = String(txData.destination_team_name ?? "");
        if (sourceKey) {
          teamKeys.add(sourceKey);
          if (sourceName) teamNames.set(sourceKey, sourceName);
        }
        if (destKey) {
          teamKeys.add(destKey);
          if (destName) teamNames.set(destKey, destName);
        }
      }

      const keys = [...teamKeys];
      if (!traderTeamKey && keys[0]) traderTeamKey = keys[0];
      if (!tradeeTeamKey && keys[1]) tradeeTeamKey = keys[1];
      if (!traderTeamName && traderTeamKey)
        traderTeamName = teamNames.get(traderTeamKey) ?? "";
      if (!tradeeTeamName && tradeeTeamKey)
        tradeeTeamName = teamNames.get(tradeeTeamKey) ?? "";
    }

    trades.push({
      transactionKey: String(tx.transaction_key ?? `trade-${i}`),
      type,
      status,
      timestamp: Number(tx.timestamp ?? 0),
      tradeNote: String(tx.trade_note ?? ""),
      traderTeamKey: traderTeamKey || undefined,
      tradeeTeamKey: tradeeTeamKey || undefined,
      traderTeamName: traderTeamName || undefined,
      tradeeTeamName: tradeeTeamName || undefined,
    });
  }

  return trades.sort((a, b) => a.timestamp - b.timestamp);
}

export async function resolveGameKeyForLeague(
  accessToken: string,
  parsed: ParsedYahooLeague,
): Promise<string> {
  if (parsed.gameKey) return parsed.gameKey;

  const seasonMatch = parsed.rawUrl.match(
    /basketball\.fantasysports\.yahoo\.com\/(\d{4})\/nba\//i,
  );
  const seasonYear = seasonMatch ? Number(seasonMatch[1]) : null;

  const data = (await yahooFetch("games;game_codes=nba", accessToken)) as {
    fantasy_content?: { games?: Record<string, unknown> };
  };
  const games = data.fantasy_content?.games;
  if (!games) throw new Error("NBA oyun listesi alınamadı.");

  const candidates: Array<{ gameKey: string; season: number }> = [];
  for (const key of Object.keys(games).filter((k) => k !== "count")) {
    const game = games[key] as {
      game?: Array<{ game_key?: string; season?: string }>;
    };
    const meta = game?.game?.[0];
    if (meta?.game_key) {
      candidates.push({
        gameKey: meta.game_key,
        season: Number(meta.season ?? 0),
      });
    }
  }

  if (seasonYear) {
    const exact = candidates.find((c) => c.season === seasonYear);
    if (exact) return exact.gameKey;
    const close = candidates.find((c) => c.season === seasonYear - 1);
    if (close) return close.gameKey;
  }

  return resolveNbaGameKey(accessToken);
}

export async function fetchLeagueTrades(
  accessToken: string,
  parsed: ParsedYahooLeague,
): Promise<{ leagueKey: string; trades: YahooTrade[] }> {
  const gameKey = await resolveGameKeyForLeague(accessToken, parsed);
  const leagueKey = buildLeagueKey(gameKey, parsed.leagueId);
  const data = await yahooFetch(
    `league/${leagueKey}/transactions;types=trade`,
    accessToken,
  );
  return {
    leagueKey,
    trades: extractTradesFromResponse(data),
  };
}

export function analyzePickTrades(
  trades: YahooTrade[],
  teams: TeamRef[],
): {
  perTeam: TeamPickTradeSummary[];
  tradeDetails: TradePickAssignment[];
} {
  const perTeamMap = new Map<string, TeamPickTradeSummary>();
  const tradeDetails: TradePickAssignment[] = [];

  for (const team of teams) {
    perTeamMap.set(team.teamKey, {
      teamKey: team.teamKey,
      teamName: team.name,
      netPoints: 0,
      trades: [],
    });
  }

  for (const trade of trades) {
    const trader = teams.find((t) => t.teamKey === trade.traderTeamKey);
    const tradee = teams.find((t) => t.teamKey === trade.tradeeTeamKey);
    const { assignments, unresolvedPicks, warnings } = parseTradeNoteForPicks(
      trade.tradeNote,
      teams,
      trader,
      tradee,
    );

    const assignmentRows: TradePickAssignment["assignments"] = [];

    for (const [teamKey, picks] of assignments.entries()) {
      const team = teams.find((t) => t.teamKey === teamKey);
      if (!team) continue;
      const entries = assignmentsToEntries(picks);
      const net = computePickTradeNet(entries);
      assignmentRows.push({
        teamKey,
        teamName: team.name,
        entries: picks,
        netPoints: net,
      });

      const summary = perTeamMap.get(teamKey);
      if (summary) {
        summary.netPoints += net;
        summary.trades.push({
          transactionKey: trade.transactionKey,
          timestamp: trade.timestamp,
          tradeNote: trade.tradeNote,
          picks: picks
            .map(
              (p) =>
                `${p.pick}. sıra ${p.direction === "given" ? "−" : "+"} (${p.confidence})`,
            )
            .join(", "),
          net,
          warnings,
          unresolvedPicks,
        });
      }
    }

    if (assignmentRows.length > 0 || unresolvedPicks.length > 0 || trade.tradeNote) {
      tradeDetails.push({
        transactionKey: trade.transactionKey,
        timestamp: trade.timestamp,
        tradeNote: trade.tradeNote,
        traderTeamKey: trade.traderTeamKey,
        tradeeTeamKey: trade.tradeeTeamKey,
        traderTeamName: trade.traderTeamName,
        tradeeTeamName: trade.tradeeTeamName,
        assignments: assignmentRows,
        unresolvedPicks,
        warnings,
      });
    }
  }

  return {
    perTeam: [...perTeamMap.values()].sort((a, b) =>
      a.teamName.localeCompare(b.teamName, "tr"),
    ),
    tradeDetails: tradeDetails.sort((a, b) => a.timestamp - b.timestamp),
  };
}

export function parseLeagueInput(leagueUrl: string): ParsedYahooLeague | null {
  return parseYahooLeagueUrl(leagueUrl);
}
