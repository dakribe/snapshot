import { gameId, type Game, type GameClock, type GameStatus, type Period, type PeriodKind, type ScoreDay, type Side, type Situation, type TeamSide } from "../../../lib/hockey";
import { nhlGet } from "./client";
import type { RawPeriodDescriptor, RawScoreGame, RawScoreResponse, RawScoreTeam } from "./raw";

export function toStatus(gameState: string, scheduleState: string): GameStatus {
  if (scheduleState === "PPD") return "postponed";
  if (scheduleState === "CNCL") return "cancelled";
  if (gameState === "LIVE" || gameState === "CRIT") return "live";
  if (gameState === "OFF" || gameState === "FINAL") return "final";
  return "scheduled"; // FUT, PRE
}

const KIND: Record<RawPeriodDescriptor["periodType"], PeriodKind> = {
  REG: "regulation",
  OT: "overtime",
  SO: "shootout",
};

export function toPeriod(pd: RawPeriodDescriptor): Period {
  const kind = KIND[pd.periodType] ?? "regulation";
  if (kind === "shootout") return { number: pd.number, kind, label: "SO" };
  if (kind === "overtime") {
    const nth = pd.number - (pd.maxRegulationPeriods ?? 3);
    return { number: pd.number, kind, label: nth <= 1 ? "OT" : `${nth}OT` };
  }
  return { number: pd.number, kind, label: ["", "1st", "2nd", "3rd"][pd.number] ?? `${pd.number}th` };
}

/**
 * Decode "AGHG"-style situation codes: away goalie in net (1/0), away
 * skaters, home skaters, home goalie in net. A pulled goalie shows up as an
 * extra skater, so it is subtracted to get the true manpower.
 */
export function toSituation(code: string | undefined): Situation | null {
  if (!code || !/^\d{4}$/.test(code)) return null;
  const awayGoalie = code[0] === "1";
  const homeGoalie = code[3] === "1";
  const away = Number(code[1]) - (awayGoalie ? 0 : 1);
  const home = Number(code[2]) - (homeGoalie ? 0 : 1);
  const emptyNet: Side[] = [];
  if (!awayGoalie) emptyNet.push("away");
  if (!homeGoalie) emptyNet.push("home");
  if (away === home) return { powerPlay: null, strength: `${away}v${home}`, emptyNet };
  const powerPlay: Side = away > home ? "away" : "home";
  return {
    powerPlay,
    strength: powerPlay === "away" ? `${away}v${home}` : `${home}v${away}`,
    emptyNet,
  };
}

function toTeam(t: RawScoreTeam, started: boolean): TeamSide {
  return {
    id: String(t.id),
    abbrev: t.abbrev,
    name: t.name.default,
    logo: { light: t.logo, dark: t.logo.replace(/_light\.svg$/, "_dark.svg") },
    score: started ? (t.score ?? 0) : null,
    shots: started ? (t.sog ?? null) : null,
    record: t.record ?? null,
  };
}

function toClock(g: RawScoreGame): GameClock | null {
  if (!g.clock || !g.periodDescriptor) return null;
  return {
    period: toPeriod(g.periodDescriptor),
    secondsRemaining: g.clock.secondsRemaining,
    running: g.clock.running,
    intermission: g.clock.inIntermission,
  };
}

export function toGame(g: RawScoreGame): Game {
  const status = toStatus(g.gameState, g.gameScheduleState);
  const started = status === "live" || status === "final";
  return {
    id: gameId("nhl", g.id),
    league: "nhl",
    nativeId: String(g.id),
    status,
    startTime: g.startTimeUTC,
    venue: g.venue?.default ?? null,
    away: toTeam(g.awayTeam, started),
    home: toTeam(g.homeTeam, started),
    clock: status === "live" ? toClock(g) : null,
    situation: status === "live" ? toSituation(g.situation?.situationCode) : null,
    endedIn: status === "final" && g.gameOutcome ? KIND[g.gameOutcome.lastPeriodType] ?? "regulation" : null,
    // National broadcasts only (market "N"); regional feeds would crowd the list.
    broadcasts: [...new Set((g.tvBroadcasts ?? []).filter((b) => b.market === "N").map((b) => b.network.trim()))],
  };
}

export function toScoreDay(raw: RawScoreResponse, fetchedAt: number): ScoreDay {
  return {
    league: "nhl",
    date: raw.currentDate,
    prevDate: raw.prevDate ?? null,
    nextDate: raw.nextDate ?? null,
    days: (raw.gameWeek ?? []).map((d) => ({ date: d.date, games: d.numberOfGames })),
    games: raw.games.map(toGame),
    fetchedAt,
  };
}

/**
 * NHL scores for a game day (YYYY-MM-DD, Eastern). Without a date the NHL
 * picks "today", rolling forward to the next day with games when today has none.
 */
export async function getNhlScoreDay(date?: string): Promise<ScoreDay> {
  const raw = await nhlGet<RawScoreResponse>(date ? `/score/${date}` : "/score/now");
  return toScoreDay(raw, Date.now());
}
