import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDay, todayIn } from "../lib/dates";

/** A week of game days. The selected day comes from the URL. */
export function DateStrip({ date, days }: { date: string; days: { date: string; games: number }[] }) {
  // Game days follow Eastern time, so "Today" does too.
  const today = todayIn("America/New_York");
  const week = days.length ? days : [{ date, games: 0 }];
  return (
    <nav aria-label="Game days" className="card flex items-stretch p-1">
      <Link
        to="/"
        search={{ date: addDays(date, -7) }}
        aria-label="Previous week"
        className="grid w-9 shrink-0 place-items-center rounded-[10px] text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <ol className="grid flex-1 grid-flow-col auto-cols-fr">
        {week.map((d) => {
          const active = d.date === date;
          return (
            <li key={d.date}>
              <Link
                to="/"
                search={{ date: d.date }}
                aria-current={active ? "date" : undefined}
                aria-label={`${formatDay(d.date, { weekday: "long", month: "long", day: "numeric" })}, ${d.games} ${d.games === 1 ? "game" : "games"}`}
                className={`flex h-full flex-col items-center justify-center rounded-[10px] px-0.5 py-2 transition-colors ${
                  active ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span className={`text-[10.5px] font-semibold uppercase ${active ? "opacity-75" : "text-ink-3"}`}>
                  {d.date === today ? "Today" : formatDay(d.date, { weekday: "short" })}
                </span>
                <span className="text-[15px] font-semibold">{formatDay(d.date, { day: "numeric" })}</span>
                <span className={`text-[10.5px] ${active ? "opacity-70" : "text-ink-3"}`}>{d.games || "–"}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link
        to="/"
        search={{ date: addDays(date, 7) }}
        aria-label="Next week"
        className="grid w-9 shrink-0 place-items-center rounded-[10px] text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <ChevronRight className="size-5" aria-hidden />
      </Link>
    </nav>
  );
}
