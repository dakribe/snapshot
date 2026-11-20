import { describe, expect, test } from "bun:test";
import { toGame, toPeriod, toScoreDay, toSituation, toStatus } from "./adapter";
import type { RawScoreGame } from "./raw";

/** A minimal NHL score-endpoint game; each test overrides what it cares about. */
function rawGame(over: Partial<RawScoreGame> = {}): RawScoreGame {
  return {
    id: 2026020347,
    gameType: 2,
    startTimeUTC: "2026-11-20T00:00:00Z",
    venue: { default: "Scotiabank Arena" },
    gameState: "FUT",
    gameScheduleState: "OK",
    awayTeam: { id: 26, name: { default: "Kings" }, abbrev: "LAK", logo: "https://assets.nhle.com/logos/nhl/svg/LAK_light.svg", record: "10-5-2" },
    homeTeam: { id: 10, name: { default: "Maple Leafs" }, abbrev: "TOR", logo: "https://assets.nhle.com/logos/nhl/svg/TOR_light.svg", record: "8-9-3" },
    ...over,
  };
}

const live = (over: Partial<RawScoreGame> = {}) =>
  rawGame({
    gameState: "LIVE",
    awayTeam: { ...rawGame().awayTeam, score: 2, sog: 18 },
    homeTeam: { ...rawGame().homeTeam, score: 1, sog: 15 },
    periodDescriptor: { number: 2, periodType: "REG", maxRegulationPeriods: 3 },
    clock: { timeRemaining: "12:41", secondsRemaining: 761, running: true, inIntermission: false },
    situation: { situationCode: "1551" },
    ...over,
  });

describe("toStatus", () => {
  test.each([
    ["FUT", "OK", "scheduled"],
    ["PRE", "OK", "scheduled"],
    ["LIVE", "OK", "live"],
    ["CRIT", "OK", "live"],
    ["OFF", "OK", "final"],
    ["FINAL", "OK", "final"],
    ["FUT", "PPD", "postponed"],
    ["FUT", "CNCL", "cancelled"],
  ] as const)("%s / %s → %s", (state, schedule, expected) => {
    expect(toStatus(state, schedule)).toBe(expected);
  });
});

describe("toPeriod", () => {
  test("regulation periods", () => {
    expect(toPeriod({ number: 1, periodType: "REG" }).label).toBe("1st");
    expect(toPeriod({ number: 3, periodType: "REG" }).label).toBe("3rd");
  });
  test("first overtime is OT", () => {
    expect(toPeriod({ number: 4, periodType: "OT", maxRegulationPeriods: 3 })).toEqual({ number: 4, kind: "overtime", label: "OT" });
  });
  test("playoff multi-overtime counts up", () => {
    expect(toPeriod({ number: 5, periodType: "OT", maxRegulationPeriods: 3 }).label).toBe("2OT");
    expect(toPeriod({ number: 7, periodType: "OT", maxRegulationPeriods: 3 }).label).toBe("4OT");
  });
  test("shootout", () => {
    expect(toPeriod({ number: 5, periodType: "SO" })).toEqual({ number: 5, kind: "shootout", label: "SO" });
  });
});

describe("toSituation", () => {
  test("even strength", () => {
    expect(toSituation("1551")).toEqual({ powerPlay: null, strength: "5v5", emptyNet: [] });
  });
  test("home power play", () => {
    expect(toSituation("1451")).toEqual({ powerPlay: "home", strength: "5v4", emptyNet: [] });
  });
  test("away 5-on-3", () => {
    expect(toSituation("1531")).toEqual({ powerPlay: "away", strength: "5v3", emptyNet: [] });
  });
  test("pulled goalie is an extra attacker, not a power play", () => {
    // home goalie out, 6 home skaters vs 5: still 5 real skaters each side
    expect(toSituation("1560")).toEqual({ powerPlay: null, strength: "5v5", emptyNet: ["home"] });
  });
  test("missing or malformed code", () => {
    expect(toSituation(undefined)).toBeNull();
    expect(toSituation("15")).toBeNull();
  });
});

