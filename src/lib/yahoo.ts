export type ParsedYahooLeague = {
  leagueId: string;
  gameKey?: string;
  leagueKey?: string;
  rawUrl: string;
};

export type YahooTeamRaw = {
  teamKey: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
};

export type YahooLeagueResponse = {
  leagueKey: string;
  leagueName: string;
  teams: YahooTeamRaw[];
};

const LEAGUE_ID_PATTERNS = [
  /basketball\.fantasysports\.yahoo\.com\/nba\/(\d+)/i,
  /basketball\.fantasysports\.yahoo\.com\/f\d+\/(\d+)/i,
  /fantasysports\.yahoo\.com\/[^/]+\/(\d+)/i,
  /league[_-]?id[=:](\d+)/i,
  /(\d+)\.l\.(\d+)/i,
];

export function parseYahooLeagueUrl(input: string): ParsedYahooLeague | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const leagueKeyMatch = trimmed.match(/(\d+)\.l\.(\d+)/);
  if (leagueKeyMatch) {
    return {
      gameKey: leagueKeyMatch[1],
      leagueId: leagueKeyMatch[2],
      leagueKey: `${leagueKeyMatch[1]}.l.${leagueKeyMatch[2]}`,
      rawUrl: trimmed,
    };
  }

  for (const pattern of LEAGUE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return { leagueId: match[1], rawUrl: trimmed };
    }
  }

  if (/^\d+$/.test(trimmed)) {
    return { leagueId: trimmed, rawUrl: trimmed };
  }

  return null;
}

export function buildLeagueKey(gameKey: string, leagueId: string): string {
  return `${gameKey}.l.${leagueId}`;
}

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
      `Yahoo API hatası (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  return response.json();
}

export async function resolveNbaGameKey(accessToken: string): Promise<string> {
  const data = (await yahooFetch("games;game_codes=nba", accessToken)) as {
    fantasy_content?: {
      games?: Record<string, unknown>;
    };
  };

  const games = data.fantasy_content?.games;
  if (!games) throw new Error("NBA oyun anahtarı bulunamadı.");

  const keys = Object.keys(games).filter((k) => k !== "count");
  let latestKey = "";
  let latestSeason = 0;

  for (const key of keys) {
    const game = games[key] as {
      game?: Array<{ game_key?: string; season?: string; is_game_over?: number }>;
    };
    const meta = game?.game?.[0];
    if (!meta?.game_key) continue;
    const season = Number(meta.season ?? 0);
    const isActive = meta.is_game_over === 0;
    if (isActive || season >= latestSeason) {
      latestSeason = season;
      latestKey = meta.game_key;
    }
  }

  if (!latestKey) throw new Error("Aktif NBA sezonu bulunamadı.");
  return latestKey;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTeamsFromStandings(json: any): YahooTeamRaw[] {
  const teams: YahooTeamRaw[] = [];
  const league = json?.fantasy_content?.league;
  if (!league) return teams;

  const standingsBlock = Array.isArray(league) ? league[1] : league?.standings;
  const teamsNode =
    standingsBlock?.standings?.teams ??
    standingsBlock?.[0]?.standings?.teams ??
    standingsBlock?.teams;

  if (!teamsNode) return teams;

  const count = Number(teamsNode.count ?? 0);
  for (let i = 0; i < count; i++) {
    const wrapper = teamsNode[i.toString()]?.team;
    if (!wrapper) continue;

    const flat = wrapper.flat?.() ?? wrapper;
    const teamObj: Record<string, unknown> = {};
    for (const item of flat) {
      if (typeof item === "object" && item !== null) {
        Object.assign(teamObj, item);
      }
    }

    const standings = teamObj.team_standings as {
      rank?: string | number;
      outcome_totals?: { wins?: string; losses?: string; ties?: string };
    };

    teams.push({
      teamKey: String(teamObj.team_key ?? ""),
      name: String(teamObj.name ?? `Takım ${i + 1}`),
      rank: Number(standings?.rank ?? i + 1),
      wins: Number(standings?.outcome_totals?.wins ?? 0),
      losses: Number(standings?.outcome_totals?.losses ?? 0),
      ties: Number(standings?.outcome_totals?.ties ?? 0),
    });
  }

  return teams.sort((a, b) => a.rank - b.rank);
}

export async function fetchLeagueStandings(
  accessToken: string,
  leagueId: string,
  gameKey?: string,
): Promise<YahooLeagueResponse> {
  const resolvedGameKey = gameKey ?? (await resolveNbaGameKey(accessToken));
  const leagueKey = buildLeagueKey(resolvedGameKey, leagueId);

  const data = await yahooFetch(`league/${leagueKey}/standings`, accessToken);
  const teams = extractTeamsFromStandings(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagueMeta = (data as any)?.fantasy_content?.league?.[0];
  const leagueName = leagueMeta?.name ?? "Fantasy Lig";

  if (teams.length === 0) {
    throw new Error(
      "Takım verisi alınamadı. Lig özel olabilir veya erişim yetkisi gerekebilir.",
    );
  }

  return { leagueKey, leagueName, teams };
}
