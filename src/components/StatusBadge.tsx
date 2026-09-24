import type { BookingStatus } from "../lib/types";

const STYLES: Record<BookingStatus, { bg: string; text: string; border: string; icon: string; label: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    icon: "⏱",
    label: "Pending Review",
  },
  accepted: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/80",
    icon: "✓",
    label: "Accepted",
  },
  declined: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200/80",
    icon: "✕",
    label: "Declined",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const conf = STYLES[status] || STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <span className="font-bold text-[11px]">{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
}

export default StatusBadge;
