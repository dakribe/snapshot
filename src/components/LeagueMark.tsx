import type { League } from "../lib/leagues";

/** Monogram tile for a league. Uniform across leagues; no official marks. */
export function LeagueMark({ league, size = 28 }: { league: League; size?: number }) {
  const soon = league.status === "soon";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-lg font-bold tracking-[-0.02em] ${
        soon ? "bg-surface-2 text-ink-3" : "bg-indigo-soft text-indigo-ink"
      }`}
      style={{ width: size, height: size, fontSize: size * (league.name.length > 3 ? 0.3 : 0.36) }}
    >
      {league.name}
    </span>
  );
}
