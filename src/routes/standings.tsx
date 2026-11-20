import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/standings")({
  head: () => ({ meta: [{ title: "Standings · Snapshot" }] }),
  component: () => (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-[-0.02em]">Standings</h1>
      <p className="mt-1 text-sm text-ink-2">Not built yet.</p>
    </div>
  ),
});
