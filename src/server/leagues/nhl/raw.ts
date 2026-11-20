/**
 * The NHL API's response shapes, typed only for the fields Snapshot reads.
 * Everything here is the provider's vocabulary; adapter.ts translates it.
 */

export type RawLocalized = { default: string; [lang: string]: string };

export type RawPeriodDescriptor = {
  number: number;
  periodType: "REG" | "OT" | "SO";
  maxRegulationPeriods?: number;
};

export type RawClock = {
  timeRemaining: string;
  secondsRemaining: number;
  running: boolean;
  inIntermission: boolean;
};

export type RawScoreTeam = {
  id: number;
  name: RawLocalized;
  abbrev: string;
  logo: string;
  score?: number;
  sog?: number;
  record?: string;
};

export type RawScoreGame = {
  id: number;
  gameType: number;
  startTimeUTC: string;
  venue?: RawLocalized;
  /** FUT, PRE, LIVE, CRIT, OFF, FINAL */
  gameState: string;
  /** OK, PPD (postponed), CNCL (cancelled) */
  gameScheduleState: string;
  awayTeam: RawScoreTeam;
  homeTeam: RawScoreTeam;
  period?: number;
  periodDescriptor?: RawPeriodDescriptor;
  clock?: RawClock;
  /** "1551" = away goalie, away skaters, home skaters, home goalie */
  situation?: { situationCode?: string };
  gameOutcome?: { lastPeriodType: "REG" | "OT" | "SO"; otPeriods?: number };
  tvBroadcasts?: { network: string; market: string; countryCode: string }[];
};

export type RawScoreResponse = {
  prevDate?: string;
  currentDate: string;
  nextDate?: string;
  gameWeek?: { date: string; numberOfGames: number }[];
  games: RawScoreGame[];
};
