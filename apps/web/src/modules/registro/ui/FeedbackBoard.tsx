import { useState } from "react";
import type { FeedbackBoardItemDto, FeedbackTone } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SelectInput } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useMembers } from "../../cadastro/data/cadastro";
import { useAddFeedback, useBoardChange, useFeedbackBoard } from "../data/board";
import { toneLabel } from "../model/record";
import { AddRow, CheckRow, Checklist, GroupingPills, useCompleting, useGrouping, type ChecklistGroup } from "./checklist";

const MODES = ["colaborador", "tom", "data"] as const;
type Mode = (typeof MODES)[number];
const modeOptions: { value: Mode; label: string }[] = [
  { value: "colaborador", label: "Colaborador" },
  { value: "tom", label: "Tom" },
  { value: "data", label: "Data" },
];

const NO_MEMBER = "Sem colaborador";
const toneGroups: { tone: FeedbackTone | null; title: string }[] = [
  { tone: "negative", title: "Negativos" },
  { tone: "positive", title: "Positivos" },
  { tone: "neutral", title: "Neutros" },
  { tone: null, title: "Sem tom" },
];
const tones: FeedbackTone[] = ["positive", "negative", "neutral"];
const dotByTone: Record<FeedbackTone, string> = { positive: "bg-accent", negative: "bg-danger", neutral: "bg-muted" };
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function shortDay(iso: string) {
  return dayMonth.format(new Date(iso)).replace(".", "").replace(" de ", " ");
}

function memberOf(item: FeedbackBoardItemDto) {
  return item.memberName ?? NO_MEMBER;
}

function ToneMark({ tone }: { tone: FeedbackTone | null }) {
  if (!tone) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotByTone[tone]}`} />
      {toneLabel(tone)}
    </span>
  );
}

function AddFeedback({ memberId, tone: fixedTone, label = "Anotar feedback" }: { memberId?: string; tone?: FeedbackTone; label?: string }) {
  const add = useAddFeedback();
  const members = useMembers();
  const toast = useToast();
  const [chosen, setChosen] = useState("");
  const [tone, setTone] = useState<FeedbackTone>(fixedTone ?? "neutral");
  const key = `${memberId ?? "pessoa"}-${fixedTone ?? "tom"}`;
  return (
    <AddRow
      label={label}
      placeholder="O que você quer falar com a pessoa?"
      id={`novo-feedback-${key}`}
      pending={add.isPending}
      extra={
        <>
          {memberId ? null : (
            <div className="w-full sm:w-56">
              <SelectInput id={`novo-feedback-pessoa-${key}`} aria-label="Colaborador" value={chosen} onChange={(event) => setChosen(event.target.value)}>
                <option value="">Escolha o colaborador</option>
                {(members.data ?? []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </SelectInput>
            </div>
          )}
          {fixedTone ? null : (
            <div role="group" aria-label="Tom" className="flex gap-1">
              {tones.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={tone === option}
                  onClick={() => setTone(option)}
                  className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-2 text-[13px] ${
                    tone === option ? "border-accent bg-accent-soft font-semibold text-app" : "border-line text-app hover:bg-chip"
                  }`}
                >
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotByTone[option]}`} />
                  {toneLabel(option)}
                </button>
              ))}
            </div>
          )}
        </>
      }
      onAdd={(body, clear) => {
        const member = memberId ?? (chosen || null);
        if (!member) {
          toast({ text: "Escolha o colaborador." });
          return;
        }
        add.mutate({ body, memberId: member, tone }, { onSuccess: clear, onError: (error) => toast({ text: errorMessage(error) }) });
      }}
    />
  );
}

export function FeedbackBoard() {
  const board = useFeedbackBoard();
  const change = useBoardChange();
  const toast = useToast();
  const { fading, complete } = useCompleting();
  const [mode, setMode] = useGrouping<Mode>("pendencias.feedbacks.agrupar", MODES, "colaborador");

  if (board.isError) return <Notice>{errorMessage(board.error)}</Notice>;
  if (!board.data) return <p className="text-sm text-muted">Carregando feedbacks…</p>;
  const items = board.data.items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const pending = items.filter((item) => item.status !== "done");
  const talked: ChecklistGroup = {
    key: "conversados",
    title: "Já conversados",
    sub: "último mês",
    ids: items.filter((item) => item.status === "done").map((item) => item.id),
    empty: "Nenhuma conversa marcada no último mês.",
    locked: true,
    startCollapsed: true,
  };

  let groups: ChecklistGroup[];
  if (mode === "colaborador") {
    const names = [...new Set(pending.map(memberOf))].sort((a, b) => Number(a === NO_MEMBER) - Number(b === NO_MEMBER) || a.localeCompare(b, "pt-BR"));
    groups = names.map((name): ChecklistGroup => {
      const members = pending.filter((item) => memberOf(item) === name);
      const memberId = members.find((item) => item.memberId)?.memberId ?? undefined;
      return {
        key: `pessoa:${name}`,
        title: name,
        ids: members.map((item) => item.id),
        empty: "",
        footer: memberId ? <AddFeedback memberId={memberId} /> : undefined,
      };
    });
  } else if (mode === "tom") {
    groups = toneGroups
      .map(({ tone, title }): ChecklistGroup => ({
        key: `tom:${tone ?? "sem"}`,
        title,
        ids: pending.filter((item) => item.tone === tone).map((item) => item.id),
        empty: "",
        footer: tone ? <AddFeedback tone={tone} /> : undefined,
      }))
      .filter((group) => group.ids.length > 0);
  } else {
    groups = [
      {
        key: "recentes",
        title: "Mais recentes",
        ids: [...pending].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((item) => item.id),
        empty: "Nada para conversar.",
        locked: true,
      },
    ];
  }
  groups.push(talked);

  function toggle(item: FeedbackBoardItemDto) {
    if (item.status === "done") {
      change.mutate({ id: item.id, change: { status: "open" } }, { onError: (error) => toast({ text: errorMessage(error) }) });
      return;
    }
    complete(item.id, (done) =>
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () =>
            toast({ text: "Marcado como conversado.", action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: "open" } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }

  function row(id: string, groupKey: string) {
    const item = byId.get(id);
    if (!item) return null;
    return (
      <CheckRow
        checked={item.status === "done" || fading.has(id)}
        label={`${item.status === "done" ? "Voltar para a conversar" : "Marcar como conversado"}: ${item.body}`}
        onToggle={() => toggle(item)}
        href={`/registros/${item.id}`}
        title={item.body}
        info={
          <>
            <ToneMark tone={item.tone} />
            <span className="tabular-nums">{shortDay(item.occurredAt)}</span>
          </>
        }
        tag={mode !== "colaborador" || groupKey === "conversados" ? memberOf(item) : undefined}
      />
    );
  }

  return (
    <div>
      <GroupingPills value={mode} options={modeOptions} onChange={setMode} />
      {pending.length === 0 ? <p className="mb-2 text-sm text-muted">Nenhum feedback para conversar.</p> : null}
      <Checklist
        key={mode}
        groups={groups}
        fading={fading}
        renderRow={row}
        renderOverlay={row}
        onDrop={async ({ id, order }) => {
          try {
            await change.mutateAsync({ id, change: { order } });
          } catch (error) {
            toast({ text: errorMessage(error) });
            throw error;
          }
        }}
      />
      <div className="mt-4">
        <AddFeedback label={mode === "colaborador" && pending.length ? "Anotar feedback para outra pessoa" : "Anotar feedback"} />
      </div>
    </div>
  );
}
