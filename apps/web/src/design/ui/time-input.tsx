import { useContext, useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { CLOCK_HOURS, CLOCK_MINUTES, clockHour, clockMinute, joinClock, startClock } from "./clock-text";
import { Icon } from "./icons";
import { Panel, useIsPhone, useOutsideClose, usePlacement } from "./popover";
import { chipTrigger, controlBase, FieldLabelContext } from "./select";
import { TimeWheel } from "./time-wheel";

// Seletor de horário próprio, no lugar do <input type="time">: o relógio nativo muda de navegador para navegador
// e o do Chrome no Android (de ponteiro) é confuso. Duas rodas sem fim, hora e minuto, como o alarme do celular
// (o Léo mostrou o da Samsung). Pronto e Enter gravam; clicar fora grava, como sair do campo; Esc e o × do
// celular desistem.

// Rodas de 5 linhas de 36px mais o rodapé: sobe quando embaixo não cabe.
const PANEL_SIZE = { minWidth: 220, maxHeight: 300, flipBelow: 270 };
const DESKTOP_WHEEL = { row: 36, sizeClass: "w-16 text-xl" };
const PHONE_WHEEL = { row: 56, sizeClass: "w-24 text-[34px]" };

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

// As duas rodas lado a lado, com os dois pontos no meio.
// Cada roda muda só a sua parte do horário atual (as duas podem parar quase juntas).
type ClockUpdate = (update: (clock: string) => string) => void;

function ClockWheels({ clock, phone, onChange }: { clock: string; phone: boolean; onChange: ClockUpdate }) {
  const wheel = phone ? PHONE_WHEEL : DESKTOP_WHEEL;
  return (
    <div className={`flex items-center justify-center ${phone ? "gap-4 py-2" : "gap-2 p-2"}`}>
      <TimeWheel label="Hora" items={CLOCK_HOURS} value={clockHour(clock)} {...wheel} autoFocus={!phone} onChange={(hour) => onChange((current) => joinClock(hour, clockMinute(current)))} />
      <span aria-hidden className={`font-semibold text-muted ${phone ? "text-[34px]" : "text-xl"}`}>:</span>
      <TimeWheel label="Minuto" items={CLOCK_MINUTES} value={clockMinute(clock)} {...wheel} onChange={(minute) => onChange((current) => joinClock(clockHour(current), minute))} />
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
  // No chip o ícone acompanha o tamanho da letra (13px no cartão de adicionar, 15px na ficha).
  const icon = <Icon name="clock" className={variant === "field" ? "h-4 w-4 shrink-0 text-muted" : "h-[1.05em] w-[1.05em] shrink-0"} />;
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
 * Campo de horário do sistema: abre as rodas de hora e minuto embaixo do campo (computador) ou num painel
 * que sobe de baixo (celular). Vazio, as rodas começam na hora atual. Devolve "HH:MM" ou "" (com `clearable`).
 * Ex.: `<Field label="Abertura"><TimeInput value={opened} onChange={setOpened} /></Field>`
 */
export function TimeInput({ value, onChange, variant = "field", placeholder = "--:--", clearable = false, disabled, id, className = "", "aria-label": ariaLabel }: TimeInputProps) {
  const field = useContext(FieldLabelContext);
  const valueId = useId();
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const place = usePlacement(open && !phone, triggerRef, PANEL_SIZE);
  const title = ariaLabel ?? field?.text ?? "Horário";

  function openWheels() {
    setDraft(value || startClock(new Date()));
    setOpen(true);
  }
  function close() {
    setOpen(false);
    if (!phone) triggerRef.current?.focus();
  }
  function save(clock: string) {
    if (clock !== value) onChange(clock);
    close();
  }
  useOutsideClose(open && !phone, [triggerRef, panelRef], () => {
    if (draft !== value) onChange(draft);
    setOpen(false);
  });
  // Esc fecha só o seletor, venha do painel ou do campo (no celular o foco fica no campo). Enter grava.
  function onPanelKey(event: KeyboardEvent) {
    if (event.key === "Enter" && open) {
      event.preventDefault();
      return save(draft);
    }
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
        onToggle={() => (open ? close() : openWheels())}
        onEscape={onPanelKey}
      />
      {open ? (
        <Panel phone={phone} place={place} panelRef={panelRef} title={title} onClose={() => setOpen(false)} footer={<ClockFooter phone={phone} clearable={clearable} onClear={() => save("")} onDone={() => save(draft)} />}>
          <div role={phone ? undefined : "dialog"} aria-label={phone ? undefined : title} onKeyDown={onPanelKey}>
            <ClockWheels clock={draft} phone={phone} onChange={setDraft} />
          </div>
        </Panel>
      ) : null}
    </>
  );
}
