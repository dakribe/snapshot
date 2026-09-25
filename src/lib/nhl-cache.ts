const NHL_API = 'https://api-web.nhle.com/v1';
const DAY = 86_400_000;
const COOLDOWN_KEY = `${NHL_API}/__snapshot-cache-v1/cooldown`;

export type CachedNhl<T> = T & { cache: { stale: boolean; fetchedAt: number } };
type Entry = { data: object; fetchedAt: number; freshUntil: number; staleUntil: number };
type CacheStore = Pick<Cache, 'match' | 'put'>;

// Cloudflare exposes caches.default; browsers and the local Node server don't.
function defaultCache(): CacheStore | undefined {
  return (globalThis as typeof globalThis & { caches?: CacheStorage & { default?: CacheStore } }).caches?.default;
}

function freshness(path: string, data: object): number {
  if (path === '/standings/now') return 3_600_000;
  const payload = data as { games?: { gameState: string }[]; gameState?: string };
  const games = payload.games ?? (payload.gameState ? [{ gameState: payload.gameState }] : []);
  if (games.length && games.every((game) => ['OFF', 'FINAL'].includes(game.gameState))) return DAY;
  // Unknown/in-progress states get a short TTL, including pregame and intermissions.
  if (games.some((game) => !['FUT', 'OFF', 'FINAL'].includes(game.gameState))) return 30_000;
  return 300_000;
}

function retryDelay(value: string | null, now: number): number {
  if (value !== null) {
    const seconds = Number(value);
    const delay = value.trim() !== '' && Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
    if (Number.isFinite(delay) && delay > 0) return Math.max(1000, delay);
  }
  return 60_000;
}

// One client per Worker isolate. Cache API storage is shared only within a data center.
export function createNhlClient(options: {
  fetch?: typeof fetch;
  now?: () => number;
  cache?: () => CacheStore | undefined;
} = {}) {
  const now = options.now ?? Date.now;
  const store = options.cache ?? defaultCache;
  const memory = new Map<string, Entry>();
  const pending = new Map<string, Promise<CachedNhl<object>>>();
  let cooldownUntil = 0;

  async function read<T>(key: string): Promise<T | undefined> {
    try {
      const response = await store()?.match(key);
      return response ? await response.json() as T : undefined;
    } catch {
      return undefined; // Storage failures must not turn a successful NHL request into an error.
    }
  }

  async function write(key: string, value: unknown, until: number) {
    try {
      await store()?.put(key, new Response(JSON.stringify(value), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.max(1, Math.ceil((until - now()) / 1000))}`,
        },
      }));
    } catch {
      // In-memory storage still provides a bounded fallback.
    }
  }

  function remember(key: string, entry: Entry) {
    for (const [existingKey, existing] of memory) {
      if (existing.staleUntil <= now()) memory.delete(existingKey);
    }
    memory.delete(key);
    memory.set(key, entry);
    if (memory.size > 200) memory.delete(memory.keys().next().value!);
  }

  function result(entry: Entry): CachedNhl<object> {
    return { ...entry.data, cache: { stale: entry.freshUntil <= now(), fetchedAt: entry.fetchedAt } };
  }

  async function load(path: string): Promise<CachedNhl<object>> {
    const key = `${NHL_API}/__snapshot-cache-v1${path}`;
    let entry = memory.get(key);
    if (!entry || entry.freshUntil <= now()) {
      const shared = await read<Entry>(key);
      if (shared && (!entry || shared.fetchedAt > entry.fetchedAt)) {
        entry = shared;
        remember(key, shared);
      }
    }
    if (entry && entry.freshUntil > now()) return result(entry);
    const stale = () => entry && entry.staleUntil > now() ? result(entry) : undefined;

    cooldownUntil = Math.max(cooldownUntil, (await read<{ until: number }>(COOLDOWN_KEY))?.until ?? 0);
    if (cooldownUntil > now()) {
      const fallback = stale();
      if (fallback) return fallback;
      throw new Error('NHL data temporarily unavailable (rate-limit cooldown)');
    }

    try {
      const response = await (options.fetch ?? fetch)(`${NHL_API}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 429) {
        cooldownUntil = Math.max(cooldownUntil, now() + retryDelay(response.headers.get('Retry-After'), now()));
        await write(COOLDOWN_KEY, { until: cooldownUntil }, cooldownUntil);
      }
      if (!response.ok) throw new Error(`NHL data request failed (${response.status})`);
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid NHL data response');
      const fetchedAt = now();
      const freshUntil = fetchedAt + freshness(path, data);
      const next = { data, fetchedAt, freshUntil, staleUntil: freshUntil + DAY };
      remember(key, next);
      await write(key, next, next.staleUntil);
      return result(next);
    } catch (error) {
      const fallback = stale();
      if (fallback) return fallback;
      throw error;
    }
  }

  return function nhlFetch<T extends object>(path: string): Promise<CachedNhl<T>> {
    let request = pending.get(path);
    if (!request) {
      request = load(path).finally(() => pending.delete(path));
      pending.set(path, request);
    }
    return request as Promise<CachedNhl<T>>;
  };
}

export const nhlFetch = createNhlClient();
