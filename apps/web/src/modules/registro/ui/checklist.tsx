import { useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DndContext, DragOverlay, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { columnDropId, useColumnsDnd, type ColumnDrop } from "./columns-dnd";
import { ChecklistBox, FrameFooter, GroupBand, gridClass, gridStyle, useFrameColumns, type ChecklistFrame } from "./checklist-table";
import type { RecordLink } from "./record-link";

// Peças do checklist de Registros (Tarefas, Problemas e Feedbacks): grupos com linhas finas, círculo
// para concluir e arrastar para reordenar ou levar a outro grupo.

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

export type ChecklistDrop = ColumnDrop;

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
  link,
  title,
  info,
  cells = [],
}: {
  checked: boolean;
  ring?: string;
  label: string;
  onToggle?: () => void;
  link: RecordLink;
  title: string;
  // Linha de informação embaixo do título. Com colunas, só no celular (no computador as células fazem esse papel).
  info?: ReactNode;
  // Uma célula por coluna do checklist, na mesma ordem do cabeçalho.
  cells?: ReactNode[];
}) {
  const columns = useFrameColumns();
  const circle = checked ? "border-2 border-accent bg-accent text-canvas" : `text-transparent hover:bg-chip ${ring}`;
  // O círculo tem a altura da primeira linha do título (20px, leading-5): fica centrado nela, como no Todoist.
  return (
    <div style={gridStyle(columns)} className={`${gridClass} items-start px-3 py-2.5`}>
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={keepKeys}
        disabled={!onToggle}
        aria-label={label}
        className={`grid h-5 w-5 place-items-center rounded-full transition ${circle}`}
      >
        <CheckIcon />
      </button>
      <div className="min-w-0">
        <Link
          to={link.to}
          state={link.state}
          data-record-id={link.recordId}
          onKeyDown={keepKeys}
          className={`block whitespace-pre-line break-words text-[15px] leading-5 hover:underline hover:decoration-line hover:underline-offset-4 ${
            checked ? "text-muted line-through" : "text-app"
          }`}
        >
          {title}
        </Link>
        {info ? <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted ${columns.length ? "md:hidden" : ""}`}>{info}</div> : null}
      </div>
      {columns.map((column, index) => (
        <div key={column.key} className="hidden text-sm leading-5 text-app md:block">
          {cells[index] ?? null}
        </div>
      ))}
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
      className={`border-b border-line bg-card outline-none transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent ${
        locked ? "" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""} ${fading ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}
    >
      {children}
    </li>
  );
}

function Column({ group, ids, fading, renderRow }: { group: ChecklistGroup; ids: string[]; fading: Set<string>; renderRow: (id: string, group: string) => ReactNode }) {
  const { setNodeRef } = useDroppable({ id: columnDropId(group.key), disabled: !group.accepts });
  return (
    <SortableContext id={group.key} items={ids} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="min-h-2">
        {ids.map((id) => (
          <SortableRow key={id} id={id} locked={Boolean(group.locked)} fading={fading.has(id)}>
            {renderRow(id, group.key)}
          </SortableRow>
        ))}
        {ids.length === 0 ? <li className="border-b border-line py-3 pl-[46px] pr-3 text-sm text-muted">{group.empty}</li> : null}
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

export function Checklist({
  frame,
  groups,
  renderRow,
  renderOverlay,
  fading,
  canMove = () => true,
  onDrop,
  openKeys = [],
}: {
  frame: ChecklistFrame;
  groups: ChecklistGroup[];
  renderRow: (id: string, group: string) => ReactNode;
  renderOverlay: (id: string, group: string) => ReactNode;
  fading: Set<string>;
  canMove?: (id: string, from: string, to: string) => boolean;
  // Grava a mudança; se falhar, a lista volta ao que os dados dizem.
  onDrop: (drop: ChecklistDrop) => Promise<unknown>;
  openKeys?: string[];
}) {
  const dnd = useColumnsDnd({ lists: groups, canMove, onDrop });
  const [toggled, setToggled] = useState<Set<string>>(() => new Set(openKeys));

  function fold(key: string) {
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const { activeId, activeColumn: activeGroup, columns } = dnd;

  return (
    <DndContext {...dnd.context} collisionDetection={closestCorners}>
      <ChecklistBox frame={frame}>
      {groups.map((group) => {
        const ids = columns[group.key] ?? group.ids;
        const collapsed = Boolean(group.startCollapsed) !== toggled.has(group.key);
        return (
          <section key={group.key} id={domId(group.key)} className="scroll-mt-4">
            <GroupBand title={group.title} sub={group.sub} count={ids.length} collapsed={collapsed} onFold={() => fold(group.key)} action={group.action} />
            {collapsed ? null : (
              <>
                <Column group={group} ids={ids} fading={fading} renderRow={renderRow} />
                {group.footer ? <FrameFooter>{group.footer}</FrameFooter> : null}
              </>
            )}
          </section>
        );
      })}
      <DragOverlay>
        {activeId && activeGroup ? <div className="rounded-control bg-card shadow-card">{renderOverlay(activeId, activeGroup)}</div> : null}
      </DragOverlay>
      </ChecklistBox>
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
    <div role="group" aria-label="Agrupar por" className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
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
