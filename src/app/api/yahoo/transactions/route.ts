import { NextRequest, NextResponse } from "next/server";
import { parseYahooLeagueUrl } from "@/lib/yahoo";
import {
  analyzePickTrades,
  fetchLeagueTrades,
} from "@/lib/yahoo-transactions";
import { fetchLeagueStandings } from "@/lib/yahoo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueUrl, accessToken } = body as {
      leagueUrl?: string;
      accessToken?: string;
    };

    if (!leagueUrl?.trim()) {
      return NextResponse.json(
        { error: "Lig linki veya ID gerekli." },
        { status: 400 },
      );
    }

    const parsed = parseYahooLeagueUrl(leagueUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Geçersiz Yahoo Fantasy lig linki." },
        { status: 400 },
      );
    }

    const token =
      accessToken?.trim() ||
      process.env.YAHOO_ACCESS_TOKEN?.trim() ||
      request.cookies.get("yahoo_access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Yahoo transactions verisi için OAuth access token gerekli. Özel liglerde sayfa scraping mümkün değil.",
          needsAuth: true,
          parsed,
        },
        { status: 401 },
      );
    }

    const [{ leagueKey, trades }, standings] = await Promise.all([
      fetchLeagueTrades(token, parsed),
      fetchLeagueStandings(token, parsed.leagueId, parsed.gameKey),
    ]);

    const teams = standings.teams.map((team) => ({
      teamKey: team.teamKey,
      name: team.name,
    }));

    const analysis = analyzePickTrades(trades, teams);
    const tradesWithPickNotes = trades.filter(
      (trade) => trade.tradeNote.trim().length > 0,
    );
    const tradesWithoutNotes = trades.length - tradesWithPickNotes.length;

    return NextResponse.json({
      parsed,
      leagueKey,
      leagueName: standings.leagueName,
      totalTrades: trades.length,
      tradesWithNotes: tradesWithPickNotes.length,
      tradesWithoutNotes,
      perTeam: analysis.perTeam,
      tradeDetails: analysis.tradeDetails,
      teams: standings.teams.map((team) => {
        const pickSummary = analysis.perTeam.find(
          (row) => row.teamKey === team.teamKey,
        );
        return {
          ...team,
          pickTradeNet: pickSummary?.netPoints ?? 0,
        };
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
