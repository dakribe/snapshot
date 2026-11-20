import { useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";

const KEY = "snapshot.theme";
const EVENT = "snapshot:theme";

/** Inlined in <head>: sets data-theme before first paint so the page never flashes. */
export const themeBootScript = `(function(){try{var p=localStorage.getItem('${KEY}');var d=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=p==='light'||p==='dark'?p:(d?'dark':'light');}catch(e){}})()`;

let memory: ThemePref = "system";

function getSnapshot(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return memory;
  }
}

const getServerSnapshot = (): ThemePref => "system";

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

// While following the system, follow it live too.
function onSystem() {
  if (getSnapshot() === "system") apply("system");
}

function subscribe(onChange: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onSystem);
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setTheme(next: ThemePref) {
  memory = next;
  try {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
  apply(next);
  window.dispatchEvent(new Event(EVENT));
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [pref, setTheme] as const;
}
