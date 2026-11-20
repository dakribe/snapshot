import type { ScoreDay } from "../../lib/hockey";
import type { LeagueId } from "../../lib/leagues";
import { getNhlScoreDay } from "./nhl/adapter";

/** What every league's data source must provide. */
export type LeagueAdapter = {
  /** Games on a game day. Without a date: the league's current or next game day. */
  scoreDay(date?: string): Promise<ScoreDay>;
};

/** Leagues with data wired up. A league listed in LEAGUES but not here shows as "Coming soon". */
export const ADAPTERS: Partial<Record<LeagueId, LeagueAdapter>> = {
  nhl: { scoreDay: getNhlScoreDay },
};
