import type { RecordDto, TaskRepeat } from "@manutencao/shared";
import { dueDay, todayDay } from "../model/board";
import { REPEAT_CHOICES, choiceOfRepeat, repeatChoiceLabel, repeatOfChoice, repeatPatch, toggleWeekday, type RepeatChoice, type RepeatPatch } from "../model/task-repeat";
import { Chip } from "./chips";

const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Na repetição semanal, os dias da semana que contam (como no Todoist): a semana começa na segunda.
function WeekdayToggles({ rule, onChange }: { rule: Extract<TaskRepeat, { every: "week" }>; onChange: (rule: TaskRepeat) => void }) {
  return (
    <span className="flex w-full gap-1 pt-1" role="group" aria-label="Dias da semana">
      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
        const on = rule.weekdays.includes(weekday);
        return (
          <button
            key={weekday}
            type="button"
            aria-pressed={on}
            aria-label={WEEKDAY_NAMES[weekday]}
            onClick={() => onChange(toggleWeekday(rule, weekday))}
            className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold ${on ? "bg-accent text-accent-contrast" : "bg-chip text-muted hover:text-app"}`}
          >
            {WEEKDAY_LETTERS[weekday]}
          </button>
        );
      })}
    </span>
  );
}

/**
 * Repetir da ficha da tarefa: ao concluir, nasce a próxima no dia seguinte da regra.
 * Ex.: `<RepeatRow record={record} onChange={(patch) => save(patch)} />`
 */
export function RepeatRow({ record, onChange }: { record: RecordDto; onChange: (patch: RepeatPatch) => void }) {
  const today = todayDay();
  const anchor = record.dueAt ? dueDay(record.dueAt) : today;
  const current = record.repeat;
  const pick = (value: string) => onChange(repeatPatch(record, value ? repeatOfChoice(value as RepeatChoice, anchor) : null, today));
  return (
    <>
      <Chip label="Repetir" value={current ? choiceOfRepeat(current) : ""} icon="repeat" onChange={pick} onClear={() => pick("")}>
        {current ? null : <option value="">Não repete</option>}
        {REPEAT_CHOICES.map((choice) => (
          <option key={choice} value={choice}>
            {repeatChoiceLabel(choice, current, anchor)}
          </option>
        ))}
      </Chip>
      {current?.every === "week" ? <WeekdayToggles rule={current} onChange={(rule) => onChange({ repeat: rule })} /> : null}
    </>
  );
}
