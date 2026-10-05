import { useState } from "react";
import { Link } from "react-router-dom";
import {
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
import { formatScore, PERFORMANCE_TARGET, rankedAverages, scoreBand, thisYear, yearOptions } from "../model/performance";

function ScoreTable({
  performance,
  onChange,
  disabled,
}: {
  performance: MemberPerformanceDto;
  onChange: (write: ScoreWrite) => void;
  disabled: boolean;
}) {
  const score = (competencyId: string, quarter: number) =>
    performance.entries.find((entry) => entry.competencyId === competencyId && entry.quarter === quarter)?.score ?? null;
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
          {performance.competencies.map((competency) => {
            const row = performance.competencyAverages.find((item) => item.competencyId === competency.id);
            return (
              <tr key={competency.id} className="border-t border-t-line">
                <td className="py-2 pr-3 text-app">
                  {competency.name}
                  {competency.archived ? <span className="ml-2 text-xs text-muted">arquivada</span> : null}
                </td>
                {QUARTERS.map((quarter) => (
                  <td key={quarter} className="px-2 py-1.5">
                    <SelectInput
                      aria-label={`${competency.name}, ${quarter}º trimestre`}
                      className="py-1.5 tabular-nums"
                      value={score(competency.id, quarter) ?? ""}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange({
                          quarter,
                          competencyId: competency.id,
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

const BAND_CLASS = {
  high: "bg-green-600",
  good: "bg-lime-500",
  mid: "bg-amber-500",
  low: "bg-red-600",
} as const;

const BAND_LEGEND = [
  { band: "high", label: "9 a 10" },
  { band: "good", label: "7 a 8" },
  { band: "mid", label: "5 a 6" },
  { band: "low", label: "até 4" },
] as const;

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  if (value === 0) return <span className="text-muted">= 0</span>;
  return value > 0 ? (
    <span className="font-semibold text-green-600">▲ +{value}</span>
  ) : (
    <span className="font-semibold text-red-600">▼ {value}</span>
  );
}

// Uma linha por competência: barra da média (com a meta marcada), um ponto por trimestre e a variação do último.
function RankedChart({ performance }: { performance: MemberPerformanceDto }) {
  const rows = rankedAverages(performance);
  if (!rows.length) return <p className="text-sm text-muted">O gráfico aparece quando houver nota.</p>;
  const best = rows[0]!.competencyId;
  const worst = rows.length > 1 ? rows[rows.length - 1]!.competencyId : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {BAND_LEGEND.map((item) => (
          <span key={item.band} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${BAND_CLASS[item.band]}`} />
            {item.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-muted" />
          meta {PERFORMANCE_TARGET}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted" />
          sem nota
        </span>
      </div>
      <div className="hidden grid-cols-[11rem_minmax(0,1fr)_9.5rem_3rem_3.5rem] items-end gap-3 border-b border-b-line pb-1 text-xs text-muted sm:grid">
        <span>Competência</span>
        <span>Média</span>
        <span className="grid grid-cols-4 text-center">
          {QUARTERS.map((quarter) => (
            <span key={quarter}>{quarter}º tri</span>
          ))}
        </span>
        <span className="text-right">Média</span>
        <span className="text-right">Δ último</span>
      </div>
      <ol>
        {rows.map((row) => {
          const tone = row.competencyId === best ? "bg-green-500/10" : row.competencyId === worst ? "bg-red-500/10" : "";
          const summary = QUARTERS.map((quarter, i) => `${quarter}º tri ${row.scores[i] ?? "sem nota"}`).join(", ");
          return (
            <li
              key={row.competencyId}
              tabIndex={0}
              aria-label={`${row.name}: média ${formatScore(row.average)}. ${summary}.`}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-b-line px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[11rem_minmax(0,1fr)_9.5rem_3rem_3.5rem] ${tone}`}
            >
              <span className="truncate text-sm text-app">{row.name}</span>
              <span className="order-2 text-right text-sm font-semibold tabular-nums text-app sm:hidden">
                {formatScore(row.average)}
              </span>
              <span className="relative order-3 col-span-2 block h-2 rounded-full bg-line sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-chart opacity-70" style={{ width: `${(row.average / 10) * 100}%` }} />
                <span
                  className="absolute -top-1 -bottom-1 w-0.5 bg-muted"
                  style={{ left: `${PERFORMANCE_TARGET * 10}%` }}
                  aria-hidden
                />
              </span>
              <span className="relative order-4 col-span-2 grid h-5 grid-cols-4 items-center justify-items-center sm:order-none sm:col-span-1">
                <span className="absolute inset-x-[12.5%] top-1/2 h-0.5 -translate-y-1/2 bg-line" aria-hidden />
                {row.scores.map((value, i) =>
                  value === null ? (
                    <span key={i} title={`${QUARTERS[i]}º tri: sem nota`} className="relative h-3 w-3 rounded-full border border-dashed border-muted bg-surface" />
                  ) : (
                    <span
                      key={i}
                      title={`${QUARTERS[i]}º tri: ${value}`}
                      className={`relative h-3 w-3 rounded-full ${BAND_CLASS[scoreBand(value)]}`}
                    />
                  ),
                )}
              </span>
              <span className="hidden text-right text-sm font-semibold tabular-nums text-app sm:block">{formatScore(row.average)}</span>
              <span className="hidden text-right text-xs tabular-nums sm:block">
                <Delta value={row.delta} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
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
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-xs text-muted">
            {PERFORMANCE_SCORES.map((value) => `${value} ${PERFORMANCE_SCORE_LABELS[value]}`).join(" · ")} · grava ao escolher
          </p>
          <Link to="/configuracoes/avaliacao" className="text-sm font-medium text-accent hover:underline">
            Editar competências
          </Link>
        </div>
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
            <p className="mt-1 text-sm text-muted">Da maior para a menor média, na escala de 0 a 10, com a nota de cada trimestre e a variação do último trimestre com nota.</p>
            <div className="mt-4">
              <RankedChart performance={data} />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
