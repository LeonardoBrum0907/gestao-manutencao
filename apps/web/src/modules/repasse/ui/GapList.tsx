import { useState } from "react";
import { Link } from "react-router-dom";
import type { TransferDetailDto, TransferGapDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { useCreateGapPdi } from "../data/transfers";
import { filterGaps, firstName, GAP_FILTERS, pdiTitle, shortName, type GapFilter } from "../model/transfer-view";

const FILTER_LABELS: Record<GapFilter, string> = { all: "Todas", zero: "Do zero", near: "Perto" };

function FilterChips({ gaps, value, onChange }: { gaps: TransferGapDto[]; value: GapFilter; onChange: (next: GapFilter) => void }) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Filtrar o que falta">
      {GAP_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          aria-pressed={value === filter}
          onClick={() => onChange(filter)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${value === filter ? "bg-accent text-accent-contrast" : "bg-chip text-app hover:bg-accent-soft"}`}
        >
          {FILTER_LABELS[filter]} <span className="tabular-nums">{filterGaps(gaps, filter).length}</span>
        </button>
      ))}
    </div>
  );
}

type RowProps = { gap: TransferGapDto; transfer: TransferDetailDto; onPlan: (gap: TransferGapDto) => void; planning: boolean };

function GapRow({ gap, transfer, onPlan, planning }: RowProps) {
  return (
    <li className="flex items-start gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{gap.subgroup}</p>
        <p className="text-sm text-app">{gap.text}</p>
        <p className="mt-0.5 text-xs text-muted">
          {firstName(transfer.learner.name)}: {gap.learnerScore ?? "sem nota"} · {firstName(transfer.teacher.name)}: {gap.teacherScore}
        </p>
      </div>
      {gap.openPdiItemId ? (
        <Link to={`/cadastro/colaboradores/${transfer.learner.id}/pdi`} className="whitespace-nowrap pt-1 text-xs font-medium text-accent hover:underline">
          No PDI
        </Link>
      ) : (
        <Button tone="ghost" className="whitespace-nowrap !px-3 !py-1 !text-xs" disabled={planning} aria-label={`Criar item de PDI para ${gap.text}`} onClick={() => onPlan(gap)}>
          + PDI
        </Button>
      )}
    </li>
  );
}

// Agrupa na ordem que chega (a do catálogo) pelo nome do equipamento.
function byEquipmentName(gaps: TransferGapDto[]): [string, TransferGapDto[]][] {
  const groups = new Map<string, TransferGapDto[]>();
  for (const gap of gaps) groups.set(gap.equipmentName, [...(groups.get(gap.equipmentName) ?? []), gap]);
  return [...groups];
}

/** "Falta repassar": o que quem ensina domina e quem aprende ainda não faz, com o atalho para o PDI. */
export function GapList({ transfer }: { transfer: TransferDetailDto }) {
  const [filter, setFilter] = useState<GapFilter>("all");
  const plan = useCreateGapPdi(transfer.id);
  const shown = filterGaps(transfer.gaps, filter);
  const onPlan = (gap: TransferGapDto) => plan.mutate({ learnerId: transfer.learner.id, teacherId: transfer.teacher.id, skillId: gap.skillId, title: pdiTitle(gap) });
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-app">Falta repassar · {transfer.gaps.length}</h2>
        {transfer.gaps.length ? <FilterChips gaps={transfer.gaps} value={filter} onChange={setFilter} /> : null}
      </div>
      {plan.isError ? <Notice>{errorMessage(plan.error)}</Notice> : null}
      {transfer.gaps.length === 0 ? <p className="text-sm text-muted">Nada: {shortName(transfer.learner.name)} já faz tudo o que {shortName(transfer.teacher.name)} domina no foco.</p> : null}
      {byEquipmentName(shown).map(([name, gaps]) => (
        <section key={name} className="mt-3 first:mt-0">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{name}</h3>
          <ul className="mt-1">
            {gaps.map((gap) => (
              <GapRow key={gap.skillId} gap={gap} transfer={transfer} onPlan={onPlan} planning={plan.isPending} />
            ))}
          </ul>
        </section>
      ))}
    </Card>
  );
}
