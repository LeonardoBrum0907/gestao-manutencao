import { useState } from "react";
import type { FeedbackTone, RecordPriority, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { useToast } from "../../../design/ui/toast";
import { useAddFeedback, useAddProblem, useAddTask } from "../data/board";
import { DueChip, MemberChip, PlaceChips, PriorityChip, ToneChip, TypeChip, noPlace, type PlaceValue } from "./chips";
import { QuickAddCard } from "./quick-add";

const placeholders: Record<RecordType, string> = {
  task: "Nome da tarefa",
  problem: "Qual é o problema?",
  feedback: "O que você quer falar com a pessoa?",
};

type InboxDraft = {
  type: RecordType;
  day: string | null;
  priority: RecordPriority | null;
  place: PlaceValue;
  memberId: string;
  tone: FeedbackTone;
};

const emptyDraft: InboxDraft = { type: "task", day: null, priority: null, place: noPlace, memberId: "", tone: "neutral" };

function DraftChips({ draft, today, onChange }: { draft: InboxDraft; today: string; onChange: (patch: Partial<InboxDraft>) => void }) {
  return (
    <>
      <TypeChip value={draft.type} onChange={(type) => onChange({ type })} />
      {draft.type === "task" ? (
        <>
          <DueChip day={draft.day} today={today} onChange={(day) => onChange({ day })} />
          <PriorityChip value={draft.priority} onChange={(priority) => onChange({ priority })} />
        </>
      ) : null}
      {draft.type === "problem" ? <PlaceChips value={draft.place} onChange={(place) => onChange({ place })} /> : null}
      {draft.type === "feedback" ? (
        <>
          <MemberChip value={draft.memberId} onChange={(memberId) => onChange({ memberId })} />
          <ToneChip value={draft.tone} onChange={(tone) => onChange({ tone })} />
        </>
      ) : null}
    </>
  );
}

/**
 * Cartão sempre aberto no fim da Entrada: escolhe o tipo e as etiquetas dele. Depois de adicionar, o texto limpa
 * e as etiquetas ficam, para lançar várias coisas parecidas em sequência.
 */
export function InboxAdd({ today }: { today: string }) {
  const toast = useToast();
  const addTask = useAddTask();
  const addProblem = useAddProblem();
  const addFeedback = useAddFeedback();
  const [draft, setDraft] = useState<InboxDraft>(emptyDraft);
  const pending = addTask.isPending || addProblem.isPending || addFeedback.isPending;
  const done = (clear: () => void) => ({ onSuccess: clear, onError: (error: Error) => toast({ text: errorMessage(error) }) });

  function add(body: string, clear: () => void) {
    if (draft.type === "task") return addTask.mutate({ body, day: draft.day, priority: draft.priority }, done(clear));
    if (draft.type === "problem") {
      const { lineId, machineId, subassemblyId } = draft.place;
      const spot = { lineId: lineId || null, machineId: machineId || null, subassemblyId: subassemblyId || null };
      return addProblem.mutate({ body, spot, inProgress: false }, done(clear));
    }
    if (!draft.memberId) return toast({ text: "Escolha o colaborador." });
    addFeedback.mutate({ body, memberId: draft.memberId, tone: draft.tone }, done(clear));
  }

  return (
    <QuickAddCard
      id="entrada-novo"
      label="Adicionar"
      placeholder={placeholders[draft.type]}
      pending={pending}
      autoFocus={false}
      chips={<DraftChips draft={draft} today={today} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />}
      onAdd={add}
    />
  );
}
