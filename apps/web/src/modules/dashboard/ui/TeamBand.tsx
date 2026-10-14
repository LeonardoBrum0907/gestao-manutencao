import { Link } from "react-router-dom";
import { MEMBER_STATUS_LABELS, type DashboardPeopleDto, type MemberStatus, type TeamMatrixDto } from "@manutencao/shared";
import { coverageLabel } from "../../competencia/model/team";
import { coverageChipClass } from "../../competencia/ui/team/TeamGridHead";
import { COVERAGE_SHIFTS, coverageRows, pdiOverdueTotal, trainingTop, type CoverageRow } from "../model/overview-team";
import { Band, Panel } from "./band";

const SHIFT_HEAD: Record<(typeof COVERAGE_SHIFTS)[number], string> = { first: "1º", second: "2º", third: "3º" };

function CoverageLine({ row }: { row: CoverageRow }) {
  return (
    <tr className="border-t border-line">
      <th scope="row" className="py-1.5 pr-2 text-left font-medium text-app">
        <span className="block truncate">{row.name}</span>
        <span className={`mt-0.5 inline-block max-w-full truncate rounded-full px-2 py-px text-[11px] font-semibold tabular-nums ${coverageChipClass[row.status]}`}>
          {coverageLabel[row.status]} · {row.qualified}
          {row.minQualified ? ` / mín. ${row.minQualified}` : ""}
        </span>
      </th>
      {row.byShift.map((count, index) => (
        <td key={COVERAGE_SHIFTS[index]} className="py-1.5 text-center">
          <span className={`inline-block w-7 rounded py-0.5 text-xs font-semibold tabular-nums ${count ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger"}`}>{count}</span>
        </td>
      ))}
    </tr>
  );
}

function Coverage({ team }: { team: TeamMatrixDto }) {
  const rows = coverageRows(team);
  return (
    <Panel title="Qualificados por turno" action={<Link to="/competencias" className="text-xs text-accent hover:underline">Matriz da equipe</Link>}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="pb-1 text-left font-medium">Modelo</th>
                {COVERAGE_SHIFTS.map((shift) => (
                  <th key={shift} className="w-10 pb-1 text-center font-medium">
                    {SHIFT_HEAD[shift]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <CoverageLine key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Nenhum modelo de equipamento ativo.</p>
      )}
      <p className="text-xs text-muted">Qualificado = aderência a partir de {team.qualifiedAdherence}% na matriz.</p>
    </Panel>
  );
}

function Fact({ label, value, to, alert = false }: { label: string; value: string; to: string; alert?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm first:border-t-0 first:pt-0">
      <Link to={to} className="text-app hover:text-accent hover:underline">
        {label}
      </Link>
      <span className={`shrink-0 font-semibold tabular-nums ${alert ? "text-danger" : "text-app"}`}>{value}</span>
    </li>
  );
}

function names(list: { name: string }[], limit = 4): string {
  const shown = list.slice(0, limit).map((item) => item.name).join(", ");
  return list.length > limit ? `${shown} e mais ${list.length - limit}` : shown;
}

function People({ people, pdiOverdue }: { people: DashboardPeopleDto; pdiOverdue: number | null }) {
  const evaluation = people.evaluation;
  const quarter = `${evaluation.quarter}º trimestre de ${evaluation.year}`;
  return (
    <Panel title="Pessoas">
      <ul className="flex flex-col">
        <Fact label={`Sem avaliação no ${quarter}`} value={`${evaluation.missing} de ${evaluation.technicians}`} to="/cadastro/colaboradores" alert={evaluation.missing > 0} />
        <Fact label={`Abaixo da meta ${evaluation.target} no ${evaluation.quarter}º trimestre`} value={String(evaluation.belowTarget)} to="/cadastro/colaboradores" />
        {pdiOverdue !== null ? <Fact label="Itens de PDI vencidos" value={String(pdiOverdue)} to="/competencias?foco=pdi" alert={pdiOverdue > 0} /> : null}
        <Fact label="Sem feedback há mais de 60 dias" value={String(people.silentFeedback.length)} to="/registros?tipo=feedbacks" />
        <Fact label="De férias ou afastados" value={String(people.away.length)} to="/cadastro/colaboradores" />
      </ul>
      {people.silentFeedback.length ? <p className="text-xs text-muted">Sem feedback: {names(people.silentFeedback)}.</p> : null}
      {people.away.length ? (
        <p className="text-xs text-muted">
          Fora: {people.away.map((member) => `${member.name} (${MEMBER_STATUS_LABELS[member.status as MemberStatus]?.toLowerCase() ?? member.status})`).join(", ")}.
        </p>
      ) : null}
    </Panel>
  );
}

function Training({ team }: { team: TeamMatrixDto }) {
  const picks = trainingTop(team, 5);
  return (
    <Panel title="Quem treinar primeiro" action={<Link to="/competencias" className="text-xs text-accent hover:underline">Ver todos</Link>}>
      {picks.length ? (
        <ol className="flex flex-col">
          {picks.map((pick) => (
            <li key={`${pick.memberId}-${pick.equipmentName}`} className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm first:border-t-0 first:pt-0">
              <Link to={`/cadastro/colaboradores/${pick.memberId}/pdi`} className="min-w-0 hover:text-accent">
                <span className="block truncate font-medium text-app">{pick.name}</span>
                <span className="text-xs text-muted">{pick.equipmentName}</span>
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {pick.adherence}% · falta {pick.gap}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">Nenhum modelo em risco: todos têm o mínimo de qualificados.</p>
      )}
    </Panel>
  );
}

/** Faixa Equipe: cobertura da matriz por turno, pendências de pessoas e quem treinar. */
export function TeamBand({ people, team }: { people: DashboardPeopleDto; team: TeamMatrixDto | undefined }) {
  return (
    <Band id="equipe" title="Equipe">
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {team ? <Coverage team={team} /> : <Panel title="Qualificados por turno"><p className="text-sm text-muted">Carregando a matriz…</p></Panel>}
        <People people={people} pdiOverdue={team ? pdiOverdueTotal(team) : null} />
        {team ? <Training team={team} /> : null}
      </div>
    </Band>
  );
}
