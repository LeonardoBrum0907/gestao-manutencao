import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../data/session";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  if (session.isPending) {
    return <p className="p-8 text-sm text-muted">Carregando…</p>;
  }
  if (!session.data) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-canvas text-app lg:grid lg:grid-cols-[272px_1fr]">
      <Sidebar open={open} email={session.data.email} onClose={() => setOpen(false)} />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <button type="button" className="text-sm font-semibold text-app" onClick={() => setOpen(true)}>
            Menu
          </button>
          <span className="text-sm font-semibold">Gestão</span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
