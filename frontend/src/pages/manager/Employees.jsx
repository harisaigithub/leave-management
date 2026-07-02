import { useEffect, useState, useCallback } from "react";
import AppLayout from "../../components/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import api from "../../api/client";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    api
      .get("/employees", { params })
      .then(({ data }) => setEmployees(data.employees))
      .catch(() => setError("Couldn't load employees."))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AppLayout title="Employees" subtitle="Search employees and review their leave history.">
      <input
        className="input mb-4 max-w-xs"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <Spinner label="Loading employees..." />}
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          {employees.length === 0 ? (
            <p className="p-6 text-sm text-muted">No employees match your search.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                    <td className="px-4 py-3 text-muted">{emp.email}</td>
                    <td className="px-4 py-3 text-muted">{emp.department || "-"}</td>
                    <td className="px-4 py-3">
                      <button className="font-medium text-brand-600 hover:underline" onClick={() => setViewing(emp)}>
                        View leave history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewing && <EmployeeHistoryModal employee={viewing} onClose={() => setViewing(null)} />}
    </AppLayout>
  );
}

function EmployeeHistoryModal({ employee, onClose }) {
  const [leaves, setLeaves] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/manager/employees/${employee.employee_id}/leaves`)
      .then(({ data }) => setLeaves(data.leaves))
      .catch(() => setError("Couldn't load this employee's history."));
  }, [employee]);

  return (
    <Modal title={`${employee.name}'s leave history`} onClose={onClose}>
      {error && <p className="text-sm text-rejected">{error}</p>}
      {!leaves && !error && <Spinner />}
      {leaves && leaves.length === 0 && <p className="text-sm text-muted">No leave requests on record.</p>}
      {leaves && leaves.length > 0 && (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {leaves.map((leave) => (
            <li key={leave.leave_id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">{leave.leave_type}</p>
                <p className="text-xs text-muted">
                  {leave.start_date} → {leave.end_date}
                </p>
              </div>
              <StatusBadge status={leave.status} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
