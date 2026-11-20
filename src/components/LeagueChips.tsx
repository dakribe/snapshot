import { SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLeaguePrefs } from "../lib/useLeaguePrefs";
import { LeagueList } from "./LeagueList";

/**
 * Mobile and tablet: a chip row above the scores. Tap a chip to show or hide
 * that league; the Leagues button opens a sheet with favorites and switches.
 */
export function LeagueChips() {
  const { ordered, isFavorite, isShown, toggleHidden } = useLeaguePrefs();
  const sheet = useRef<HTMLDialogElement>(null);

  // A click that lands on the dialog element itself is a click on the backdrop.
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) el.close();
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2">
      <div className="no-scrollbar -ml-4 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pl-4">
        {ordered.map((l) => {
          const soon = l.status === "soon";
          const on = !soon && isShown(l.id);
          return (
            <button
              key={l.id}
              type="button"
              disabled={soon}
              aria-pressed={on}
              onClick={() => toggleHidden(l.id)}
              title={soon ? `${l.name}: coming soon` : on ? `Hide ${l.name} games` : `Show ${l.name} games`}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${
                soon
                  ? "border-dashed border-line-strong text-ink-3"
                  : on
                    ? "border-transparent bg-ink text-bg"
                    : "border-line-strong bg-surface text-ink-2"
              }`}
            >
              {isFavorite(l.id) ? (
                <Star className={`size-3.5 ${on ? "fill-orange text-orange" : "fill-orange/60 text-orange/60"}`} aria-hidden />
              ) : null}
              {l.name}
              {soon ? <span className="text-[11px] font-medium">soon</span> : null}
            </button>
          );
        })}
      </div>
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          aria-label="Leagues"
          title="Favorite or hide leagues"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink-2"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </button>
      </div>

      <dialog
        ref={sheet}
        aria-labelledby="leagues-sheet-title"
        className="sheet m-0 mt-auto w-full max-w-none rounded-t-[20px] bg-surface p-0 pb-[env(safe-area-inset-bottom)] text-ink shadow-pop"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="leagues-sheet-title" className="text-[16px] font-semibold">
            Leagues
          </h2>
          <button
            type="button"
            onClick={() => sheet.current?.close()}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="px-4 pt-3 text-[12.5px] text-ink-3">Star a league to pin it to the top. Switch it off to hide its games.</p>
        <div className="px-1 pb-4">
          <LeagueList />
        </div>
      </dialog>
    </div>
  );
}
