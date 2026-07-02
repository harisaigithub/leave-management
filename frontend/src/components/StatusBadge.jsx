const STYLES = {
  PENDING: "bg-pending/10 text-pending",
  APPROVED: "bg-approved/10 text-approved",
  REJECTED: "bg-rejected/10 text-rejected",
  CANCELLED: "bg-cancelled/10 text-cancelled",
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || "bg-bg text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
