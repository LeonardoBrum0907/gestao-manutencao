import { Link } from "react-router-dom";
import type { DashboardChamadoDto, DashboardFlowWeekDto, DashboardNowDto } from "@manutencao/shared";
import { dayOf } from "../../turno/model/chamado";
import { formatDuration, LONG_OPEN_MINUTES, minutesSince, shortDate } from "../model/overview-format";
import { Band, Kpi, Panel } from "./band";
import { ColumnChart } from "./ColumnChart";

function NowKpis({ now, at }: { now: DashboardNowDto; at: Date }) {
  const long = now.openChamados.filter((item) => minutesSince(item.openedAt, at) >= LONG_OPEN_MINUTES).length;
  const stopped = now.stoppedLines.map((line) => line.name).join(", ");
  const settingUp = now.settingUpLines ? ` · ${now.settingUpLines} em ajuste` : "";
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi to="/turno/chamados" label="Chamados abertos" value={now.openChamados.length} sub={long ? `${long} há mais de 2 h` : "nenhum há mais de 2 h"} tone={long ? "warn" : "neutral"} />
      <Kpi to="/registros?due=overdue" label="Tarefas vencidas" value={now.overdueTasks} sub={`${now.overdueHighTasks} de alta prioridade`} tone={now.overdueTasks ? "danger" : "neutral"} />
      <Kpi to="/registros?due=today" label="Vencem hoje" value={now.dueTodayTasks} tone="today" />
      <Kpi to="/configuracoes/fabricas" label="Linhas paradas" value={now.stoppedLines.length} sub={`${stopped || "nenhuma"}${settingUp}`} tone={now.stoppedLines.length ? "danger" : "neutral"} />
      <Kpi to="/rp?status=analysis" label="RPs em análise" value={now.rpsInAnalysis} sub={`${now.rpsWithoutRootCause} sem causa raiz`} />
      <Kpi to="/entrada" label="Rascunhos na Entrada" value={now.drafts} sub={now.oldestDraftAt ? `o mais antigo de ${shortDate(now.oldestDraftAt)}` : "nada para triar"} />
    </div>
  );
}

function ChamadoLine({ chamado, at }: { chamado: DashboardChamadoDto; at: Date }) {
  const minutes = minutesSince(chamado.openedAt, at);
  const place = [chamado.lineName, chamado.machineName].filter(Boolean).join(" · ") || "Sem linha";
  const link = `/turno/chamados?dia=${dayOf(new Date(chamado.openedAt))}&abrir=${chamado.id}`;
  return (
    <li className="flex items-start justify-between gap-3 border-t border-line py-2 first:border-t-0 first:pt-0">
      <Link to={link} className="min-w-0 hover:text-accent">
        <span className="block truncate text-sm font-medium text-app">{chamado.body}</span>
        <span className="text-xs text-muted">
          {chamado.dayNumber ? `nº ${chamado.dayNumber} · ` : ""}
          {place}
        </span>
      </Link>
      <span className={`shrink-0 text-xs font-semibold tabular-nums ${minutes >= LONG_OPEN_MINUTES ? "text-danger" : "text-muted"}`}>há {formatDuration(minutes)}</span>
    </li>
  );
}

function OpenChamados({ chamados, at }: { chamados: DashboardChamadoDto[]; at: Date }) {
  return (
    <Panel title="Chamados em aberto" action={<Link to="/turno/chamados" className="text-xs text-accent hover:underline">Ver chamados</Link>}>
      {chamados.length ? (
        <ol className="flex flex-col">
          {chamados.slice(0, 6).map((chamado) => (
            <ChamadoLine key={chamado.id} chamado={chamado} at={at} />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">Nenhum chamado aberto.</p>
      )}
    </Panel>
  );
}

function FlowPanel({ flow }: { flow: DashboardFlowWeekDto[] }) {
  const weeks = flow.map((week) => week.weekStart);
  const series = [
    { label: "Entraram", fill: "fill-chart-2", swatch: "bg-chart-2", values: flow.map((week) => week.created) },
    { label: "Concluídas", fill: "fill-chart", swatch: "bg-chart", values: flow.map((week) => week.completed) },
  ];
  return (
    <Panel title="Tarefas e problemas por semana">
      <ColumnChart weeks={weeks} series={series} label="Tarefas e problemas que entraram e que foram concluídos nas últimas 8 semanas" />
    </Panel>
  );
}

/** Faixa Agora: o que precisa do coordenador hoje. */
export function NowBand({ now, flow, at }: { now: DashboardNowDto; flow: DashboardFlowWeekDto[]; at: Date }) {
  return (
    <Band id="agora" title="Agora">
      <NowKpis now={now} at={at} />
      <div className="grid gap-3 lg:grid-cols-2">
        <OpenChamados chamados={now.openChamados} at={at} />
        <FlowPanel flow={flow} />
      </div>
    </Band>
  );
}
