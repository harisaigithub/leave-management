import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Already logged in? Skip the login screen.
  if (user) {
    const from = location.state?.from?.pathname || (user.role === "MANAGER" ? "/manager/dashboard" : "/dashboard");
    return <Navigate to={from} replace />;
  }

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.role === "MANAGER" ? "/manager/dashboard" : "/dashboard", { replace: true });
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="mb-3">
            <rect width="28" height="28" rx="8" fill="#2F6F5E" />
            <path d="M8 14.5L12 18.5L20 9.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="font-display text-2xl font-bold text-ink">Sign in to Leave Hub</h1>
          <p className="mt-1 text-sm text-muted">Manage leave requests and approvals in one place.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card p-6">
          {formError && (
            <div role="alert" className="mb-4 rounded-lg border border-rejected/30 bg-rejected/10 px-3.5 py-2.5 text-sm text-rejected">
              {formError}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-rejected">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-rejected">{fieldErrors.password}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-border bg-white px-4 py-3 text-xs text-muted">
          <p className="mb-1 font-medium text-ink">Demo credentials</p>
          <p>Employee - employee@demo.com / Employee@123</p>
          <p>Manager - manager@demo.com / Manager@123</p>
        </div>
      </div>
    </div>
  );
}
