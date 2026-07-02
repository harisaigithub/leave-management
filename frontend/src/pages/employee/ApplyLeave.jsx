import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import api from "../../api/client";

const LEAVE_TYPES = ["SICK", "CASUAL", "EARNED", "UNPAID"];

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ leave_type: "CASUAL", start_date: "", end_date: "", reason: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.start_date) errs.start_date = "Start date is required";
    if (!form.end_date) errs.end_date = "End date is required";
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      errs.end_date = "End date must be on or after the start date";
    }
    if (!form.reason.trim() || form.reason.trim().length < 5) {
      errs.reason = "Reason must be at least 5 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/leaves", form);
      navigate("/history", { replace: true, state: { justApplied: true } });
    } catch (err) {
      setFormError(err.response?.data?.message || "Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Apply for leave" subtitle="Submit a new leave request for manager review.">
      <form onSubmit={handleSubmit} noValidate className="card max-w-xl p-6">
        {formError && (
          <div role="alert" className="mb-4 rounded-lg border border-rejected/30 bg-rejected/10 px-3.5 py-2.5 text-sm text-rejected">
            {formError}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="leave_type" className="label">
            Leave type
          </label>
          <select
            id="leave_type"
            className="input"
            value={form.leave_type}
            onChange={(e) => update("leave_type", e.target.value)}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start_date" className="label">
              Start date
            </label>
            <input
              id="start_date"
              type="date"
              className="input"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              aria-invalid={!!errors.start_date}
            />
            {errors.start_date && <p className="mt-1 text-xs text-rejected">{errors.start_date}</p>}
          </div>
          <div>
            <label htmlFor="end_date" className="label">
              End date
            </label>
            <input
              id="end_date"
              type="date"
              className="input"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              aria-invalid={!!errors.end_date}
            />
            {errors.end_date && <p className="mt-1 text-xs text-rejected">{errors.end_date}</p>}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="reason" className="label">
            Reason
          </label>
          <textarea
            id="reason"
            rows={4}
            className="input resize-none"
            placeholder="Briefly explain the reason for this leave..."
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            aria-invalid={!!errors.reason}
          />
          {errors.reason && <p className="mt-1 text-xs text-rejected">{errors.reason}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Submitting..." : "Submit request"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
