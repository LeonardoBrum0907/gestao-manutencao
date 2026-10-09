import { useState } from "react";
import { Link, Navigate, Outlet, useMatch } from "react-router-dom";
import { MENU_STATE } from "../../app/nav-trail";
import { useSession } from "../data/session";
import { Icon } from "../../design/ui/icons";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  // Telas de tabela larga usam a largura toda; as demais ficam numa coluna de leitura.
  const wide = useMatch("/competencias");

  if (session.isPending) {
    return <p className="h-full overflow-y-auto bg-canvas p-8 text-sm text-muted">Carregando…</p>;
  }
  if (!session.data) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell flex h-full overflow-hidden bg-canvas text-app">
      <Sidebar open={open} email={session.data.email} onClose={() => setOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-chrome flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2 lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-control text-app transition hover:bg-chip"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <Link
            to="/captura"
            state={MENU_STATE}
            className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast"
          >
            <Icon name="plus" />
            Registrar
          </Link>
        </header>
        <main className="app-main min-h-0 flex-1 overflow-y-auto">
          <div className={`app-page mx-auto w-full px-4 py-6 sm:px-8 sm:py-8 ${wide ? "" : "max-w-5xl"}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
