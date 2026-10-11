import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemBoardItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SelectInput } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useLines } from "../../cadastro/data/cadastro";
import { useAddProblem, useBoardChange, useProblemBoard } from "../data/board";
import { originLabel } from "../model/record";
import { AddRow, CheckRow, Checklist, GroupingPills, InProgressChip, useCompleting, useGrouping, type ChecklistGroup } from "./checklist";

const MODES = ["linha", "situacao"] as const;
type Mode = (typeof MODES)[number];
const modeOptions: { value: Mode; label: string }[] = [
  { value: "linha", label: "Linha" },
  { value: "situacao", label: "Situação" },
];

const NO_LINE = "Sem linha";
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function shortDay(iso: string) {
  return dayMonth.format(new Date(iso)).replace(".", "").replace(" de ", " ");
}

function lineOf(item: ProblemBoardItemDto) {
  return item.lineName ?? NO_LINE;
}

function AddProblem({ lineId, inProgress, label = "Adicionar problema" }: { lineId?: string; inProgress?: boolean; label?: string }) {
  const add = useAddProblem();
  const lines = useLines();
  const toast = useToast();
  const [chosen, setChosen] = useState("");
  const key = `${lineId ?? "linha"}-${inProgress ? "andamento" : "aberto"}`;
  return (
    <AddRow
      label={label}
      placeholder="Qual é o problema?"
      id={`novo-problema-${key}`}
      pending={add.isPending}
      extra={
        lineId ? null : (
          <div className="w-full sm:w-48">
            <SelectInput id={`novo-problema-linha-${key}`} aria-label="Linha" value={chosen} onChange={(event) => setChosen(event.target.value)}>
              <option value="">Sem linha</option>
              {(lines.data ?? []).map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </div>
        )
      }
      onAdd={(body, clear) =>
        add.mutate(
          { body, lineId: lineId ?? (chosen || null), inProgress: Boolean(inProgress) },
          { onSuccess: clear, onError: (error) => toast({ text: errorMessage(error) }) },
        )
      }
    />
  );
}

export function ProblemBoard() {
  const board = useProblemBoard();
  const change = useBoardChange();
  const toast = useToast();
  const navigate = useNavigate();
  const { fading, complete } = useCompleting();
  const [mode, setMode] = useGrouping<Mode>("pendencias.problemas.agrupar", MODES, "linha");

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
  if (mode === "linha") {
    const names = [...new Set(open.map(lineOf))].sort((a, b) => Number(a === NO_LINE) - Number(b === NO_LINE) || a.localeCompare(b, "pt-BR"));
    groups = [
      ...names.map((name): ChecklistGroup => {
        const members = open.filter((item) => lineOf(item) === name);
        const lineId = members.find((item) => item.lineId)?.lineId ?? undefined;
        return {
          key: `linha:${name}`,
          title: name,
          ids: members.map((item) => item.id),
          empty: "",
          footer: lineId ? <AddProblem lineId={lineId} /> : undefined,
        };
      }),
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
    return (
      <CheckRow
        checked={checked}
        label={item.rpId ? `Abrir o RP para fechar: ${item.body}` : `${item.status === "done" ? "Reabrir" : "Marcar como resolvido"}: ${item.body}`}
        onToggle={() => toggle(item)}
        href={`/registros/${item.id}`}
        title={item.body}
        info={
          <>
            <span className="tabular-nums">{shortDay(item.occurredAt)}</span>
            {item.origin !== "inbox" ? <span>{originLabel(item.origin)}</span> : null}
            {item.status === "in_progress" && !checked && mode === "linha" ? <InProgressChip /> : null}
          </>
        }
        tag={mode !== "linha" || groupKey === "resolvidos" ? lineOf(item) : undefined}
      />
    );
  }

  return (
    <div>
      <GroupingPills value={mode} options={modeOptions} onChange={setMode} />
      {open.length === 0 && mode === "linha" ? <p className="mb-2 text-sm text-muted">Nenhum problema em aberto.</p> : null}
      <Checklist
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
      {mode === "linha" ? (
        <div className="mt-4">
          <AddProblem label={open.length ? "Adicionar problema em outra linha" : "Adicionar problema"} />
        </div>
      ) : null}
    </div>
  );
}
