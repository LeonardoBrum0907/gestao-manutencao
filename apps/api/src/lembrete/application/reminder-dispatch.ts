import { Inject, Injectable } from "@nestjs/common";
import { DomainError } from "../../kernel/domain-error";
import { reminderMessage } from "../domain/reminder-message";
import { dueFireAt } from "../domain/reminder-schedule";
import { REMINDER_PUSH, REMINDER_STORE, type ReminderPush, type ReminderStore } from "./reminder-ports";

/** O que o relógio fez numa volta: lembretes que venceram e quantos foram enviados a algum aparelho. */
export type DispatchResult = { due: number; delivered: number };

/** Uma volta do relógio: acha os lembretes que venceram e manda para os aparelhos. */
@Injectable()
export class ReminderDispatch {
  constructor(
    @Inject(REMINDER_STORE) private readonly store: ReminderStore,
    @Inject(REMINDER_PUSH) private readonly push: ReminderPush,
  ) {}

  /**
   * Roda a cada minuto. Marca o toque como enviado mesmo sem aparelho ou com falha, para não repetir a cada volta.
   * @example await dispatch.tick(new Date()) // { due: 1, delivered: 1 }
   */
  async tick(now: Date): Promise<DispatchResult> {
    const candidates = await this.store.candidates();
    let due = 0;
    let delivered = 0;
    for (const candidate of candidates) {
      const fireAt = dueFireAt(candidate, now);
      if (!fireAt) continue;
      due += 1;
      if (await this.send(reminderMessage(candidate.task, candidate.id, now), now)) delivered += 1;
      await this.store.markSent(candidate.id, fireAt);
    }
    return { due, delivered };
  }

  // Sem as chaves VAPID no .env o envio recusa; o lembrete conta como tocado, como sem aparelho inscrito.
  private async send(message: Parameters<ReminderPush["deliver"]>[0], now: Date): Promise<boolean> {
    try {
      return (await this.push.deliver(message, now)).sent > 0;
    } catch (error) {
      if (error instanceof DomainError && error.code === "push_keys") return false;
      throw error;
    }
  }
}
