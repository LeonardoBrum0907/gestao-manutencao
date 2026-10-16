import { useSearchParams } from "react-router-dom";
import { DASHBOARD_PERIODS, type DashboardPeriod } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Field, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { useFactories } from "../../cadastro/data/cadastro";
import { useTeamMatrix } from "../../competencia/data/matrix";
import { useDashboardOverview } from "../data/dashboard";
import { readOverviewFilter, writeOverviewFilter, type OverviewFilter } from "../model/overview-filter";
import { MachinesBand } from "./MachinesBand";
import { NowBand } from "./NowBand";
import { TeamBand } from "./TeamBand";

function PeriodSwitch({ days, onChange }: { days: DashboardPeriod; onChange: (days: DashboardPeriod) => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-app" id="dashboard-period">
        Período
      </span>
      <div role="group" aria-labelledby="dashboard-period" className="flex rounded-control border border-line bg-surface p-0.5">
        {DASHBOARD_PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={period === days}
            onClick={() => onChange(period)}
            className={`rounded-control px-3 py-1.5 text-sm font-medium tabular-nums transition ${period === days ? "bg-accent text-accent-contrast" : "text-muted hover:text-app"}`}
          >
            {period} dias
          </button>
        ))}
      </div>
    </div>
  );
}

function Filters({ filter, onChange }: { filter: OverviewFilter; onChange: (filter: OverviewFilter) => void }) {
  const factories = useFactories();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-56">
        <Field label="Fábrica">
          <SelectInput value={filter.factoryId} onChange={(event) => onChange({ ...filter, factoryId: event.target.value })}>
            <option value="">Todas as fábricas</option>
            {(factories.data ?? []).map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <PeriodSwitch days={filter.days} onChange={(days) => onChange({ ...filter, days })} />
    </div>
  );
}

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const filter = readOverviewFilter(params);
  const overview = useDashboardOverview(filter);
  const team = useTeamMatrix();
  const data = overview.data;
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Dashboard"
        text="O que precisa de você agora, onde as máquinas mais pararam e como está a equipe. A fábrica vale para chamados, linhas e RPs."
      />
      <Filters filter={filter} onChange={(next) => setParams(writeOverviewFilter(next), { replace: true })} />
      {overview.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {overview.isError ? <Notice>{errorMessage(overview.error)}</Notice> : null}
      {data ? (
        <>
          <NowBand now={data.now} flow={data.flow} at={new Date(data.generatedAt)} factoryId={data.factoryId} />
          <MachinesBand machines={data.machines} />
          <TeamBand people={data.people} team={team.data} />
        </>
      ) : null}
    </div>
  );
}
