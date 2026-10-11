import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Peças do checklist de Registros (Tarefas, Problemas e Feedbacks): grupos com linhas finas, círculo
// para concluir e arrastar para reordenar ou levar a outro grupo.

const COLUMN = "col:";

export type ChecklistGroup = {
  key: string;
  title: string;
  sub?: string;
  ids: string[];
  empty: string;
  // Recebe item vindo de outro grupo (o grupo de origem decide se o item pode sair: canMove).
  accepts?: boolean;
  // Sem arrastar (concluídas).
  locked?: boolean;
  startCollapsed?: boolean;
  action?: ReactNode;
  footer?: ReactNode;
};

export type ChecklistDrop = { id: string; from: string; to: string; order: string[] };

// Arrastar começa só depois de mexer o mouse um pouco (clique continua clique) ou de segurar o dedo
// um instante (rolar a tela continua rolando). Pelo teclado: foco no item, espaço, setas, espaço.
function useChecklistSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

// Teclas dentro do círculo e do título são deles: não começam um arrastar na linha.
function keepKeys(event: ReactKeyboardEvent) {
  event.stopPropagation();
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 6.2l2.4 2.4 4.6-5" />
    </svg>
  );
}

export const ringTone = {
  high: "border-2 border-danger hover:text-danger",
  medium: "border-2 border-warn hover:text-warn",
  plain: "border-[1.5px] border-muted hover:text-muted",
};

export function CheckRow({
  checked,
  ring = ringTone.plain,
  label,
  onToggle,
  href,
  title,
  info,
  tag,
}: {
  checked: boolean;
  ring?: string;
  label: string;
  onToggle?: () => void;
  href: string;
  title: string;
  info?: ReactNode;
  tag?: ReactNode;
}) {
  const circle = checked ? "border-2 border-accent bg-accent text-canvas" : `text-transparent hover:bg-chip ${ring}`;
  return (
    <div className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-3 py-2.5 sm:grid-cols-[22px_minmax(0,1fr)_auto]">
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={keepKeys}
        disabled={!onToggle}
        aria-label={label}
        className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full transition ${circle}`}
      >
        <CheckIcon />
      </button>
      <div className="min-w-0">
        <Link
          to={href}
          onKeyDown={keepKeys}
          className={`block whitespace-pre-line break-words text-[15px] leading-snug hover:underline hover:decoration-line hover:underline-offset-4 ${
            checked ? "text-muted line-through" : "text-app"
          }`}
        >
          {title}
        </Link>
        {info ? <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">{info}</div> : null}
      </div>
      {tag ? <div className="col-start-2 mt-1 text-[13px] text-muted sm:col-start-3 sm:mt-0 sm:self-end sm:text-right">{tag}</div> : null}
    </div>
  );
}

export function InProgressChip() {
  return <span className="rounded-md bg-accent-soft px-1.5 py-px text-xs font-semibold text-accent">Em andamento</span>;
}

function SortableRow({ id, locked, fading, children }: { id: string; locked: boolean; fading: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: locked });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="item arrastável"
      className={`border-b border-line bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        locked ? "" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""} ${fading ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}
    >
      {children}
    </li>
  );
}

function Column({ group, ids, fading, renderRow }: { group: ChecklistGroup; ids: string[]; fading: Set<string>; renderRow: (id: string, group: string) => ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `${COLUMN}${group.key}`, disabled: !group.accepts });
  return (
    <SortableContext id={group.key} items={ids} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="min-h-2">
        {ids.map((id) => (
          <SortableRow key={id} id={id} locked={Boolean(group.locked)} fading={fading.has(id)}>
            {renderRow(id, group.key)}
          </SortableRow>
        ))}
        {ids.length === 0 ? <li className="border-b border-line py-3 pl-[34px] text-sm text-muted">{group.empty}</li> : null}
      </ul>
    </SortableContext>
  );
}

function domId(key: string) {
  return `grupo-${key.replace(/[^a-z0-9-]/gi, "-")}`;
}

export function scrollToGroup(key: string) {
  document.getElementById(domId(key))?.scrollIntoView({ block: "start" });
}

type Columns = Record<string, string[]>;

function columnsOf(groups: ChecklistGroup[]): Columns {
  return Object.fromEntries(groups.map((group) => [group.key, group.ids]));
}

