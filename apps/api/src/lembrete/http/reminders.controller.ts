import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { TaskReminders } from "../application/task-reminders";

// Rotas novas dos lembretes. Atrás do login como as demais (SessionGuard global); o "Adiar 1 h" da
// notificação chama a de snooze pelo service worker, com o cookie da sessão do app.
@Controller("api")
export class RemindersController {
  constructor(private readonly reminders: TaskReminders) {}

  @Get("records/:id/reminders")
  list(@Param("id") recordId: string) {
    return this.reminders.list(recordId);
  }

  @Post("records/:id/reminders")
  add(@Param("id") recordId: string, @Body() body: unknown) {
    return this.reminders.add(recordId, body);
  }

  @Delete("reminders/:id")
  async remove(@Param("id") id: string) {
    await this.reminders.remove(id);
    return { ok: true };
  }

  @Post("reminders/:id/snooze")
  @HttpCode(200)
  snooze(@Param("id") id: string) {
    return this.reminders.snooze(id, new Date());
  }
}
