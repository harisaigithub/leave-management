import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import api from "../../api/client";

const LEAVE_TYPES = ["SICK", "CASUAL", "EARNED", "UNPAID"];
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function LeaveHistory() {
  const location = useLocation();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [editing, setEditing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [banner, setBanner] = useState(location.state?.justApplied ? "Leave request submitted successfully." : null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (leaveType) params.leave_type = leaveType;
    api
      .get("/leaves", { params })
      .then(({ data }) => setLeaves(data.leaves))
      .catch(() => setError("Couldn't load your leave history."))
      .finally(() => setLoading(false));
  }, [search, status, leaveType]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search/filter
    return () => clearTimeout(t);
  }, [load]);

  async function handleCancel(id) {
    setActionError(null);
    try {
      await api.delete(`/leaves/${id}`);
      setCancelling(null);
      setBanner("Leave request cancelled.");
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't cancel this request.");
    }
  }

  return (
    <AppLayout title="Leave history" subtitle="Search, filter, and manage your leave requests.">
      {banner && (
        <div className="mb-4 rounded-lg border border-approved/30 bg-approved/10 px-3.5 py-2.5 text-sm text-approved">
          {banner}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search by reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input max-w-[10rem]" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          <option value="">All types</option>
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <Spinner label="Loading leave history..." />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          {leaves.length === 0 ? (
            <p className="p-6 text-sm text-muted">No leave requests match your filters.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((leave) => (
                  <tr key={leave.leave_id}>
                    <td className="px-4 py-3 font-medium text-ink">{leave.leave_type}</td>
                    <td className="px-4 py-3 text-muted">
                      {leave.start_date} → {leave.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/leaves/${leave.leave_id}`} className="font-medium text-brand-600 hover:underline">
                          View
                        </Link>
                        {leave.status === "PENDING" && (
                          <>
                            <button className="font-medium text-brand-600 hover:underline" onClick={() => setEditing(leave)}>
                              Edit
                            </button>
                            <button className="font-medium text-rejected hover:underline" onClick={() => setCancelling(leave)}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        <EditLeaveModal
          leave={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setBanner("Leave request updated.");
            load();
          }}
        />
      )}

      {cancelling && (
        <Modal title="Cancel leave request" onClose={() => setCancelling(null)}>
          {actionError && <p className="mb-3 text-sm text-rejected">{actionError}</p>}
          <p className="mb-5 text-sm text-muted">
            Are you sure you want to cancel your {cancelling.leave_type.toLowerCase()} leave from {cancelling.start_date} to{" "}
            {cancelling.end_date}? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn-danger" onClick={() => handleCancel(cancelling.leave_id)}>
              Yes, cancel it
            </button>
            <button className="btn-secondary" onClick={() => setCancelling(null)}>
              Keep it
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

function EditLeaveModal({ leave, onClose, onSaved }) {
  const [form, setForm] = useState({
    leave_type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date,
    reason: leave.reason,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    if (form.start_date > form.end_date) {
      setError("End date must be on or after the start date");
      return;
    }
    if (form.reason.trim().length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/leaves/${leave.leave_id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit leave request" onClose={onClose}>
      <form onSubmit={handleSave} noValidate>
        {error && <p className="mb-3 text-sm text-rejected">{error}</p>}
        <div className="mb-3">
          <label className="label">Leave type</label>
          <select
            className="input"
            value={form.leave_type}
            onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
          >
            {["SICK", "CASUAL", "EARNED", "UNPAID"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input
              type="date"
              className="input"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              type="date"
              className="input"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </div>
        </div>
        <div className="mb-5">
          <label className="label">Reason</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Discard
          </button>
        </div>
      </form>
    </Modal>
  );
}
