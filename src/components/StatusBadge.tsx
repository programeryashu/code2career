import type { BookingStatus } from "../lib/types";

const STYLES: Record<
  BookingStatus,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-500/30",
    icon: "⏱",
    label: "Pending Review",
  },
  accepted: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-500/30",
    icon: "✓",
    label: "Accepted",
  },
  declined: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-500/30",
    icon: "✕",
    label: "Declined",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const conf = STYLES[status] || STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-transform duration-150 ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <span className="text-[11px] font-bold">{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
}

export default StatusBadge;
