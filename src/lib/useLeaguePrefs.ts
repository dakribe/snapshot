import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LEAGUES, type League, type LeagueId } from "./leagues";

/**
 * A visitor's league preferences, kept in this browser (localStorage).
 * - favorites: pinned to the top of the list and of the scores page
 * - hidden: leagues switched off, so their games don't show on scores
 */
type Prefs = { favorites: LeagueId[]; hidden: LeagueId[] };

const KEY = "snapshot.leagues";
const EVENT = "snapshot:leagues";
const DEFAULT: Prefs = { favorites: [], hidden: [] };

const validIds = (ids: unknown): LeagueId[] =>
  Array.isArray(ids) ? ids.filter((id): id is LeagueId => LEAGUES.some((l) => l.id === id)) : [];

// useSyncExternalStore needs a stable snapshot, so cache the parse by raw string.
let lastRaw: string | null = null;
let lastPrefs: Prefs = DEFAULT;

function getSnapshot(): Prefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: fall back to whatever this page view has.
    return lastPrefs;
  }
  if (raw === lastRaw) return lastPrefs;
  lastRaw = raw;
  try {
    const p = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    lastPrefs = { favorites: validIds(p.favorites), hidden: validIds(p.hidden) };
  } catch {
    lastPrefs = DEFAULT;
  }
  return lastPrefs;
}

// The server has no stored prefs; the client re-renders with them after hydration.
const getServerSnapshot = () => DEFAULT;

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function save(next: Prefs) {
  lastPrefs = next;
  try {
    lastRaw = JSON.stringify(next);
    localStorage.setItem(KEY, lastRaw);
  } catch {
    // Private mode or storage blocked: prefs last for this page view only.
  }
  window.dispatchEvent(new Event(EVENT));
}

const toggle = (list: LeagueId[], id: LeagueId) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function useLeaguePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
