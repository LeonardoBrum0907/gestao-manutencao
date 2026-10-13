import { useState } from "react";
import { TRANSFER_SUGGEST_BELOW_PERCENT, type MemberDto, type TransferCandidateDto, type TransferSuggestionDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Modal, MultiSelect, Notice, SelectInput } from "../../../design/ui/controls";
import { useMembers } from "../../cadastro/data/cadastro";
import { useCreateTransfer, useTransferSuggestions } from "../data/transfers";
import { progressLabel, shortName } from "../model/transfer-view";
import { PickedLearner } from "./PickedLearner";
import { TransferBar } from "./TransferBar";

// Quem pode ensinar ou aprender: técnicos que não foram desligados.
function technicians(members: MemberDto[] | undefined): MemberDto[] {
  return (members ?? []).filter((member) => member.position === "technician" && member.status !== "inactive");
}

// Embaixo do nome: com quem a pessoa já aprende (N:N), senão a equipe.
function candidateNote(candidate: TransferCandidateDto): string {
  if (candidate.withTeacher) return "já aprende com esta pessoa";
  if (candidate.learningFrom.length) return `também aprende com ${candidate.learningFrom.map(shortName).join(", ")}`;
  return candidate.member.teamName ?? "Sem equipe";
}

function CandidateRow({ candidate, checked, onPick }: { candidate: TransferCandidateDto; checked: boolean; onPick: () => void }) {
  const busy = candidate.withTeacher;
  return (
    <label className={`flex items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0 ${busy ? "opacity-60" : "cursor-pointer hover:bg-chip"}`}>
      <input type="radio" name="learner" checked={checked} disabled={busy} onChange={onPick} className="accent-[var(--accent)]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-app">{candidate.member.name}</span>
        <span className="block text-xs text-muted">{candidateNote(candidate)}</span>
      </span>
      <TransferBar percent={candidate.progress.percent} className="w-16" />
      <span className="w-20 text-right text-xs tabular-nums text-muted">já faz {progressLabel(candidate.progress)}</span>
    </label>
  );
}

function MasteredLine({ suggestion, teacherName }: { suggestion: TransferSuggestionDto; teacherName: string }) {
  if (suggestion.mastered === 0) {
    return <p className="text-sm text-danger">{shortName(teacherName)} ainda não tem nota 3 ou 4 nesses equipamentos.</p>;
  }
  return (
    <p className="text-sm text-muted">
      {shortName(teacherName)} domina <span className="font-semibold text-app">{suggestion.mastered}</span> habilidades nesses equipamentos.
    </p>
  );
}

// learnerId e equipmentIds vêm preenchidos no repasse rápido da Matriz da equipe.
type Props = { teacherId: string; learnerId?: string; equipmentIds?: string[]; onClose: () => void; onCreated: (id: string) => void };

/** Janela "Novo repasse": quem ensina, o foco e quem aprende, com a sugestão de quem já faz mais. */
export function NewTransferModal(props: Props) {
  const members = useMembers();
  const [teacherId, setTeacherId] = useState(props.teacherId);
  const [equipmentIds, setEquipmentIds] = useState<string[] | null>(props.equipmentIds?.length ? props.equipmentIds : null);
  const [learnerId, setLearnerId] = useState(props.learnerId ?? "");
  const [learnerPicked, setLearnerPicked] = useState(Boolean(props.learnerId));
  const suggestions = useTransferSuggestions(teacherId, equipmentIds);
  const create = useCreateTransfer();
  const people = technicians(members.data);
  const teacherName = people.find((member) => member.id === teacherId)?.name ?? "";
  const suggestion = suggestions.data?.teacherId === teacherId ? suggestions.data : undefined;
  const pairOpen = learnerPicked && Boolean(suggestion?.candidates.find((candidate) => candidate.member.id === learnerId)?.withTeacher);

  function pickTeacher(id: string) {
    setTeacherId(id);
    setEquipmentIds(null);
    setLearnerId("");
    setLearnerPicked(false);
  }
  function changeLearner() {
    setLearnerId("");
    setLearnerPicked(false);
  }
  function submit() {
    create.mutate({ teacherId, learnerId, equipmentIds: suggestion?.equipmentIds ?? [] }, { onSuccess: (created) => props.onCreated(created.id) });
  }

  return (
    <Modal open title="Novo repasse" onClose={props.onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Ensina">
          <SelectInput value={teacherId} onChange={(event) => pickTeacher(event.target.value)} searchable>
            <option value="">Escolha um técnico</option>
            {people.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        {suggestion ? (
          <FocusAndLearner
            suggestion={suggestion}
            teacherName={teacherName}
            learner={{ id: learnerId, name: people.find((member) => member.id === learnerId)?.name ?? "", picked: learnerPicked }}
            onFocus={setEquipmentIds}
            onLearner={setLearnerId}
            onChangeLearner={changeLearner}
          />
        ) : null}
        {suggestions.isError ? <Notice>{errorMessage(suggestions.error)}</Notice> : null}
        {create.isError ? <Notice>{errorMessage(create.error)}</Notice> : null}
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button disabled={!teacherId || !learnerId || pairOpen || create.isPending} onClick={submit}>
            {create.isPending ? "Criando…" : "Criar repasse"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type FocusProps = {
  suggestion: TransferSuggestionDto;
  teacherName: string;
  // picked: escolhido no clique da Matriz da equipe; aparece sozinho, sem a lista de sugestões.
  learner: { id: string; name: string; picked: boolean };
  onFocus: (ids: string[]) => void;
  onLearner: (id: string) => void;
  onChangeLearner: () => void;
};

function FocusAndLearner({ suggestion, teacherName, learner, onFocus, onLearner, onChangeLearner }: FocusProps) {
  const options = suggestion.teacherEquipments.map((item) => ({ value: item.id, label: item.name }));
  // Foco vazio não faz sentido (o servidor voltaria para a matriz inteira): fica ao menos um equipamento.
  const changeFocus = (next: string[]) => {
    if (next.length) onFocus(next);
  };
  return (
    <>
      <MultiSelect label="Equipamentos em foco" options={options} value={suggestion.equipmentIds} onChange={changeFocus} emptyText="Sem equipamentos na matriz." />
      <MasteredLine suggestion={suggestion} teacherName={teacherName} />
      {suggestion.mastered > 0 && learner.picked ? (
        <PickedLearner
          candidate={suggestion.candidates.find((candidate) => candidate.member.id === learner.id)}
          learnerName={learner.name}
          teacherName={teacherName}
          onChange={onChangeLearner}
        />
      ) : null}
      {suggestion.mastered > 0 && !learner.picked ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-app">Aprende</p>
          <div className="max-h-60 overflow-y-auto rounded-control border border-line">
            {suggestion.candidates.map((candidate) => (
              <CandidateRow key={candidate.member.id} candidate={candidate} checked={learner.id === candidate.member.id} onPick={() => onLearner(candidate.member.id)} />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">Quem já faz {TRANSFER_SUGGEST_BELOW_PERCENT}% ou mais não aparece.</p>
        </div>
      ) : null}
    </>
  );
}
