import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ReminderDispatch } from "../application/reminder-dispatch";

const TICK_MS = 60 * 1000;

/**
 * Relógio dos lembretes: confere a cada minuto, dentro da própria API (o servidor fica ligado o dia todo;
 * o cron da Vercel foi descartado no desenho dos avisos). Uma volta não começa enquanto a anterior roda.
 */
@Injectable()
export class ReminderClock implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly dispatch: ReminderDispatch) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.turn(), TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async turn(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.dispatch.tick(new Date());
      if (result.due > 0) console.log(JSON.stringify({ event: "reminders_sent", ...result }));
    } catch (error) {
      console.warn(JSON.stringify({ event: "reminders_failed", message: error instanceof Error ? error.message : String(error) }));
    } finally {
      this.running = false;
    }
  }
}
