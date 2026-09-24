export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Deadline is stored as YYYY-MM-DD. */
export function formatDeadline(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Short relative label for "posted" timestamps. */
export function postedLabel(isoDateTime: string): string {
  const then = new Date(isoDateTime).getTime();
  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  if (days === 0) return "posted today";
  if (days === 1) return "posted yesterday";
  return `posted ${days}d ago`;
}
