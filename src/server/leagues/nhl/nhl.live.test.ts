/**
 * Contract check against the real NHL API. Skipped unless NHL_LIVE=1
 * (`bun run test:live`), so the regular test run never needs the network.
 * Run it when something looks off, or when the NHL may have changed its API.
 */
import { describe, expect, test } from "bun:test";
import { getNhlScoreDay } from "./adapter";

const enabled = process.env.NHL_LIVE === "1";

describe.skipIf(!enabled)("NHL API (live)", () => {
  test("today's scores parse into our model", async () => {
    const day = await getNhlScoreDay();
    expect(day.league).toBe("nhl");
    expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const g of day.games) {
      expect(g.id).toMatch(/^nhl:\d+$/);
      expect(["scheduled", "live", "final", "postponed", "cancelled"]).toContain(g.status);
      expect(g.away.abbrev).toMatch(/^[A-Z]{3}$/);
      expect(g.home.logo.dark).toEndWith("_dark.svg");
      if (g.status === "live") expect(g.clock).not.toBeNull();
    }
  });

  test("a finished day has finals with scores and an ending", async () => {
    const day = await getNhlScoreDay("2026-11-19");
    expect(day.games.length).toBeGreaterThan(0);
    for (const g of day.games.filter((x) => x.status === "final")) {
      expect(g.away.score).not.toBeNull();
      expect(g.endedIn).not.toBeNull();
    }
  });
});
