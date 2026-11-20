import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

/** Desktop right column. Placeholder until Team of the Week exists. */
export function RightRail() {
  return (
    <aside aria-label="More" className="hidden space-y-4 xl:block">
      <Link to="/team-of-the-week" className="card block p-4 transition-colors hover:bg-surface-2">
        <span className="flex items-center gap-2">
          <Trophy className="size-4 text-orange" aria-hidden />
          <span className="text-[15px] font-semibold">Team of the Week</span>
          <span className="ml-auto rounded-full bg-surface-2 px-1.5 py-px text-[10.5px] font-semibold text-ink-3">Soon</span>
        </span>
        <span className="mt-1.5 block text-[13px] text-ink-3">The week's best-rated forwards, defense and goalie.</span>
      </Link>
    </aside>
  );
}
