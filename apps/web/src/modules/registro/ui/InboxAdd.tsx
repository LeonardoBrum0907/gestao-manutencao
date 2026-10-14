import { useState } from "react";
import type { FeedbackTone, RecordPriority, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { useToast } from "../../../design/ui/toast";
import { useAddFeedback, useAddProblem, useAddTask } from "../data/board";
import { useAddEntry } from "../data/entries";
import { recordShortName } from "../model/record";
import { DueChip, MemberChip, PlaceChips, PriorityChip, ToneChip, TypeChip, noPlace, type PlaceValue } from "./chips";
import { QuickAddCard } from "./quick-add";

const placeholders: Record<RecordType, string> = {
  entry: "Anote rápido; o tipo você define depois",
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

const emptyDraft: InboxDraft = { type: "entry", day: null, priority: null, place: noPlace, memberId: "", tone: "neutral" };

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
 * Cartão sempre aberto no fim da Entrada. Por padrão anota um rascunho (tipo Entrada), que fica na lista até ser
 * revisado; escolhendo outro tipo, o registro vai direto para Registros. Depois de adicionar, o texto limpa e as
 * etiquetas ficam, para lançar várias coisas parecidas em sequência.
 */
export function InboxAdd({
  today,
  quick = false,
  onCancel,
}: {
  today: string;
  // Aberto pelo botão rápido do Meu Dia: já com o cursor no texto e avisando que o rascunho foi para a Entrada.
  quick?: boolean;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const addEntry = useAddEntry();
  const addTask = useAddTask();
  const addProblem = useAddProblem();
  const addFeedback = useAddFeedback();
  const [draft, setDraft] = useState<InboxDraft>(emptyDraft);
  const pending = addEntry.isPending || addTask.isPending || addProblem.isPending || addFeedback.isPending;

  function done(clear: () => void) {
    const sent = draft.type !== "entry" ? `Foi para Registros como ${recordShortName(draft.type).toLowerCase()}.` : quick ? "Anotado na Entrada." : null;
    return {
      onSuccess: () => {
        clear();
        if (sent) toast({ text: sent });
      },
      onError: (error: Error) => toast({ text: errorMessage(error) }),
    };
  }

  function add(body: string, clear: () => void) {
    if (draft.type === "entry") return addEntry.mutate(body, done(clear));
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
      autoFocus={quick}
      onCancel={onCancel}
      chips={<DraftChips draft={draft} today={today} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />}
      onAdd={add}
    />
  );
}
