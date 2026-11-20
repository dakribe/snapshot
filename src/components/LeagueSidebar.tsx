import { LeagueList } from "./LeagueList";

/** Desktop: the league list as a sticky left column. */
export function LeagueSidebar() {
  return (
    <aside aria-label="Leagues" className="card sticky top-[72px] hidden overflow-hidden pb-1 lg:block">
      <div className="border-b border-line px-3 py-3">
        <h2 className="text-[15px] font-semibold">Leagues</h2>
        <p className="mt-0.5 text-[12px] text-ink-3">Star a league to pin it to the top. Switch it off to hide its games.</p>
      </div>
      <LeagueList compact />
    </aside>
  );
}
