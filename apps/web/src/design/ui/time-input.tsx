import { useContext, useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { CLOCK_HOURS, CLOCK_MINUTES, clockHour, clockMinute, parseClock, withClockHour, withClockMinute } from "./clock-text";
import { FieldError } from "./field-feedback";
import { Icon } from "./icons";
import { Panel, useIsPhone, useOutsideClose, usePlacement } from "./popover";
import { chipTrigger, controlBase, FieldLabelContext } from "./select";

// Seletor de horário próprio, no lugar do <input type="time">: o relógio nativo muda de navegador para navegador
// e o do Chrome no Android (de ponteiro) é confuso. Grade de horas e de minutos de 5 em 5; o campo de texto
// aceita qualquer minuto ("1430", "14h32"). Clicar fora grava, como sair do campo; Esc e o × do celular desistem.

// A grade inteira (texto, horas, minutos e rodapé) cabe em ~370px: sobe quando embaixo não cabe.
const PANEL_SIZE = { minWidth: 288, maxHeight: 390, flipBelow: 380 };

type ClockDraft = { clock: string; typed: string; error: string };

function wrongClock(typed: string): string {
  return `Horário "${typed.trim()}" não existe. Use de 00:00 a 23:59, ex.: 14:30 ou 1430.`;
}

// O horário sendo escolhido no painel aberto, antes de gravar.
function useClockDraft(value: string) {
  const [draft, setDraft] = useState<ClockDraft>({ clock: value, typed: value, error: "" });
  const pick = (clock: string) => setDraft({ clock, typed: clock, error: "" });
  const type = (typed: string) => setDraft((current) => ({ clock: typed.trim() ? (parseClock(typed) ?? current.clock) : "", typed, error: "" }));
  // O que está no painel vale para gravar? Texto que não é horário não grava.
  const settled = (): string | null => (draft.typed.trim() && !parseClock(draft.typed) ? null : draft.clock);
  const complain = () => setDraft((current) => ({ ...current, error: wrongClock(current.typed) }));
  return { draft, reset: () => pick(value), pick, type, settled, complain };
}

type ClockGridProps = { label: string; items: string[]; chosen: string; disabled?: boolean; phone: boolean; onPick: (item: string) => void };

function ClockGrid({ label, items, chosen, disabled = false, phone, onPick }: ClockGridProps) {
  const size = phone ? "h-11 text-base" : "h-7 text-sm";
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => {
          // Escolhido em cor cheia: no tema escuro o accent-soft quase some sobre o fundo do painel.
          const tone = item === chosen ? "bg-accent font-semibold text-accent-contrast" : "text-app hover:bg-chip active:bg-chip";
          return (
            <button key={item} type="button" aria-pressed={item === chosen} disabled={disabled} onClick={() => onPick(item)} className={`rounded-lg tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40 ${size} ${tone}`}>
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TypedClockProps = { label: string; draft: ClockDraft; phone: boolean; onType: (typed: string) => void; onEnter: () => void };

// Para quem prefere digitar: no computador já abre com o cursor aqui.
function TypedClock({ label, draft, phone, onType, onEnter }: TypedClockProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        inputMode="numeric"
        autoFocus={!phone}
        aria-label={`Digitar ${label.toLowerCase()}`}
        aria-invalid={draft.error ? true : undefined}
        placeholder="Digite: 1430 ou 14:30"
        value={draft.typed}
        onChange={(event) => onType(event.target.value)}
        onKeyDown={(event) => (event.key === "Enter" ? (event.preventDefault(), onEnter()) : null)}
        // 16px no celular: abaixo disso o Safari do iPhone dá zoom na tela ao focar.
        className={`w-full rounded-lg border border-line bg-chip px-2.5 py-2 tabular-nums ${phone ? "text-base" : "text-sm"} text-app focus:border-accent focus:bg-surface focus:outline-none`}
      />
      {draft.error ? <FieldError text={draft.error} /> : null}
    </div>
  );
}

function ClockFooter({ phone, clearable, onClear, onDone }: { phone: boolean; clearable: boolean; onClear: () => void; onDone: () => void }) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-line ${phone ? "px-1 pt-3" : "px-3 py-2.5"}`}>
      {clearable ? (
        <button type="button" onClick={onClear} className="rounded-control border border-line bg-chip px-3 py-1.5 text-[13px] font-semibold text-app transition hover:bg-accent-soft">
          Sem horário
        </button>
      ) : null}
      <button type="button" onClick={onDone} className="rounded-control bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-contrast transition hover:brightness-90">
        Pronto
      </button>
    </div>
  );
}

type TriggerProps = {
  triggerRef: RefObject<HTMLButtonElement | null>;
  variant: "field" | "chip";
  shown: string;
  empty: boolean;
  open: boolean;
  labelling: { label?: string; labelledBy?: string; valueId: string };
  id?: string;
  disabled?: boolean;
  className: string;
  onToggle: () => void;
  onEscape: (event: KeyboardEvent) => void;
};

function TimeTrigger({ triggerRef, variant, shown, empty, open, labelling, id, disabled, className, onToggle, onEscape }: TriggerProps) {
  const fieldLook = `${controlBase} control-focus flex w-full items-center justify-between gap-2 text-left ${open ? "control-open" : "hover:border-accent"} disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted disabled:opacity-75`;
  const icon = <Icon name="clock" className={`h-3.5 w-3.5 shrink-0 ${variant === "field" ? "h-4 w-4 text-muted" : ""}`} />;
  return (
    <button
      ref={triggerRef}
      id={id}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={labelling.label}
      aria-labelledby={labelling.labelledBy}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (open) return onEscape(event);
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        onToggle();
      }}
      className={`${variant === "chip" ? chipTrigger : fieldLook} ${className}`}
    >
      {variant === "chip" ? icon : null}
      <span id={labelling.valueId} className={`min-w-0 truncate tabular-nums ${empty ? "text-muted" : ""}`}>
        {shown}
      </span>
      {variant === "field" ? icon : null}
    </button>
  );
}

type TimeInputProps = {
  // "HH:MM", ou "" sem horário.
  value: string;
  onChange: (value: string) => void;
  // "chip": etiqueta pequena da ficha da tarefa; "field": campo de formulário, como o SelectInput.
  variant?: "field" | "chip";
  placeholder?: string;
  // Mostra "Sem horário" para apagar.
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

/**
 * Campo de horário do sistema: abre a grade de horas e minutos embaixo do campo (computador) ou num painel
 * que sobe de baixo (celular). Devolve "HH:MM" ou "" (com `clearable`).
 * Ex.: `<Field label="Abertura"><TimeInput value={opened} onChange={setOpened} /></Field>`
 */
export function TimeInput({ value, onChange, variant = "field", placeholder = "--:--", clearable = false, disabled, id, className = "", "aria-label": ariaLabel }: TimeInputProps) {
  const field = useContext(FieldLabelContext);
  const valueId = useId();
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const draft = useClockDraft(value);
  const place = usePlacement(open && !phone, triggerRef, PANEL_SIZE);
  const title = ariaLabel ?? field?.text ?? "Horário";

  function close() {
    setOpen(false);
    if (!phone) triggerRef.current?.focus();
  }
  function save(clock: string | null) {
    if (clock === null) return draft.complain();
    if (clock !== value) onChange(clock);
    close();
  }
  useOutsideClose(open && !phone, [triggerRef, panelRef], () => {
    const clock = draft.settled();
    if (clock !== null && clock !== value) onChange(clock);
    setOpen(false);
  });
  // Esc fecha só o seletor, venha do painel ou do campo (no celular o foco fica no campo).
  function onPanelKey(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    // O Modal ignora o Esc que já foi usado aqui.
    event.preventDefault();
    close();
  }

  const labelling = { label: ariaLabel, labelledBy: ariaLabel ? undefined : field ? `${field.id} ${valueId}` : undefined, valueId };
  return (
    <>
      <TimeTrigger
        triggerRef={triggerRef}
        variant={variant}
        shown={value || placeholder}
        empty={!value}
        open={open}
        labelling={labelling}
        id={id}
        disabled={disabled}
        className={className}
        onToggle={() => (open ? close() : (draft.reset(), setOpen(true)))}
        onEscape={onPanelKey}
      />
      {open ? (
        <Panel phone={phone} place={place} panelRef={panelRef} title={title} onClose={() => setOpen(false)} footer={<ClockFooter phone={phone} clearable={clearable} onClear={() => save("")} onDone={() => save(draft.settled())} />}>
          <div role={phone ? undefined : "dialog"} aria-label={phone ? undefined : title} onKeyDown={onPanelKey} className={`flex flex-col gap-3 ${phone ? "pb-1" : "p-1.5"}`}>
            <TypedClock label={title} draft={draft.draft} phone={phone} onType={draft.type} onEnter={() => save(draft.settled())} />
            <ClockGrid label="Hora" items={CLOCK_HOURS} chosen={clockHour(draft.draft.clock)} phone={phone} onPick={(hour) => draft.pick(withClockHour(draft.draft.clock, hour))} />
            <ClockGrid label="Minuto" items={CLOCK_MINUTES} chosen={clockMinute(draft.draft.clock)} disabled={!draft.draft.clock} phone={phone} onPick={(minute) => save(withClockMinute(draft.draft.clock, minute))} />
          </div>
        </Panel>
      ) : null}
    </>
  );
}
