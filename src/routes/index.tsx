import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { LeagueChips } from "../components/LeagueChips";
import { LeagueMark } from "../components/LeagueMark";
import { LeagueSidebar } from "../components/LeagueSidebar";
import { useLeaguePrefs } from "../lib/useLeaguePrefs";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Scores · Snapshot" }] }),
  component: ScoresPage,
});

function ScoresPage() {
  const { ordered, isShown, isFavorite } = useLeaguePrefs();
  const shown = ordered.filter((l) => l.status === "live" && isShown(l.id));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <LeagueSidebar />

      <div className="min-w-0 space-y-4">
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Scores</h1>
        <LeagueChips />

        {shown.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-semibold">Every league is switched off.</p>
            <p className="mt-1 text-sm text-ink-2">Switch one back on to see its games.</p>
          </div>
        ) : (
          shown.map((l) => (
            <section key={l.id} className="card overflow-hidden" aria-labelledby={`league-${l.id}`}>
              <h2 id={`league-${l.id}`} className="flex items-center gap-2.5 border-b border-line px-4 py-3 text-[15px] font-semibold">
                <LeagueMark league={l} size={24} />
                {l.name}
                {isFavorite(l.id) ? <Star className="size-3.5 fill-orange text-orange" aria-label="Favorite" /> : null}
              </h2>
              <p className="px-4 py-8 text-center text-sm text-ink-3">No games loaded yet.</p>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
