/** Pick-trade puan tablosu (Kural Kitabı Tablo 4) */
export const PICK_TRADE_VALUES: Record<number, number> = {
  5: 45,
  6: 37,
  7: 30,
  8: 25,
  9: 20,
  10: 17,
  11: 14,
  12: 11,
  13: 9,
  14: 8,
  15: 6,
  16: 5,
};

export const TRADABLE_PICKS = Object.keys(PICK_TRADE_VALUES).map(Number);

export type PickTradeEntry = {
  pick: number;
  direction: "given" | "received";
};

export type TeamStanding = {
  teamKey?: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pickTradeNet: number;
};

export type LeagueData = {
  leagueKey: string;
  leagueName?: string;
  teams: TeamStanding[];
};

export function categoryPoints(wins: number, ties: number): number {
  return wins + ties * 0.5;
}

export function computePickTradeNet(entries: PickTradeEntry[]): number {
  return entries.reduce((sum, entry) => {
    const value = PICK_TRADE_VALUES[entry.pick] ?? 0;
    return entry.direction === "received" ? sum + value : sum - value;
  }, 0);
}

export function teamTotalScore(team: TeamStanding): number {
  return categoryPoints(team.wins, team.ties) + team.pickTradeNet;
}

export type PromotionVerdict = {
  bChampion: TeamStanding & { categoryScore: number; totalScore: number };
  aLastPlace: TeamStanding & { categoryScore: number; totalScore: number };
  margin: number;
  promoted: boolean;
};

export function evaluatePromotion(
  bLeague: LeagueData,
  aLeague: LeagueData,
): PromotionVerdict | null {
  const bChampion = bLeague.teams.find((t) => t.rank === 1);
  const aLast = aLeague.teams.reduce<TeamStanding | null>((worst, team) => {
    if (!worst || team.rank > worst.rank) return team;
    return worst;
  }, null);

  if (!bChampion || !aLast) return null;

  const bCategory = categoryPoints(bChampion.wins, bChampion.ties);
  const aCategory = categoryPoints(aLast.wins, aLast.ties);
  const bTotal = bCategory + bChampion.pickTradeNet;
  const aTotal = aCategory + aLast.pickTradeNet;

  return {
    bChampion: { ...bChampion, categoryScore: bCategory, totalScore: bTotal },
    aLastPlace: { ...aLast, categoryScore: aCategory, totalScore: aTotal },
    margin: bTotal - aTotal,
    promoted: bTotal > aTotal,
  };
}

export function enrichTeams(teams: TeamStanding[]): Array<
  TeamStanding & { categoryScore: number; totalScore: number }
> {
  return teams
    .map((team) => ({
      ...team,
      categoryScore: categoryPoints(team.wins, team.ties),
      totalScore: teamTotalScore(team),
    }))
    .sort((a, b) => a.rank - b.rank);
}
