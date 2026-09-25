const NHL_API = 'https://api-web.nhle.com/v1';

export type Localized = { default: string };

export type Team = {
  id: number;
  abbrev: string;
  name?: Localized;
  commonName?: Localized;
  placeName?: Localized;
  score?: number;
  sog?: number;
  logo: string;
};

export type Game = {
  id: number;
  season: number;
  gameType: number;
  gameDate?: string;
  startTimeUTC: string;
  gameState: string;
  gameScheduleState: string;
  venue: Localized;
  awayTeam: Team;
  homeTeam: Team;
  tvBroadcasts?: Array<{ network: string }>;
  periodDescriptor?: { number: number; periodType: string };
  gameOutcome?: { lastPeriodType?: string };
  clock?: { timeRemaining: string; inIntermission: boolean };
};

export type ScoreResponse = {
  currentDate: string;
  prevDate: string;
  nextDate: string;
  gameWeek: Array<{ date: string; dayAbbrev: string; numberOfGames: number }>;
  games: Game[];
};

export type Goal = {
  eventId: number;
  name: Localized;
  teamAbbrev: Localized;
  timeInPeriod: string;
  strength: string;
  goalsToDate: number;
  awayScore: number;
  homeScore: number;
  assists: Array<{ name: Localized }>;
  periodDescriptor: { number: number; periodType: string };
};

export type GameDetail = Game & {
  gameDate: string;
  clock?: { timeRemaining: string; inIntermission: boolean };
  summary?: {
    scoring?: Array<{ periodDescriptor: { number: number; periodType: string }; goals: Goal[] }>;
    threeStars?: Array<{
      star: number;
      playerId: number;
      teamAbbrev: string;
      headshot: string;
      name: Localized;
      goals: number;
      assists: number;
      points: number;
    }>;
    penalties?: Array<{ penalties: Array<{ teamAbbrev?: Localized }> }>;
  };
};

export type Standing = {
  teamAbbrev: Localized;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  streakCode: string;
  streakCount: number;
};

async function nhlFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${NHL_API}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`NHL data request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getTodayScore(date: string) {
  'use server';
  return nhlFetch<ScoreResponse>(`/score/${encodeURIComponent(date)}`);
}

export async function getGame(id: string) {
  'use server';
  return nhlFetch<GameDetail>(`/gamecenter/${encodeURIComponent(id)}/landing`);
}

export async function getStandings() {
  'use server';
  return nhlFetch<{ standings: Standing[] }>('/standings/now');
}

export function teamName(team: Team) {
  return team.placeName?.default ?? team.name?.default ?? team.commonName?.default ?? team.abbrev;
}

export function fullTeamName(team: Team) {
  const place = team.placeName?.default;
  const common = team.commonName?.default ?? team.name?.default;
  return place && common ? `${place} ${common}` : common ?? place ?? team.abbrev;
}

export function gameStatus(game: Game) {
  if (game.gameScheduleState !== 'OK') return 'Postponed';
  if (game.gameState === 'LIVE' || game.gameState === 'CRIT') {
    if (game.clock?.inIntermission) return `Intermission · ${periodLabel(game.periodDescriptor)}`;
    return `${periodLabel(game.periodDescriptor)} · ${game.clock?.timeRemaining ?? ''}`;
  }
  if (game.gameState === 'OFF' || game.gameState === 'FINAL') {
    const suffix = game.gameOutcome?.lastPeriodType;
    return suffix && suffix !== 'REG' ? `Final/${suffix}` : 'Final';
  }
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(game.startTimeUTC));
}

export function periodLabel(period?: { number: number; periodType: string }) {
  if (!period) return '';
  if (period.periodType !== 'REG') return period.periodType;
  return `${period.number}${period.number === 1 ? 'st' : period.number === 2 ? 'nd' : 'rd'}`;
}

export function longDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}
