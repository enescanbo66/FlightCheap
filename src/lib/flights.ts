import { spawn } from "node:child_process";
import path from "node:path";

import type { FlightSearchParams, FlightSearchResponse, FlightOffer } from "@/lib/types";

const SCRIPT = path.join(process.cwd(), "scripts", "search_flights.py");

function runPython(args: string[], timeoutMs = 180_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [SCRIPT, ...args], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Flight search timed out"));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `search_flights.py exited with ${code}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/** Search one or many destination codes in a single Python process. */
export async function searchFlightsExpanded(
  params: FlightSearchParams & { destinations: string[] }
): Promise<FlightSearchResponse> {
  const destinations = params.destinations
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);

  if (!destinations.length) {
    return { ok: false, count: 0, flights: [], error: "No destinations to search" };
  }

  const args = [
    "--from",
    params.from,
    "--to",
    destinations.join(","),
    "--date-from",
    params.dateFrom,
    "--date-to",
    params.dateTo,
    "--trip",
    params.trip ?? "one-way",
    "--seat",
    params.seat ?? "economy",
    "--currency",
    params.currency ?? "USD",
    "--limit",
    String(params.limit ?? 80),
    "--workers",
    destinations.length > 1 ? "8" : "6",
  ];

  if (params.returnFrom) args.push("--return-from", params.returnFrom);
  if (params.returnTo) args.push("--return-to", params.returnTo);
  if (params.maxStops != null) args.push("--max-stops", String(params.maxStops));
  if (params.maxPrice != null) args.push("--max-price", String(params.maxPrice));
  if (params.airlines?.length) args.push("--airlines", params.airlines.join(","));

  try {
    const raw = await runPython(args);
    const parsed = JSON.parse(raw) as FlightSearchResponse & { flights?: FlightOffer[] };
    return {
      ok: true,
      count: parsed.count ?? parsed.flights?.length ?? 0,
      queriedDays: parsed.queriedDays,
      errors: parsed.errors,
      flights: parsed.flights ?? [],
      warning: parsed.warning,
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      flights: [],
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}
