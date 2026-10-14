import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemBoardItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useAddProblem, useBoardChange, useProblemBoard, type NewProblemSpot } from "../data/board";
import { PROBLEM_MODES, placeGroups, placeTag, problemModeOptions, type ProblemMode } from "../model/problem-board";
import { originLabel } from "../model/record";
import { CheckRow, Checklist, GroupingPills, InProgressChip, useCompleting, useGrouping, type ChecklistGroup } from "./checklist";
import { PlaceChips, type PlaceValue } from "./chips";
import type { ChecklistColumn } from "./checklist-table";
import { AddRow } from "./quick-add";
import { useRecordLink } from "./record-link";

const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function shortDay(iso: string) {
  return dayMonth.format(new Date(iso)).replace(".", "").replace(" de ", " ");
}

function placeOf(spot: NewProblemSpot | undefined): PlaceValue {
  return { lineId: spot?.lineId ?? "", machineId: spot?.machineId ?? "", subassemblyId: spot?.subassemblyId ?? "" };
}

// O lugar começa com o do grupo e pode mudar nas etiquetas antes de adicionar.
function AddProblem({ spot, inProgress, label = "Adicionar problema" }: { spot?: NewProblemSpot; inProgress?: boolean; label?: string }) {
  const add = useAddProblem();
  const toast = useToast();
  const [place, setPlace] = useState(() => placeOf(spot));
  const key = `${spot?.subassemblyId ?? spot?.machineId ?? spot?.lineId ?? "lugar"}-${inProgress ? "andamento" : "aberto"}`;
  return (
    <AddRow
      label={label}
      placeholder="Qual é o problema?"
      id={`novo-problema-${key}`}
      pending={add.isPending}
      chips={<PlaceChips value={place} onChange={setPlace} />}
      onAdd={(body, clear) =>
        add.mutate(
          {
            body,
            spot: { lineId: place.lineId || null, machineId: place.machineId || null, subassemblyId: place.subassemblyId || null },
            inProgress: Boolean(inProgress),
          },
          { onSuccess: clear, onError: (error) => toast({ text: errorMessage(error) }) },
        )
      }
    />
  );
}

const PROBLEM_COLUMNS: ChecklistColumn[] = [
  { key: "lugar", header: "Lugar", width: "15rem" },
  { key: "origem", header: "Origem", width: "6.5rem" },
  { key: "data", header: "Aberto em", width: "6.5rem" },
  { key: "situacao", header: "Situação", width: "8.5rem" },
];

function Dash() {
  return <span className="text-muted">—</span>;
}

function ProblemStatus({ item, checked }: { item: ProblemBoardItemDto; checked: boolean }) {
  if (item.status === "done" || checked) return <span className="text-muted">Resolvido</span>;
  if (item.status === "in_progress") return <InProgressChip />;
  return <span className="text-muted">Aberto</span>;
}

const otherPlace: Record<Exclude<ProblemMode, "situacao">, string> = {
  linha: "Adicionar problema em outra linha",
  maquina: "Adicionar problema em outra máquina",
  conjunto: "Adicionar problema",
};

function openLine(count: number): string {
  if (count === 0) return "Nenhum problema em aberto";
  return count === 1 ? "1 problema em aberto" : `${count} problemas em aberto`;
}

export function ProblemBoard() {
  const board = useProblemBoard();
  const change = useBoardChange();
  const toast = useToast();
  const linkOf = useRecordLink();
  const navigate = useNavigate();
  const { fading, complete } = useCompleting();
  const [mode, setMode] = useGrouping<ProblemMode>("pendencias.problemas.agrupar", PROBLEM_MODES, "linha");

  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data) return <p className="text-sm text-muted">Carregando problemas…</p>;
  const items = board.data.items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const open = items.filter((item) => item.status !== "done");
  const resolved: ChecklistGroup = {
    key: "resolvidos",
    title: "Resolvidos",
    sub: "últimos 7 dias",
    ids: items.filter((item) => item.status === "done").map((item) => item.id),
    empty: "Nenhum resolvido nos últimos 7 dias.",
    locked: true,
    startCollapsed: true,
  };

  let groups: ChecklistGroup[];
  if (mode !== "situacao") {
    groups = [
      ...placeGroups(open, mode).map(
        (group): ChecklistGroup => ({
          key: group.key,
          title: group.title,
          ids: group.ids,
          empty: "",
          footer: group.spot ? <AddProblem spot={group.spot} /> : undefined,
        }),
      ),
      resolved,
    ];
  } else {
    groups = [
      {
        key: "aberto",
        title: "Aberto",
        ids: open.filter((item) => item.status === "open").map((item) => item.id),
        empty: "Nada aberto.",
        accepts: true,
        footer: <AddProblem />,
      },
      {
        key: "andamento",
        title: "Em andamento",
        ids: open.filter((item) => item.status === "in_progress").map((item) => item.id),
        empty: "Arraste para cá o que já está sendo resolvido.",
        accepts: true,
        footer: <AddProblem inProgress />,
      },
      resolved,
    ];
  }

  function toggle(item: ProblemBoardItemDto) {
    if (item.rpId) {
      navigate(`/rp/${item.rpId}`);
      return;
    }
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
            toast({ text: "Problema resolvido.", action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: before } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }

  function row(id: string, groupKey: string) {
    const item = byId.get(id);
    if (!item) return null;
    const checked = item.status === "done" || fading.has(id);
    const place = placeTag(item, mode, groupKey);
    return (
      <CheckRow
        checked={checked}
        label={item.rpId ? `Abrir o RP para fechar: ${item.body}` : `${item.status === "done" ? "Reabrir" : "Marcar como resolvido"}: ${item.body}`}
        onToggle={() => toggle(item)}
        link={linkOf(item)}
        title={item.body}
        info={
          <>
            <span className="tabular-nums">{shortDay(item.occurredAt)}</span>
            {item.origin !== "inbox" ? <span>{originLabel(item.origin)}</span> : null}
            {item.status === "in_progress" && !checked && mode !== "situacao" ? <InProgressChip /> : null}
            {place ? <span>{place}</span> : null}
          </>
        }
        cells={[
          place ? <span className="text-muted">{place}</span> : <Dash />,
          item.origin !== "inbox" ? originLabel(item.origin) : <Dash />,
          <span className="tabular-nums text-muted">{shortDay(item.occurredAt)}</span>,
          <ProblemStatus item={item} checked={checked} />,
        ]}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <GroupingPills value={mode} options={problemModeOptions} onChange={setMode} />
        <span className="hidden text-sm text-muted md:inline">{openLine(open.length)}</span>
      </div>
      <Checklist
        frame={{ itemHeader: "Problema", columns: PROBLEM_COLUMNS, summary: openLine(open.length) }}
        key={mode}
        groups={groups}
        fading={fading}
        renderRow={row}
        renderOverlay={row}
        // Problema de RP segue o status do RP: só reordena, não troca de situação aqui.
        canMove={(id) => !byId.get(id)?.rpId}
        onDrop={async ({ id, from, to, order }) => {
          const status = from !== to ? (to === "andamento" ? "in_progress" : "open") : undefined;
          try {
            await change.mutateAsync({ id, change: { ...(status ? { status } : {}), order } });
            if (status) toast({ text: status === "in_progress" ? "Agora está em andamento." : "Voltou para aberto." });
          } catch (error) {
            toast({ text: errorMessage(error) });
            throw error;
          }
        }}
      />
      {mode !== "situacao" ? (
        <div className="mt-4">
          <AddProblem label={open.length ? otherPlace[mode] : "Adicionar problema"} />
        </div>
      ) : null}
    </div>
  );
}
