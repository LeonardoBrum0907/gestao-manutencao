import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { FeedbackTone, RecordPriority, RecordType } from "@manutencao/shared";
import { SelectInput } from "../../../design/ui/controls";
import { Icon, type IconName } from "../../../design/ui/icons";
import { useLines, useMachines, useMembers, useSubassemblies } from "../../cadastro/data/cadastro";
import { subassemblyChoices } from "../../cadastro/model/machine-spot";
import { dayLabel, nextDay } from "../model/board";
import { priorityLabel, recordShortName, recordTypeIcon, toneLabel } from "../model/record";

// Etiquetas do cartão de adicionar (no estilo do Todoist): cada uma abre a lista de escolha e,
// quando tem valor, ganha um × para tirar.

const chipIcon = (name: IconName, size: string) => <Icon name={name} className={size} />;

// Na coluna lateral do modal do registro as etiquetas aparecem sem borda, alinhadas ao rótulo, e com letra maior
// (15px, o recordValueText de record-text.ts; escrito por inteiro para o Tailwind gerar a classe).
const PlainChips = createContext(false);
const plainTrigger = "hover:!bg-card !text-[15px]";

/** Etiquetas sem borda dentro dele. Ex.: `<PlainChipsArea><PriorityChip … /></PlainChipsArea>` */
export function PlainChipsArea({ children }: { children: ReactNode }) {
  return <PlainChips.Provider value>{children}</PlainChips.Provider>;
}

type ChipProps = {
  label: string;
  value: string;
  icon: IconName;
  // Cor do texto quando há valor (prazo atrasado em vermelho, hoje em verde…).
  tone?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  children: ReactNode;
};

/**
 * Etiqueta com escolha. As opções vêm como `<option>`, como no SelectInput.
 * Ex.: `<Chip label="Linha" value={lineId} icon="line" onChange={setLineId} onClear={() => setLineId("")}>{options}</Chip>`
 */
export function Chip({ label, value, icon, tone = "text-app", onChange, onClear, children }: ChipProps) {
  const plain = useContext(PlainChips);
  const filled = value !== "";
  const frame = plain ? "-ml-2" : "border border-line bg-surface";
  const iconSize = plain ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className={`inline-flex items-center rounded-md ${frame} ${filled ? tone : "text-muted"}`}>
      <SelectInput
        variant="chip"
        aria-label={label}
        value={value}
        icon={chipIcon(icon, iconSize)}
        className={plain ? plainTrigger : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </SelectInput>
      {filled && onClear ? (
        <button type="button" aria-label={`Tirar ${label.toLowerCase()}`} onClick={onClear} className="-ml-1 grid h-7 w-6 place-items-center rounded-md text-muted hover:text-app">
          <Icon name="close" className={plain ? "h-3.5 w-3.5" : "h-3 w-3"} />
        </button>
      ) : null}
    </span>
  );
}

const PICK = "escolher";

function dayTone(day: string, today: string): string {
  if (day < today) return "text-danger";
  if (day === today) return "text-accent";
  return "text-app";
}

type PickerInput = HTMLInputElement & { showPicker?: () => void };

/**
 * Prazo: Hoje, Amanhã ou outra data (abre o calendário do aparelho). `day` em "AAAA-MM-DD".
 * Ex.: `<DueChip day={day} today={board.today} onChange={setDay} />`
 */
export function DueChip({ day, today, onChange }: { day: string | null; today: string; onChange: (day: string | null) => void }) {
  const picker = useRef<PickerInput>(null);
  const [typing, setTyping] = useState(false);
  const typingText = useContext(PlainChips) ? "text-[15px]" : "text-[13px]";
  const tomorrow = nextDay(today);
  const custom = day && day !== today && day !== tomorrow ? day : null;

  function choose(value: string) {
    if (value !== PICK) return onChange(value || null);
    try {
      picker.current?.showPicker?.();
      if (!picker.current?.showPicker) setTyping(true);
    } catch {
      setTyping(true);
    }
  }

  return (
    <span className="relative inline-flex">
      <Chip label="Prazo" value={day ?? ""} icon="calendar" tone={day ? dayTone(day, today) : undefined} onChange={choose} onClear={() => onChange(null)}>
        {day ? null : <option value="">Data</option>}
        <option value={today}>Hoje</option>
        <option value={tomorrow}>Amanhã</option>
        {custom ? <option value={custom}>{dayLabel(custom, today)}</option> : null}
        <option value={PICK}>Escolher data…</option>
      </Chip>
      <input
        ref={picker}
        type="date"
        aria-label="Data do prazo"
        tabIndex={typing ? 0 : -1}
        value={day ?? ""}
        onChange={(event) => {
          onChange(event.target.value || null);
          setTyping(false);
        }}
        className={typing ? `ml-1 rounded-md border border-line bg-surface px-2 py-1 ${typingText} text-app` : "pointer-events-none absolute inset-0 opacity-0"}
      />
    </span>
  );
}

