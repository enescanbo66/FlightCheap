import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PICK_TRADE_VALUES = {
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

const ROUND_RE = /^Round\s+(\d{1,2})\s*$/i;
const TRADED_TO_ONLY_RE = /^(?:Vetoed Trade to|Traded to)\s*$/i;
const TRADED_TO_INLINE_RE =
  /^(?:Vetoed Trade to|Traded to)\s+(.+?)(?:\s*\(\s*\))?\s*$/i;
const DATE_RE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{1,2}:\d{2}\s*(am|pm)\s*$/i;
const SKIP_RE = /^(logo||)$/i;

function cleanTeamName(name) {
  return name.replace(/\s*\(\s*\)\s*$/, "").replace(/\s+/g, " ").trim();
}

function isPlayerLine(line) {
  if (!line.trim()) return false;
  if (ROUND_RE.test(line)) return false;
  if (TRADED_TO_ONLY_RE.test(line)) return false;
  if (TRADED_TO_INLINE_RE.test(line)) return false;
  if (DATE_RE.test(line)) return false;
  if (SKIP_RE.test(line)) return false;
  return /[A-Za-z]/.test(line);
}

function createTransaction() {
  return {
    status: "approved",
    date: "",
    assets: [],
    recipients: [],
    _datedSides: 0,
  };
}

export function parseYahooTradePaste(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !SKIP_RE.test(line));

  const transactions = [];
  let current = null;
  let pendingPicks = [];
  let lastRecipient = null;

  function finalizeTransaction() {
    if (current && current.assets.length > 0) {
      const { _datedSides, ...tx } = current;
      transactions.push(tx);
    }
    current = null;
    pendingPicks = [];
    lastRecipient = null;
  }

  let pendingTradeDirection = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const roundMatch = line.match(ROUND_RE);
    if (roundMatch) {
      if (!current) current = createTransaction();
      pendingPicks.push(Number(roundMatch[1]));
      continue;
    }

    if (TRADED_TO_ONLY_RE.test(line)) {
      if (!current) current = createTransaction();
      pendingTradeDirection = line;
      continue;
    }

    const tradedMatch = line.match(TRADED_TO_INLINE_RE);
    if (tradedMatch || pendingTradeDirection) {
      if (!current) current = createTransaction();

      let recipient;
      let directionLine;
      if (tradedMatch) {
        recipient = cleanTeamName(tradedMatch[1]);
        directionLine = line;
      } else {
        recipient = cleanTeamName(line);
        directionLine = pendingTradeDirection;
        pendingTradeDirection = null;
      }

      lastRecipient = recipient;
      if (!current.recipients.includes(recipient)) {
        current.recipients.push(recipient);
      }
      if (/^vetoed trade to/i.test(directionLine)) current.status = "vetoed";

      for (const pick of pendingPicks) {
        current.assets.push({ kind: "pick", pick, recipient });
      }
      pendingPicks = [];
      continue;
    }

    if (DATE_RE.test(line)) {
      if (!current) current = createTransaction();
      current.date = current.date || line;
      current._datedSides += 1;
      if (current._datedSides >= 2) finalizeTransaction();
      continue;
    }

    if (isPlayerLine(line)) {
      if (!current) current = createTransaction();
      current.assets.push({
        kind: "player",
        playerName: line,
        recipient: lastRecipient ?? "Unknown",
      });
      continue;
    }
  }

  finalizeTransaction();
  return transactions;
}

export function calculatePickTradeTotals(transactions) {
  const totals = new Map();

  for (const tx of transactions) {
    if (tx.status !== "approved") continue;

    const picks = tx.assets.filter((asset) => asset.kind === "pick");
    if (picks.length < 2) continue;

    const teams = [...new Set(picks.map((pick) => pick.recipient))];
    if (teams.length !== 2) continue;

    for (const pick of picks) {
      const value = PICK_TRADE_VALUES[pick.pick];
      if (!value) continue;

      totals.set(pick.recipient, (totals.get(pick.recipient) ?? 0) + value);
      const giver = teams.find((team) => team !== pick.recipient);
      if (giver) totals.set(giver, (totals.get(giver) ?? 0) - value);
    }
  }

  return totals;
}

function main() {
  const inputPath =
    process.argv[2] ?? resolve(process.cwd(), "scripts/parse-yahoo-trades.txt");
  const text = readFileSync(inputPath, "utf8");
  const transactions = parseYahooTradePaste(text);

  console.log(`Toplam işlem: ${transactions.length}`);
  console.log(
    `Onaylı: ${transactions.filter((tx) => tx.status === "approved").length}`,
  );
  console.log(
    `Veto: ${transactions.filter((tx) => tx.status === "vetoed").length}`,
  );

  const pickTrades = transactions.filter(
    (tx) =>
      tx.status === "approved" &&
      tx.assets.some((asset) => asset.kind === "pick"),
  );

  console.log(`\nPick içeren onaylı takas: ${pickTrades.length}`);
  for (const tx of pickTrades) {
    console.log(`\n[${tx.date}] ${tx.recipients.join(" ↔ ")}`);
    for (const asset of tx.assets) {
      if (asset.kind === "pick") {
        console.log(
          `  Round ${asset.pick} → ${asset.recipient} (${PICK_TRADE_VALUES[asset.pick]} puan)`,
        );
      }
    }
  }

  const totals = calculatePickTradeTotals(transactions);
  console.log("\n=== Net pick-trade puanları (sadece pick içeren onaylı takaslar) ===");
  if (totals.size === 0) {
    console.log("(Bu paste'te pick içeren onaylı takas yok veya parse edilemedi)");
  }
  [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, score]) => {
      console.log(`${team}: ${score > 0 ? "+" : ""}${score}`);
    });
}

main();
