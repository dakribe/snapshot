import { Link, useRouter } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { formatDay } from "../lib/dates";
import { leagueById } from "../lib/leagues";
import type { LeagueScores as Scores } from "../server/scores";
import { GameRow } from "./GameRow";
import { LeagueMark } from "./LeagueMark";

/** One league's games for the day, or why they aren't there. */
export function LeagueScores({ scores, favorite }: { scores: Scores; favorite: boolean }) {
  const router = useRouter();
  const league = leagueById(scores.league);
  return (
    <section className="card overflow-hidden" aria-labelledby={`league-${league.id}`}>
      <h2 id={`league-${league.id}`} className="flex items-center gap-2.5 border-b border-line px-4 py-3 text-[15px] font-semibold">
        <LeagueMark league={league} size={24} />
        {league.name}
        {favorite ? <Star className="size-3.5 fill-orange text-orange" aria-label="Favorite" /> : null}
        {scores.ok && scores.day.games.length ? (
          <span className="ml-auto text-[12px] font-normal text-ink-3">
            {scores.day.games.length} {scores.day.games.length === 1 ? "game" : "games"}
          </span>
        ) : null}
      </h2>

      {!scores.ok ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-ink-2">{scores.message}</p>
          <button
            type="button"
            onClick={() => router.invalidate()}
            className="mt-3 rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            Try again
          </button>
        </div>
      ) : scores.day.games.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-ink-2">No {league.name} games on this day.</p>
          {scores.day.nextDate ? (
            <Link
              to="/"
              search={{ date: scores.day.nextDate }}
              className="mt-3 inline-block rounded-full bg-indigo px-3.5 py-1.5 text-[13px] font-semibold text-on-indigo"
            >
              Next games: {formatDay(scores.day.nextDate, { weekday: "short", month: "short", day: "numeric" })}
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {scores.day.games.map((g) => (
            <li key={g.id}>
              <GameRow game={g} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LeagueScoresSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="size-6 animate-pulse rounded-lg bg-surface-2" />
        <span className="h-4 w-12 animate-pulse rounded bg-surface-2" />
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-[60px_1fr_64px_1fr] items-center gap-3 border-b border-line px-4 py-4 last:border-0">
          <span className="h-3.5 w-11 animate-pulse rounded bg-surface-2" />
          <span className="ml-auto h-3.5 w-24 animate-pulse rounded bg-surface-2" />
          <span className="mx-auto h-5 w-10 animate-pulse rounded bg-surface-2" />
          <span className="h-3.5 w-24 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
