import AppLayout from "../../components/AppLayout";

// Full implementation (stats cards + recent activity) lands in Step 6.
export default function EmployeeDashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Your leave overview at a glance.">
      <div className="card p-6 text-sm text-muted">Employee dashboard — built in Step 6.</div>
    </AppLayout>
  );
}
