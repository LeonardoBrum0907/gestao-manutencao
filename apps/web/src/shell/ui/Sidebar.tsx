import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../../design/ui/icons";
import { useDashboard } from "../../modules/dashboard/data/dashboard";
import { useLogout } from "../data/session";
import { ThemeToggle } from "./ThemeToggle";

type Entry = { to: string; label: string; icon: IconName };

// Uso diário em cima; os cadastros de apoio ficam em Configurações, no rodapé.
const groups: { title?: string; items: Entry[] }[] = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/acompanhamento", label: "Pendências", icon: "list" },
    ],
  },
  {
    title: "Turno",
    items: [
      { to: "/turno/chamado", label: "Chamado", icon: "wrench" },
      { to: "/turno/ocorrencia", label: "Ocorrência", icon: "alert" },
    ],
  },
  {
    title: "Equipe",
    items: [
      { to: "/cadastro/colaboradores", label: "Colaboradores", icon: "user" },
      { to: "/cadastro/equipes", label: "Equipes", icon: "users" },
    ],
  },
];

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium ${
    isActive ? "bg-sidebar-active text-sidebar-text" : "text-sidebar-muted transition hover:bg-chip"
  }`;

function OverdueBadge() {
  const dashboard = useDashboard();
  const overdue = dashboard.data?.overdueCount ?? 0;
  if (!overdue) return null;
  return (
    <span className="ml-auto rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-danger">
      {overdue} {overdue === 1 ? "vencida" : "vencidas"}
    </span>
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
        className={`fixed inset-y-0 left-0 z-40 flex h-full min-h-0 w-[248px] shrink-0 flex-col overflow-hidden border-r border-sidebar-line bg-sidebar px-3 py-4 text-sidebar-text transition lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-accent text-sm font-bold text-accent-contrast" aria-hidden="true">
            G
          </span>
          <p className="text-[15px] font-semibold leading-tight">Gestão de Manutenção</p>
        </div>
        <NavLink
          to="/captura"
          onClick={onClose}
          className="mt-4 flex items-center justify-center gap-2 rounded-control bg-accent px-3 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
        >
          <Icon name="plus" />
          Registrar
        </NavLink>
        <nav aria-label="Menu" className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {groups.map((group, index) => (
            <div key={group.title ?? index}>
              {group.title ? (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-muted">{group.title}</p>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={onClose} className={itemClass}>
                    <Icon name={item.icon} />
                    {item.label}
                    {item.to === "/acompanhamento" ? <OverdueBadge /> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-3 flex flex-col gap-1 border-t border-sidebar-line pt-3">
          <NavLink to="/configuracoes" onClick={onClose} className={itemClass}>
            <Icon name="settings" />
            Configurações
          </NavLink>
          <div className="flex items-center gap-2 px-3 pt-1">
            <p className="min-w-0 flex-1 truncate text-xs text-sidebar-muted" title={email}>
              {email}
            </p>
            <ThemeToggle />
            <button
              type="button"
              aria-label="Sair"
              title="Sair"
              onClick={() => logout.mutate()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-chip text-app transition hover:bg-accent-soft"
            >
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
