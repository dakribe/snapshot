import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team-of-the-week")({
  head: () => ({ meta: [{ title: "Team of the Week · Snapshot" }] }),
  component: () => (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-[-0.02em]">Team of the Week</h1>
      <p className="mt-1 text-sm text-ink-2">The week's best-rated players. Not built yet.</p>
    </div>
  ),
});
