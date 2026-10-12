import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../design/ui/icons";
import { barShare } from "../model/overview-format";

const COLLAPSED_KEY = "dashboard.faixas-recolhidas";

function readCollapsed(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// Faixa recolhida fica guardada no aparelho, como o "Agrupar por" de Registros.
function useCollapsed(id: string): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(() => readCollapsed().includes(id));
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      const others = readCollapsed().filter((item) => item !== id);
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next ? [...others, id] : others));
    } catch {
      // Sem armazenamento (aba anônima): vale só nesta visita.
    }
  }
  return [collapsed, toggle];
}

/** Uma faixa do Dashboard (Agora, Máquinas, Equipe), que abre e recolhe pelo título. */
export function Band({ id, title, detail, children }: { id: string; title: string; detail?: string; children: ReactNode }) {
  const [collapsed, toggle] = useCollapsed(id);
  return (
    <section aria-labelledby={`faixa-${id}`} className="flex flex-col gap-3">
      <button type="button" onClick={toggle} aria-expanded={!collapsed} className="flex w-fit items-center gap-2 text-left">
        <Icon name="chevron" className={`h-4 w-4 text-muted transition ${collapsed ? "" : "rotate-90"}`} />
        <h2 id={`faixa-${id}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </h2>
        {detail ? <span className="text-xs text-muted">· {detail}</span> : null}
      </button>
      {collapsed ? null : children}
    </section>
  );
}

/** Quadro dentro de uma faixa: título pequeno e o conteúdo. */
export function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-card border border-line bg-card p-4 shadow-card ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-app">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export type KpiTone = "neutral" | "danger" | "warn" | "today";

const kpiFrame: Record<KpiTone, string> = {
  neutral: "border-line bg-card",
  danger: "border-danger bg-danger-soft",
  warn: "border-warn bg-warn-soft",
  today: "border-line bg-accent-soft",
};
const kpiNumber: Record<KpiTone, string> = { neutral: "text-app", danger: "text-danger", warn: "text-warn", today: "text-app" };

/** Número grande clicável que leva à lista já filtrada. */
export function Kpi({ to, label, value, sub, tone = "neutral" }: { to: string; label: string; value: number | string; sub?: string; tone?: KpiTone }) {
  return (
    <Link to={to} className={`flex min-w-0 flex-col gap-0.5 rounded-card border px-4 py-3 shadow-card transition hover:border-accent ${kpiFrame[tone]}`}>
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className={`text-3xl font-semibold leading-tight tabular-nums ${kpiNumber[tone]}`}>{value}</span>
      {sub ? <span className="text-xs text-muted">{sub}</span> : null}
    </Link>
  );
}

export type BarRow = { key: string; label: string; value: number; detail?: string; to?: string };

/** Barras horizontais na mesma escala (a maior ocupa a largura toda): nome e valor em cima, barra embaixo. */
export function BarList({ rows, empty, unit }: { rows: BarRow[]; empty: string; unit: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.key} title={`${row.label}: ${row.value} ${unit}`} className="flex flex-col gap-1 text-sm">
          <span className="flex items-baseline justify-between gap-3">
            {row.to ? (
              <Link to={row.to} className="min-w-0 truncate text-app hover:text-accent hover:underline">
                {row.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate text-app">{row.label}</span>
            )}
            <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted">
              <span className="font-semibold text-app">{row.value}</span>
              {row.detail ? ` · ${row.detail}` : ""}
            </span>
          </span>
          <span className="block h-2 rounded-r bg-chart" style={{ width: `${barShare(row.value, max)}%` }} />
        </li>
      ))}
    </ul>
  );
}
