import type { RecordDto } from "@manutencao/shared";
import { dueDay, todayDay } from "../model/board";
import { dueClockOf, withDueClock, withDueDay, type DueValue } from "../model/due-time";
import { DueChip } from "./chips";
import { recordValueText } from "./record-text";

/**
 * Prazo da tarefa na ficha: o dia (Hoje, Amanhã, calendário) e, opcional, o horário. Sem horário vale o dia
 * inteiro e os lembretes "antes do prazo" tocam às 7h.
 * Ex.: `<DueRow record={record} onChange={(due) => save(due)} />`
 */
export function DueRow({ record, onChange }: { record: RecordDto; onChange: (due: DueValue) => void }) {
  const current: DueValue = { dueAt: record.dueAt, dueHasTime: record.dueHasTime };
  const saved = record.dueAt && record.dueHasTime ? dueClockOf(record.dueAt) : "";
  return (
    <>
      <DueChip day={record.dueAt ? dueDay(record.dueAt) : null} today={todayDay()} onChange={(day) => onChange(withDueDay(current, day))} />
      {record.dueAt ? (
        <input
          key={saved}
          type="time"
          aria-label="Horário do prazo"
          defaultValue={saved}
          // Grava ao sair do campo: o seletor muda a cada parte digitada.
          onBlur={(event) => event.target.value !== saved && onChange(withDueClock(current, event.target.value))}
          className={`rounded-md bg-transparent px-1 py-1 ${recordValueText} text-app outline-none hover:bg-card focus:bg-card`}
        />
      ) : null}
    </>
  );
}
