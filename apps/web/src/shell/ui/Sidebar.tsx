import { NavLink } from "react-router-dom";
import { Button } from "../../design/ui/controls";
import { useLogout } from "../data/session";
import { ThemeToggle } from "./ThemeToggle";

const home = [{ to: "/dashboard", label: "Dashboard" }];

const notebook = [
  { to: "/captura", label: "Captura" },
  { to: "/acompanhamento", label: "Acompanhamento" },
  { to: "/registros", label: "Registros" },
];

const shift = [
  { to: "/turno/chamado", label: "Chamado" },
  { to: "/turno/ocorrencia", label: "Ocorrência" },
];

const support = [
  { to: "/cadastro/fabricas", label: "Fábricas" },
  { to: "/cadastro/maquinas", label: "Máquinas" },
  { to: "/cadastro/funcoes", label: "Funções" },
  { to: "/cadastro/graus", label: "Graus" },
  { to: "/cadastro/colaboradores", label: "Colaboradores" },
  { to: "/cadastro/equipes", label: "Equipes" },
];

function Item({ to, label, onNavigate }: { to: string; label: string; onNavigate: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block rounded-control px-3 py-2.5 text-sm font-medium ${
          isActive ? "bg-sidebar-active text-sidebar-text" : "text-sidebar-muted transition hover:bg-chip"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Sidebar({
  open,
  email,
  onClose,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
}) {
  const logout = useLogout();
  return (
    <>
      {open ? (
        <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={onClose} />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full min-h-0 w-[272px] shrink-0 flex-col overflow-hidden border-r border-sidebar-line bg-sidebar px-4 py-5 text-sidebar-text transition lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sidebar-muted">Gestor</p>
          <p className="mt-1 text-lg font-semibold leading-tight">Gestão de Manutenção</p>
          <p className="mt-1 truncate text-xs text-sidebar-muted">{email}</p>
        </div>
        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <div>
            <div className="flex flex-col gap-1">
              {home.map((item) => (
                <Item key={item.to} {...item} onNavigate={onClose} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-muted">Caderno</p>
            <div className="mt-2 flex flex-col gap-1">
              {notebook.map((item) => (
                <Item key={item.to} {...item} onNavigate={onClose} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-muted">Turno</p>
            <div className="mt-2 flex flex-col gap-1">
              {shift.map((item) => (
                <Item key={item.to} {...item} onNavigate={onClose} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-muted">Apoio</p>
            <div className="mt-2 flex flex-col gap-1">
              {support.map((item) => (
                <Item key={item.to} {...item} onNavigate={onClose} />
              ))}
            </div>
          </div>
        </nav>
        <div className="mt-4 flex flex-col gap-3 border-t border-sidebar-line pt-4">
          <ThemeToggle />
          <Button tone="ghost" onClick={() => logout.mutate()}>
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
