import { Link } from "react-router-dom";
import { RECORD_TYPE_LABELS, type DashboardDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice, PageTitle } from "../../../design/ui/controls";
import { statusChipClass, statusLabel } from "../../registro/model/record";
import { useDashboard } from "../data/dashboard";
import { formatDashboardWhen, openRankLabel } from "../model/when";

const cardLink = "block rounded-card border p-4 shadow-card transition hover:border-accent sm:p-5";

function CountLink({
  to,
  label,
  count,
  tone = "neutral",
}: {
  to: string;
  label: string;
  count: number;
  tone?: "neutral" | "danger" | "today" | "quiet";
}) {
  const frame = tone === "danger" ? "border-danger bg-card" : tone === "today" ? "border-line bg-accent-soft" : "border-line bg-card";
  const number = tone === "danger" ? "text-danger" : tone === "quiet" ? "text-muted" : "text-app";
  return (
    <Link to={to} className={`${cardLink} ${frame}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 text-4xl font-semibold tabular-nums tracking-tight ${number}`}>{count}</p>
    </Link>
  );
}

function Ranking({
  title,
  rows,
  linkTo,
}: {
  title: string;
  rows: DashboardDto["machineRanking"];
  linkTo?: (id: string) => string;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum aberto.</p> : null}
      <ol className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-baseline justify-between gap-3 text-sm">
            {linkTo ? (
              <Link to={linkTo(row.id)} className="font-medium text-app hover:text-accent hover:underline">
                {row.name}
              </Link>
            ) : (
              <span className="font-medium text-app">{row.name}</span>
            )}
            <span className="shrink-0 tabular-nums text-muted">{openRankLabel(row.openCount)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function DashboardPage() {
  const dashboard = useDashboard();
  const data = dashboard.data;
  return (
    <div>
      <PageTitle title="Dashboard" text="Abertos, prazos, cadastro e o que entrou por último." />
      {dashboard.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {dashboard.isError ? <Notice>{errorMessage(dashboard.error)}</Notice> : null}
      {data ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CountLink to="/acompanhamento?status=open" label="Abertas" count={data.openCount} />
            <CountLink to="/acompanhamento?due=overdue" label="Vencidas" count={data.overdueCount} tone="danger" />
            <CountLink to="/acompanhamento?due=today" label="Vencem hoje" count={data.dueTodayCount} tone="today" />
            <CountLink to="/acompanhamento?status=done" label="Concluídas" count={data.doneCount} tone="quiet" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CountLink to="/configuracoes/fabricas" label="Máquinas" count={data.machineCount} />
            <CountLink to="/cadastro/colaboradores" label="Colaboradores ativos" count={data.activeMemberCount} />
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-app">Últimos registros</h2>
            {data.recent.length === 0 ? <Card>Nenhum registro ainda.</Card> : null}
            <div className="flex flex-col gap-3">
              {data.recent.map((record) => (
                <Link key={record.id} to={`/registros/${record.id}`} className={`${cardLink} border-line bg-card`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {RECORD_TYPE_LABELS[record.type].short}
                    </p>
                    <span className={statusChipClass(record.status)}>{statusLabel(record.status)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 font-medium text-app">{record.body}</p>
                  <p className="mt-2 text-sm text-muted">{formatDashboardWhen(record.occurredAt)}</p>
                </Link>
              ))}
            </div>
          </section>
          <div className="grid gap-3 lg:grid-cols-2">
            <Ranking title="Máquinas com mais abertos" rows={data.machineRanking} />
            <Ranking
              title="Colaboradores com mais abertos"
              rows={data.memberRanking}
              linkTo={(id) => `/cadastro/colaboradores/${id}`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
