import { getRouteApi } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

const root = getRouteApi("__root__");

const noSubscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * The time zone to show times in. During hydration it matches what the server
 * rendered (from the cookie); right after, it switches to the browser's zone,
 * which only differs on a first-ever visit before the cookie exists.
 */
export function useTimeZone(): string {
  const { timeZone } = root.useLoaderData();
  return useSyncExternalStore(noSubscribe, browserTimeZone, () => timeZone);
}

/** The league prefs the server rendered with. */
export function useServerPrefs() {
  return root.useLoaderData().prefs;
}
