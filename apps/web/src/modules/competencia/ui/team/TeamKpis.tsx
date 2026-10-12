import type { TeamMatrixDto } from "@manutencao/shared";
import { teamKpis, type TeamFocus } from "../../model/team-insights";

type Kpi = { focus: TeamFocus | null; value: string; label: string; tone: string };

function kpiList(team: TeamMatrixDto): Kpi[] {
  const kpis = teamKpis(team);
  return [
    { focus: null, value: `${kpis.covered}/${kpis.total}`, label: "equipamentos com o mínimo de qualificados", tone: "text-accent" },
    { focus: "none", value: String(kpis.none), label: "sem ninguém qualificado", tone: kpis.none ? "text-danger" : "text-app" },
    { focus: "short", value: String(kpis.short), label: "abaixo do mínimo", tone: kpis.short ? "text-danger" : "text-app" },
    { focus: "single", value: String(kpis.single), label: "ponto único (só 1 pessoa)", tone: kpis.single ? "text-warn" : "text-app" },
    { focus: "pdi", value: String(kpis.pdiLate), label: "técnicos com PDI atrasado", tone: kpis.pdiLate ? "text-danger" : "text-app" },
  ];
}

// Números do topo. Clicar num deles mostra só os equipamentos (ou técnicos) daquele número; clicar de novo solta.
export function TeamKpis({ team, focus, onFocus }: { team: TeamMatrixDto; focus: TeamFocus | null; onFocus: (focus: TeamFocus | null) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {kpiList(team).map((kpi) => {
        const active = kpi.focus !== null && kpi.focus === focus;
        const content = (
          <>
            <span className={`text-2xl font-semibold leading-tight tabular-nums ${kpi.tone}`}>{kpi.value}</span>
            <span className="text-xs text-muted">{kpi.label}</span>
          </>
        );
        if (kpi.focus === null) {
          return (
            <div key="covered" className="col-span-2 flex flex-col gap-0.5 rounded-card border border-line bg-card px-4 py-3 shadow-card sm:col-span-1">
              {content}
            </div>
          );
        }
        return (
          <button
            key={kpi.focus}
            type="button"
            aria-pressed={active}
            title={active ? "Mostrar tudo de novo" : "Mostrar só estes"}
            onClick={() => onFocus(active ? null : kpi.focus)}
            className={`flex flex-col gap-0.5 rounded-card border bg-card px-4 py-3 text-left shadow-card transition hover:border-line-strong ${active ? "border-accent ring-2 ring-inset ring-accent" : "border-line"}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
