import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAhlGame, getAhlScore } from './ahl-data';

const game = {
  ID: '1029067', Date: '2026-06-18', GameDateISO8601: '2026-06-18T19:00:00-04:00',
  HomeID: '335', HomeCode: 'TOR', HomeLongName: 'Toronto Marlies', HomeGoals: '3', HomeLogo: 'tor.png',
  VisitorID: '330', VisitorCode: 'CHI', VisitorLongName: 'Chicago Wolves', VisitorGoals: '4', VisitorLogo: 'chi.png',
  GameStatus: '4', GameStatusString: 'Final', GameStatusStringLong: 'Final OT',
  Period: '4', PeriodNameShort: 'OT', GameClock: '16:42', Intermission: '0', venue_name: 'Coca-Cola Coliseum',
};

function mockGames(games = [game]) {
  return vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ SiteKit: { Scorebar: games } }))));
}

afterEach(() => vi.unstubAllGlobals());

describe('AHL data', () => {
  it('filters the selected date and maps scores, teams, venue, and overtime', async () => {
    mockGames();
    const result = await getAhlScore('2026-06-18');
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toMatchObject({
      id: 1029067, gameState: 'FINAL', venue: { default: 'Coca-Cola Coliseum' },
      awayTeam: { abbrev: 'CHI', score: 4, name: { default: 'Chicago Wolves' } },
      homeTeam: { abbrev: 'TOR', score: 3, logo: 'tor.png' },
      gameOutcome: { lastPeriodType: 'OT' },
    });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('client_code=ahl'), expect.any(Object));
    expect((await getAhlScore('2026-06-19')).games).toEqual([]);
  });

  it('requests enough rows to retain current games beyond the default 1,000-row cap', async () => {
    const olderGames = Array.from({ length: 1000 }, (_, index) => ({ ...game, ID: String(index), Date: '2025-01-01' }));
    const games = [...olderGames, game];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      const limit = Number(new URL(url).searchParams.get('limit') ?? 1000);
      return new Response(JSON.stringify({ SiteKit: { Scorebar: games.slice(0, limit) } }));
    }));
    expect((await getAhlScore(game.Date)).games).toHaveLength(1);
    expect((await getAhlGame(game.ID)).id).toBe(Number(game.ID));
  });

  it('reports truncation rather than presenting an incomplete schedule', async () => {
    mockGames(Array.from({ length: 10_000 }, () => game));
    await expect(getAhlScore(game.Date)).rejects.toThrow('AHL schedule response reached its game limit');
  });

  it('handles day navigation across year boundaries', async () => {
    mockGames([]);
    expect(await getAhlScore('2026-01-01')).toMatchObject({ prevDate: '2025-12-31', nextDate: '2026-01-02' });
  });

  it('recognizes live games from numeric status and preserves the clock', async () => {
    mockGames([{ ...game, GameStatus: '2', GameStatusString: '2nd', GameStatusStringLong: '2nd', Period: '2', PeriodNameShort: '2', Intermission: '1' }]);
    expect(await getAhlGame(game.ID)).toMatchObject({ gameState: 'LIVE', clock: { timeRemaining: '16:42', inIntermission: true } });
  });

  it('recognizes scheduled games', async () => {
    mockGames([{ ...game, GameStatus: '1', GameStatusString: '7:00PM', GameStatusStringLong: '7:00 PM EDT' }]);
    expect(await getAhlGame(game.ID)).toMatchObject({ gameState: 'FUT' });
  });

  it('reports missing games', async () => {
    mockGames([]);
    await expect(getAhlGame('missing')).rejects.toThrow('AHL game not found');
  });

  it('reports HTTP failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(getAhlScore('2026-06-18')).rejects.toThrow('AHL data request failed (503)');
  });

  it('does not silently treat malformed responses as empty schedules', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(getAhlScore('2026-06-18')).rejects.toThrow('Invalid AHL data response');
  });
});
