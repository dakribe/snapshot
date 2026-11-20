import type { TeamLogo as Logo } from "../lib/hockey";

/** Team mark; swaps to the dark-background variant in dark mode. */
export function TeamLogo({ logo, abbrev, size = 28 }: { logo: Logo; abbrev: string; size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <img src={logo.light} alt={abbrev} width={size} height={size} className="size-full object-contain dark:hidden" />
      <img src={logo.dark} alt="" aria-hidden width={size} height={size} className="hidden size-full object-contain dark:block" />
    </span>
  );
}
