import { useState } from "react";
import type { BoardItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Notice, PageTitle } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useBoardChange, useTaskBoard } from "../data/board";
import { myDayDate, myDayGroups, type MyDayGroups } from "../model/my-day";
import { CheckRow, Checklist, InProgressChip, type ChecklistGroup } from "./checklist";
import type { ChecklistColumn } from "./checklist-table";
import { InboxAdd } from "./InboxAdd";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink, type RecordLink } from "./record-link";
import { AddTask, DueText, PassToToday, PriorityCell, TaskStatusCell, taskRing, useTaskToggle } from "./task-parts";

const MY_DAY_COLUMNS: ChecklistColumn[] = [
  { key: "prioridade", header: "Prioridade", width: "7rem" },
  { key: "prazo", header: "Prazo", width: "8.5rem" },
  { key: "situacao", header: "Situação", width: "8.5rem" },
];

function countLine(groups: MyDayGroups): string {
  const today = groups.today.length === 1 ? "1 para hoje" : `${groups.today.length} para hoje`;
  if (!groups.overdue.length) return today;
  return `${today} · ${groups.overdue.length} ${groups.overdue.length === 1 ? "atrasada" : "atrasadas"}`;
}

// Anotar sem sair do Meu Dia: o cartão da Entrada abre aqui e o rascunho vai para lá.
function QuickEntry({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button tone="ghost" onClick={() => setOpen(true)} className="gap-2">
        <Icon name="inbox" />
        Anotar na Entrada
      </Button>
    );
  }
  return (
    <div className="w-full sm:w-[30rem]">
      <InboxAdd today={today} quick onCancel={() => setOpen(false)} />
    </div>
  );
}

/**
 * Meu Dia: as tarefas de hoje e as atrasadas, para abrir no começo do turno. O resto do que tem prazo
 * fica na Agenda; a busca em tudo, em Registros.
 */
export function MyDayPage() {
  const board = useTaskBoard();
  const change = useBoardChange();
  const toast = useToast();
  const linkOf = useRecordLink();
  const { fading, toggle } = useTaskToggle();

  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data) return <p className="text-sm text-muted">Carregando o seu dia…</p>;
  const { today, items } = board.data;
  const byId = new Map(items.map((item) => [item.id, item]));
  const parts = myDayGroups(items, today);

  function row(id: string, groupKey: string) {
    const item = byId.get(id);
    if (!item) return null;
    return <MyDayRow item={item} today={today} overdue={groupKey === "overdue"} checked={item.status === "done" || fading.has(id)} onToggle={() => toggle(item)} link={linkOf(item)} />;
  }

  const groups: ChecklistGroup[] = [
    ...(parts.overdue.length
      ? [{ key: "overdue", title: "Atrasadas", ids: parts.overdue, empty: "Nada atrasado.", action: <PassToToday ids={parts.overdue} today={today} /> }]
      : []),
    {
      key: "today",
      title: "Hoje",
      ids: parts.today,
      empty: "Nada para hoje. Arraste uma atrasada para cá ou adicione uma tarefa.",
      accepts: true,
      footer: <AddTask id="nova-tarefa-hoje" day={today} today={today} />,
    },
    { key: "done", title: "Concluídas hoje", ids: parts.doneToday, empty: "Nenhuma concluída hoje.", locked: true, startCollapsed: true },
  ];

  return (
    <div>
      <PageTitle title="Meu Dia" text={myDayDate(today)} action={<QuickEntry today={today} />} />
      <p className="mb-3 hidden justify-end text-sm text-muted md:flex">{countLine(parts)}</p>
      <Checklist
        frame={{ itemHeader: "Tarefa", columns: MY_DAY_COLUMNS, summary: countLine(parts) }}
        groups={groups}
        fading={fading}
        renderRow={row}
        renderOverlay={row}
        onDrop={async ({ id, from, to, order }) => {
          const moved = from !== to && to === "today";
          try {
            await change.mutateAsync({ id, change: { ...(moved ? { group: "today" as const } : {}), order } });
            if (moved) toast({ text: "Prazo agora é hoje." });
          } catch (error) {
            toast({ text: errorMessage(error) });
            throw error;
          }
        }}
      />
      <RecordModalHost />
    </div>
  );
}

function MyDayRow({
  item,
  today,
  overdue,
  checked,
  onToggle,
  link,
}: {
  item: BoardItemDto;
  today: string;
  overdue: boolean;
  checked: boolean;
  onToggle: () => void;
  link: RecordLink;
}) {
  const due = item.dueAt ? <DueText dueAt={item.dueAt} today={today} overdue={overdue} /> : <span className="text-muted">—</span>;
  return (
    <CheckRow
      checked={checked}
      ring={taskRing(item.priority)}
      label={`${item.status === "done" ? "Reabrir" : "Concluir"}: ${item.body}`}
      onToggle={onToggle}
      link={link}
      title={item.body}
      info={
        <>
          {item.dueAt ? due : null}
          {item.status === "in_progress" && !checked ? <InProgressChip /> : null}
        </>
      }
      cells={[<PriorityCell priority={item.priority} />, due, <TaskStatusCell item={item} checked={checked} />]}
    />
  );
}