const priorityTone: Record<RecordPriority, string> = { high: "text-danger", medium: "text-warn", low: "text-app" };

export function PriorityChip({ value, onChange }: { value: RecordPriority | null; onChange: (value: RecordPriority | null) => void }) {
  return (
    <Chip
      label="Prioridade"
      value={value ?? ""}
      icon="flag"
      tone={value ? priorityTone[value] : undefined}
      onChange={(next) => onChange((next || null) as RecordPriority | null)}
      onClear={() => onChange(null)}
    >
      {value ? null : <option value="">Prioridade</option>}
      <option value="high">{priorityLabel("high")}</option>
      <option value="medium">{priorityLabel("medium")}</option>
      <option value="low">{priorityLabel("low")}</option>
    </Chip>
  );
}

export function TypeChip({ value, onChange }: { value: RecordType; onChange: (value: RecordType) => void }) {
  return (
    <Chip label="Tipo" value={value} icon={recordTypeIcon[value]} onChange={(next) => onChange(next as RecordType)}>
      <option value="entry">{recordShortName("entry")}</option>
      <option value="task">{recordShortName("task")}</option>
      <option value="problem">{recordShortName("problem")}</option>
      <option value="feedback">{recordShortName("feedback")}</option>
    </Chip>
  );
}

export function MemberChip({ value, label = "Colaborador", onChange }: { value: string; label?: string; onChange: (value: string) => void }) {
  const members = useMembers();
  return (
    <Chip label={label} value={value} icon="user" onChange={onChange} onClear={() => onChange("")}>
      {value ? null : <option value="">{label}</option>}
      {(members.data ?? []).map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </Chip>
  );
}

export function ToneChip({ value, onChange }: { value: FeedbackTone; onChange: (value: FeedbackTone) => void }) {
  return (
    <Chip label="Tom" value={value} icon="tone" onChange={(next) => onChange(next as FeedbackTone)}>
      <option value="positive">{toneLabel("positive")}</option>
      <option value="negative">{toneLabel("negative")}</option>
      <option value="neutral">{toneLabel("neutral")}</option>
    </Chip>
  );
}

export type PlaceValue = { lineId: string; machineId: string; subassemblyId: string };
export const noPlace: PlaceValue = { lineId: "", machineId: "", subassemblyId: "" };

/**
 * Linha, máquina da linha e conjunto do modelo da máquina; cada etiqueta só aparece quando a anterior tem valor
 * e há o que escolher. Trocar a linha limpa a máquina, e trocar a máquina limpa o conjunto.
 */
export function PlaceChips({ value, onChange }: { value: PlaceValue; onChange: (value: PlaceValue) => void }) {
  const lines = useLines();
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const lineMachines = (machines.data ?? []).filter((machine) => machine.lineId === value.lineId);
  const machine = lineMachines.find((item) => item.id === value.machineId);
  const choices = subassemblyChoices(subassemblies.data ?? [], machine, value.subassemblyId);
  const setLine = (lineId: string) => onChange({ lineId, machineId: "", subassemblyId: "" });
  const setMachine = (machineId: string) => onChange({ ...value, machineId, subassemblyId: "" });
  const setSubassembly = (subassemblyId: string) => onChange({ ...value, subassemblyId });
  return (
    <>
      <Chip label="Linha" value={value.lineId} icon="line" onChange={setLine} onClear={() => setLine("")}>
        {value.lineId ? null : <option value="">Linha</option>}
        {(lines.data ?? []).map((line) => (
          <option key={line.id} value={line.id}>
            {line.name}
          </option>
        ))}
      </Chip>
      {lineMachines.length ? (
        <Chip label="Máquina" value={value.machineId} icon="machine" onChange={setMachine} onClear={() => setMachine("")}>
          {value.machineId ? null : <option value="">Máquina</option>}
          {lineMachines.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Chip>
      ) : null}
      {choices.length ? (
        <Chip label="Conjunto" value={value.subassemblyId} icon="settings" onChange={setSubassembly} onClear={() => setSubassembly("")}>
          {value.subassemblyId ? null : <option value="">Conjunto</option>}
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Chip>
      ) : null}
    </>
  );
}
