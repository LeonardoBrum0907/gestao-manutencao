import { useState, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { agendaDayTitle } from "../model/agenda";
import { columnDropId } from "./columns-dnd";

// Colunas da Agenda. No computador ficam lado a lado, com cartões; no celular empilham, em lista dentro
// de uma caixa, como as outras listas do app. É o mesmo DOM: só o CSS muda.

export function agendaDomId(key: string): string {
  return `agenda-${key.replace(/[^a-z0-9-]/gi, "-")}`;
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted transition ${collapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.25">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="item arrastável"
      className={`cursor-grab border-b border-line bg-card outline-none transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing md:mb-2 md:rounded-control md:border md:shadow-card ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {children}
    </li>
  );
}

/** Lista que recebe e ordena cartões; `accepts` falso só reordena (Atrasadas). */
export function AgendaList({
  listKey,
  ids,
  accepts,
  empty,
  renderCard,
}: {
  listKey: string;
  ids: string[];
  accepts: boolean;
  empty?: string;
  renderCard: (id: string, listKey: string) => ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: columnDropId(listKey), disabled: !accepts });
  return (
    <SortableContext id={listKey} items={ids} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="min-h-3">
        {ids.map((id) => (
          <SortableCard key={id} id={id}>
            {renderCard(id, listKey)}
          </SortableCard>
        ))}
        {ids.length === 0 && empty ? <li className="border-b border-line px-3 py-3 text-sm text-muted md:border-0 md:px-1 md:py-2">{empty}</li> : null}
      </ul>
    </SortableContext>
  );
}

const columnShape = "min-w-0 scroll-mt-4 md:w-[16.5rem] md:shrink-0";
// No celular a coluna é uma caixa de lista; no computador, uma faixa com fundo próprio, para cada dia
// ficar bem separado do vizinho (os cartões brancos se destacam sobre ela).
const boxShape = "overflow-hidden rounded-card border border-line bg-card shadow-card md:overflow-visible md:bg-chip md:p-2 md:shadow-none";
const headShape = "flex items-baseline gap-2 border-b border-line-strong bg-group px-3 py-2 md:mb-2 md:border-line md:bg-transparent md:px-1";

/** Coluna de um dia: cabeçalho, os cartões e o adicionar. */
export function AgendaDayColumn({
  day,
  today,
  count,
  children,
  footer,
}: {
  day: string;
  today: string;
  count: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  const title = agendaDayTitle(day, today);
  return (
    <section id={agendaDomId(day)} aria-label={`${title.date}, ${title.name}`} className={`${columnShape} ${boxShape}`}>
      <h2 className={headShape}>
        <span className={`text-[13.5px] font-bold ${day === today ? "text-accent-ink" : "text-app"}`}>
          {title.date} · {title.name}
        </span>
        {count ? <span className="text-[13px] tabular-nums text-muted">{count}</span> : null}
      </h2>
      {children}
      <div className="border-b border-line px-3 md:border-0 md:px-1">{footer}</div>
    </section>
  );
}

/**
 * Atrasadas numa coluna própria, antes de hoje (como no Todoist): não se misturam com o que vence hoje.
 * Recolhe pelo nome e tem o "Passar para hoje".
 */
export function OverdueColumn({ count, action, children }: { count: number; action: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section id={agendaDomId("atrasadas")} aria-label="Atrasadas" className={`${columnShape} ${boxShape} ${collapsed ? "md:w-44" : ""}`}>
      <h2 className={headShape}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="-ml-1 flex items-center gap-1.5 rounded-md px-1 text-[13.5px] font-bold text-danger hover:bg-chip"
        >
          <Chevron collapsed={collapsed} />
          Atrasadas
        </button>
        <span className="text-[13px] tabular-nums text-muted">{count}</span>
        {collapsed ? null : <span className="ml-auto">{action}</span>}
      </h2>
      {collapsed ? null : children}
    </section>
  );
}

/** "Sem prazo" no fim: começa recolhida; aberta, recebe tarefas para tirar o prazo ou planejar a semana. */
export function UndatedColumn({ count, children }: { count: number; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <section id={agendaDomId("sem-prazo")} aria-label="Sem prazo" className={`${columnShape} ${boxShape} ${collapsed ? "md:w-44" : ""}`}>
      <h2 className={headShape}>
        <button type="button" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} className="-ml-1 flex items-center gap-1.5 rounded-md px-1 text-[13.5px] font-bold text-app hover:bg-chip">
          <Chevron collapsed={collapsed} />
          Sem prazo
        </button>
        {count ? <span className="text-[13px] tabular-nums text-muted">{count}</span> : null}
      </h2>
      {collapsed ? null : children}
    </section>
  );
}
