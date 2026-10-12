import type { ReactNode } from "react";
import type { RecordDto, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useFactories } from "../../cadastro/data/cadastro";
import { useBoardChange } from "../data/board";
import { dueAtOf, dueDay, todayDay } from "../model/board";
import { fromLocalInput, recordShortName, statusOptions, toLocalInput } from "../model/record";
import { retypeBlock } from "../model/record-sheet";
import { Chip, DueChip, MemberChip, PlaceChips, PlainChipsArea, PriorityChip, ToneChip, TypeChip, noPlace, type PlaceValue } from "./chips";
import { InlineText } from "./record-main";
import { useRecordSave } from "./record-save";

// Coluna lateral do modal do registro (como a do Todoist): cada campo grava assim que muda.

function SideRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1 border-b border-line py-3 first:pt-0">
      <h3 className="text-xs font-semibold text-muted">{label}</h3>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </section>
  );
}

function TypeRow({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  const blocked = retypeBlock(record);
  const chip = <TypeChip value={record.type} onChange={(type) => type !== record.type && save({}, type)} />;
  if (!blocked && record.type === "entry") {
    return (
      <span className="flex flex-col items-start gap-0.5">
        {chip}
        <span className="text-xs text-muted">Escolha Tarefa, Problema ou Feedback para levar a Registros.</span>
      </span>
    );
  }
  if (!blocked) return chip;
  return (
    <span className="flex flex-col gap-0.5 text-[13px]">
      <span className="text-app">{recordShortName(record.type)}</span>
      <span className="text-xs text-muted">{blocked}</span>
    </span>
  );
}

// Concluir fica no círculo; aqui é o "em andamento". Vai pelo checklist, como o arrastar.
function StatusChip({ record }: { record: RecordDto }) {
  const change = useBoardChange();
  const toast = useToast();
  const pick = (status: string) =>
    change.mutate({ id: record.id, change: { status: status as RecordStatus } }, { onError: (error) => toast({ text: errorMessage(error) }) });
  return (
    <Chip label="Situação" value={record.status} icon="list" tone={record.status === "in_progress" ? "text-accent" : "text-app"} onChange={pick}>
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Chip>
  );
}

function FactoryChip({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const factories = useFactories();
  return (
    <Chip label="Fábrica" value={value} icon="machine" onChange={onChange} onClear={() => onChange("")}>
      {value ? null : <option value="">Fábrica</option>}
      {(factories.data ?? []).map((factory) => (
        <option key={factory.id} value={factory.id}>
          {factory.name}
        </option>
      ))}
    </Chip>
  );
}

function TaskRows({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  const today = todayDay();
  return (
    <>
      <SideRow label="Prazo">
        <DueChip day={record.dueAt ? dueDay(record.dueAt) : null} today={today} onChange={(day) => save({ dueAt: day ? dueAtOf(day) : null })} />
      </SideRow>
      <SideRow label="Prioridade">
        <PriorityChip value={record.priority} onChange={(priority) => save({ priority })} />
      </SideRow>
      <SideRow label="Situação">
        <StatusChip record={record} />
      </SideRow>
      <SideRow label="Responsável">
        <MemberChip label="Responsável" value={record.memberId ?? ""} onChange={(memberId) => save({ memberId: memberId || null })} />
      </SideRow>
      <SideRow label="Local">
        <FactoryChip value={record.factoryId ?? ""} onChange={(factoryId) => save({ factoryId: factoryId || null })} />
        <InlineText value={record.line ?? ""} placeholder="Linha" singleLine className="text-[13px] text-app" onCommit={(line) => save({ line: line.trim() || null })} />
        <InlineText value={record.tag ?? ""} placeholder="TAG" singleLine className="text-[13px] text-app" onCommit={(tag) => save({ tag: tag.trim() || null })} />
      </SideRow>
    </>
  );
}

function placeOf(record: RecordDto): PlaceValue {
  if (!record.lineId) return noPlace;
  return { lineId: record.lineId, machineId: record.machineId ?? "", subassemblyId: record.subassemblyId ?? "" };
}

function ProblemRows({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  // Escolher uma linha cadastrada substitui a "outra" escrita à mão.
  const savePlace = (place: PlaceValue) =>
    save({
      lineId: place.lineId || null,
      lineLabel: place.lineId ? null : record.lineLabel,
      machineId: place.machineId || null,
      subassemblyId: place.subassemblyId || null,
    });
  return (
    <>
      <SideRow label="Situação">
        <StatusChip record={record} />
      </SideRow>
      <SideRow label="Onde">
        {record.lineLabel && !record.lineId ? <span className="w-full text-[13px] text-app">{record.lineLabel}</span> : null}
        <PlaceChips value={placeOf(record)} onChange={savePlace} />
      </SideRow>
      <SideRow label="Quem, se souber">
        <MemberChip value={record.memberId ?? ""} onChange={(memberId) => save({ memberId: memberId || null })} />
      </SideRow>
    </>
  );
}

function FeedbackRows({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  return (
    <>
      <SideRow label="Colaborador">
        <MemberChip value={record.memberId ?? ""} onChange={(memberId) => save({ memberId: memberId || null })} />
      </SideRow>
      <SideRow label="Tom">
        <ToneChip value={record.tone ?? "neutral"} onChange={(tone) => save({ tone })} />
      </SideRow>
    </>
  );
}

// Data e hora em que aconteceu; grava ao sair do campo (o seletor dispara mudança a cada parte digitada).
function WhenRow({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  const saved = toLocalInput(record.occurredAt);
  return (
    <input
      key={saved}
      type="datetime-local"
      aria-label="Quando aconteceu"
      defaultValue={saved}
      onBlur={(event) => event.target.value && event.target.value !== saved && save({ occurredAt: fromLocalInput(event.target.value) })}
      className="-ml-1 rounded-md bg-transparent px-1 py-1 text-[13px] text-app outline-none hover:bg-card focus:bg-card"
    />
  );
}

/**
 * Coluna lateral: tipo (troca de Tarefa para Problema ou Feedback) e os campos do tipo.
 * Ex.: `<RecordSide record={record} />`
 */
export function RecordSide({ record }: { record: RecordDto }) {
  return (
    <PlainChipsArea>
      <SideRow label="Tipo">
        <TypeRow record={record} />
      </SideRow>
      {record.type === "task" ? <TaskRows record={record} /> : null}
      {record.type === "problem" ? <ProblemRows record={record} /> : null}
      {record.type === "feedback" ? <FeedbackRows record={record} /> : null}
      <SideRow label="Quando aconteceu">
        <Icon name="calendar" className="h-3.5 w-3.5 text-muted" />
        <WhenRow record={record} />
      </SideRow>
    </PlainChipsArea>
  );
}
