import { useState } from "react";
import type { RecordDto, TaskReminderBody, TaskReminderDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useAddReminder, useRemoveReminder, useTaskReminders } from "../data/reminders";
import { todayDay } from "../model/board";
import { fromLocalInput, nowLocalInput } from "../model/record";
import { beforeOptions, reminderText } from "../model/reminders";

type ReminderTab = "at" | "before";

const fieldClass = "rounded-md border border-line bg-surface px-2 py-1 text-[13px] text-app";

function ReminderItem({ reminder, record }: { reminder: TaskReminderDto; record: RecordDto }) {
  const remove = useRemoveReminder(record.id);
  const toast = useToast();
  const text = reminderText(reminder, record, todayDay());
  return (
    <li className="flex w-full items-start justify-between gap-2 text-[13px]">
      <span className="min-w-0">
        <span className="text-app">{text.label}</span>
        {text.when ? <span className="block text-xs text-muted">{text.when}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Tirar lembrete ${text.label}`}
        disabled={remove.isPending}
        onClick={() => remove.mutate(reminder.id, { onError: (error) => toast({ text: errorMessage(error) }) })}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:text-app disabled:opacity-50"
      >
        <Icon name="close" className="h-3 w-3" />
      </button>
    </li>
  );
}

function TabButton({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: string }) {
  const tone = active ? "bg-accent-soft font-semibold text-app" : "text-muted hover:text-app";
  return (
    <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-md px-2 py-1 text-xs disabled:opacity-50 ${tone}`}>
      {children}
    </button>
  );
}

type ReminderDraft = { tab: ReminderTab; at: string; minutes: number };

function draftBody(draft: ReminderDraft): TaskReminderBody {
  return draft.tab === "at" ? { kind: "at", at: fromLocalInput(draft.at) } : { kind: "before", minutesBefore: draft.minutes };
}

function ReminderInputs({ record, draft, onChange }: { record: RecordDto; draft: ReminderDraft; onChange: (draft: ReminderDraft) => void }) {
  return (
    <>
      <div className="flex gap-1">
        <TabButton active={draft.tab === "at"} onClick={() => onChange({ ...draft, tab: "at" })}>Data e hora</TabButton>
        <TabButton active={draft.tab === "before"} disabled={!record.dueAt} onClick={() => onChange({ ...draft, tab: "before" })}>Antes do prazo</TabButton>
      </div>
      {draft.tab === "at" ? (
        <input type="datetime-local" aria-label="Data e hora do lembrete" value={draft.at} onChange={(event) => onChange({ ...draft, at: event.target.value })} className={fieldClass} />
      ) : (
        <select aria-label="Quanto antes do prazo" value={draft.minutes} onChange={(event) => onChange({ ...draft, minutes: Number(event.target.value) })} className={fieldClass}>
          {beforeOptions(record.dueHasTime).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
      {!record.dueAt ? <span className="text-xs text-muted">Para lembrar antes do prazo, escolha o prazo primeiro.</span> : null}
    </>
  );
}

// Como no Todoist: numa data e hora fixa ou um tempo antes do prazo.
function ReminderForm({ record, onDone }: { record: RecordDto; onDone: () => void }) {
  const add = useAddReminder(record.id);
  const toast = useToast();
  const [draft, setDraft] = useState<ReminderDraft>(() => ({ tab: record.dueAt ? "before" : "at", at: nowLocalInput(), minutes: beforeOptions(record.dueHasTime)[0].value }));
  const submit = () => add.mutate(draftBody(draft), { onSuccess: onDone, onError: (error) => toast({ text: errorMessage(error) }) });
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-line bg-card p-2">
      <ReminderInputs record={record} draft={draft} onChange={setDraft} />
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={add.isPending || (draft.tab === "at" && !draft.at)} className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-contrast disabled:opacity-50">
          Adicionar lembrete
        </button>
        <button type="button" onClick={onDone} className="rounded-md px-2 py-1 text-xs text-muted hover:text-app">Cancelar</button>
      </div>
    </div>
  );
}

/**
 * Lembretes da tarefa na coluna lateral da ficha: a lista, com × para tirar, e o formulário para criar.
 * Ex.: `<ReminderRow record={record} />`
 */
export function ReminderRow({ record }: { record: RecordDto }) {
  const reminders = useTaskReminders(record.id);
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex w-full flex-col gap-1.5">
      {reminders.data && reminders.data.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {reminders.data.map((reminder) => <ReminderItem key={reminder.id} reminder={reminder} record={record} />)}
        </ul>
      ) : null}
      {adding ? (
        <ReminderForm record={record} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="-ml-1 inline-flex items-center gap-1 self-start rounded-md px-1 py-1 text-[13px] text-muted hover:bg-card hover:text-app">
          <Icon name="plus" className="h-3.5 w-3.5" />
          Lembrete
        </button>
      )}
    </div>
  );
}
