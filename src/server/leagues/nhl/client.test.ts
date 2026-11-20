import { afterEach, describe, expect, mock, test } from "bun:test";
import { NhlApiError, nhlGet } from "./client";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function fakeFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = mock(impl) as unknown as typeof fetch;
  return globalThis.fetch as unknown as ReturnType<typeof mock>;
}

/** Resolves to the error a call rejects with; fails the test if it succeeds. */
const failure = (p: Promise<unknown>) =>
  p.then(
    () => {
      throw new Error("expected the call to fail");
    },
    (e: unknown) => e as NhlApiError,
  );

describe("nhlGet", () => {
  test("requests the v1 API, following redirects, and parses JSON", async () => {
    const f = fakeFetch(async () => Response.json({ ok: true }));
    expect(await nhlGet<{ ok: boolean }>("/score/now")).toEqual({ ok: true });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api-web.nhle.com/v1/score/now");
    expect(init.redirect).toBe("follow");
  });

  test("HTTP errors carry the path and status", async () => {
    fakeFetch(async () => new Response("nope", { status: 404 }));
    const err = await failure(nhlGet("/gamecenter/1/boxscore"));
    expect(err).toBeInstanceOf(NhlApiError);
    expect(err.status).toBe(404);
    expect(err.path).toBe("/gamecenter/1/boxscore");
  });

  test("network failures become NhlApiError with no status", async () => {
    fakeFetch(async () => {
      throw new TypeError("fetch failed");
    });
    const err = await failure(nhlGet("/score/now"));
    expect(err).toBeInstanceOf(NhlApiError);
    expect(err.status).toBeNull();
    expect(err.message).toContain("network error");
  });

  test("timeouts are reported as timeouts", async () => {
    fakeFetch(
      (_url, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
        }),
    );
    const err = await failure(nhlGet("/score/now", { timeoutMs: 20 }));
    expect(err.message).toContain("timed out after 20ms");
  });

  test("non-JSON bodies are an error, not a crash", async () => {
    fakeFetch(async () => new Response("<html>", { status: 200 }));
    const err = await failure(nhlGet("/score/now"));
    expect(err.message).toContain("not JSON");
  });
});
