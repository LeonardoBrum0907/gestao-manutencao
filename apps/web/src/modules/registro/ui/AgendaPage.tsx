import { useState } from "react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import type { BoardItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, PageTitle } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useBoardChange, useTaskBoard } from "../data/board";
import { dayLabel } from "../model/board";
import { AGENDA_DAYS, OVERDUE_KEY, UNDATED_KEY, addDays, agendaLists, agendaMonth, agendaWeek, dayKey, dayOfKey } from "../model/agenda";
import { AgendaDayColumn, AgendaList, OverdueColumn, UndatedColumn, agendaDomId } from "./agenda-columns";
import { CheckRow, InProgressChip } from "./checklist";
import { useColumnsDnd, type ColumnDrop, type DndColumn } from "./columns-dnd";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink } from "./record-link";
import { AddTask, DueText, PassToToday, dueClock, taskRing, useTaskToggle } from "./task-parts";

const navButton = "grid h-9 min-w-9 place-items-center rounded-control border border-line bg-surface px-2 text-sm text-app transition hover:bg-chip disabled:opacity-40";

// Semana a semana a partir de hoje; voltar para antes de hoje não tem o que mostrar (as atrasadas têm coluna própria).
function WeekNav({ week, onChange }: { week: number; onChange: (week: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Semana anterior" disabled={week === 0} onClick={() => onChange(week - 1)} className={navButton}>
        ‹
      </button>
      <button type="button" onClick={() => onChange(0)} className={`${navButton} px-3 font-semibold`}>
        Hoje
      </button>
      <button type="button" aria-label="Próxima semana" onClick={() => onChange(week + 1)} className={navButton}>
        ›
      </button>
    </div>
  );
}

// No celular, a faixa dos dias leva até a lista de cada um.
function DayStrip({ days, today, lists }: { days: string[]; today: string; lists: Record<string, string[]> }) {
  return (
    <div className="mb-4 flex justify-between gap-1 md:hidden">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => document.getElementById(agendaDomId(day))?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={`relative w-10 rounded-control py-1 text-sm tabular-nums ${day === today ? "bg-accent font-bold text-accent-contrast" : "text-app hover:bg-chip"}`}
        >
          {Number(day.slice(8))}
          {lists[dayKey(day)]?.length ? <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" /> : null}
        </button>
      ))}
    </div>
  );
}

function dropText(to: string, today: string): string {
  const day = dayOfKey(to);
  if (!day) return "Tarefa ficou sem prazo.";
  return `Prazo agora é ${dayLabel(day, today).toLowerCase()}.`;
}

/**
 * Agenda: as tarefas com prazo em uma semana a partir de hoje. Arrastar um cartão para outro dia muda o
 * prazo (o horário fica); para Sem prazo, tira o prazo.
 */
export function AgendaPage() {
  const board = useTaskBoard();
  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data) return <p className="text-sm text-muted">Carregando a agenda…</p>;
  return <AgendaBoard today={board.data.today} items={board.data.items} />;
}

function AgendaBoard({ today, items }: { today: string; items: BoardItemDto[] }) {
  const [week, setWeek] = useState(0);
  const change = useBoardChange();
  const toast = useToast();
  const linkOf = useRecordLink();
  const { fading, toggle } = useTaskToggle();
  const days = agendaWeek(addDays(today, week * AGENDA_DAYS));
  const lists = agendaLists(items, days, today);
  const byId = new Map(items.map((item) => [item.id, item]));
  const dndLists: DndColumn[] = Object.entries(lists).map(([key, ids]) => ({ key, ids, accepts: key !== OVERDUE_KEY }));

  async function drop({ id, from, to, order }: ColumnDrop) {
    const day = from !== to ? dayOfKey(to) : null;
    const undated = from !== to && to === UNDATED_KEY;
    try {
      await change.mutateAsync({ id, change: { ...(day ? { day } : {}), ...(undated ? { group: "undated" as const } : {}), order } });
      if (from !== to) toast({ text: dropText(to, today) });
    } catch (error) {
      toast({ text: errorMessage(error) });
      throw error;
    }
  }

  const dnd = useColumnsDnd({ lists: dndLists, onDrop: drop });
  const ids = (key: string) => dnd.columns[key] ?? lists[key] ?? [];

  function card(id: string, listKey: string) {
    const item = byId.get(id);
    if (!item) return null;
    const checked = fading.has(id);
    const time = item.dueAt && listKey !== OVERDUE_KEY ? dueClock(item.dueAt) : null;
    const info = (
      <>
        {listKey === OVERDUE_KEY && item.dueAt ? <DueText dueAt={item.dueAt} today={today} overdue /> : null}
        {time ? <span className="tabular-nums">{time}</span> : null}
        {item.status === "in_progress" && !checked ? <InProgressChip /> : null}
      </>
    );
    return (
      <CheckRow
        checked={checked}
        ring={taskRing(item.priority)}
        label={`Concluir: ${item.body}`}
        onToggle={() => toggle(item)}
        link={linkOf(item)}
        title={item.body}
        info={listKey === OVERDUE_KEY || time || item.status === "in_progress" ? info : undefined}
      />
    );
  }

  return (
    <div>
      <PageTitle title="Agenda" text={agendaMonth(days)} action={<WeekNav week={week} onChange={setWeek} />} />
      <DayStrip days={days} today={today} lists={lists} />
      <DndContext {...dnd.context} collisionDetection={closestCorners}>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-4 md:overflow-x-auto md:pb-6">
          {ids(OVERDUE_KEY).length ? (
            <OverdueColumn count={ids(OVERDUE_KEY).length} action={<PassToToday ids={ids(OVERDUE_KEY)} />}>
              <AgendaList listKey={OVERDUE_KEY} ids={ids(OVERDUE_KEY)} accepts={false} renderCard={card} />
            </OverdueColumn>
          ) : null}
          {days.map((day) => {
            const key = dayKey(day);
            return (
              <AgendaDayColumn
                key={day}
                day={day}
                today={today}
                count={ids(key).length}
                footer={<AddTask id={`nova-tarefa-${day}`} day={day} today={today} label="Adicionar" />}
              >
                <AgendaList listKey={key} ids={ids(key)} accepts renderCard={card} />
              </AgendaDayColumn>
            );
          })}
          <UndatedColumn count={ids(UNDATED_KEY).length}>
            <AgendaList listKey={UNDATED_KEY} ids={ids(UNDATED_KEY)} accepts empty="Toda tarefa tem prazo." renderCard={card} />
            <div className="border-b border-line px-3 md:border-0 md:px-1">
              <AddTask id="nova-tarefa-sem-prazo" day={null} today={today} label="Adicionar" />
            </div>
          </UndatedColumn>
        </div>
        <DragOverlay>
          {dnd.activeId && dnd.activeColumn ? <div className="w-[16.5rem] rounded-control border border-accent bg-card shadow-card">{card(dnd.activeId, dnd.activeColumn)}</div> : null}
        </DragOverlay>
      </DndContext>
      <RecordModalHost />
    </div>
  );
}
