import { Star } from "lucide-react";
import type { League } from "../lib/leagues";
import { useLeaguePrefs } from "../lib/useLeaguePrefs";
import { LeagueMark } from "./LeagueMark";

function Switch({ on, label, disabled, onToggle }: { on: boolean; label: string; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "bg-indigo" : "bg-surface-3"
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-card transition-transform duration-200 ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

function Row({ league, compact }: { league: League; compact: boolean }) {
  const { isFavorite, isShown, toggleFavorite, toggleHidden } = useLeaguePrefs();
  const soon = league.status === "soon";
  const fav = isFavorite(league.id);
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <LeagueMark league={league} />
      <span className="min-w-0 flex-1">
        <span
          className={`flex items-center gap-1.5 text-[14px] font-semibold ${soon ? "text-ink-3" : "text-ink"}`}
          title={compact ? league.fullName : undefined}
        >
          {league.name}
          {soon ? (
            <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10.5px] font-semibold whitespace-nowrap text-ink-3">
              {compact ? "Soon" : "Coming soon"}
            </span>
          ) : null}
        </span>
        {compact ? null : <span className="block truncate text-[11.5px] text-ink-3">{league.fullName}</span>}
      </span>
      <button
        type="button"
        onClick={() => toggleFavorite(league.id)}
        disabled={soon}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${league.name} from favorites` : `Add ${league.name} to favorites`}
        className="grid size-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Star
          className={`size-[18px] ${fav ? "fill-orange text-orange" : "text-ink-3"}`}
          strokeWidth={fav ? 1.8 : 2}
          aria-hidden
        />
      </button>
      <Switch
        on={!soon && isShown(league.id)}
        disabled={soon}
        label={`Show ${league.name} games`}
        onToggle={() => toggleHidden(league.id)}
      />
    </li>
  );
}

/**
 * Favorites first, then every other league. Shared by the sidebar and the
 * mobile sheet; `compact` drops the full league name for the narrow sidebar.
 */
export function LeagueList({ compact = false }: { compact?: boolean }) {
  const { ordered, isFavorite } = useLeaguePrefs();
  const favorites = ordered.filter((l) => isFavorite(l.id));
  const rest = ordered.filter((l) => !isFavorite(l.id));
  return (
    <div>
      {favorites.length ? (
        <>
          <h3 className="px-3 pt-3 pb-1 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">Favorites</h3>
          <ul className="divide-y divide-line">
            {favorites.map((l) => (
              <Row key={l.id} league={l} compact={compact} />
            ))}
          </ul>
        </>
      ) : null}
      <h3 className="px-3 pt-3 pb-1 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
        {favorites.length ? "All leagues" : "Leagues"}
      </h3>
      <ul className="divide-y divide-line">
        {rest.map((l) => (
          <Row key={l.id} league={l} compact={compact} />
        ))}
      </ul>
    </div>
  );
}
