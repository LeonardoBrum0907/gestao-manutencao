import { Link } from "react-router-dom";
import { RP_FOUR_M, RP_FOUR_M_LABELS, type DashboardMachinesDto } from "@manutencao/shared";
import { compareTo, formatDuration, paretoEmptyText, type Trend } from "../model/overview-format";
import { Band, BarList, Panel, type BarRow } from "./band";
import { ColumnChart } from "./ColumnChart";

// Seta e diferença para o período anterior. `lowerIsBetter`: menos chamados ou menos minutos é bom (verde).
function TrendNote({ trend, lowerIsBetter, unit }: { trend: Trend | null; lowerIsBetter: boolean; unit: (value: number) => string }) {
  if (!trend) return <span className="text-xs text-muted">sem período anterior para comparar</span>;
  if (trend.direction === "same") return <span className="text-xs text-muted">igual ao período anterior</span>;
  const good = (trend.direction === "down") === lowerIsBetter;
  const arrow = trend.direction === "up" ? "▲" : "▼";
  return (
    <span className={`text-xs font-semibold ${good ? "text-accent-ink" : "text-danger"}`}>
      {arrow} {unit(Math.abs(trend.diff))} {trend.direction === "up" ? "a mais" : "a menos"} que o período anterior
    </span>
  );
}

function Totals({ machines }: { machines: DashboardMachinesDto }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <div className="flex flex-col gap-0.5 rounded-card border border-line bg-card px-4 py-3 shadow-card">
        <span className="text-xs font-medium text-muted">Chamados</span>
        <span className="text-3xl font-semibold leading-tight tabular-nums text-app">{machines.chamados}</span>
        <TrendNote trend={compareTo(machines.chamados, machines.previousChamados)} lowerIsBetter unit={String} />
      </div>
      <div className="flex flex-col gap-0.5 rounded-card border border-line bg-card px-4 py-3 shadow-card">
        <span className="text-xs font-medium text-muted">Tempo médio de atendimento</span>
        <span className="text-3xl font-semibold leading-tight tabular-nums text-app">{machines.avgMinutes === null ? "—" : formatDuration(machines.avgMinutes)}</span>
        <TrendNote trend={compareTo(machines.avgMinutes, machines.previousAvgMinutes)} lowerIsBetter unit={formatDuration} />
      </div>
    </div>
  );
}

function paretoRows(machines: DashboardMachinesDto): BarRow[] {
  return machines.pareto.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.count,
    detail: formatDuration(item.minutes),
    to: item.key.startsWith("line:") ? undefined : `/maquinas/${item.key}`,
  }));
}

function Repeats({ machines }: { machines: DashboardMachinesDto }) {
  if (!machines.repeats.length) return <p className="text-sm text-muted">Nenhuma máquina com 2 ou mais falhas no período.</p>;
  return (
    <ol className="flex flex-col">
      {machines.repeats.map((item) => (
        <li key={item.machineId} className="flex items-start justify-between gap-3 border-t border-line py-2 text-sm first:border-t-0 first:pt-0">
          <Link to={`/maquinas/${item.machineId}`} className="min-w-0 hover:text-accent">
            <span className="block truncate font-medium text-app">{item.label}</span>
            {item.subassembly ? <span className="text-xs text-muted">mais citado: {item.subassembly}</span> : null}
          </Link>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-danger">{item.count}×</span>
        </li>
      ))}
    </ol>
  );
}

function fourMRows(machines: DashboardMachinesDto): BarRow[] {
  return RP_FOUR_M.map((key) => ({ key, label: RP_FOUR_M_LABELS[key], value: machines.fourM[key] }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Faixa Máquinas: onde o período concentrou chamados, falhas repetidas e as causas das RPs. */
export function MachinesBand({ machines }: { machines: DashboardMachinesDto }) {
  return (
    <Band id="maquinas" title="Máquinas" detail={`últimos ${machines.days} dias`}>
      <Totals machines={machines} />
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Máquinas com mais chamados">
          <BarList rows={paretoRows(machines)} unit="chamados" empty={paretoEmptyText(machines.chamados)} />
          <p className="text-xs text-muted">Barra = chamados; ao lado, o tempo somado entre abrir e fechar.</p>
        </Panel>
        <Panel title="Chamados por semana">
          <ColumnChart
            weeks={machines.weekly.map((week) => week.weekStart)}
            series={[{ label: "Chamados", fill: "fill-chart", swatch: "bg-chart", values: machines.weekly.map((week) => week.count) }]}
            label="Chamados abertos em cada uma das últimas 8 semanas"
          />
        </Panel>
        <Panel title="Falhas repetidas" className="lg:col-span-2 xl:col-span-1">
          <Repeats machines={machines} />
          <h4 className="pt-1 text-sm font-semibold text-app">Causas das RPs (4M)</h4>
          <BarList rows={fourMRows(machines)} unit="RPs" empty="Nenhuma RP com causa marcada no período." />
        </Panel>
      </div>
    </Band>
  );
}
