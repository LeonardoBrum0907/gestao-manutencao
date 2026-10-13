import { TRANSFER_SUGGEST_BELOW_PERCENT, type TransferCandidateDto } from "@manutencao/shared";
import { progressLabel, shortName } from "../model/transfer-view";
import { TransferBar } from "./TransferBar";

type Props = { candidate: TransferCandidateDto | undefined; learnerName: string; teacherName: string; onChange: () => void };

// Quem aprende já escolhido no repasse rápido (clique na Matriz da equipe), no lugar da lista de sugestões.
// Fora da lista de candidatos é quem já faz 90% ou mais: dá para criar mesmo assim, só avisa.
function PickedNote({ candidate, learnerName, teacherName }: Omit<Props, "onChange">) {
  if (!candidate) {
    return (
      <span className="block text-xs text-pill-warn-text">
        já faz {TRANSFER_SUGGEST_BELOW_PERCENT}% ou mais do que {shortName(teacherName)} domina nesses equipamentos
      </span>
    );
  }
  if (candidate.withTeacher) return <span className="block text-xs text-danger">{shortName(learnerName)} já aprende com {shortName(teacherName)} num repasse em andamento</span>;
  return <span className="block text-xs text-muted">já faz {progressLabel(candidate.progress)}</span>;
}

/** Linha de quem aprende escolhido, com "Trocar" para voltar à lista de sugestões. */
export function PickedLearner(props: Props) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-app">Aprende</p>
      <div className="flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-app">{props.learnerName}</span>
          <PickedNote candidate={props.candidate} learnerName={props.learnerName} teacherName={props.teacherName} />
        </span>
        {props.candidate ? <TransferBar percent={props.candidate.progress.percent} className="w-16" /> : null}
        <button type="button" className="text-sm font-medium text-accent hover:underline" onClick={props.onChange}>
          Trocar
        </button>
      </div>
    </div>
  );
}
