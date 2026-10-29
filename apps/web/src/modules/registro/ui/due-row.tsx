import type { RecordDto } from "@manutencao/shared";
import { TimeInput } from "../../../design/ui/time-input";
import { dueDay, todayDay } from "../model/board";
import { dueClockOf, withDueClock, withDueDay, type DueValue } from "../model/due-time";
import { DueChip } from "./chips";

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
        <TimeInput
          variant="chip"
          aria-label="Horário do prazo"
          placeholder="Horário"
          clearable
          value={saved}
          onChange={(time) => onChange(withDueClock(current, time))}
          // 15px como as outras etiquetas da coluna lateral (o recordValueText, PR #153), escrito por inteiro para o Tailwind.
          className="text-app hover:!bg-card !text-[15px]"
        />
      ) : null}
    </>
  );
}
