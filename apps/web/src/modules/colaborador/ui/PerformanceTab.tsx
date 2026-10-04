import { useState } from "react";
import {
  PERFORMANCE_COMPETENCIES,
  PERFORMANCE_SCORE_LABELS,
  PERFORMANCE_SCORES,
  QUARTERS,
  type MemberDto,
  type MemberPerformanceDto,
  type PerformanceScore,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, SelectInput, Stat } from "../../../design/ui/controls";
import { usePerformance, useSetScore, type ScoreWrite } from "../data/performance";
import { competencyLabel, formatScore, rankedAverages, thisYear, yearOptions } from "../model/performance";

function ScoreTable({
  performance,
  onChange,
  disabled,
}: {
  performance: MemberPerformanceDto;
  onChange: (write: ScoreWrite) => void;
  disabled: boolean;
}) {
  const score = (competency: string, quarter: number) =>
    performance.entries.find((entry) => entry.competency === competency && entry.quarter === quarter)?.score ?? null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="py-2 pr-3 font-semibold">Competência</th>
            {QUARTERS.map((quarter) => (
              <th key={quarter} className="px-2 py-2 font-semibold">
                {quarter}º tri
              </th>
            ))}
            <th className="py-2 pl-3 text-right font-semibold">Média</th>
          </tr>
        </thead>
        <tbody>
          {PERFORMANCE_COMPETENCIES.map((competency) => {
            const row = performance.competencyAverages.find((item) => item.competency === competency.key);
            return (
              <tr key={competency.key} className="border-t border-t-line">
                <td className="py-2 pr-3 text-app">{competency.label}</td>
                {QUARTERS.map((quarter) => (
                  <td key={quarter} className="px-2 py-1.5">
                    <SelectInput
                      aria-label={`${competency.label}, ${quarter}º trimestre`}
                      className="py-1.5 tabular-nums"
                      value={score(competency.key, quarter) ?? ""}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange({
                          quarter,
                          competency: competency.key,
                          score: event.target.value ? (Number(event.target.value) as PerformanceScore) : null,
                        })
                      }
                    >
                      <option value="">—</option>
                      {PERFORMANCE_SCORES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                ))}
                <td className="py-2 pl-3 text-right font-semibold tabular-nums text-app">{formatScore(row?.average ?? null)}</td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-t-line font-semibold">
            <td className="py-2 pr-3 text-app">Média do trimestre</td>
            {performance.quarterAverages.map((value, index) => (
              <td key={index} className="px-2 py-2 pl-4 tabular-nums text-app">
                {formatScore(value)}
              </td>
            ))}
            <td className="py-2 pl-3 text-right tabular-nums text-app">{formatScore(performance.average)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Barras ordenadas num eixo só (o Pareto do SIGEM usava um segundo eixo de % acumulado).
function RankedChart({ performance }: { performance: MemberPerformanceDto }) {
  const [active, setActive] = useState<string | null>(null);
  const rows = rankedAverages(performance);
  if (!rows.length) return <p className="text-sm text-muted">O gráfico aparece quando houver nota.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => {
        const quarters = QUARTERS.map((quarter) => {
          const entry = performance.entries.find((item) => item.competency === row.competency && item.quarter === quarter);
          return `${quarter}º tri ${entry ? entry.score : "—"}`;
        });
        const label = competencyLabel(row.competency);
        return (
          <li
            key={row.competency}
            tabIndex={0}
            aria-label={`${label}: média ${formatScore(row.average)} em ${row.quarters} trimestre(s)`}
            onPointerEnter={() => setActive(row.competency)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(row.competency)}
            onBlur={() => setActive(null)}
            className="relative grid grid-cols-1 gap-1 rounded-control px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-3"
          >
            <span className="truncate text-sm text-app">{label}</span>
            {/* A folga à direita guarda o rótulo: a barra usa a largura toda como escala de 0 a 10. */}
            <span className="block border-l border-l-line pr-10">
              <span className="relative block h-3.5">
                <span
                  className={`block h-full rounded-r-[4px] bg-chart transition-opacity ${active === row.competency ? "opacity-75" : ""}`}
                  style={{ width: `${(row.average / 10) * 100}%` }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 pl-2 text-xs font-semibold tabular-nums text-app"
                  style={{ left: `${(row.average / 10) * 100}%` }}
                >
                  {formatScore(row.average)}
                </span>
              </span>
            </span>
            {active === row.competency ? (
              <span
                role="tooltip"
                className="absolute right-0 top-full z-10 mt-1 rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-card"
              >
                <span className="block text-sm font-semibold tabular-nums text-app">{formatScore(row.average)}</span>
                <span className="block text-muted">{label}</span>
                <span className="block text-muted">{quarters.join(" · ")}</span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function PerformanceTab({ member }: { member: MemberDto }) {
  const current = thisYear();
  const [year, setYear] = useState(current);
  const performance = usePerformance(member.id, year);
  const setScore = useSetScore(member.id, year);
  const data = performance.data?.year === year ? performance.data : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-40">
          <Field label="Ano">
            <SelectInput value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {yearOptions(performance.data, current).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <p className="text-xs text-muted">
          {PERFORMANCE_SCORES.map((value) => `${value} ${PERFORMANCE_SCORE_LABELS[value]}`).join(" · ")} · grava ao escolher
        </p>
      </div>
      {performance.isError ? <Notice>{errorMessage(performance.error)}</Notice> : null}
      {!data && performance.isFetching ? <p className="text-sm text-muted">Carregando…</p> : null}
      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label={`Média de ${year}`} value={formatScore(data.average)} tone={data.average === null ? "text-muted" : ""} />
            {data.quarterAverages.map((value, index) => (
              <Stat key={index} label={`${index + 1}º tri`} value={formatScore(value)} tone={value === null ? "text-muted" : ""} />
            ))}
          </div>
          <Card>
            <h2 className="text-sm font-semibold text-app">Nota por trimestre</h2>
            <div className="mt-3">
              <ScoreTable performance={data} onChange={(write) => setScore.mutate(write)} disabled={setScore.isPending} />
            </div>
            {setScore.isError ? (
              <div className="mt-3">
                <Notice>{errorMessage(setScore.error)}</Notice>
              </div>
            ) : null}
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-app">Média por competência em {year}</h2>
            <p className="mt-1 text-sm text-muted">Da maior para a menor, na escala de 0 a 10. Os valores também estão na tabela acima.</p>
            <div className="mt-4">
              <RankedChart performance={data} />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
