import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RECORD_PRIORITY_LABELS, taskRepeatLabel, type BoardItemDto, type RecordPriority, type TaskRepeat } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { changeOnBoard, refreshRecords, useAddTask, useBoardChange } from "../data/board";
import { dueLabel } from "../model/board";
import { dueClockOf } from "../model/due-time";
import { passToTodayChange } from "../model/my-day";
import { InProgressChip, ringTone, useCompleting } from "./checklist";
import { DueChip, PriorityChip } from "./chips";
import { AddRow } from "./quick-add";

// Peças da tarefa usadas no Meu Dia e na Agenda: prazo, prioridade, situação, concluir e adicionar.

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

/** Cor do círculo pela prioridade (alta vermelho, média laranja). */
export function taskRing(priority: RecordPriority | null): string {
  if (priority === "high") return ringTone.high;
  if (priority === "medium") return ringTone.medium;
  return ringTone.plain;
}

const priorityTone: Record<RecordPriority, string> = { high: "font-semibold text-danger", medium: "font-semibold text-warn", low: "text-muted" };

export function PriorityCell({ priority }: { priority: RecordPriority | null }) {
  if (!priority) return <span className="text-muted">—</span>;
  return <span className={priorityTone[priority]}>{RECORD_PRIORITY_LABELS[priority]}</span>;
}

export function TaskStatusCell({ item, checked }: { item: BoardItemDto; checked: boolean }) {
  if (item.status === "done" || checked) return <span className="text-muted">Concluída</span>;
  if (item.status === "in_progress") return <InProgressChip />;
  return <span className="text-muted">Aberta</span>;
}

/** Horário do prazo, quando ele tem horário escolhido (sem horário vale o dia). Ex.: "15:00". */
export function dueClock(dueAt: string, hasTime: boolean): string | null {
  return hasTime ? dueClockOf(dueAt) : null;
}

/** Setas da tarefa que se repete, com a regra no texto para leitor de tela e no "title". Ex.: `<RepeatMark repeat={item.repeat} />` */
export function RepeatMark({ repeat }: { repeat: TaskRepeat | null }) {
  if (!repeat) return null;
  const label = taskRepeatLabel(repeat);
  return (
    <span title={label} aria-label={`Repete: ${label}`} role="img" className="inline-flex text-muted">
      <Icon name="repeat" className="h-3.5 w-3.5" />
    </span>
  );
}

/** Prazo com ícone: vermelho se atrasada, verde se hoje; com as setas quando a tarefa se repete. Ex.: "📅 10 out". */
export function DueText({ dueAt, hasTime, today, overdue, repeat = null }: { dueAt: string; hasTime: boolean; today: string; overdue: boolean; repeat?: TaskRepeat | null }) {
  const label = dueLabel(dueAt, today);
  const tone = overdue ? "text-danger" : label === "Hoje" ? "text-accent" : "text-muted";
  const time = dueClock(dueAt, hasTime);
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${tone}`}>
      <CalendarIcon />
      {label}
      {time ? ` ${time}` : ""}
      <RepeatMark repeat={repeat} />
    </span>
  );
}

/**
 * Concluir com o círculo (a linha some devagar, com Desfazer) e reabrir uma concluída.
 * @example const { fading, toggle } = useTaskToggle(); <CheckRow onToggle={() => toggle(item)} … />
 */
export function useTaskToggle() {
  const change = useBoardChange();
  const toast = useToast();
  const { fading, complete } = useCompleting();
  function toggle(item: BoardItemDto) {
    if (item.status === "done") {
      change.mutate({ id: item.id, change: { status: "open" } }, { onError: (error) => toast({ text: errorMessage(error) }) });
      return;
    }
    const before = item.status;
    complete(item.id, (done) =>
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () => toast({ text: "Tarefa concluída.", action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: before } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }
  return { fading, toggle };
}

/**
 * "+ Adicionar tarefa" já com o dia da lista (hoje, um dia da Agenda ou sem prazo).
 * @example <AddTask id="nova-tarefa-hoje" day={today} today={today} />
 */
export function AddTask({ id, day: listDay, today, label = "Adicionar tarefa" }: { id: string; day: string | null; today: string; label?: string }) {
  const add = useAddTask();
  const toast = useToast();
  const [day, setDay] = useState(listDay);
  const [priority, setPriority] = useState<RecordPriority | null>(null);
  return (
    <AddRow
      label={label}
      placeholder="Nome da tarefa"
      id={id}
      pending={add.isPending}
      chips={
        <>
          <DueChip day={day} today={today} onChange={setDay} />
          <PriorityChip value={priority} onChange={setPriority} />
        </>
      }
      onAdd={(body, clear) => add.mutate({ body, day, priority }, { onSuccess: clear, onError: (error) => toast({ text: errorMessage(error) }) })}
    />
  );
}

/** "Passar para hoje" das atrasadas: leva todas para hoje de uma vez, cada uma no horário que já tinha. */
export function PassToToday({ ids, today }: { ids: string[]; today: string }) {
  const client = useQueryClient();
  const toast = useToast();
  const [passing, setPassing] = useState(false);
  async function pass() {
    setPassing(true);
    try {
      await Promise.all(ids.map((id) => changeOnBoard(id, passToTodayChange(today))));
      toast({ text: ids.length === 1 ? "1 tarefa passou para hoje." : `${ids.length} tarefas passaram para hoje.` });
    } catch (error) {
      toast({ text: errorMessage(error) });
    } finally {
      await refreshRecords(client);
      setPassing(false);
    }
  }
  return (
    <button type="button" onClick={() => void pass()} disabled={passing} className="text-sm font-semibold text-accent disabled:opacity-50">
      {passing ? "Passando…" : "Passar para hoje"}
    </button>
  );
}
