import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { RecordDto, TaskReminderDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useAddReminder, useRemoveReminder } from "../data/reminders";
import { todayDay } from "../model/board";
import { presetNote, reminderPresets, type ReminderPreset } from "../model/reminder-presets";
import { fireShortText } from "../model/reminders";
import { CustomReminder } from "./reminder-custom";
import { recordNoteText, recordValueText } from "./record-text";

const rowClass = `flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${recordValueText} text-app hover:bg-accent-soft focus:bg-accent-soft focus:outline-none disabled:opacity-50 disabled:hover:bg-transparent`;

function PresetButton({ preset, today, busy, onPick }: { preset: ReminderPreset; today: string; busy: boolean; onPick: (preset: ReminderPreset) => void }) {
  const saved = preset.savedId !== null;
  return (
    <button type="button" aria-pressed={saved} disabled={busy || preset.past} onClick={() => onPick(preset)} className={rowClass}>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        {saved ? <Icon name="check" className="h-4 w-4 text-accent" /> : <span className="w-4" />}
        {preset.label}
      </span>
      <span className={`shrink-0 ${recordNoteText} tabular-nums text-muted`}>{preset.past ? "Já passou" : fireShortText(preset.fireAt, today)}</span>
    </button>
  );
}

function usePresetPick(record: RecordDto, onDone: () => void) {
  const add = useAddReminder(record.id);
  const remove = useRemoveReminder(record.id);
  const toast = useToast();
  const options = { onSuccess: onDone, onError: (error: unknown) => toast({ text: errorMessage(error) }) };
  // Atalho que a tarefa já tem sai com o mesmo toque: assim não nasce lembrete repetido.
  const pick = (preset: ReminderPreset) => (preset.savedId ? remove.mutate(preset.savedId, options) : add.mutate(preset.body, options));
  return { pick, busy: add.isPending || remove.isPending };
}

function PresetList({ record, saved, onCustom, onDone }: { record: RecordDto; saved: TaskReminderDto[]; onCustom: () => void; onDone: () => void }) {
  const { pick, busy } = usePresetPick(record, onDone);
  const today = todayDay();
  const note = presetNote(record);
  return (
    <>
      <span className={`px-3 pb-1 pt-2 ${recordNoteText} font-semibold text-muted`}>Avisar…</span>
      {reminderPresets(record, saved, new Date(), today).map((preset) => <PresetButton key={preset.key} preset={preset} today={today} busy={busy} onPick={pick} />)}
      {note ? <span className={`px-3 pb-1 pt-1 ${recordNoteText} text-muted`}>{note}</span> : null}
      <button type="button" onClick={onCustom} className={`${rowClass} mt-1 border-t border-line`}>
        Outro dia e horário…
        <Icon name="chevron" className="h-3.5 w-3.5 self-center text-muted" />
      </button>
    </>
  );
}

/**
 * Lista de atalhos do "+ Lembrete": um toque grava (ou tira, se já existe) e fecha; "Outro dia e horário" abre dia e hora.
 * Ex.: `<ReminderMenu record={record} saved={reminders} onClose={() => setOpen(false)} />`
 */
export function ReminderMenu({ record, saved, onClose }: { record: RecordDto; saved: TaskReminderDto[]; onClose: () => void }) {
  const [custom, setCustom] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
  }, [custom]);
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    // Esc fecha só a lista: o modal do registro (dialog.ts) ignora o Esc já usado.
    event.preventDefault();
    onClose();
  };
  return (
    <div ref={box} onKeyDown={onKey} className="flex w-full flex-col rounded-md border border-line bg-surface pb-1 shadow-card">
      {custom ? <CustomReminder record={record} onBack={() => setCustom(false)} onDone={onClose} /> : <PresetList record={record} saved={saved} onCustom={() => setCustom(true)} onDone={onClose} />}
    </div>
  );
}
