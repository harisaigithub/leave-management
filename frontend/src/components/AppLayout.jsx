import Navbar from "./Navbar";

export default function AppLayout({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {(title || actions) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              {title && <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
