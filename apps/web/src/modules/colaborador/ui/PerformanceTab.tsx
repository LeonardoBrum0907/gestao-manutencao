import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_PERFORMANCE_TARGET,
  PERFORMANCE_SCORE_LABELS,
  PERFORMANCE_SCORES,
  QUARTERS,
  type MemberDto,
  type MemberPerformanceDto,
  type PerformanceScore,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, SelectInput, Stat } from "../../../design/ui/controls";
import { useMatrixSettings } from "../../competencia/data/catalog";
import { usePerformance, useSetScore, type ScoreWrite } from "../data/performance";
import { formatScore, thisYear, yearOptions } from "../model/performance";
import { RankedChart } from "./RankedChart";

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

export function PerformanceTab({ member }: { member: MemberDto }) {
  const current = thisYear();
  const [year, setYear] = useState(current);
  const performance = usePerformance(member.id, year);
  const settings = useMatrixSettings();
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
              <RankedChart performance={data} target={settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET} />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
