import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Scores", short: "Scores", icon: CalendarDays },
  { to: "/team-of-the-week", label: "Team of the Week", short: "TOTW", icon: Trophy },
  { to: "/standings", label: "Standings", short: "Standings", icon: ListOrdered },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                aria-current={isActive(n.to) ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive(n.to) ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4 pb-10 md:pt-6">{children}</main>

      <footer className="mx-auto hidden max-w-7xl px-4 pb-8 text-xs text-ink-3 md:block">
        Unofficial. Not affiliated with or endorsed by the NHL, PWHL or AHL.
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                active ? "text-indigo-ink" : "text-ink-3"
              }`}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
              {n.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
