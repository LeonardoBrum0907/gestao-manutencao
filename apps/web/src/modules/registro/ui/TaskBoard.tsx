import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { useQueryClient } from "@tanstack/react-query";
import type { BoardGroup, BoardItemDto, BoardTarget, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { changeOnBoard, useAddTask, useBoardChange, useTaskBoard } from "../data/board";
import { invalidateRecords } from "../data/records";
import { canDrag, columnsOf, dueLabel, groupEmpty, isDropTarget, todayTitle, type BoardColumns } from "../model/board";

const COLUMN = "col:";

const dropLabel: Record<BoardTarget, string> = {
  today: "Prazo agora é hoje.",
  upcoming: "Prazo agora é amanhã.",
  undated: "Tarefa ficou sem prazo.",
};

// Arrastar começa só depois de mexer o mouse um pouco (clique continua clique) ou de segurar o dedo
// um instante (rolar a tela continua rolando). Pelo teclado: foco na tarefa, espaço, setas, espaço.
function useBoardSensors() {
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

const ringByPriority = {
  high: "border-2 border-danger hover:text-danger",
  medium: "border-2 border-warn hover:text-warn",
  low: "border-[1.5px] border-muted hover:text-muted",
};

function TaskRow({
  item,
  group,
  today,
  checked,
  onToggle,
}: {
  item: BoardItemDto;
  group: BoardGroup;
  today: string;
  checked: boolean;
  onToggle?: () => void;
}) {
  const ring = checked
    ? "border-2 border-accent bg-accent text-canvas"
    : `text-transparent hover:bg-chip ${ringByPriority[item.priority ?? "low"]}`;
  const dueTone = group === "overdue" ? "text-danger" : group === "today" ? "text-accent" : "text-muted";
  return (
    <div className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-3 py-2.5">
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={keepKeys}
        disabled={!onToggle}
        aria-label={`${item.status === "done" ? "Reabrir" : "Concluir"}: ${item.body}`}
        className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full transition ${ring}`}
      >
        <CheckIcon />
      </button>
      <div className="min-w-0">
        <Link
          to={`/registros/${item.id}`}
          onKeyDown={keepKeys}
          className={`block break-words text-[15px] leading-snug hover:underline hover:decoration-line hover:underline-offset-4 ${
            checked ? "text-muted line-through" : "text-app"
          }`}
        >
          {item.body}
        </Link>
        {item.dueAt || item.status === "in_progress" ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            {item.dueAt ? (
              <span className={`inline-flex items-center gap-1 tabular-nums ${dueTone}`}>
                <CalendarIcon />
                {dueLabel(item.dueAt, today)}
              </span>
            ) : null}
            {item.status === "in_progress" && !checked ? (
              <span className="rounded-md bg-accent-soft px-1.5 py-px text-xs font-semibold text-accent">Em andamento</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SortableTask({ fading, ...props }: { item: BoardItemDto; group: BoardGroup; today: string; checked: boolean; fading: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    disabled: !canDrag(props.group),
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="tarefa arrastável"
      className={`border-b border-line bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        canDrag(props.group) ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : ""} ${fading ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}
    >
      <TaskRow {...props} />
    </li>
  );
}

function AddTask({ group }: { group: BoardTarget }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const add = useAddTask();
  const toast = useToast();
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-2.5 text-left text-sm text-muted transition hover:text-accent"
      >
        <span aria-hidden="true" className="grid h-5 w-5 place-items-center text-lg leading-none text-accent">
          +
        </span>
        Adicionar tarefa
      </button>
    );
  }
  return (
    <form
      className="flex flex-wrap gap-2 border-b border-line py-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        const text = body.trim();
        if (!text) return;
        add.mutate(
          { body: text, group },
          {
            onSuccess: () => setBody(""),
            onError: (error) => toast({ text: errorMessage(error) }),
          },
        );
      }}
    >
      <input
        autoFocus
        id={`nova-tarefa-${group}`}
        aria-label="Nova tarefa"
        placeholder="O que precisa ser feito?"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="min-w-0 flex-1 rounded-control border border-line bg-surface px-3 py-2 text-sm text-app"
      />
      <button
        type="submit"
        disabled={add.isPending || !body.trim()}
        className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-90 disabled:opacity-50"
      >
        Adicionar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-control px-3 py-2 text-sm font-semibold text-muted hover:bg-chip">
        Cancelar
      </button>
    </form>
  );
}

