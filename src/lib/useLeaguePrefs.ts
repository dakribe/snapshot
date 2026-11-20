import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LEAGUES, type League, type LeagueId } from "./leagues";
import { parsePrefs, PREFS_COOKIE, readBrowserCookie, serializePrefs, type LeaguePrefs } from "./session";
import { useServerPrefs } from "./useSession";

/**
 * A visitor's league preferences, kept in a cookie so the server renders the
 * same order the browser shows.
 * - favorites: pinned to the top of the list and of the scores page
 * - hidden: leagues switched off, so their games don't show on scores
 */
const EVENT = "snapshot:leagues";

// useSyncExternalStore needs a stable snapshot, so cache the parse by raw value.
let lastRaw: string | undefined;
let lastPrefs: LeaguePrefs | null = null;

function getSnapshot(): LeaguePrefs {
  const raw = readBrowserCookie(PREFS_COOKIE);
  if (lastPrefs && raw === lastRaw) return lastPrefs;
  lastRaw = raw;
  lastPrefs = parsePrefs(raw);
  return lastPrefs;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Other tabs can't signal cookie changes; re-check when this tab regains focus.
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

function save(next: LeaguePrefs) {
  document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(serializePrefs(next))};path=/;max-age=31536000;samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}

const toggle = (list: LeagueId[], id: LeagueId) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function useLeaguePrefs() {
  const serverPrefs = useServerPrefs();
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => serverPrefs);

  const toggleFavorite = useCallback((id: LeagueId) => {
    const p = getSnapshot();
    save({ ...p, favorites: toggle(p.favorites, id) });
  }, []);

  const toggleHidden = useCallback((id: LeagueId) => {
    const p = getSnapshot();
    save({ ...p, hidden: toggle(p.hidden, id) });
  }, []);

  /** Favorites first (in the order they were starred), then the rest in default order. */
  const ordered = useMemo<League[]>(
    () => [
      ...prefs.favorites.map((id) => LEAGUES.find((l) => l.id === id)!),
      ...LEAGUES.filter((l) => !prefs.favorites.includes(l.id)),
    ],
    [prefs.favorites],
  );

  return {
    ordered,
    isFavorite: (id: LeagueId) => prefs.favorites.includes(id),
    isShown: (id: LeagueId) => !prefs.hidden.includes(id),
    toggleFavorite,
    toggleHidden,
  };
}
