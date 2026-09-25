import type { Game, ScoreResponse, Team } from './nhl';

// Scorebar defaults to 1,000 rows, oldest first. This window spans several
// seasons, so the default silently drops current games in a high-volume league.
const GAME_LIMIT = 10_000;
const AHL_API = `https://lscluster.hockeytech.com/feed/index.php?feed=modulekit&view=scorebar&numberofdaysback=365&numberofdaysahead=365&limit=${GAME_LIMIT}&key=ccb91f29d6744675&client_code=ahl`;

type AhlGame = {
  ID: string; Date: string; GameDateISO8601: string;
  HomeID: string; HomeCode: string; HomeLongName: string; HomeGoals: string; HomeLogo: string;
  VisitorID: string; VisitorCode: string; VisitorLongName: string; VisitorGoals: string; VisitorLogo: string;
  GameStatus: string; GameStatusString: string; GameStatusStringLong: string;
  Period?: string; PeriodNameShort?: string; GameClock?: string; Intermission?: string; venue_name?: string;
};

function team(id: string, abbrev: string, name: string, logo: string, score: string): Team {
  return { id: Number(id), abbrev, name: { default: name }, logo, score: Number(score) };
}

function toGame(item: AhlGame): Game {
  const status = (item.GameStatusStringLong || item.GameStatusString).toLowerCase();
  const final = item.GameStatus === '4' || status.includes('final') || status.includes('complete');
  const live = item.GameStatus === '2' || status.includes('period') || status.includes('intermission') || status.includes('live');
  const periodType = item.PeriodNameShort === 'SO' ? 'SO' : item.PeriodNameShort?.includes('OT') ? 'OT' : 'REG';
  return {
    id: Number(item.ID), season: Number(item.Date.slice(0, 4)), gameType: 2,
    gameDate: item.Date, startTimeUTC: item.GameDateISO8601,
    gameState: final ? 'FINAL' : live ? 'LIVE' : 'FUT', gameScheduleState: 'OK',
    venue: { default: item.venue_name || 'AHL venue' },
    awayTeam: team(item.VisitorID, item.VisitorCode, item.VisitorLongName, item.VisitorLogo, item.VisitorGoals),
    homeTeam: team(item.HomeID, item.HomeCode, item.HomeLongName, item.HomeLogo, item.HomeGoals),
    periodDescriptor: item.Period ? { number: Number(item.Period), periodType } : undefined,
    gameOutcome: final ? { lastPeriodType: periodType } : undefined,
    clock: live && item.GameClock ? { timeRemaining: item.GameClock, inIntermission: item.Intermission === '1' } : undefined,
  };
}

async function fetchGames(): Promise<AhlGame[]> {
  const response = await fetch(AHL_API, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`AHL data request failed (${response.status})`);
  const data = await response.json() as { SiteKit?: { Scorebar?: AhlGame[] } };
  if (!Array.isArray(data?.SiteKit?.Scorebar)) throw new Error('Invalid AHL data response');
  if (data.SiteKit.Scorebar.length >= GAME_LIMIT) throw new Error('AHL schedule response reached its game limit');
  return data.SiteKit.Scorebar;
}

export async function getAhlScore(date: string): Promise<ScoreResponse> {
  const games = (await fetchGames()).filter((game) => game.Date === date).map(toGame);
  const shift = (days: number) => {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  };
  return { currentDate: date, prevDate: shift(-1), nextDate: shift(1), gameWeek: [], games };
}

export async function getAhlGame(id: string): Promise<Game> {
  const item = (await fetchGames()).find((game) => game.ID === id);
  if (!item) throw new Error('AHL game not found');
  return toGame(item);
}
