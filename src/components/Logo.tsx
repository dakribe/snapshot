import { Link } from "@tanstack/react-router";

/** A puck in flight: indigo tile, white puck, orange motion lines. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="8" fill="var(--indigo)" />
      <ellipse cx="16.5" cy="15.6" rx="6.2" ry="3.4" fill="var(--on-indigo)" />
      <rect x="10.3" y="12.4" width="12.4" height="3.2" fill="var(--on-indigo)" />
      <ellipse cx="16.5" cy="12.4" rx="6.2" ry="3.4" fill="var(--indigo)" stroke="var(--on-indigo)" strokeWidth="1.6" />
      <path d="M3.6 12.6h4M4.6 16h3.4M5.8 19.4h2.4" stroke="var(--orange)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label="Snapshot, home">
      <LogoMark />
      <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">Snapshot</span>
    </Link>
  );
}
