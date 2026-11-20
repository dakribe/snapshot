/**
 * Snapshot's league-agnostic hockey model. Every data source (NHL today,
 * PWHL and AHL later) is adapted into these shapes, and the UI only ever
 * reads these, never a provider's raw JSON.
 */
import type { LeagueId } from "./leagues";

export type Side = "away" | "home";

export type GameStatus = "scheduled" | "live" | "final" | "postponed" | "cancelled";

export type PeriodKind = "regulation" | "overtime" | "shootout";

export type Period = {
  /** 1-based, counting overtimes after regulation (NHL 2OT = 5) */
  number: number;
  kind: PeriodKind;
  /** "1st", "2nd", "3rd", "OT", "2OT", "SO" */
  label: string;
};

export type GameClock = {
  period: Period;
  /**
   * Seconds left in the period, or in the intermission when `intermission`
   * is true. Only moves while `running` (intermissions always count down).
   */
  secondsRemaining: number;
  running: boolean;
  intermission: boolean;
};

/** Manpower on the ice right now. */
export type Situation = {
  /** side with more skaters, or null at even strength */
  powerPlay: Side | null;
  /** e.g. "5v4", from the power-play side's point of view; "5v5" when even */
  strength: string;
  /** sides that have pulled their goalie */
  emptyNet: Side[];
};

export type TeamLogo = { light: string; dark: string };

export type TeamSide = {
  /** provider team id, as a string */
  id: string;
  abbrev: string;
  /** "Maple Leafs" */
  name: string;
  logo: TeamLogo;
  /** null before the game starts */
  score: number | null;
  shots: number | null;
  /** "17-4-3" (W-L-OTL) before the game, when the provider gives it */
  record: string | null;
};

export type Game = {
  /** `${league}:${nativeId}`, unique across leagues */
  id: string;
  league: LeagueId;
  /** the provider's own id */
  nativeId: string;
  status: GameStatus;
  /** ISO 8601, UTC */
  startTime: string;
  venue: string | null;
  away: TeamSide;
  home: TeamSide;
  /** only while live */
  clock: GameClock | null;
  /** only while live */
  situation: Situation | null;
  /** for final games: how far it went */
  endedIn: PeriodKind | null;
  /** national TV networks, deduplicated */
  broadcasts: string[];
};

export type ScoreDay = {
  league: LeagueId;
  /** YYYY-MM-DD, the league's local game day */
  date: string;
  prevDate: string | null;
  nextDate: string | null;
  /** the surrounding days with game counts, for a date strip */
  days: { date: string; games: number }[];
  games: Game[];
  /** ms since epoch when this was read from the provider */
  fetchedAt: number;
};

export const gameId = (league: LeagueId, nativeId: string | number) => `${league}:${nativeId}`;
