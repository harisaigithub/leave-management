import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import api from "../../api/client";

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/manager/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => setError("Couldn't load the dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout
      title="Manager dashboard"
      subtitle="Organization-wide leave overview."
      actions={
        <Link to="/manager/pending" className="btn-primary">
          Review pending approvals
        </Link>
      }
    >
      {loading && <Spinner label="Loading dashboard..." />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total employees" value={data.totals.totalEmployees} />
            <StatCard label="Pending approvals" value={data.totals.pendingApprovals} accent="pending" />
            <StatCard label="Approved" value={data.totals.approved} accent="approved" />
            <StatCard label="Rejected" value={data.totals.rejected} accent="rejected" />
          </div>

          <div className="mt-8 card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Recent activity</h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted">No leave activity yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentActivity.map((leave) => (
                  <li key={leave.leave_id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {leave.employee_name} · {leave.leave_type}
                      </p>
                      <p className="text-xs text-muted">
                        {leave.start_date} to {leave.end_date} · updated {leave.updated_at}
                      </p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