describe("toGame", () => {
  test("scheduled game: league-scoped id, no score, record kept", () => {
    const g = toGame(rawGame());
    expect(g.id).toBe("nhl:2026020347");
    expect(g.nativeId).toBe("2026020347");
    expect(g.status).toBe("scheduled");
    expect(g.away.score).toBeNull();
    expect(g.away.record).toBe("10-5-2");
    expect(g.clock).toBeNull();
  });

  test("logos come in light and dark", () => {
    expect(toGame(rawGame()).home.logo).toEqual({
      light: "https://assets.nhle.com/logos/nhl/svg/TOR_light.svg",
      dark: "https://assets.nhle.com/logos/nhl/svg/TOR_dark.svg",
    });
  });

  test("live game: score, shots, running clock, situation", () => {
    const g = toGame(live());
    expect(g.status).toBe("live");
    expect([g.away.score, g.home.score]).toEqual([2, 1]);
    expect([g.away.shots, g.home.shots]).toEqual([18, 15]);
    expect(g.clock).toEqual({
      period: { number: 2, kind: "regulation", label: "2nd" },
      secondsRemaining: 761,
      running: true,
      intermission: false,
    });
    expect(g.situation?.strength).toBe("5v5");
  });

  test("intermission: clock counts the break, not the period", () => {
    const g = toGame(live({ clock: { timeRemaining: "14:52", secondsRemaining: 892, running: true, inIntermission: true } }));
    expect(g.clock?.intermission).toBe(true);
    expect(g.clock?.secondsRemaining).toBe(892);
  });

  test("live game with a 0-0 score reports 0, not null", () => {
    const g = toGame(live({ awayTeam: rawGame().awayTeam, homeTeam: rawGame().homeTeam }));
    expect([g.away.score, g.home.score]).toEqual([0, 0]);
  });

  test.each([
    ["REG", "regulation"],
    ["OT", "overtime"],
    ["SO", "shootout"],
  ] as const)("final ending in %s", (last, kind) => {
    const g = toGame(rawGame({ gameState: "OFF", gameOutcome: { lastPeriodType: last } }));
    expect(g.status).toBe("final");
    expect(g.endedIn).toBe(kind);
    expect(g.clock).toBeNull();
    expect(g.situation).toBeNull();
  });

  test("postponed game", () => {
    expect(toGame(rawGame({ gameScheduleState: "PPD" })).status).toBe("postponed");
  });

  test("only national broadcasts, deduplicated and trimmed", () => {
    const g = toGame(
      rawGame({
        tvBroadcasts: [
          { network: "SN", market: "N", countryCode: "CA" },
          { network: "SN ", market: "N", countryCode: "CA" },
          { network: "TNT", market: "N", countryCode: "US" },
          { network: "FDSNW", market: "H", countryCode: "US" },
        ],
      }),
    );
    expect(g.broadcasts).toEqual(["SN", "TNT"]);
  });
});

describe("toScoreDay", () => {
  test("maps the day, its neighbours and the week strip", () => {
    const day = toScoreDay(
      {
        prevDate: "2026-11-19",
        currentDate: "2026-11-21",
        nextDate: "2026-11-22",
        gameWeek: [
          { date: "2026-11-20", numberOfGames: 0 },
          { date: "2026-11-21", numberOfGames: 14 },
        ],
        games: [rawGame(), live()],
      },
      1234,
    );
    expect(day.date).toBe("2026-11-21");
    expect(day.prevDate).toBe("2026-11-19");
    expect(day.days).toEqual([
      { date: "2026-11-20", games: 0 },
      { date: "2026-11-21", games: 14 },
    ]);
    expect(day.games.map((g) => g.status)).toEqual(["scheduled", "live"]);
    expect(day.fetchedAt).toBe(1234);
  });
});