function Group({
  group,
  title,
  sub,
  count,
  action,
  collapsed,
  onFold,
  children,
}: {
  group: BoardGroup;
  title: string;
  sub?: string;
  count: number;
  action?: ReactNode;
  collapsed: boolean;
  onFold: () => void;
  children: ReactNode;
}) {
  return (
    <section id={`grupo-${group}`} className="mt-7 scroll-mt-4 first:mt-0">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={onFold}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Abrir ${title}` : `Recolher ${title}`}
          className="grid place-items-center rounded-md p-0.5 text-muted hover:bg-chip"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 transition ${collapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
        <h2 className="text-[15px] font-semibold text-app">
          {title}
          {sub ? <span className="font-medium text-muted"> · {sub}</span> : null}
        </h2>
        {count ? <span className="text-[13px] tabular-nums text-muted">{count}</span> : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {collapsed ? null : children}
    </section>
  );
}

function Column({ group, ids, children }: { group: BoardGroup; ids: string[]; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `${COLUMN}${group}`, disabled: !isDropTarget(group) });
  return (
    <SortableContext id={group} items={ids} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="min-h-2">
        {children}
        {ids.length === 0 ? <li className="border-b border-line py-3 pl-[34px] text-sm text-muted">{groupEmpty[group]}</li> : null}
      </ul>
    </SortableContext>
  );
}

export function TaskBoard() {
  const board = useTaskBoard();
  const change = useBoardChange();
  const toast = useToast();
  const client = useQueryClient();
  const sensors = useBoardSensors();
  const [params] = useSearchParams();
  const items = board.data?.items;
  const [columns, setColumns] = useState<BoardColumns>(() => columnsOf(items ?? []));
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<BoardGroup | null>(null);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [doneOpen, setDoneOpen] = useState(params.get("status") === "done");
  const [folded, setFolded] = useState<Set<BoardGroup>>(new Set());
  const [rescheduling, setRescheduling] = useState(false);

  // A lista da tela segue o servidor, menos durante um arrastar (aí ela é a prévia do lugar novo).
  useEffect(() => {
    if (items && !activeId) setColumns(columnsOf(items));
  }, [items, activeId]);

  // Vindo do painel ("Vencidas", "Vencem hoje", "Concluídas"): rola até o grupo.
  const target = params.get("due") === "overdue" ? "overdue" : params.get("due") === "today" ? "today" : params.get("status") === "done" ? "done" : null;
  const ready = Boolean(items);
  useEffect(() => {
    if (ready && target) document.getElementById(`grupo-${target}`)?.scrollIntoView({ block: "start" });
  }, [ready, target]);

  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data || !items) return <p className="text-sm text-muted">Carregando tarefas…</p>;
  const today = board.data.today;
  const byId = new Map(items.map((item) => [item.id, item]));

  function findGroup(id: UniqueIdentifier): BoardGroup | null {
    const key = String(id);
    if (key.startsWith(COLUMN)) return key.slice(COLUMN.length) as BoardGroup;
    return (Object.keys(columns) as BoardGroup[]).find((group) => columns[group].includes(key)) ?? null;
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    origin.current = findGroup(event.active.id);
  }

  // Passar por cima de outro grupo já mostra a tarefa lá; só Hoje, Próximos dias e Sem prazo recebem.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findGroup(active.id);
    const to = findGroup(over.id);
    if (!from || !to || from === to || !isDropTarget(to)) return;
    setColumns((current) => {
      const id = String(active.id);
      const overIndex = current[to].indexOf(String(over.id));
      const index = overIndex >= 0 ? overIndex : current[to].length;
      return {
        ...current,
        [from]: current[from].filter((item) => item !== id),
        [to]: [...current[to].slice(0, index), id, ...current[to].slice(index)],
      };
    });
  }

  function onDragCancel() {
    origin.current = null;
    setActiveId(null);
    if (items) setColumns(columnsOf(items));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const from = origin.current;
    origin.current = null;
    const group = findGroup(active.id);
    const overGroup = over ? findGroup(over.id) : null;
    if (!from || !group || !overGroup || overGroup !== group) {
      onDragCancel();
      return;
    }
    const list = columns[group];
    const oldIndex = list.indexOf(id);
    const overIndex = list.indexOf(String(over?.id));
    const newIndex = overIndex >= 0 ? overIndex : list.length - 1;
    const order = oldIndex === newIndex ? list : arrayMove(list, oldIndex, newIndex);
    const moved = group !== from;
    setColumns({ ...columns, [group]: order });
    setActiveId(null);
    if (!moved && order === list) return;
    change.mutate(
      { id, change: { ...(moved && isDropTarget(group) ? { group } : {}), order } },
      {
        onSuccess: () => {
          if (moved && isDropTarget(group)) toast({ text: dropLabel[group] });
        },
        onError: (error) => toast({ text: errorMessage(error) }),
      },
    );
  }

  function toggle(item: BoardItemDto) {
    if (item.status === "done") {
      change.mutate({ id: item.id, change: { status: "open" } }, { onError: (error) => toast({ text: errorMessage(error) }) });
      return;
    }
    const before: RecordStatus = item.status;
    setLeaving((current) => new Set(current).add(item.id));
    window.setTimeout(() => {
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () =>
            toast({
              text: "Tarefa concluída.",
              action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: before } }) },
            }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: () =>
            setLeaving((current) => {
              const next = new Set(current);
              next.delete(item.id);
              return next;
            }),
        },
      );
    }, 450);
  }

  async function passOverdueToToday() {
    const ids = columns.overdue;
    setRescheduling(true);
    try {
      await Promise.all(ids.map((id) => changeOnBoard(id, { group: "today" })));
      toast({ text: ids.length === 1 ? "1 tarefa passou para hoje." : `${ids.length} tarefas passaram para hoje.` });
    } catch (error) {
      toast({ text: errorMessage(error) });
    } finally {
      setRescheduling(false);
      invalidateRecords(client);
    }
  }

  function fold(group: BoardGroup) {
    if (group === "done") {
      setDoneOpen((open) => !open);
      return;
    }
    setFolded((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  const open = items.filter((item) => item.status !== "done").length;
  const overdue = columns.overdue.length;
  const day = todayTitle(today);
  const titles: Record<BoardGroup, { title: string; sub?: string }> = {
    overdue: { title: "Atrasadas" },
    today: day,
    upcoming: { title: "Próximos dias" },
    undated: { title: "Sem prazo" },
    done: { title: "Concluídas", sub: "últimos 7 dias" },
  };
  const active = activeId ? byId.get(activeId) : null;
  const activeGroup = activeId ? findGroup(activeId) : null;

  return (
    <div>
      <p className="mb-6 flex flex-wrap gap-x-4 text-sm text-muted">
        <span>
          {open} {open === 1 ? "aberta" : "abertas"}
        </span>
        {overdue ? (
          <span className="text-danger">
            {overdue} {overdue === 1 ? "atrasada" : "atrasadas"}
          </span>
        ) : null}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        {(["overdue", "today", "upcoming", "undated", "done"] as const).map((group) => {
          if (group === "overdue" && columns.overdue.length === 0) return null;
          const ids = columns[group];
          const collapsed = group === "done" ? !doneOpen : folded.has(group);
          return (
            <Group
              key={group}
              group={group}
              {...titles[group]}
              count={ids.length}
              collapsed={collapsed}
              onFold={() => fold(group)}
              action={
                group === "overdue" ? (
                  <button type="button" onClick={() => void passOverdueToToday()} disabled={rescheduling} className="text-sm font-semibold text-accent disabled:opacity-50">
                    {rescheduling ? "Passando…" : "Passar para hoje"}
                  </button>
                ) : null
              }
            >
              <Column group={group} ids={ids}>
                {ids.map((id) => {
                  const item = byId.get(id);
                  if (!item) return null;
                  return (
                    <SortableTask
                      key={id}
                      item={item}
                      group={group}
                      today={today}
                      checked={item.status === "done" || leaving.has(id)}
                      fading={leaving.has(id)}
                      onToggle={() => toggle(item)}
                    />
                  );
                })}
              </Column>
              {isDropTarget(group) ? <AddTask group={group} /> : null}
            </Group>
          );
        })}
        <DragOverlay>
          {active && activeGroup ? (
            <div className="rounded-lg bg-canvas px-2 shadow-card">
              <TaskRow item={active} group={activeGroup} today={today} checked={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
