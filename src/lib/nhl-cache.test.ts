import { describe, expect, it, vi } from 'vitest';
import { createNhlClient } from './nhl-cache';

function setup(shared = false) {
  let time = Date.UTC(2026, 0, 1);
  const responses = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (key: RequestInfo | URL) => responses.get(String(key))?.clone()),
    put: vi.fn(async (key: RequestInfo | URL, response: Response) => { responses.set(String(key), response.clone()); }),
  };
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ gameState: 'LIVE' }));
  const options = { fetch: fetcher, now: () => time, cache: () => shared ? cache : undefined };
  return {
    client: createNhlClient(options),
    newClient: () => createNhlClient(options),
    fetcher, cache,
    advance: (ms: number) => { time += ms; },
    now: () => time,
  };
}

const game = '/gamecenter/1/landing';

describe('NHL cache', () => {
  it('deduplicates requests, reuses fresh results, and refreshes live games after 30s', async () => {
    const s = setup();
    const [a, b] = await Promise.all([s.client(game), s.client(game)]);
    expect(a).toEqual(b);
    expect(a.cache).toEqual({ stale: false, fetchedAt: s.now() });
    s.advance(29_999);
    await s.client(game);
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    s.advance(1);
    await s.client(game);
    expect(s.fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['/standings/now', { standings: [] }, 3_600_000],
    [game, { gameState: 'FUT' }, 300_000],
    [game, { gameState: 'FINAL' }, 86_400_000],
    ['/score/2026-01-01', { games: [{ gameState: 'OFF' }, { gameState: 'FINAL' }] }, 86_400_000],
    ['/score/2026-01-01', { games: [{ gameState: 'OFF' }, { gameState: 'LIVE' }] }, 30_000],
    ['/score/2026-01-01', { games: [] }, 300_000],
  ])('applies freshness for %s / %j', async (path, payload, ttl) => {
    const s = setup();
    s.fetcher.mockImplementation(async () => Response.json(payload));
    await s.client(path);
    s.advance(ttl - 1);
    await s.client(path);
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    s.advance(1);
    await s.client(path);
    expect(s.fetcher).toHaveBeenCalledTimes(2);
  });

  it.each(['120', 'date', 'invalid'])('serves stale on 429 and shares a cooldown across paths and clients (%s)', async (header) => {
    const s = setup(true);
    await s.client(game);
    s.advance(30_000);
    const retryAfter = header === 'date' ? new Date(s.now() + 120_000).toUTCString() : header;
    s.fetcher.mockResolvedValue(new Response(null, { status: 429, headers: { 'Retry-After': retryAfter } }));
    expect((await s.client(game)).cache.stale).toBe(true);
    const other = s.newClient();
    expect((await other(game)).cache.stale).toBe(true);
    await expect(other('/standings/now')).rejects.toThrow('cooldown');
    expect(s.fetcher).toHaveBeenCalledTimes(2);
    s.advance(header === 'invalid' ? 60_000 : 120_000);
    s.fetcher.mockImplementation(async () => Response.json({ gameState: 'LIVE' }));
    expect((await other(game)).cache.stale).toBe(false);
    expect(s.fetcher).toHaveBeenCalledTimes(3);
  });

  it('reads shared fresh entries without fetching and retains stale data beyond freshness', async () => {
    const s = setup(true);
    await s.client(game);
    expect((await s.newClient()(game)).cache.stale).toBe(false);
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    const response = s.cache.put.mock.calls[0]![1];
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86430');
    s.advance(30_000);
    s.fetcher.mockRejectedValue(new Error('offline'));
    expect((await s.newClient()(game)).cache.stale).toBe(true);
  });

  it('does not serve stale data beyond retention even if storage returns it', async () => {
    const s = setup(true);
    await s.client(game);
    s.advance(86_430_000);
    s.fetcher.mockRejectedValue(new Error('offline'));
    await expect(s.client(game)).rejects.toThrow('offline');
  });

  it('does not cache errors or malformed JSON and clears failed in-flight requests', async () => {
    const s = setup();
    s.fetcher.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(s.client(game)).rejects.toThrow('500');
    s.fetcher.mockResolvedValueOnce(new Response('not json'));
    await expect(s.client(game)).rejects.toThrow();
    expect((await s.client(game)).cache.stale).toBe(false);
    expect(s.fetcher).toHaveBeenCalledTimes(3);
  });

  it('continues with bounded memory when cache storage fails', async () => {
    const s = setup(true);
    s.cache.match.mockRejectedValue(new Error('cache down'));
    s.cache.put.mockRejectedValue(new Error('cache down'));
    await s.client(game);
    await s.client(game);
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    for (let id = 2; id <= 201; id++) await s.client(`/gamecenter/${id}/landing`);
    await s.client(game);
    expect(s.fetcher).toHaveBeenCalledTimes(202);
  });
});
