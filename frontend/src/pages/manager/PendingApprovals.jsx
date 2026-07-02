import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import api from "../../api/client";

const LEAVE_TYPES = ["SICK", "CASUAL", "EARNED", "UNPAID"];

export default function PendingApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reviewing, setReviewing] = useState(null); // { leave, action: 'approve' | 'reject' }
  const [banner, setBanner] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (leaveType) params.leave_type = leaveType;
    api
      .get("/manager/pending-leaves", { params })
      .then(({ data }) => setLeaves(data.leaves))
      .catch(() => setError("Couldn't load pending approvals."))
      .finally(() => setLoading(false));
  }, [search, leaveType]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AppLayout title="Pending approvals" subtitle="Review and act on outstanding leave requests.">
      {banner && (
        <div className="mb-4 rounded-lg border border-approved/30 bg-approved/10 px-3.5 py-2.5 text-sm text-approved">
          {banner}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search employee name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[10rem]" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          <option value="">All types</option>
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <Spinner label="Loading pending requests..." />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          {leaves.length === 0 ? (
            <p className="p-6 text-sm text-muted">No pending requests right now.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((leave) => (
                  <tr key={leave.leave_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{leave.employee_name}</p>
                      <p className="text-xs text-muted">{leave.employee_email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">{leave.leave_type}</td>
                    <td className="px-4 py-3 text-muted">
                      {leave.start_date} → {leave.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/leaves/${leave.leave_id}`} className="font-medium text-brand-600 hover:underline">
                          View
                        </Link>
                        <button
                          className="font-medium text-approved hover:underline"
                          onClick={() => setReviewing({ leave, action: "approve" })}
                        >
                          Approve
                        </button>
                        <button
                          className="font-medium text-rejected hover:underline"
                          onClick={() => setReviewing({ leave, action: "reject" })}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          leave={reviewing.leave}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={(msg) => {
            setReviewing(null);
            setBanner(msg);
            load();
          }}
        />
      )}
    </AppLayout>
  );
}

function ReviewModal({ leave, action, onClose, onDone }) {
  const [comments, setComments] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isReject = action === "reject";

  async function handleConfirm() {
    setError(null);
    if (isReject && !comments.trim()) {
      setError("A comment is required when rejecting a request.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/manager/leaves/${leave.leave_id}/${action}`, { manager_comments: comments.trim() || undefined });
      onDone(isReject ? "Leave request rejected." : "Leave request approved.");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your decision.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isReject ? "Reject leave request" : "Approve leave request"} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">
        {leave.employee_name}'s {leave.leave_type.toLowerCase()} leave, {leave.start_date} to {leave.end_date}.
      </p>
      {error && <p className="mb-3 text-sm text-rejected">{error}</p>}
      <label className="label">
        Comments {isReject ? <span className="text-rejected">(required)</span> : <span className="text-muted">(optional)</span>}
      </label>
      <textarea
        rows={3}
        className="input mb-5 resize-none"
        placeholder={isReject ? "Explain why this request is being rejected..." : "Add a note (optional)..."}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
      <div className="flex gap-3">
        <button
          disabled={saving}
          onClick={handleConfirm}
          className={isReject ? "btn-danger" : "btn-primary"}
        >
          {saving ? "Submitting..." : isReject ? "Confirm rejection" : "Confirm approval"}
        </button>
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
