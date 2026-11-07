/**
 * Utility functions for the HarvestAjo web app.
 */

/** Merge class names, filtering falsy values. Lightweight clsx alternative. */
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/** Truncate a Stellar address for display: GABC...XYZW */
export function truncateAddress(addr: string, start = 4, end = 4): string {
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/** Format a Unix timestamp as a short date. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Seconds remaining until a deadline. Returns 0 if passed. */
export function secondsRemaining(seasonStart: number, cycleSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, seasonStart + cycleSeconds - now);
}

/** Format seconds as "3d 4h" / "2h 15m" / "5m". */
export function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "Overdue";
}

/** Generate a short pseudo-avatar color from an address. */
export function addressColor(addr: string): string {
  let hash = 0;
  for (let i = 0; i < addr.length; i++) {
    hash = (hash << 5) - hash + addr.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 50%)`;
}
