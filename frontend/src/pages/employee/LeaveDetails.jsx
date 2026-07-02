import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function LeaveDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [leave, setLeave] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/leaves/${id}`)
      .then(({ data }) => setLeave(data.leave))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load this leave request."))
      .finally(() => setLoading(false));
  }, [id]);

  const backTo = user?.role === "MANAGER" ? "/manager/pending" : "/history";

  return (
    <AppLayout title="Leave request details">
      {loading && <Spinner />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {leave && (
        <div className="card max-w-xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">{leave.leave_type} leave</h2>
            <StatusBadge status={leave.status} />
          </div>

          <dl className="space-y-3 text-sm">
            <Row label="Start date" value={leave.start_date} />
            <Row label="End date" value={leave.end_date} />
            <Row label="Reason" value={leave.reason} />
            <Row label="Submitted" value={leave.created_at} />
            <Row label="Last updated" value={leave.updated_at} />
            {leave.manager_comments && <Row label="Manager comments" value={leave.manager_comments} />}
          </dl>

          <Link to={backTo} className="btn-secondary mt-6 inline-flex">
            ← Back
          </Link>
        </div>
      )}
    </AppLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0">
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
