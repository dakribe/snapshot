import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { LEAGUES, type LeagueId } from "./leagues";

/**
 * Per-visitor settings the server needs for its first render, kept in
 * cookies so server and browser agree and nothing jumps after load.
 * (Theme stays in localStorage: a boot script applies it before paint.)
 */
export type LeaguePrefs = { favorites: LeagueId[]; hidden: LeagueId[] };
export type Session = { prefs: LeaguePrefs; timeZone: string };

export const PREFS_COOKIE = "snapshot_leagues";
export const TZ_COOKIE = "snapshot_tz";
/** NHL game days are Eastern; used until the browser has reported its zone. */
export const DEFAULT_TZ = "America/New_York";
export const DEFAULT_PREFS: LeaguePrefs = { favorites: [], hidden: [] };

const isLeague = (id: string): id is LeagueId => LEAGUES.some((l) => l.id === id);

/** Cookie format: "f:nhl.pwhl|h:ahl" (favorites in starred order, hidden). */
export function parsePrefs(raw: string | undefined | null): LeaguePrefs {
  if (!raw) return DEFAULT_PREFS;
  const out: LeaguePrefs = { favorites: [], hidden: [] };
  for (const part of decodeURIComponent(raw).split("|")) {
    const [key, list = ""] = part.split(":");
    const ids = [...new Set(list.split(".").filter(isLeague))];
    if (key === "f") out.favorites = ids;
    if (key === "h") out.hidden = ids;
  }
  return out;
}

export function serializePrefs(p: LeaguePrefs): string {
  return `f:${p.favorites.join(".")}|h:${p.hidden.join(".")}`;
}

export function validTimeZone(tz: string | undefined | null): string | null {
  if (!tz) return null;
  try {
    // Throws a RangeError for unknown zones; returns the canonical name otherwise.
    return new Intl.DateTimeFormat("en-US", { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** Read one cookie from document.cookie. */
export function readBrowserCookie(name: string): string | undefined {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit?.slice(name.length + 1);
}

export const readSession = createIsomorphicFn()
  .server(
    (): Session => ({
      prefs: parsePrefs(getCookie(PREFS_COOKIE)),
      timeZone: validTimeZone(getCookie(TZ_COOKIE) ? decodeURIComponent(getCookie(TZ_COOKIE)!) : null) ?? DEFAULT_TZ,
    }),
  )
  .client(
    (): Session => ({
      prefs: parsePrefs(readBrowserCookie(PREFS_COOKIE)),
      timeZone: validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? DEFAULT_TZ,
    }),
  );

/**
 * Inlined in <head>: records the browser's time zone in a cookie so the next
 * server render shows local start times.
 */
export const timeZoneBootScript = `(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(z&&document.cookie.indexOf('${TZ_COOKIE}='+encodeURIComponent(z))<0)document.cookie='${TZ_COOKIE}='+encodeURIComponent(z)+';path=/;max-age=31536000;samesite=lax';}catch(e){}})()`;
