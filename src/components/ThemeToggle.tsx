import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePref } from "../lib/theme";

const ORDER: ThemePref[] = ["system", "light", "dark"];
const LABEL: Record<ThemePref, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

export function ThemeToggle() {
  const [pref, setPref] = useTheme();
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setPref(next)}
      className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label={`${LABEL[pref]}. Switch to ${LABEL[next].toLowerCase()}.`}
      title={LABEL[pref]}
    >
      <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
    </button>
  );
}
