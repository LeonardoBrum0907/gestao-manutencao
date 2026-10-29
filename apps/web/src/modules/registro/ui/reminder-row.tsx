import { useState } from "react";
import type { RecordDto, TaskReminderDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useRemoveReminder, useTaskReminders } from "../data/reminders";
import { todayDay } from "../model/board";
import { reminderText, sortedByFire } from "../model/reminders";
import { ReminderMenu } from "./reminder-menu";
import { recordNoteText, recordValueText } from "./record-text";

// Em destaque, quando toca (é o que importa ao bater o olho); embaixo, de onde vem essa hora.
function ReminderItem({ reminder, record }: { reminder: TaskReminderDto; record: RecordDto }) {
  const remove = useRemoveReminder(record.id);
  const toast = useToast();
  const text = reminderText(reminder, record, todayDay());
  return (
    <li className={`flex w-full items-start gap-2 ${recordValueText}`}>
      <Icon name="bell" className="mt-1 h-4 w-4 text-accent" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold tabular-nums text-app">{text.title}</span>
        <span className={`${recordNoteText} text-muted`}>{text.detail}</span>
      </span>
      <button
        type="button"
        aria-label={`Tirar lembrete de ${text.title}`}
        disabled={remove.isPending}
        onClick={() => remove.mutate(reminder.id, { onError: (error) => toast({ text: errorMessage(error) }) })}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:text-app disabled:opacity-50"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/**
 * Lembretes da tarefa na coluna lateral da ficha: a lista, com × para tirar, e o "+ Lembrete" com os atalhos.
 * Ex.: `<ReminderRow record={record} />`
 */
export function ReminderRow({ record }: { record: RecordDto }) {
  const reminders = useTaskReminders(record.id);
  const [open, setOpen] = useState(false);
  const saved = reminders.data ?? [];
  return (
    <div className="flex w-full flex-col gap-2">
      {saved.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {sortedByFire(saved, record).map((reminder) => <ReminderItem key={reminder.id} reminder={reminder} record={record} />)}
        </ul>
      ) : null}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`-ml-1 inline-flex items-center gap-1 self-start rounded-md px-1 py-1 ${recordValueText} text-muted hover:bg-card hover:text-app`}>
        <Icon name="plus" className="h-4 w-4" />
        Lembrete
      </button>
      {open ? <ReminderMenu record={record} saved={saved} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
