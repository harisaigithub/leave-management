import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-3 font-display text-xl font-bold text-ink">This page doesn't exist</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        The page you're looking for was moved, renamed, or never existed. Check the link or head back to your dashboard.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
