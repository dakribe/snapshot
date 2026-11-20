import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { Game, ScoreDay } from "../lib/hockey";
import type { LeagueId } from "../lib/leagues";
import { ADAPTERS } from "./leagues";
import { loadScores } from "./scores";

const saved = { ...ADAPTERS };
const clearAdapters = () => {
  for (const k of Object.keys(ADAPTERS) as LeagueId[]) delete ADAPTERS[k];
};
// Each test registers only the fake leagues it needs.
beforeEach(clearAdapters);
afterEach(() => {
  clearAdapters();
  Object.assign(ADAPTERS, saved);
});

const game = (id: string, startTime: string): Game =>
  ({ id, startTime, status: "scheduled" }) as Game;

/** A fake league whose "next game day" is `next` and whose schedule is `byDate`. */
function fakeLeague(league: LeagueId, next: string, byDate: Record<string, Game[]>) {
  const calls: (string | undefined)[] = [];
  ADAPTERS[league] = {
    scoreDay: async (date?: string): Promise<ScoreDay> => {
      calls.push(date);
      const d = date ?? next;
      return {
        league,
        date: d,
        prevDate: null,
        nextDate: null,
        days: Object.entries(byDate).map(([day, games]) => ({ date: day, games: games.length })),
        games: byDate[d] ?? [],
        fetchedAt: 0,
      };
    },
  };
  return calls;
}

describe("loadScores", () => {
  test("an explicit date is passed straight through", async () => {
    const calls = fakeLeague("nhl", "2026-11-21", { "2026-11-19": [game("nhl:1", "2026-11-20T00:00:00Z")] });
    const page = await loadScores("2026-11-19");
    expect(page.date).toBe("2026-11-19");
    expect(calls).toEqual(["2026-11-19"]);
  });

  test("no date: shows the earliest next game day and refetches leagues that were later", async () => {
    const nhl = fakeLeague("nhl", "2026-11-21", { "2026-11-21": [game("nhl:1", "2026-11-21T18:00:00Z")] });
    const pwhl = fakeLeague("pwhl", "2026-11-22", {
      "2026-11-21": [game("pwhl:9", "2026-11-21T19:00:00Z")],
      "2026-11-22": [],
    });
    const page = await loadScores(null);
    expect(page.date).toBe("2026-11-21");
    expect(nhl).toEqual([undefined]);
    expect(pwhl).toEqual([undefined, "2026-11-21"]);
    const p = page.leagues.find((l) => l.league === "pwhl");
    expect(p?.ok && p.day.games.map((g) => g.id)).toEqual(["pwhl:9"]);
  });

  test("games are ordered by start time", async () => {
    fakeLeague("nhl", "2026-11-21", {
      "2026-11-21": [game("nhl:b", "2026-11-22T03:00:00Z"), game("nhl:a", "2026-11-21T18:00:00Z"), game("nhl:c", "2026-11-22T00:00:00Z")],
    });
    const page = await loadScores("2026-11-21");
    const nhl = page.leagues[0];
    expect(nhl.ok && nhl.day.games.map((g) => g.id)).toEqual(["nhl:a", "nhl:c", "nhl:b"]);
  });

  test("one league failing doesn't take down the others", async () => {
    const quiet = spyOn(console, "error").mockImplementation(() => {});
    fakeLeague("nhl", "2026-11-21", { "2026-11-21": [game("nhl:1", "2026-11-21T18:00:00Z")] });
    ADAPTERS.ahl = { scoreDay: () => Promise.reject(new Error("boom")) };
    const page = await loadScores("2026-11-21");
    expect(page.leagues.find((l) => l.league === "nhl")?.ok).toBe(true);
    expect(page.leagues.find((l) => l.league === "ahl")).toEqual({
      league: "ahl",
      ok: false,
      message: "Couldn't load AHL games right now.",
    });
    quiet.mockRestore();
  });

  test("the date strip sums game counts across leagues", async () => {
    const g = game("x", "2026-11-21T18:00:00Z");
    fakeLeague("nhl", "2026-11-21", { "2026-11-21": [g, g], "2026-11-22": [g] });
    fakeLeague("pwhl", "2026-11-21", { "2026-11-21": [g] });
    const page = await loadScores("2026-11-21");
    expect(page.days).toEqual([
      { date: "2026-11-21", games: 3 },
      { date: "2026-11-22", games: 1 },
    ]);
  });
});
