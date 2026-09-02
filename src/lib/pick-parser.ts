import {
  computePickTradeNet,
  PICK_TRADE_VALUES,
  type PickTradeEntry,
} from "@/lib/promotion";

export type TeamRef = {
  teamKey: string;
  name: string;
};

export type ParsedTradePick = {
  pick: number;
  direction: "given" | "received";
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type TradePickParseResult = {
  teamKey: string;
  teamName: string;
  entries: ParsedTradePick[];
  netPoints: number;
};

export type TradePickAssignment = {
  transactionKey: string;
  timestamp: number;
  tradeNote: string;
  traderTeamKey?: string;
  tradeeTeamKey?: string;
  traderTeamName?: string;
  tradeeTeamName?: string;
  assignments: TradePickParseResult[];
  unresolvedPicks: number[];
  warnings: string[];
};

const TRADABLE_MIN = 5;
const TRADABLE_MAX = 16;

const GIVEN_KEYWORDS =
  /\b(ver(?:iyor|ir|ecek|di|ildi)?|gönder(?:iyor|ir|di)?|gider|gitti|giden|devred(?:iyor|er|ildi)?|gives?|gave|sent|sends?|outgoing|away)\b/i;
const RECEIVED_KEYWORDS =
  /\b(al(?:ıyor|ir|acak|dı|ındı)?|gel(?:iyor|ir|di)?|gelen|kazan(?:dı|ır)?|receives?|received|gets?|got|incoming|in)\b/i;

const PICK_NUMBER_PATTERNS: RegExp[] = [
  /(\d{1,2})\s*[\.\)]\s*s[ıi]ra/gi,
  /(?:pick|round|rd|r)\s*[#.\-:]?\s*(\d{1,2})/gi,
  /(\d{1,2})(?:st|nd|rd|th)\s*(?:round|pick)/gi,
  /round\s*(\d{1,2})/gi,
  /(?:^|[\s,;|])(\d{1,2})(?:[\s,;|]|$)/gi,
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function isTradablePick(pick: number): boolean {
  return pick >= TRADABLE_MIN && pick <= TRADABLE_MAX;
}

function findTeamInText(
  text: string,
  teams: TeamRef[],
): TeamRef | undefined {
  const normalized = normalizeText(text);
  return teams
    .filter((team) => normalized.includes(normalizeText(team.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

export function extractPickNumbers(note: string): number[] {
  const found = new Set<number>();

  for (const pattern of PICK_NUMBER_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(note)) !== null) {
      const pick = Number(match[1]);
      if (isTradablePick(pick)) found.add(pick);
    }
  }

  return [...found].sort((a, b) => a - b);
}

function inferDirection(segment: string): "given" | "received" | null {
  const hasGiven = GIVEN_KEYWORDS.test(segment);
  const hasReceived = RECEIVED_KEYWORDS.test(segment);
  GIVEN_KEYWORDS.lastIndex = 0;
  RECEIVED_KEYWORDS.lastIndex = 0;

  if (hasGiven && !hasReceived) return "given";
  if (hasReceived && !hasGiven) return "received";
  return null;
}

function parseSegment(
  segment: string,
  teams: TeamRef[],
): Array<{ team: TeamRef; pick: number; direction: "given" | "received"; confidence: ParsedTradePick["confidence"]; reason: string }> {
  const picks = extractPickNumbers(segment);
  if (picks.length === 0) return [];

  const direction = inferDirection(segment);
  const team = findTeamInText(segment, teams);

  if (team && direction) {
    return picks.map((pick) => ({
      team,
      pick,
      direction,
      confidence: "high",
      reason: `Takım adı ve yön anahtar kelimesi eşleşti: "${segment.trim()}"`,
    }));
  }

  if (team && !direction && picks.length === 1) {
    return [
      {
        team,
        pick: picks[0],
        direction: "given",
        confidence: "low",
        reason: `Takım bulundu ancak yön belirsiz; varsayılan olarak verildi sayıldı.`,
      },
    ];
  }

  return [];
}

export function parseTradeNoteForPicks(
  note: string,
  teams: TeamRef[],
  trader?: TeamRef,
  tradee?: TeamRef,
): {
  assignments: Map<string, ParsedTradePick[]>;
  unresolvedPicks: number[];
  warnings: string[];
} {
  const assignments = new Map<string, ParsedTradePick[]>();
  const warnings: string[] = [];
  const trimmed = note.trim();

  if (!trimmed) {
    return { assignments, unresolvedPicks: [], warnings };
  }

  const allPicks = extractPickNumbers(trimmed);
  if (allPicks.length === 0) {
    return { assignments, unresolvedPicks: [], warnings };
  }

  const segments = trimmed
    .split(/[\n;|]+/)
    .flatMap((part) => part.split(/,(?![^()]*\))/))
    .map((part) => part.trim())
    .filter(Boolean);

  const resolved = new Set<string>();

  for (const segment of segments) {
    for (const parsed of parseSegment(segment, teams)) {
      const key = `${parsed.team.teamKey}:${parsed.pick}:${parsed.direction}`;
      if (resolved.has(key)) continue;
      resolved.add(key);

      const list = assignments.get(parsed.team.teamKey) ?? [];
      list.push({
        pick: parsed.pick,
        direction: parsed.direction,
        confidence: parsed.confidence,
        reason: parsed.reason,
      });
      assignments.set(parsed.team.teamKey, list);
    }
  }

  const assignedPicks = new Set(
    [...assignments.values()].flat().map((entry) => entry.pick),
  );
  const unresolvedPicks = allPicks.filter((pick) => !assignedPicks.has(pick));

  if (unresolvedPicks.length > 0 && trader && tradee) {
    if (unresolvedPicks.length === 2) {
      const [firstPick, secondPick] = unresolvedPicks;
      const add = (team: TeamRef, pick: number, direction: "given" | "received") => {
        const list = assignments.get(team.teamKey) ?? [];
        list.push({
          pick,
          direction,
          confidence: "medium",
          reason:
            "İki pick bulundu; çapraz takas varsayımı (ilk pick trader verir, ikinci pick tradee verir).",
        });
        assignments.set(team.teamKey, list);
      };
      add(trader, firstPick, "given");
      add(tradee, secondPick, "given");
      unresolvedPicks.length = 0;
      warnings.push(
        "Trade notunda yön belirsiz iki pick bulundu; çapraz takas varsayıldı.",
      );
    } else if (unresolvedPicks.length === 1) {
      const pick = unresolvedPicks[0];
      const list = assignments.get(trader.teamKey) ?? [];
      list.push({
        pick,
        direction: "given",
        confidence: "low",
        reason:
          "Tek pick bulundu; trader takımın verdiği pick olarak varsayıldı.",
      });
      assignments.set(trader.teamKey, list);
      unresolvedPicks.length = 0;
      warnings.push(
        "Trade notunda tek pick bulundu; trader takım veren olarak işaretlendi.",
      );
    }
  }

  return { assignments, unresolvedPicks, warnings };
}

export function aggregateTeamPickNet(
  teamKey: string,
  allAssignments: Iterable<PickTradeEntry>,
): number {
  return computePickTradeNet([...allAssignments]);
}

export function assignmentsToEntries(
  picks: ParsedTradePick[],
): PickTradeEntry[] {
  return picks.map((pick) => ({
    pick: pick.pick,
    direction: pick.direction,
  }));
}

export function formatPickSummary(entries: ParsedTradePick[]): string {
  if (entries.length === 0) return "Pick yok";
  return entries
    .map((entry) => {
      const value = PICK_TRADE_VALUES[entry.pick];
      const sign = entry.direction === "given" ? "−" : "+";
      return `${entry.pick}. sıra (${sign}${value})`;
    })
    .join(", ");
}
