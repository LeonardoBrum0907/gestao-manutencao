import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { MENU_STATE } from "../../app/nav-trail";
import { useSession } from "../data/session";
import { loginReturnState } from "../model/login-return";
import { Icon } from "../../design/ui/icons";
import { NotebookIcon } from "../../design/ui/brand-mark";
import { Sidebar } from "./Sidebar";

// Esc fecha o menu do celular e devolve o foco ao botão que o abriu, como nas janelas (dialog.ts).
function useCloseMenuOnEscape(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      closeRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
}

export function AppShell() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useCloseMenuOnEscape(open, () => {
    setOpen(false);
    menuButton.current?.focus();
  });
  // Telas de tabela larga usam a largura toda; as demais ficam numa coluna de leitura.
  const wide = useMatch("/competencias");
  const location = useLocation();

  if (session.isPending) {
    return <p className="h-full overflow-y-auto bg-canvas p-8 text-sm text-muted">Carregando…</p>;
  }
  // Leva a tela pedida para o login devolver a pessoa a ela (link de aviso, link aberto no PC, sessão vencida).
  if (!session.data) return <Navigate to="/login" replace state={loginReturnState(location)} />;

  return (
    <div className="app-shell flex h-full overflow-hidden bg-canvas text-app">
      <Sidebar open={open} email={session.data.email} onClose={() => setOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-chrome flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2 lg:hidden">
          <div className="flex items-center gap-1">
            <button
              ref={menuButton}
              type="button"
              aria-label="Abrir menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-control text-app transition hover:bg-chip"
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <NotebookIcon className="h-7 w-7 rounded-control" />
          </div>
          <Link
            to="/entrada"
            state={MENU_STATE}
            className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast"
          >
            <Icon name="inbox" />
            Entrada
          </Link>
        </header>
        <main className="app-main min-h-0 flex-1 overflow-y-auto">
          <div className={`app-page mx-auto w-full px-4 py-6 sm:px-8 sm:py-8 ${wide ? "" : "max-w-page"}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
