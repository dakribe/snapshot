import { createServerFn } from "@tanstack/react-start";
import { isDay } from "../lib/dates";
import type { ScoreDay } from "../lib/hockey";
import type { LeagueId } from "../lib/leagues";
import { ADAPTERS } from "./leagues";

export type LeagueScores =
  | { league: LeagueId; ok: true; day: ScoreDay }
  | { league: LeagueId; ok: false; message: string };

export type ScoresPage = {
  /** the game day shown */
  date: string;
  /** surrounding days with game counts summed across leagues */
  days: { date: string; games: number }[];
  leagues: LeagueScores[];
};

async function fetchLeague(league: LeagueId, date?: string): Promise<LeagueScores> {
  try {
    const day = await ADAPTERS[league]!.scoreDay(date);
    const games = day.games.toSorted((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
    return { league, ok: true, day: { ...day, games } };
  } catch (err) {
    console.error(`[scores] ${league}`, err);
    return { league, ok: false, message: `Couldn't load ${league.toUpperCase()} games right now.` };
  }
}

export async function loadScores(date: string | null): Promise<ScoresPage> {
  const leagues = Object.keys(ADAPTERS) as LeagueId[];
  let results = await Promise.all(leagues.map((l) => fetchLeague(l, date ?? undefined)));

  // No date asked for: each league reports its own next game day. Show the
  // earliest, and refetch any league that answered for a later day.
  let shown = date;
  if (!shown) {
    const dates = results.flatMap((r) => (r.ok ? [r.day.date] : []));
    shown = dates.toSorted()[0] ?? new Date().toISOString().slice(0, 10);
    results = await Promise.all(
      results.map((r) => (r.ok && r.day.date !== shown ? fetchLeague(r.league, shown!) : r)),
    );
  }

  const counts = new Map<string, number>();
  for (const r of results) {
    if (!r.ok) continue;
    for (const d of r.day.days) counts.set(d.date, (counts.get(d.date) ?? 0) + d.games);
  }

  return {
    date: shown,
    days: [...counts].map(([d, games]) => ({ date: d, games })).toSorted((a, b) => a.date.localeCompare(b.date)),
    leagues: results,
  };
}

export const getScores = createServerFn({ method: "GET" })
  .validator((input: { date?: string | null } | undefined) => ({ date: isDay(input?.date) ? input.date : null }))
  .handler(({ data }) => loadScores(data.date));
