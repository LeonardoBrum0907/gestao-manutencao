import type { TaskRepeat } from "@manutencao/shared";
import type { NextTask } from "../domain/task-repeat-next";
import type { RepeatCandidate, TaskRepeatStore } from "./task-repeat-ports";

/** Tarefas em memória para os testes da repetição. */
export class FakeTaskRepeatStore implements TaskRepeatStore {
  readonly candidates = new Map<string, RepeatCandidate>();
  readonly inserted: { previousId: string; next: NextTask; repeat: TaskRepeat }[] = [];
  readonly removedNextOf: string[] = [];

  async candidate(id: string): Promise<RepeatCandidate | null> {
    return this.candidates.get(id) ?? null;
  }

  async insertNext(previousId: string, next: NextTask, repeat: TaskRepeat): Promise<string | null> {
    this.inserted.push({ previousId, next, repeat });
    const found = this.candidates.get(previousId);
    if (found) this.candidates.set(previousId, { ...found, hasNext: true });
    return `next-of-${previousId}`;
  }

  async removeOpenNext(previousId: string): Promise<boolean> {
    this.removedNextOf.push(previousId);
    const found = this.candidates.get(previousId);
    if (found) this.candidates.set(previousId, { ...found, hasNext: false });
    return true;
  }
}
