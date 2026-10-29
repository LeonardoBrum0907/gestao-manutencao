import { Inject, Injectable } from "@nestjs/common";
import { nextTask } from "../domain/task-repeat-next";
import { TASK_REPEAT_STORE, type RepeatCandidate, type TaskRepeatStore } from "./task-repeat-ports";

function spawns(found: RepeatCandidate | null): found is RepeatCandidate & { source: NonNullable<RepeatCandidate["source"]> } {
  return found !== null && found.type === "task" && found.status === "done" && !found.hasNext && found.source !== null;
}

/** Tarefas que se repetem (como no Todoist): concluir uma faz nascer a próxima da série. */
@Injectable()
export class TaskRepeats {
  constructor(@Inject(TASK_REPEAT_STORE) private readonly store: TaskRepeatStore) {}

  /**
   * Chamado depois de salvar um registro: se é tarefa concluída com regra e ainda sem a próxima, cria a próxima.
   * Reaberta (o "Desfazer" do concluir), a próxima que ninguém começou some, para a série não ficar com duas abertas.
   * Devolve o id da nova, ou nulo quando nada nasce.
   * @example await repeats.afterSave("t1", new Date()) // "t2"
   */
  async afterSave(id: string, now: Date): Promise<string | null> {
    const found = await this.store.candidate(id);
    if (found && found.status !== "done" && found.hasNext) await this.store.removeOpenNext(id);
    if (!spawns(found)) return null;
    const next = nextTask(found.source, now);
    return next ? this.store.insertNext(id, next, found.source.repeat) : null;
  }
}
