import type { Game, Side } from "../lib/hockey";
import { useTimeZone } from "../lib/useSession";
import { TeamLogo } from "./TeamLogo";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function Status({ game }: { game: Game }) {
  const timeZone = useTimeZone();
  switch (game.status) {
    case "live": {
      const c = game.clock;
      if (!c) return <span className="text-[13px] font-semibold text-live">Live</span>;
      return (
        <span className="flex flex-col gap-0.5 text-live">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <span className="size-1.5 rounded-full bg-live" aria-hidden />
            {c.intermission ? `${c.period.label} Int` : c.period.label}
          </span>
          {c.period.kind === "shootout" ? null : (
            <span className="text-[13px] font-semibold">{mmss(c.secondsRemaining)}</span>
          )}
        </span>
      );
    }
    case "final":
      return (
        <span className="text-[13px] font-medium text-ink-3">
          {game.endedIn === "overtime" ? "Final/OT" : game.endedIn === "shootout" ? "Final/SO" : "Final"}
        </span>
      );
    case "postponed":
      return <span className="text-[13px] font-medium text-ink-3">Postponed</span>;
    case "cancelled":
      return <span className="text-[13px] font-medium text-ink-3">Cancelled</span>;
    default:
      return (
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-ink-2">
            {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(game.startTime))}
          </span>
          {game.broadcasts.length ? (
            <span className="truncate text-[11px] text-ink-3">{game.broadcasts.slice(0, 2).join(", ")}</span>
          ) : null}
        </span>
      );
  }
}

function Team({ game, side }: { game: Game; side: Side }) {
  const t = game[side];
  const other = game[side === "away" ? "home" : "away"];
  const lost = game.status === "final" && (t.score ?? 0) < (other.score ?? 0);
  const name = (
    <span className={`truncate text-[15px] ${lost ? "text-ink-3" : "font-semibold text-ink"}`}>
      <span className="sm:hidden">{t.abbrev}</span>
      <span className="hidden sm:inline">{t.name}</span>
    </span>
  );
  const logo = <TeamLogo logo={t.logo} abbrev={t.abbrev} size={28} />;
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${side === "away" ? "justify-end text-right" : ""}`}>
      {side === "away" ? (
        <>
          {name}
          {logo}
        </>
      ) : (
        <>
          {logo}
          {name}
        </>
      )}
    </span>
  );
}

function Score({ game }: { game: Game }) {
  if (game.status !== "live" && game.status !== "final") {
    return <span className="text-[13px] text-ink-3">vs</span>;
  }
  const a = game.away.score ?? 0;
  const h = game.home.score ?? 0;
  const fin = game.status === "final";
  return (
    <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
      <span className={fin && a < h ? "text-ink-3" : "text-ink"}>{a}</span>
      <span className="text-[15px] font-normal text-ink-3">–</span>
      <span className={fin && h < a ? "text-ink-3" : "text-ink"}>{h}</span>
    </span>
  );
}

/** One game in a scores list: status, away team, score, home team. */
export function GameRow({ game }: { game: Game }) {
  const s = game.situation;
  const note =
    game.status === "live" && s
      ? [s.powerPlay ? `${game[s.powerPlay].abbrev} power play ${s.strength}` : null, ...s.emptyNet.map((side) => `${game[side].abbrev} empty net`)]
          .filter(Boolean)
          .join(" · ")
      : "";
  return (
    <div className="grid grid-cols-[60px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 px-3 py-3 sm:grid-cols-[76px_minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-3 sm:px-4">
      <Status game={game} />
      <Team game={game} side="away" />
      <span className="flex min-w-16 justify-center">
        <Score game={game} />
      </span>
      <Team game={game} side="home" />
      {note ? <span className="col-span-3 col-start-2 mt-1 text-center text-[11.5px] font-semibold text-live">{note}</span> : null}
    </div>
  );
}
