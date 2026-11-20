/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { themeBootScript } from "../lib/theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Snapshot" },
      { name: "description", content: "Live hockey scores, player ratings and Team of the Week." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect width='28' height='28' rx='8' fill='%234f46e5'/%3E%3Cellipse cx='16.5' cy='15.6' rx='6.2' ry='3.4' fill='white'/%3E%3Crect x='10.3' y='12.4' width='12.4' height='3.2' fill='white'/%3E%3Cellipse cx='16.5' cy='12.4' rx='6.2' ry='3.4' fill='%234f46e5' stroke='white' stroke-width='1.6'/%3E%3Cpath d='M3.6 12.6h4M4.6 16h3.4M5.8 19.4h2.4' stroke='%23f08a3c' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E",
      },
    ],
    scripts: [{ children: themeBootScript }],
  }),
  shellComponent: RootDocument,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink-2">That page doesn't exist.</p>
      <Link to="/" className="mt-5 inline-block rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-on-indigo">
        Go to scores
      </Link>
    </div>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // data-theme is set by the boot script before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
