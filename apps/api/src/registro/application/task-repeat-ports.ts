import type { RecordStatus, RecordType } from "@manutencao/shared";
import type { NextTask, RepeatSource } from "../domain/task-repeat-next";

/** O registro recém-salvo, visto pela repetição: sem regra, source é nulo. */
export type RepeatCandidate = {
  type: RecordType;
  status: RecordStatus;
  // Já nasceu a próxima desta tarefa (concluída antes, reaberta e concluída de novo).
  hasNext: boolean;
  source: RepeatSource | null;
};

export interface TaskRepeatStore {
  candidate(id: string): Promise<RepeatCandidate | null>;
  /** Grava a próxima ligada à anterior; nulo se outra gravação já fez nascer a próxima. */
  insertNext(previousId: string, next: NextTask, repeat: RepeatSource["repeat"]): Promise<string | null>;
  /** Apaga a próxima se ela ainda está aberta e sem anexo; diz se apagou. */
  removeOpenNext(previousId: string): Promise<boolean>;
}

export const TASK_REPEAT_STORE = Symbol("TASK_REPEAT_STORE");
