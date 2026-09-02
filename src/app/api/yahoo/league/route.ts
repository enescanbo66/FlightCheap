import { NextRequest, NextResponse } from "next/server";
import { fetchLeagueStandings, parseYahooLeagueUrl } from "@/lib/yahoo";

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
          error: "Yahoo erişim tokeni bulunamadı.",
          needsAuth: true,
          parsed,
        },
        { status: 401 },
      );
    }

    const league = await fetchLeagueStandings(
      token,
      parsed.leagueId,
      parsed.gameKey,
    );

    return NextResponse.json({
      parsed,
      league,
      teams: league.teams.map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        rank: team.rank,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        pickTradeNet: 0,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
