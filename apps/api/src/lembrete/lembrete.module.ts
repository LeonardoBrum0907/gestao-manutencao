import { Module } from "@nestjs/common";
import { PushDevices } from "../aviso/application/push-devices";
import { AvisoModule } from "../aviso/aviso.module";
import { ReminderDispatch } from "./application/reminder-dispatch";
import { REMINDER_PUSH, REMINDER_STORE } from "./application/reminder-ports";
import { TaskReminders } from "./application/task-reminders";
import { RemindersController } from "./http/reminders.controller";
import { ReminderClock } from "./infra/reminder-clock";
import { ReminderRepository } from "./infra/reminder.repository";

// Lembretes das tarefas: a ficha cria e tira; o relógio confere a cada minuto e manda pelo módulo de avisos.
@Module({
  imports: [AvisoModule],
  controllers: [RemindersController],
  providers: [
    { provide: REMINDER_STORE, useClass: ReminderRepository },
    { provide: REMINDER_PUSH, useExisting: PushDevices },
    TaskReminders,
    ReminderDispatch,
    ReminderClock,
  ],
})
export class LembreteModule {}
