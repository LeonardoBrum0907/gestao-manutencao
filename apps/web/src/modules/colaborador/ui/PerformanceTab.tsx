import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_PERFORMANCE_TARGET,
  PERFORMANCE_SCORE_LABELS,
  PERFORMANCE_SCORES,
  QUARTERS,
  type MemberDto,
  type MemberPerformanceDto,
  type PdiItemDto,
  type PerformanceCompetencyDto,
  type PerformanceScore,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, SelectInput, Stat } from "../../../design/ui/controls";
import { useMatrixSettings } from "../../competencia/data/catalog";
import { usePdiItems } from "../data/pdi-items";
import { usePerformance, useSetScore, type ScoreWrite } from "../data/performance";
import { belowTarget, openItemOfCompetency } from "../model/pdi-items";
import { formatScore, thisYear, yearOptions } from "../model/performance";
import { emptyPdiItem, PdiItemForm } from "./PdiItems";
import { RankedChart } from "./RankedChart";

function ScoreTable({
  member,
  performance,
  target,
  pdiItems,
  onChange,
  onCreatePdi,
  disabled,
}: {
  member: MemberDto;
  performance: MemberPerformanceDto;
  target: number;
  pdiItems: PdiItemDto[];
  onChange: (write: ScoreWrite) => void;
  onCreatePdi: (competency: PerformanceCompetencyDto) => void;
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
            <th className="py-2 pl-3 font-semibold">
              <span className="sr-only">PDI</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {performance.competencies.map((competency) => {
            const row = performance.competencyAverages.find((item) => item.competencyId === competency.id);
            const below = belowTarget(row?.average ?? null, target);
            const openItem = openItemOfCompetency(pdiItems, competency.id);
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
                <td className={`py-2 pl-3 text-right font-semibold tabular-nums ${below ? "text-danger" : "text-app"}`}>
                  {formatScore(row?.average ?? null)}
                </td>
                <td className="py-1.5 pl-3 text-right">
                  {openItem ? (
                    <Link
                      to={`/cadastro/colaboradores/${member.id}/pdi`}
                      title={openItem.title}
                      className="whitespace-nowrap text-xs font-medium text-accent hover:underline"
                    >
                      No PDI
                    </Link>
                  ) : below ? (
                    <Button
                      tone="ghost"
                      className="whitespace-nowrap !px-3 !py-1 !text-xs"
                      aria-label={`Criar item de PDI para ${competency.name}`}
                      onClick={() => onCreatePdi(competency)}
                    >
                      + PDI
                    </Button>
                  ) : null}
                </td>
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
            <td />
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
  const pdiItems = usePdiItems(member.id);
  const [pdiFor, setPdiFor] = useState<PerformanceCompetencyDto | null>(null);
  const target = settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET;
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
            <p className="mt-1 text-xs text-muted">
              Média abaixo da meta ({target}) fica em vermelho e ganha o atalho “+ PDI”. A meta muda em Configurações › Avaliação.
            </p>
            <div className="mt-3">
              <ScoreTable
                member={member}
                performance={data}
                target={target}
                pdiItems={pdiItems.data ?? []}
                onChange={(write) => setScore.mutate(write)}
                onCreatePdi={setPdiFor}
                disabled={setScore.isPending}
              />
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
              <RankedChart performance={data} target={target} />
            </div>
          </Card>
        </>
      ) : null}
      {pdiFor ? (
        <Modal open title={`Item de PDI · ${pdiFor.name}`} onClose={() => setPdiFor(null)}>
          <PdiItemForm
            bare
            member={member}
            initial={{ ...emptyPdiItem, title: `Desenvolver ${pdiFor.name.toLowerCase()}`, competencyId: pdiFor.id }}
            onDone={() => setPdiFor(null)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
