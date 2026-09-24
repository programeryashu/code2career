import type { BookingStatus } from "../lib/types";

const STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-700",
};

const LABELS: Record<BookingStatus, string> = {
  pending: "🟡 Pending",
  accepted: "🟢 Accepted",
  declined: "🔴 Declined",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

export default StatusBadge;
