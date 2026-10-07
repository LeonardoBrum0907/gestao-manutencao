import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

// Select próprio do sistema: no computador a lista abre embaixo do campo; no celular, num painel que sobe de baixo.
// Escolher fecha na hora (o seletor nativo do Samsung Internet só fecha no "Concluir").

const controlBase = "rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-app transition";
const SEARCH_FROM = 9;

// O Field passa o rótulo para o select, que não é um <select> e por isso não herda o nome do <label>.
export const FieldLabelContext = createContext<{ id: string; text: string } | null>(null);

type Choice = { value: string; label: string; disabled: boolean };

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return textOf(child.props.children);
      return "";
    })
    .join("");
}

function readOptions(children: ReactNode): Choice[] {
  const out: Choice[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ children?: ReactNode; value?: string | number; disabled?: boolean }>;
    if (element.type === Fragment) out.push(...readOptions(element.props.children));
    else if (element.type === "option") {
      const label = textOf(element.props.children);
      out.push({ value: String(element.props.value ?? label), label, disabled: Boolean(element.props.disabled) });
    }
  });
  return out;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const PHONE = "(max-width: 639px)";

function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

// Posição da lista no computador: embaixo do campo, ou em cima quando não há espaço.
function usePlacement(open: boolean, anchor: RefObject<HTMLElement | null>): Place | null {
  const [place, setPlace] = useState<Place | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    function update() {
      const box = anchor.current?.getBoundingClientRect();
      if (!box) return;
      const below = window.innerHeight - box.bottom - 12;
      const above = box.top - 12;
      const up = below < 240 && above > below;
      const width = Math.max(box.width, 220);
      const left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8));
      const maxHeight = Math.min(360, up ? above : below) - 6;
      setPlace(up ? { left, width, bottom: window.innerHeight - box.top + 6, maxHeight } : { left, width, top: box.bottom + 6, maxHeight });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchor]);
  return place;
}

// Fecha ao clicar fora do campo e da lista.
function useOutsideClose(open: boolean, refs: RefObject<HTMLElement | null>[], close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      closeRef.current();
    }
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
    // As refs são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Cross({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

type Row = Choice & { id: string; selected: boolean };

type ListState = {
  query: string;
  setQuery: (value: string) => void;
  active: number;
  setActive: (index: number) => void;
  rows: Row[];
};

