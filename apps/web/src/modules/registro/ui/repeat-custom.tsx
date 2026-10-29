import type { TaskRepeat } from "@manutencao/shared";
import { SelectInput } from "../../../design/ui/controls";
import { REPEAT_UNITS, clampInterval, customOfRepeat, repeatOfCustom, repeatUnitLabel, type CustomRepeat, type RepeatUnit } from "../model/repeat-custom";
import { addDays } from "../model/agenda";
import { toggleWeekday } from "../model/task-repeat";
import { recordNoteText, recordValueText } from "./record-text";

const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Ao escolher "Termina em", a data sugerida fica um mês depois do prazo.
const SUGGESTED_END_DAYS = 30;
const fieldClass = `rounded-md border border-line bg-surface px-2 py-1 text-app ${recordValueText}`;

/**
 * Os dias da semana da repetição (como no Todoist), a semana começando na segunda.
 * Ex.: `<WeekdayToggles weekdays={[1, 3]} onChange={(weekdays) => save(weekdays)} />`
 */
export function WeekdayToggles({ weekdays, onChange }: { weekdays: number[]; onChange: (weekdays: number[]) => void }) {
  return (
    <span className="flex w-full gap-1 pt-1" role="group" aria-label="Dias da semana">
      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
        const on = weekdays.includes(weekday);
        return (
          <button
            key={weekday}
            type="button"
            aria-pressed={on}
            aria-label={WEEKDAY_NAMES[weekday]}
            onClick={() => onChange(toggleWeekday(weekdays, weekday))}
            className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold ${on ? "bg-accent text-accent-contrast" : "bg-chip text-muted hover:text-app"}`}
          >
            {WEEKDAY_LETTERS[weekday]}
          </button>
        );
      })}
    </span>
  );
}

// "A cada [N] [dias]": o número grava ao sair do campo (cada tecla mudaria a regra).
function IntervalRow({ custom, onChange }: { custom: CustomRepeat; onChange: (patch: Partial<CustomRepeat>) => void }) {
  const commit = (text: string) => {
    const interval = clampInterval(custom.unit, Number(text));
    if (interval !== custom.interval) onChange({ interval });
  };
  return (
    <span className="flex items-center gap-2">
      <span className="text-muted">A cada</span>
      <input
        key={custom.interval}
        type="number"
        inputMode="numeric"
        min={1}
        aria-label="A cada quantos"
        defaultValue={custom.interval}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className={`${fieldClass} w-16 tabular-nums`}
      />
      <SelectInput variant="chip" aria-label="Unidade da repetição" value={custom.unit} className="border border-line" onChange={(event) => onChange({ unit: event.target.value as RepeatUnit, interval: clampInterval(event.target.value as RepeatUnit, custom.interval) })}>
        {REPEAT_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {repeatUnitLabel(unit, custom.interval)}
          </option>
        ))}
      </SelectInput>
    </span>
  );
}

// Até quando: sem data a série não termina; com data, a última tarefa nasce até esse dia.
function UntilRow({ until, anchor, onChange }: { until: string | null; anchor: string; onChange: (until: string | null) => void }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-muted">Termina</span>
      <SelectInput variant="chip" aria-label="Quando termina" value={until ? "date" : "never"} className="border border-line" onChange={(event) => onChange(event.target.value === "date" ? addDays(anchor, SUGGESTED_END_DAYS) : null)}>
        <option value="never">Nunca</option>
        <option value="date">Em uma data</option>
      </SelectInput>
      {until ? (
        <input type="date" aria-label="Último dia da repetição" value={until} min={anchor} onChange={(event) => event.target.value && onChange(event.target.value)} className={fieldClass} />
      ) : null}
    </span>
  );
}

/**
 * Personalizar… do Repetir: a cada N dias, semanas (com os dias) ou meses, e até quando. Cada mudança grava.
 * Ex.: `<RepeatCustomPanel rule={record.repeat} anchor="2026-11-02" onChange={(rule) => save({ repeat: rule })} />`
 */
export function RepeatCustomPanel({ rule, anchor, onChange }: { rule: TaskRepeat | null; anchor: string; onChange: (rule: TaskRepeat) => void }) {
  const custom = customOfRepeat(rule, anchor);
  const change = (patch: Partial<CustomRepeat>) => onChange(repeatOfCustom({ ...custom, ...patch }));
  return (
    <div className={`mt-1 flex w-full flex-col gap-2 rounded-md border border-line bg-surface p-2 text-app ${recordValueText}`}>
      <IntervalRow custom={custom} onChange={change} />
      {custom.unit === "week" ? <WeekdayToggles weekdays={custom.weekdays} onChange={(weekdays) => change({ weekdays })} /> : null}
      {custom.unit === "month" ? <span className={`text-muted ${recordNoteText}`}>No dia {custom.dayOfMonth} de cada mês (o dia do prazo).</span> : null}
      <UntilRow until={custom.until} anchor={anchor} onChange={(until) => change({ until })} />
    </div>
  );
}

