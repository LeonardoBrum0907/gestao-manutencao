import { Link } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Card, Notice, PageTitle } from "../../../design/ui/controls";
import { useDashboard } from "../data/dashboard";

export function DashboardPage() {
  const dashboard = useDashboard();
  return (
    <div className="mx-auto max-w-lg">
      <PageTitle eyebrow="Gestor" title="Dashboard" text="O número sai dos registros abertos." />
      <Card>
        {dashboard.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
        {dashboard.isError ? <Notice>{errorMessage(dashboard.error)}</Notice> : null}
        {dashboard.data ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Abertos</p>
            <p className="text-5xl font-semibold tracking-tight text-app">{dashboard.data.openCount}</p>
            <Link to="/acompanhamento?status=open" className="text-sm font-semibold text-accent">
              Ver na lista
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
