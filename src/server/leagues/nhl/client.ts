/**
 * Minimal client for the NHL's public web API. No key required.
 * The API answers some paths with a redirect (e.g. /score/now), so redirects
 * are followed.
 */
export const NHL_API = "https://api-web.nhle.com/v1";

export class NhlApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "NhlApiError";
  }
}

export async function nhlGet<T>(path: string, { timeoutMs = 8_000 }: { timeoutMs?: number } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${NHL_API}${path}`, {
      redirect: "follow",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? `timed out after ${timeoutMs}ms` : "network error";
    throw new NhlApiError(path, null, `NHL API ${path}: ${reason}`);
  }
  if (!res.ok) throw new NhlApiError(path, res.status, `NHL API ${path}: HTTP ${res.status}`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new NhlApiError(path, res.status, `NHL API ${path}: response was not JSON`);
  }
}
