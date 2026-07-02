import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Spinner from "../../components/Spinner";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/employees/${user.employee_id}`)
      .then(({ data }) => setProfile(data.employee))
      .catch(() => setError("Couldn't load your profile."));
  }, [user]);

  return (
    <AppLayout title="Profile" subtitle="Your account details.">
      {error && <div className="card p-6 text-sm text-rejected">{error}</div>}
      {!profile && !error && <Spinner />}

      {profile && (
        <div className="card max-w-md p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 font-display text-xl font-bold text-brand-600">
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-display text-lg font-bold text-ink">{profile.name}</p>
              <p className="text-sm text-muted">{profile.role === "MANAGER" ? "Manager" : "Employee"}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-3">
              <dt className="font-medium text-muted">Email</dt>
              <dd className="text-ink">{profile.email}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <dt className="font-medium text-muted">Department</dt>
              <dd className="text-ink">{profile.department || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted">Member since</dt>
              <dd className="text-ink">{profile.created_at}</dd>
            </div>
          </dl>
        </div>
      )}
    </AppLayout>
  );
}
