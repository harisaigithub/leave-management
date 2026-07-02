export default function StatCard({ label, value, accent = "brand" }) {
  const accents = {
    brand: "text-brand-600 bg-brand-50",
    pending: "text-pending bg-pending/10",
    approved: "text-approved bg-approved/10",
    rejected: "text-rejected bg-rejected/10",
  };
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 font-display text-3xl font-bold ${accents[accent]}`}>
        {value}
      </p>
    </div>
  );
}
