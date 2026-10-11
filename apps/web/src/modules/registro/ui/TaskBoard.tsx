import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { BoardGroup, BoardItemDto, BoardTarget, RecordPriority } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { changeOnBoard, refreshRecords, useAddTask, useBoardChange, useTaskBoard } from "../data/board";
import { dueLabel, groupEmpty, isDropTarget, nextDay, todayTitle } from "../model/board";
import { CheckRow, Checklist, InProgressChip, ringTone, scrollToGroup, useCompleting, type ChecklistGroup } from "./checklist";
import { DueChip, PriorityChip } from "./chips";
import { AddRow } from "./quick-add";

const groupOrder: BoardGroup[] = ["overdue", "today", "upcoming", "undated", "done"];

const dropLabel: Record<BoardTarget, string> = {
  today: "Prazo agora é hoje.",
  upcoming: "Prazo agora é amanhã.",
  undated: "Tarefa ficou sem prazo.",
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

function groupDay(group: BoardTarget, today: string): string | null {
  if (group === "today") return today;
  if (group === "upcoming") return nextDay(today);
  return null;
}

function AddTask({ group, today }: { group: BoardTarget; today: string }) {
  const add = useAddTask();
  const toast = useToast();
  const [day, setDay] = useState(() => groupDay(group, today));
  const [priority, setPriority] = useState<RecordPriority | null>(null);
  return (
    <AddRow
      label="Adicionar tarefa"
      placeholder="Nome da tarefa"
      id={`nova-tarefa-${group}`}
      pending={add.isPending}
      chips={
        <>
          <DueChip day={day} today={today} onChange={setDay} />
          <PriorityChip value={priority} onChange={setPriority} />
        </>
      }
      onAdd={(body, clear) => add.mutate({ body, day, priority }, { onSuccess: clear, onError: (error) => toast({ text: errorMessage(error) }) })}
    />
  );
}

export function TaskBoard() {
  const board = useTaskBoard();
  const change = useBoardChange();
  const toast = useToast();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const { fading, complete } = useCompleting();
  const [rescheduling, setRescheduling] = useState(false);

  // Vindo do painel ("Vencidas", "Vencem hoje", "Concluídas"): rola até o grupo.
  const target = params.get("due") === "overdue" ? "overdue" : params.get("due") === "today" ? "today" : params.get("status") === "done" ? "done" : null;
  const ready = Boolean(board.data);
  useEffect(() => {
    if (ready && target) scrollToGroup(target);
  }, [ready, target]);

  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data) return <p className="text-sm text-muted">Carregando tarefas…</p>;
  const { today, items } = board.data;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ids = (group: BoardGroup) => items.filter((item) => item.group === group).map((item) => item.id);
  const overdue = ids("overdue");

  function toggle(item: BoardItemDto) {
    if (item.status === "done") {
      change.mutate({ id: item.id, change: { status: "open" } }, { onError: (error) => toast({ text: errorMessage(error) }) });
      return;
    }
    const before = item.status;
    complete(item.id, (done) =>
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () =>
            toast({ text: "Tarefa concluída.", action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: before } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }

  async function passOverdueToToday() {
    setRescheduling(true);
    try {
      await Promise.all(overdue.map((id) => changeOnBoard(id, { group: "today" })));
      toast({ text: overdue.length === 1 ? "1 tarefa passou para hoje." : `${overdue.length} tarefas passaram para hoje.` });
    } catch (error) {
      toast({ text: errorMessage(error) });
    } finally {
      await refreshRecords(client);
      setRescheduling(false);
    }
  }

  function row(id: string, groupKey: string) {
    const item = byId.get(id);
    if (!item) return null;
    const group = groupKey as BoardGroup;
    const checked = item.status === "done" || fading.has(id);
    const dueTone = group === "overdue" ? "text-danger" : group === "today" ? "text-accent" : "text-muted";
    return (
      <CheckRow
        checked={checked}
        ring={item.priority === "high" ? ringTone.high : item.priority === "medium" ? ringTone.medium : ringTone.plain}
        label={`${item.status === "done" ? "Reabrir" : "Concluir"}: ${item.body}`}
        onToggle={() => toggle(item)}
        href={`/registros/${item.id}`}
        title={item.body}
        info={
          item.dueAt || (item.status === "in_progress" && !checked) ? (
            <>
              {item.dueAt ? (
                <span className={`inline-flex items-center gap-1 tabular-nums ${dueTone}`}>
                  <CalendarIcon />
                  {dueLabel(item.dueAt, today)}
                </span>
              ) : null}
              {item.status === "in_progress" && !checked ? <InProgressChip /> : null}
            </>
          ) : null
        }
      />
    );
  }

  const day = todayTitle(today);
  const titles: Record<BoardGroup, { title: string; sub?: string }> = {
    overdue: { title: "Atrasadas" },
    today: day,
    upcoming: { title: "Próximos dias" },
    undated: { title: "Sem prazo" },
    done: { title: "Concluídas", sub: "últimos 7 dias" },
  };
  const groups: ChecklistGroup[] = groupOrder
    .filter((group) => group !== "overdue" || overdue.length > 0)
    .map((group) => ({
      key: group,
      ...titles[group],
      ids: ids(group),
      empty: groupEmpty[group],
      accepts: isDropTarget(group),
      locked: group === "done",
      startCollapsed: group === "done",
      footer: isDropTarget(group) ? <AddTask group={group} today={today} /> : undefined,
      action:
        group === "overdue" ? (
          <button type="button" onClick={() => void passOverdueToToday()} disabled={rescheduling} className="text-sm font-semibold text-accent disabled:opacity-50">
            {rescheduling ? "Passando…" : "Passar para hoje"}
          </button>
        ) : undefined,
    }));
  const open = items.filter((item) => item.status !== "done").length;

  return (
    <div>
      <p className="mb-6 flex flex-wrap gap-x-4 text-sm text-muted">
        <span>
          {open} {open === 1 ? "aberta" : "abertas"}
        </span>
        {overdue.length ? (
          <span className="text-danger">
            {overdue.length} {overdue.length === 1 ? "atrasada" : "atrasadas"}
          </span>
        ) : null}
      </p>
      <Checklist
        groups={groups}
        fading={fading}
        openKeys={target === "done" ? ["done"] : []}
        renderRow={row}
        renderOverlay={row}
        onDrop={async ({ id, from, to, order }) => {
          const moved = from !== to && isDropTarget(to as BoardGroup);
          try {
            await change.mutateAsync({ id, change: { ...(moved ? { group: to as BoardTarget } : {}), order } });
            if (moved) toast({ text: dropLabel[to as BoardTarget] });
          } catch (error) {
            toast({ text: errorMessage(error) });
            throw error;
          }
        }}
      />
    </div>
  );
}
