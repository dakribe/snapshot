import type { Game, Localized, ScoreResponse, Team } from './nhl';

const PWHL_API = 'https://lscluster.hockeytech.com/feed/index.php';
const API_KEY = '446521baf8c38984';

type PWHLGame = {
  ID: string; Date: string; GameDateISO8601: string; HomeID: string; HomeCode: string;
  HomeLongName: string; HomeGoals: string; HomeLogo: string; VisitorID: string;
  VisitorCode: string; VisitorLongName: string; VisitorGoals: string; VisitorLogo: string;
  GameStatusString: string; GameStatusStringLong: string; venue_name?: string;
  HomeAudioUrl?: string; HomeVideoUrl?: string;
};

type PWHLResponse = { SiteKit?: { Scorebar?: PWHLGame[] } };

function localized(defaultValue: string): Localized { return { default: defaultValue }; }

function team(id: string, abbrev: string, name: string, logo: string, score: string): Team {
  return { id: Number(id), abbrev, name: localized(name), logo, score: Number(score) };
}

function toGame(item: PWHLGame): Game {
  const status = item.GameStatusStringLong || item.GameStatusString;
  const lower = status.toLowerCase();
  return {
    id: Number(item.ID), season: Number(item.Date.slice(0, 4)), gameType: 2,
    gameDate: item.Date, startTimeUTC: item.GameDateISO8601,
    gameState: lower.includes('final') || lower.includes('complete') ? 'FINAL' : lower.includes('live') || lower.includes('period') ? 'LIVE' : 'FUT',
    gameScheduleState: 'OK', venue: localized(item.venue_name ?? 'PWHL venue'),
    awayTeam: team(item.VisitorID, item.VisitorCode, item.VisitorLongName, item.VisitorLogo, item.VisitorGoals),
    homeTeam: team(item.HomeID, item.HomeCode, item.HomeLongName, item.HomeLogo, item.HomeGoals),
  };
}

export async function getPwhlScore(date: string): Promise<ScoreResponse> {
  'use server';
  const response = await fetch(`${PWHL_API}?feed=modulekit&view=scorebar&numberofdaysback=365&numberofdaysahead=365&key=${API_KEY}&client_code=pwhl`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`PWHL data request failed (${response.status})`);
  const data = await response.json() as PWHLResponse;
  const games = (data.SiteKit?.Scorebar ?? []).filter((item) => item.Date === date).map(toGame);
  const current = new Date(`${date}T12:00:00`);
  const shift = (days: number) => { const next = new Date(current); next.setDate(next.getDate() + days); return next.toISOString().slice(0, 10); };
  return { currentDate: date, prevDate: shift(-1), nextDate: shift(1), gameWeek: [], games };
}

export async function getPwhlGame(id: string): Promise<Game> {
  'use server';
  const response = await fetch(`${PWHL_API}?feed=modulekit&view=scorebar&numberofdaysback=365&numberofdaysahead=365&key=${API_KEY}&client_code=pwhl`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`PWHL game request failed (${response.status})`);
  const item = (await response.json() as PWHLResponse).SiteKit?.Scorebar?.find((game) => game.ID === id);
  if (!item) throw new Error('PWHL game not found');
  return toGame(item);
}
