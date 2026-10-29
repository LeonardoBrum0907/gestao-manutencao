import { useState } from "react";
import type { RecordDto } from "@manutencao/shared";
import { dueDay, todayDay } from "../model/board";
import { customOfRepeat, repeatOfCustom } from "../model/repeat-custom";
import { REPEAT_CHOICES, choiceOfRepeat, repeatChoiceLabel, repeatOfChoice, repeatPatch, type RepeatChoice, type RepeatPatch } from "../model/task-repeat";
import { Chip } from "./chips";
import { RepeatCustomPanel, WeekdayToggles } from "./repeat-custom";

/**
 * Repetir da ficha da tarefa: ao concluir, nasce a próxima no dia seguinte da regra. Personalizar… abre os
 * campos de "a cada N" e "termina"; regra personalizada já gravada abre com eles.
 * Ex.: `<RepeatRow record={record} onChange={(patch) => save(patch)} />`
 */
export function RepeatRow({ record, onChange }: { record: RecordDto; onChange: (patch: RepeatPatch) => void }) {
  const [customOpen, setCustomOpen] = useState(false);
  const today = todayDay();
  const anchor = record.dueAt ? dueDay(record.dueAt) : today;
  const current = record.repeat;
  const choice = current ? choiceOfRepeat(current) : "";
  function pick(value: string) {
    setCustomOpen(value === "custom");
    if (value === "custom" && current) return;
    const rule = value === "custom" ? repeatOfCustom(customOfRepeat(null, anchor)) : value ? repeatOfChoice(value as RepeatChoice, anchor) : null;
    onChange(repeatPatch(record, rule, today));
  }
  const showCustom = current !== null && (customOpen || choice === "custom");
  return (
    <>
      <Chip label="Repetir" value={showCustom ? "custom" : choice} icon="repeat" onChange={pick} onClear={() => pick("")}>
        {current ? null : <option value="">Não repete</option>}
        {REPEAT_CHOICES.map((item) => (
          <option key={item} value={item}>
            {repeatChoiceLabel(item, current, anchor)}
          </option>
        ))}
      </Chip>
      {showCustom ? <RepeatCustomPanel rule={current} anchor={anchor} onChange={(repeat) => onChange({ repeat })} /> : null}
      {!showCustom && current?.every === "week" ? <WeekdayToggles weekdays={current.weekdays} onChange={(weekdays) => onChange({ repeat: { ...current, weekdays } })} /> : null}
    </>
  );
}