function useList(open: boolean, choices: Choice[], isSelected: (value: string) => boolean, listId: string): ListState {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const needle = fold(query.trim());
  const rows = choices
    .filter((choice) => !needle || fold(choice.label).includes(needle))
    .map((choice, index) => ({ ...choice, id: `${listId}-${index}`, selected: isSelected(choice.value) }));

  // Ao abrir, começa na opção escolhida; ao buscar, na primeira que sobrou.
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const picked = rows.findIndex((row) => row.selected);
    setActive(picked >= 0 ? picked : 0);
    // Só no momento em que abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open && query) setActive(0);
  }, [open, query]);
  const activeId = rows[active]?.id;
  useEffect(() => {
    if (open && activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  return { query, setQuery, active, setActive, rows };
}

// Setas, Home/End e Enter dentro da lista aberta. Devolve true quando a tecla foi usada.
function listKeys(event: KeyboardEvent, list: ListState, pick: (row: Row) => void): boolean {
  const last = list.rows.length - 1;
  const step = (from: number, delta: number) => {
    let index = from;
    for (let tries = 0; tries <= last; tries++) {
      index = Math.max(0, Math.min(last, index + delta));
      if (!list.rows[index]?.disabled) return index;
      if (index === 0 || index === last) break;
    }
    return from;
  };
  if (event.key === "ArrowDown") list.setActive(step(list.active, 1));
  else if (event.key === "ArrowUp") list.setActive(step(list.active, -1));
  else if (event.key === "Home") list.setActive(step(-1, 1));
  else if (event.key === "End") list.setActive(step(last + 1, -1));
  else if (event.key === "Enter") {
    const row = list.rows[list.active];
    if (row && !row.disabled) pick(row);
  } else return false;
  event.preventDefault();
  return true;
}

function Options({
  list,
  listId,
  label,
  multi,
  phone,
  onPick,
}: {
  list: ListState;
  listId: string;
  label: string;
  multi: boolean;
  phone: boolean;
  onPick: (row: Row) => void;
}) {
  if (!list.rows.length) return <p className="px-3 py-3 text-sm text-muted">Nada encontrado.</p>;
  return (
    <ul id={listId} role="listbox" aria-label={label} aria-multiselectable={multi || undefined} className="flex flex-col gap-0.5">
      {list.rows.map((row, index) => {
        const tone = row.selected && !multi ? "bg-accent-soft font-semibold text-accent" : index === list.active && !phone ? "bg-chip" : "";
        return (
          <li
            key={row.id}
            id={row.id}
            role="option"
            aria-selected={row.selected}
            aria-disabled={row.disabled || undefined}
            onMouseDown={(event) => event.preventDefault()}
            onMouseMove={() => (index !== list.active ? list.setActive(index) : null)}
            onClick={() => (row.disabled ? null : onPick(row))}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg text-left text-app ${phone ? "min-h-[52px] px-3.5 py-3 text-base active:bg-chip" : "min-h-10 px-2.5 py-2 text-sm"} ${
              multi ? "justify-start" : "justify-between"
            } ${tone} ${row.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {multi ? (
              <span
                className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] ${row.selected ? "border-accent bg-accent text-accent-contrast" : "border-muted bg-surface"}`}
              >
                {row.selected ? <Check className="h-3 w-3" /> : null}
              </span>
            ) : null}
            <span className="min-w-0 break-words">{row.label}</span>
            {row.selected && !multi ? <Check className="text-accent" /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function SearchBox({
  list,
  label,
  listId,
  autoFocus,
  onKeyDown,
}: {
  list: ListState;
  label: string;
  listId: string;
  autoFocus: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" />
      </svg>
      <input
        type="search"
        autoFocus={autoFocus}
        value={list.query}
        onChange={(event) => list.setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={list.rows[list.active]?.id}
        aria-label={`Buscar em ${label}`}
        placeholder="Buscar"
        className="w-full rounded-lg border border-line bg-chip py-2 pl-8 pr-2.5 text-sm text-app focus:border-accent focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

// A lista aberta: flutuando embaixo do campo no computador, ou painel de baixo no celular.
function Panel({
  phone,
  place,
  panelRef,
  title,
  onClose,
  search,
  children,
  footer,
}: {
  phone: boolean;
  place: Place | null;
  panelRef: RefObject<HTMLDivElement | null>;
  title: string;
  onClose: () => void;
  search?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (phone) {
    return createPortal(
      <div className="fixed inset-0 z-[70] flex flex-col justify-end">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div
          ref={panelRef}
          role="dialog"
          aria-label={title}
          className="relative flex max-h-[75vh] flex-col gap-1 rounded-t-card border-t border-line bg-card px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-card"
        >
          <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
          <div className="flex items-center justify-between pl-1.5">
            <h2 className="text-[17px] font-semibold text-app">{title}</h2>
            <button type="button" aria-label="Fechar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-control text-muted transition hover:bg-chip">
              <Cross size={18} />
            </button>
          </div>
          {search}
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">{children}</div>
          {footer}
        </div>
      </div>,
      document.body,
    );
  }
  if (!place) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
      className="fixed z-[60] flex flex-col rounded-xl border border-line bg-card shadow-[0_12px_32px_rgb(28_40_34_/_0.14)]"
    >
      {search ? <div className="p-1 pb-0">{search}</div> : null}
      <div className="flex min-h-0 flex-col overflow-y-auto p-1">{children}</div>
      {footer}
    </div>,
    document.body,
  );
}

type SelectProps = {
  value?: string | number;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  children?: ReactNode;
  "aria-label"?: string;
  // Busca dentro da lista; por padrão aparece a partir de 9 opções.
  searchable?: boolean;
};

export function SelectInput({ value, onChange, disabled, className = "", id, children, searchable, "aria-label": ariaLabel }: SelectProps) {
  const field = useContext(FieldLabelContext);
  const listId = useId();
  const valueId = useId();
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const choices = readOptions(children);
  const current = String(value ?? "");
  const shown = choices.find((choice) => choice.value === current) ?? choices[0];
  const title = ariaLabel ?? field?.text ?? "Escolha";
  const withSearch = searchable ?? choices.length >= SEARCH_FROM;
  const list = useList(open, choices, (item) => item === current, listId);
  const place = usePlacement(open && !phone, triggerRef);

  function close(refocus = true) {
    setOpen(false);
    if (refocus && !phone) triggerRef.current?.focus();
  }
  useOutsideClose(open && !phone, [triggerRef, panelRef], () => setOpen(false));

  function pick(row: Row) {
    if (row.value !== current) onChange?.({ target: { value: row.value } });
    close();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      // O Modal ignora o Esc que já foi usado aqui.
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      close();
      return;
    }
    if (listKeys(event, list, pick)) return;
    // Sem busca: digitar pula para a opção que começa com o texto.
    if (!withSearch && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + fold(event.key), at: now };
      const found = list.rows.findIndex((row) => !row.disabled && fold(row.label).startsWith(typed.current.text));
      if (found >= 0) list.setActive(found);
      if (event.key === " ") event.preventDefault();
    }
  }

  const labelledBy = ariaLabel ? undefined : field ? `${field.id} ${valueId}` : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !withSearch && !phone ? list.rows[list.active]?.id : undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => (event.key === " " ? event.preventDefault() : null)}
        className={`${controlBase} control-focus flex w-full items-center justify-between gap-2 text-left ${open ? "control-open" : "hover:border-accent"} disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted disabled:opacity-75 disabled:hover:border-line ${className}`}
      >
        <span id={valueId} className="min-w-0 truncate">
          {shown?.label ?? ""}
        </span>
        <Chevron open={open} />
      </button>
      {open ? (
        <Panel
          phone={phone}
          place={place}
          panelRef={panelRef}
          title={title}
          onClose={() => close()}
          search={withSearch ? <SearchBox list={list} label={title} listId={listId} autoFocus={!phone} onKeyDown={onKeyDown} /> : null}
        >
          <Options list={list} listId={listId} label={title} multi={false} phone={phone} onPick={pick} />
        </Panel>
      ) : null}
    </>
  );
}

export type MultiOption = { value: string; label: string };

// Várias escolhas (técnicos): cada uma vira uma etiqueta; o que não cabe numa linha vira "+N".
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecione",
  emptyText = "Nada para escolher.",
}: {
  label: string;
  options: MultiOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const labelId = useId();
  const countId = useId();
  const listId = useId();
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(Number.POSITIVE_INFINITY);

  const choices: Choice[] = options.map((option) => ({ ...option, disabled: false }));
  const byValue = new Map(options.map((option) => [option.value, option.label]));
  const picked = value.filter((item) => byValue.has(item));
  const list = useList(open, choices, (item) => value.includes(item), listId);
  const place = usePlacement(open && !phone, boxRef);
  const withSearch = choices.length >= SEARCH_FROM;

  // Mede as etiquetas numa fileira escondida e vê quantas cabem na largura do campo.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    function update() {
      if (!row || !measure) return;
      const gap = 6;
      const nodes = [...measure.children] as HTMLElement[];
      const more = nodes.pop();
      const widths = nodes.map((node) => node.offsetWidth);
      const room = row.clientWidth;
      const total = widths.reduce((sum, width) => sum + width + gap, -gap);
      if (total <= room) {
        setFit(widths.length);
        return;
      }
      const space = room - (more?.offsetWidth ?? 40) - gap;
      let used = -gap;
      let count = 0;
      for (const width of widths) {
        if (used + gap + width > space) break;
        used += gap + width;
        count++;
      }
      setFit(count);
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [picked.map((item) => byValue.get(item)).join("|")]);

  const visible = picked.slice(0, fit);
  const hidden = picked.slice(visible.length);

  function close(refocus = true) {
    setOpen(false);
    if (refocus && !phone) triggerRef.current?.focus();
  }
  useOutsideClose(open && !phone, [boxRef, panelRef], () => setOpen(false));

  function toggle(item: string) {
    onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      close();
      return;
    }
    if (event.key === " " && !withSearch) {
      event.preventDefault();
      const row = list.rows[list.active];
      if (row) toggle(row.value);
      return;
    }
    listKeys(event, list, (row) => toggle(row.value));
  }

  const chip = (item: string, removable: boolean) => (
    <span key={item} className="inline-flex max-w-[10rem] shrink-0 items-center gap-0.5 rounded-lg bg-accent-soft py-0.5 pl-2 pr-0.5 text-[13px] font-semibold text-accent">
      <span className="truncate">{byValue.get(item)}</span>
      {removable ? (
        <button
          type="button"
          aria-label={`Remover ${byValue.get(item)}`}
          onClick={(event) => {
            event.stopPropagation();
            toggle(item);
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md transition hover:bg-surface"
        >
          <Cross />
        </button>
      ) : (
        <span className="h-6 w-6 shrink-0" />
      )}
    </span>
  );

  const hiddenNames = hidden.map((item) => byValue.get(item)).join(", ");
  const footer = (
    <div className={`flex items-center justify-between gap-2 border-t border-line ${phone ? "px-1 pt-3" : "px-3 py-2.5"}`}>
      <span className="text-[13px] text-muted">{value.length === 1 ? "1 selecionado" : `${value.length} selecionados`}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className="rounded-control border border-line bg-chip px-3 py-1.5 text-[13px] font-semibold text-app transition hover:bg-accent-soft"
        >
          Limpar
        </button>
        <button type="button" onClick={() => close()} className="rounded-control bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-contrast transition hover:brightness-90">
          Pronto
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-1.5 text-sm text-app">
      <span id={labelId} className="font-medium">
        {label}
      </span>
      <div
        ref={boxRef}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${controlBase} flex min-h-[44px] cursor-pointer items-center gap-1.5 !py-1.5 !pl-2 !pr-1.5 ${open ? "control-open" : "hover:border-accent"}`}
      >
        <div ref={rowRef} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {visible.map((item) => chip(item, true))}
          {hidden.length ? (
            <button
              type="button"
              title={hiddenNames}
              aria-label={`Mais ${hidden.length}: ${hiddenNames}`}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(true);
              }}
              className="shrink-0 rounded-lg border border-line bg-chip px-2 py-0.5 text-[13px] font-semibold text-app transition hover:bg-accent-soft"
            >
              +{hidden.length}
            </button>
          ) : null}
          {!picked.length ? <span className="truncate px-1 text-muted">{placeholder}</span> : null}
        </div>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && !withSearch && !phone ? list.rows[list.active]?.id : undefined}
          aria-labelledby={`${labelId} ${countId}`}
          onClick={(event) => {
            event.stopPropagation();
            if (open) close();
            else setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onKeyUp={(event) => (event.key === " " ? event.preventDefault() : null)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md transition hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span id={countId} className="sr-only">
            {value.length === 1 ? "1 selecionado" : `${value.length} selecionados`}
          </span>
          <Chevron open={open} />
        </button>
      </div>
      <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5 whitespace-nowrap">
        {picked.map((item) => chip(item, false))}
        <span className="shrink-0 rounded-lg border border-line px-2 py-0.5 text-[13px] font-semibold">+{picked.length}</span>
      </div>
      {open ? (
        <Panel
          phone={phone}
          place={place}
          panelRef={panelRef}
          title={label}
          onClose={() => close()}
          footer={footer}
          search={withSearch ? <SearchBox list={list} label={label} listId={listId} autoFocus={!phone} onKeyDown={onKeyDown} /> : null}
        >
          {choices.length ? (
            <Options list={list} listId={listId} label={label} multi phone={phone} onPick={(row) => toggle(row.value)} />
          ) : (
            <p className="px-3 py-3 text-sm text-muted">{emptyText}</p>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