export function Checklist({
  groups,
  renderRow,
  renderOverlay,
  fading,
  canMove = () => true,
  onDrop,
  openKeys = [],
}: {
  groups: ChecklistGroup[];
  renderRow: (id: string, group: string) => ReactNode;
  renderOverlay: (id: string, group: string) => ReactNode;
  fading: Set<string>;
  canMove?: (id: string, from: string, to: string) => boolean;
  // Grava a mudança; se falhar, a lista volta ao que os dados dizem.
  onDrop: (drop: ChecklistDrop) => Promise<unknown>;
  openKeys?: string[];
}) {
  const sensors = useChecklistSensors();
  const [columns, setColumns] = useState<Columns>(() => columnsOf(groups));
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<string | null>(null);
  const [toggled, setToggled] = useState<Set<string>>(() => new Set(openKeys));
  const signature = JSON.stringify(groups.map((group) => [group.key, group.ids]));
  const latest = useRef(groups);
  latest.current = groups;

  // A lista segue os dados, menos durante um arrastar (aí ela é a prévia do lugar novo). Depois de
  // soltar, a prévia fica até os dados novos chegarem, sem piscar a ordem antiga.
  useEffect(() => {
    if (!origin.current) setColumns(columnsOf(latest.current));
  }, [signature]);

  const byKey = new Map(groups.map((group) => [group.key, group]));

  function findGroup(id: UniqueIdentifier): string | null {
    const key = String(id);
    if (key.startsWith(COLUMN)) return key.slice(COLUMN.length);
    return Object.keys(columns).find((group) => columns[group]?.includes(key)) ?? null;
  }

  function cancel() {
    origin.current = null;
    setActiveId(null);
    setColumns(columnsOf(latest.current));
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    origin.current = findGroup(event.active.id);
  }

  // Passar por cima de outro grupo já mostra o item lá, se o grupo recebe e o item pode ir.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const id = String(active.id);
    const from = findGroup(active.id);
    const to = findGroup(over.id);
    if (!from || !to || from === to || !byKey.get(to)?.accepts || !origin.current || !canMove(id, origin.current, to)) return;
    setColumns((current) => {
      const target = current[to] ?? [];
      const overIndex = target.indexOf(String(over.id));
      const index = overIndex >= 0 ? overIndex : target.length;
      return {
        ...current,
        [from]: (current[from] ?? []).filter((item) => item !== id),
        [to]: [...target.slice(0, index), id, ...target.slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const from = origin.current;
    const group = findGroup(active.id);
    const overGroup = over ? findGroup(over.id) : null;
    if (!from || !group || overGroup !== group) {
      cancel();
      return;
    }
    origin.current = null;
    const list = columns[group] ?? [];
    const oldIndex = list.indexOf(id);
    const overIndex = list.indexOf(String(over?.id));
    const newIndex = overIndex >= 0 ? overIndex : list.length - 1;
    const order = oldIndex === newIndex ? list : arrayMove(list, oldIndex, newIndex);
    setColumns({ ...columns, [group]: order });
    setActiveId(null);
    if (group === from && order === list) return;
    onDrop({ id, from, to: group, order }).catch(() => setColumns(columnsOf(latest.current)));
  }

  function fold(key: string) {
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const activeGroup = activeId ? findGroup(activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={cancel}>
      {groups.map((group) => {
        const ids = columns[group.key] ?? group.ids;
        const collapsed = Boolean(group.startCollapsed) !== toggled.has(group.key);
        return (
          <section key={group.key} id={domId(group.key)} className="mt-7 scroll-mt-4 first:mt-0">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <h2 className="min-w-0">
                <button
                  type="button"
                  onClick={() => fold(group.key)}
                  aria-expanded={!collapsed}
                  className="-ml-0.5 flex items-center gap-2 rounded-md py-0.5 pl-0.5 pr-1.5 text-left text-[15px] font-semibold text-app hover:bg-chip"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted transition ${collapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                  <span className="min-w-0">
                    {group.title}
                    {group.sub ? <span className="font-medium text-muted"> · {group.sub}</span> : null}
                  </span>
                </button>
              </h2>
              {ids.length ? <span className="text-[13px] tabular-nums text-muted">{ids.length}</span> : null}
              {group.action ? <div className="ml-auto shrink-0">{group.action}</div> : null}
            </div>
            {collapsed ? null : (
              <>
                <Column group={group} ids={ids} fading={fading} renderRow={renderRow} />
                {group.footer}
              </>
            )}
          </section>
        );
      })}
      <DragOverlay>
        {activeId && activeGroup ? <div className="rounded-lg bg-canvas px-2 shadow-card">{renderOverlay(activeId, activeGroup)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Marcar o círculo: a linha risca, some devagar e só então grava (a lista muda de grupo depois).
export function useCompleting() {
  const [fading, setFading] = useState<Set<string>>(new Set());
  function complete(id: string, run: (done: () => void) => void) {
    setFading((current) => new Set(current).add(id));
    window.setTimeout(
      () =>
        run(() =>
          setFading((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          }),
        ),
      450,
    );
  }
  return { fading, complete };
}

// "Agrupar por": a escolha fica guardada no aparelho.
export function useGrouping<T extends string>(storageKey: string, options: readonly T[], fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored && (options as readonly string[]).includes(stored) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  });
  function choose(next: T) {
    setValue(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Sem armazenamento (aba anônima): a escolha vale só nesta visita.
    }
  }
  return [value, choose];
}

export function GroupingPills<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label="Agrupar por" className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-muted">
      <span>Agrupar por</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 text-[13px] transition ${
            value === option.value ? "border-accent bg-accent-soft font-semibold text-app" : "border-line text-app hover:bg-chip"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
