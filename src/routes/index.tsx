import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DateStrip } from "../components/DateStrip";
import { LeagueChips } from "../components/LeagueChips";
import { LeagueScores, LeagueScoresSkeleton } from "../components/LeagueScores";
import { LeagueSidebar } from "../components/LeagueSidebar";
import { RightRail } from "../components/RightRail";
import { formatDay, isDay } from "../lib/dates";
import { useLeaguePrefs } from "../lib/useLeaguePrefs";
import { getScores } from "../server/scores";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => (isDay(search.date) ? { date: search.date } : {}),
  loaderDeps: ({ search }) => ({ date: search.date ?? null }),
  loader: ({ deps }) => getScores({ data: { date: deps.date } }),
  head: () => ({ meta: [{ title: "Scores · Snapshot" }] }),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: () => (
    <Layout>
      <div className="card h-[76px] animate-pulse" aria-hidden />
      <LeagueScoresSkeleton />
    </Layout>
  ),
  errorComponent: ScoresError,
  component: ScoresPage,
});

function Layout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
      <LeagueSidebar />
      <div className="min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Scores</h1>
          {title ? <p className="mt-0.5 text-sm text-ink-2">{title}</p> : null}
        </div>
        <LeagueChips />
        {children}
      </div>
      <RightRail />
    </div>
  );
}

function ScoresPage() {
  const page = Route.useLoaderData();
  const { ordered, isShown, isFavorite } = useLeaguePrefs();
  const byLeague = new Map(page.leagues.map((l) => [l.league, l]));
  const shown = ordered.filter((l) => l.status === "live" && isShown(l.id) && byLeague.has(l.id));

  return (
    <Layout title={formatDay(page.date, { weekday: "long", month: "long", day: "numeric" })}>
      <DateStrip date={page.date} days={page.days} />
      {shown.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">Every league is switched off.</p>
          <p className="mt-1 text-sm text-ink-2">Switch one back on to see its games.</p>
        </div>
      ) : (
        shown.map((l) => <LeagueScores key={l.id} scores={byLeague.get(l.id)!} favorite={isFavorite(l.id)} />)
      )}
    </Layout>
  );
}

function ScoresError() {
  const router = useRouter();
  return (
    <Layout>
      <div className="card p-8 text-center">
        <p className="font-semibold">Scores are unavailable right now.</p>
        <p className="mt-1 text-sm text-ink-2">We couldn't reach the leagues' data. This is usually brief.</p>
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="mt-4 rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-on-indigo"
        >
          Try again
        </button>
      </div>
    </Layout>
  );
}
