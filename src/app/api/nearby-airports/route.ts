import { NextResponse } from "next/server";

import {
  findNearbyAirports,
  supportsNearbyAirports,
} from "@/lib/airports-geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const kind = searchParams.get("kind") ?? undefined;
  const radiusRaw = searchParams.get("radiusKm");
  const radiusKm = radiusRaw ? Number(radiusRaw) : 250;

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "code is required", airports: [] },
      { status: 400 }
    );
  }

  if (!supportsNearbyAirports(kind) && kind) {
    return NextResponse.json({
      ok: true,
      airports: [],
      supported: false,
    });
  }

  const airports = await findNearbyAirports(
    code,
    kind,
    Number.isFinite(radiusKm) ? radiusKm : 250
  );

  return NextResponse.json({
    ok: true,
    supported: true,
    radiusKm: Number.isFinite(radiusKm) ? radiusKm : 250,
    airports,
  });
}
