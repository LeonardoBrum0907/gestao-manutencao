import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCrumbLabel, useNavTrail, type Crumb } from "../../app/nav-trail";
import { Icon } from "./icons";

// Para onde o "Voltar" leva quando a tela foi aberta direto (link salvo, outra aba), sem trilha.
export type BackTo = { to: string; label: string };

const crumbLink = "truncate rounded px-0.5 font-medium text-accent hover:underline";

// Barra do topo da tela: "←" volta um passo e a trilha mostra o caminho desde o menu.
// No celular fica só o botão com o nome da tela anterior; o "…" abre o caminho inteiro.
// `current` também é o nome desta tela na trilha das telas que ela abrir.
export function NavTrail({ current, back, className = "mb-4" }: { current: string; back?: BackTo; className?: string }) {
  useCrumbLabel(current);
  const { trail, goTo } = useNavTrail();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const fallback = trail.length === 0;
  const crumbs: Crumb[] = fallback ? (back ? [{ url: back.to, label: back.label, idx: null }] : []) : trail;
  if (crumbs.length === 0) return null;
  const last = crumbs[crumbs.length - 1];

  // Sem trilha, voltar troca a tela no histórico: a lista não ganha um "voltar" para a ficha que acabou de deixar.
  function go(crumb: Crumb) {
    setOpen(false);
    if (fallback) navigate(crumb.url, { replace: true });
    else goTo(crumb);
  }

  // Ctrl/⌘+clique e botão do meio continuam abrindo em outra aba.
  function onClick(event: MouseEvent, crumb: Crumb) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(crumb);
  }

  // No computador, caminho longo mostra o começo e os dois últimos passos; o "…" abre o resto.
  const hidden = !open && crumbs.length > 4 ? crumbs.slice(1, -2) : [];
  const shown = hidden.length ? [crumbs[0], null, ...crumbs.slice(-2)] : crumbs;

  return (
    <nav aria-label="Caminho" className={`app-chrome min-w-0 text-sm ${className}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={last.url}
          onClick={(event) => onClick(event, last)}
          title={`Voltar para ${last.label}`}
          aria-label={`Voltar para ${last.label}`}
          className="inline-flex min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-control border border-line bg-chip px-2.5 py-1.5 font-semibold text-app transition hover:bg-accent-soft sm:max-w-none sm:px-2"
        >
          <Icon name="back" className="h-4 w-4" />
          <span className="truncate sm:hidden">{last.label}</span>
        </Link>
        {crumbs.length > 1 ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fechar caminho" : "Mostrar caminho"}
            onClick={() => setOpen(!open)}
            className="shrink-0 rounded-control px-2 py-1.5 font-semibold text-muted transition hover:bg-chip hover:text-app sm:hidden"
          >
            …
          </button>
        ) : null}
        <ol className="hidden min-w-0 items-center gap-1 sm:flex">
          {shown.map((crumb, index) => (
            <li key={crumb ? crumb.url + index : "mais"} className="flex min-w-0 items-center gap-1">
              {crumb ? (
                <Link to={crumb.url} onClick={(event) => onClick(event, crumb)} className={`${crumbLink} max-w-[14rem]`}>
                  {crumb.label}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-label={`Mostrar mais ${hidden.length} telas do caminho`}
                  onClick={() => setOpen(true)}
                  className="rounded px-1 font-semibold text-muted hover:bg-chip hover:text-app"
                >
                  …
                </button>
              )}
              <Icon name="chevron" className="h-3.5 w-3.5 text-muted" />
            </li>
          ))}
          <li aria-current="page" className="min-w-0 truncate text-muted">
            {current}
          </li>
        </ol>
      </div>
      {open ? (
        <ol className="mt-2 flex flex-col rounded-card border border-line bg-card p-1.5 shadow-card sm:hidden">
          {crumbs.map((crumb, index) => (
            <li key={crumb.url + index}>
              <Link
                to={crumb.url}
                onClick={(event) => onClick(event, crumb)}
                className="flex items-center gap-2 rounded-control px-2.5 py-2 font-medium text-accent hover:bg-chip"
                style={{ paddingLeft: `${0.625 + index * 0.75}rem` }}
              >
                <span className="truncate">{crumb.label}</span>
              </Link>
            </li>
          ))}
          <li
            aria-current="page"
            className="truncate px-2.5 py-2 text-muted"
            style={{ paddingLeft: `${0.625 + crumbs.length * 0.75}rem` }}
          >
            {current}
          </li>
        </ol>
      ) : null}
    </nav>
  );
}
