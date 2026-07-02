import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import api from "../../api/client";

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dashboard/employee")
      .then(({ data }) => !cancelled && setData(data))
      .catch(() => !cancelled && setError("Couldn't load your dashboard. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Your leave overview at a glance."
      actions={
        <Link to="/apply" className="btn-primary">
          Apply for leave
        </Link>
      }
    >
      {loading && <Spinner label="Loading your dashboard..." />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total requests" value={data.totals.total} />
            <StatCard label="Approved" value={data.totals.approved} accent="approved" />
            <StatCard label="Pending" value={data.totals.pending} accent="pending" />
            <StatCard label="Rejected" value={data.totals.rejected} accent="rejected" />
          </div>

          <div className="mt-8 card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Recent activity</h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted">No leave requests yet - apply for your first one above.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentActivity.map((leave) => (
                  <li key={leave.leave_id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {leave.leave_type} · {leave.start_date} to {leave.end_date}
                      </p>
                      <p className="text-xs text-muted">Updated {leave.updated_at}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={leave.status} />
                      <Link to={`/leaves/${leave.leave_id}`} className="text-sm font-medium text-brand-600 hover:underline">
                        View
                      </Link>
                    </div>
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
