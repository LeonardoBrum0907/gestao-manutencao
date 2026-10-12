import type { RecordOrigin, RecordType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { RecordState } from "./record-state";

export type RetypeSubject = {
  type: RecordType;
  origin: RecordOrigin;
  chamadoId: string | null;
  attachments: number;
};

/**
 * Confere se um registro pode virar outro tipo. Só o que nasceu na Entrada troca: problema de chamado,
 * ocorrência ou RP é espelho de outra ficha, e tarefa gerada de chamado continua ligada a ele.
 * Ex.: `assertRetype({ type: "task", origin: "inbox", chamadoId: null, attachments: 0 }, "problem")`
 */
export function assertRetype(subject: RetypeSubject, target: RecordType): void {
  if (subject.type === target) return;
  if (subject.origin !== "inbox") {
    throw new DomainError("retype_origin", 400, `Só registro lançado pela Entrada troca de tipo; este veio de "${subject.origin}".`);
  }
  if (subject.chamadoId) {
    throw new DomainError("retype_chamado", 400, "Esta tarefa foi gerada de um chamado e continua tarefa.");
  }
  if (subject.attachments > 0) {
    throw new DomainError("retype_attachments", 400, `Só a tarefa guarda anexo: tire os ${subject.attachments} anexo(s) antes de trocar o tipo.`);
  }
}

/**
 * Estado com o tipo novo, sem o que só o tipo antigo usa e que a ficha do tipo novo não limpa
 * (tom fora do feedback, máquina e conjunto fora do problema). Feedback e rascunho da Entrada não têm "em andamento".
 * Ex.: `retypeState(task, "feedback")` devolve o feedback aberto, com texto, data e observação da tarefa.
 */
export function retypeState(state: RecordState, target: RecordType): RecordState {
  if (state.type === target) return state;
  const problem = target === "problem";
  return {
    ...state,
    type: target,
    status: (target === "feedback" || target === "entry") && state.status === "in_progress" ? "open" : state.status,
    tone: target === "feedback" ? state.tone : null,
    machineId: problem ? state.machineId : null,
    subassemblyId: problem ? state.subassemblyId : null,
  };
}
