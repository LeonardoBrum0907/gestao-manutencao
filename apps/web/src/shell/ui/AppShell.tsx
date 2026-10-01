import { useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { useSession } from "../data/session";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  if (session.isPending) {
    return <p className="h-full overflow-y-auto bg-canvas p-8 text-sm text-muted">Carregando…</p>;
  }
  if (!session.data) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-full overflow-hidden bg-canvas text-app">
      <Sidebar open={open} email={session.data.email} onClose={() => setOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <button type="button" className="text-sm font-semibold text-app" onClick={() => setOpen(true)}>
            Menu
          </button>
          <Link to="/captura" className="text-sm font-semibold text-accent">
            Captura
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
