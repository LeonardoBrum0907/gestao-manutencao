import { useState } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { TimeInput } from "../../../design/ui/time-input";
import { useToast } from "../../../design/ui/toast";
import { useAddReminder } from "../data/reminders";
import { dueDay, nextDay, todayDay } from "../model/board";
import { dueAtWithClock } from "../model/due-time";
import { fireText } from "../model/reminders";
import { recordNoteText, recordValueText } from "./record-text";

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_CLOCK = "07:00";

type DayChoice = { day: string; label: string };

function dayChoices(record: RecordDto, today: string): DayChoice[] {
  const choices = [{ day: today, label: "Hoje" }, { day: nextDay(today), label: "Amanhã" }];
  const due = record.dueAt ? dueDay(record.dueAt) : null;
  if (due && due > nextDay(today)) choices.push({ day: due, label: "Dia do prazo" });
  return choices;
}

function DayChips({ choices, day, onPick }: { choices: DayChoice[]; day: string; onPick: (day: string) => void }) {
  const tone = (active: boolean) => (active ? "border-accent bg-accent-soft font-semibold" : "border-line bg-surface hover:bg-chip");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {choices.map((choice) => (
        <button key={choice.day} type="button" aria-pressed={choice.day === day} onClick={() => onPick(choice.day)} className={`rounded-md border px-2.5 py-1 ${recordValueText} text-app ${tone(choice.day === day)}`}>
          {choice.label}
        </button>
      ))}
      <input type="date" aria-label="Outra data do lembrete" value={day} onChange={(event) => event.target.value && onPick(event.target.value)} className={`rounded-md border border-line bg-surface px-2 py-1 ${recordValueText} text-app`} />
    </div>
  );
}

function FirePreview({ at, today }: { at: Date | null; today: string }) {
  if (!at) return <p className={`${recordNoteText} text-muted`}>Escolha o horário.</p>;
  if (at.getTime() <= Date.now()) return <p className={`${recordNoteText} text-danger`}>Esse horário já passou.</p>;
  return <p className={`rounded-md bg-accent-soft px-2.5 py-1.5 ${recordValueText} text-app`}>Vai tocar <strong className="tabular-nums">{fireText(at, today).toLowerCase()}</strong></p>;
}

/**
 * "Outro dia e horário" dos lembretes: dia (Hoje, Amanhã, Dia do prazo ou outra data) e hora, com a prévia de quando toca.
 * Ex.: `<CustomReminder record={record} onBack={() => setCustom(false)} onDone={close} />`
 */
export function CustomReminder({ record, onBack, onDone }: { record: RecordDto; onBack: () => void; onDone: () => void }) {
  const add = useAddReminder(record.id);
  const toast = useToast();
  const today = todayDay();
  const [day, setDay] = useState(() => nextDay(today));
  const [clock, setClock] = useState(DEFAULT_CLOCK);
  const at = CLOCK.test(clock) ? new Date(dueAtWithClock(day, clock)) : null;
  const ready = at !== null && at.getTime() > Date.now();
  const submit = () => at && add.mutate({ kind: "at", at: at.toISOString() }, { onSuccess: onDone, onError: (error) => toast({ text: errorMessage(error) }) });
  return (
    <div className="flex flex-col gap-2.5 p-3">
      <span className={`${recordNoteText} font-semibold text-muted`}>Dia</span>
      <DayChips choices={dayChoices(record, today)} day={day} onPick={setDay} />
      <span className={`${recordNoteText} font-semibold text-muted`}>Hora</span>
      <div className="w-36 self-start">
        <TimeInput aria-label="Hora do lembrete" value={clock} onChange={setClock} />
      </div>
      <FirePreview at={at} today={today} />
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={!ready || add.isPending} className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast disabled:opacity-50">
          Adicionar
        </button>
        <button type="button" onClick={onBack} className="rounded-md px-2 py-1.5 text-sm text-muted hover:text-app">Voltar</button>
      </div>
    </div>
  );
}
