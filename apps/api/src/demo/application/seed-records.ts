import { demoMoment } from "../domain/demo-calendar";
import { demoCatalog, demoMachineModel } from "../domain/demo-catalog";
import type { DemoChamado } from "../domain/demo-chamados";
import { DEMO_ENTRIES, DEMO_FEEDBACKS, DEMO_PROBLEMS, DEMO_TASKS, type DemoProblem, type DemoTask } from "../domain/demo-records";
import type { DemoDatabase, DemoIds, DemoServices } from "./demo-services";

type RecordsContext = { services: DemoServices; database: DemoDatabase; ids: DemoIds; today: Date };

// Registros escritos durante o expediente: o horário das datas relativas.
const WORK_HOUR = 9;
// Prazo só com dia vale ao meio-dia de Brasília (Record.dueHasTime no schema).
const DUE_HOUR = 12;

/**
 * Chamados do turno (com as pendências geradas deles), tarefas, feedbacks, problemas e rascunhos da Entrada.
 * @example await seedRecords({ services, database, ids, today }, demoChamados(today, random, catalog, people))
 */
export async function seedRecords(context: RecordsContext, chamados: DemoChamado[]): Promise<void> {
  for (const chamado of chamados) await seedChamado(context, chamado);
  for (const task of DEMO_TASKS) await seedTask(context, task);
  for (const feedback of DEMO_FEEDBACKS) {
    const occurredAt = demoMoment(context.today, feedback.daysAgo, WORK_HOUR + 7).toISOString();
    await context.services.records.capture({ type: "feedback", body: feedback.body, occurredAt, memberId: context.ids.get("person", feedback.member), tone: feedback.tone });
  }
  for (const problem of DEMO_PROBLEMS) await seedProblem(context, problem);
  for (const entry of DEMO_ENTRIES) {
    await context.services.records.capture({ type: "entry", body: entry.body, occurredAt: demoMoment(context.today, entry.daysAgo, 7, 30).toISOString() });
  }
}

async function seedChamado({ services, ids, today }: RecordsContext, chamado: DemoChamado): Promise<void> {
  const created = await services.chamados.open({
    body: chamado.body,
    openedAt: chamado.openedAt.toISOString(),
    closedAt: chamado.closedAt?.toISOString() ?? null,
    shift: chamado.shift,
    memberIds: chamado.members.map((member) => ids.get("person", member)),
    lineId: ids.get("line", chamado.line),
    machineId: ids.get("machine", chamado.machine),
    status: chamado.status,
    notes: chamado.notes,
  });
  if (!chamado.task) return;
  const { task } = chamado;
  const dueAt = demoMoment(today, -task.dueInDays, DUE_HOUR).toISOString();
  await services.chamados.addTask(created.id, { body: task.body, dueAt, memberId: ids.get("person", task.member), priority: task.priority }, chamado.closedAt ?? chamado.openedAt);
}

async function seedTask({ services, database, ids, today }: RecordsContext, task: DemoTask): Promise<void> {
  const occurredAt = demoMoment(today, task.daysAgo, WORK_HOUR).toISOString();
  const memberId = ids.optional("person", task.member);
  const { id } = await services.records.capture({ type: "task", body: task.body, occurredAt, memberId });
  await services.records.updateSheet(id, {
    body: task.body,
    occurredAt,
    status: task.doneDaysAgo === null ? "open" : "done",
    memberId,
    priority: task.priority,
    dueAt: task.dueInDays === null ? null : demoMoment(today, -task.dueInDays, DUE_HOUR).toISOString(),
    dueHasTime: false,
  });
  if (task.doneDaysAgo !== null) await database.setCompletedAt(id, demoMoment(today, task.doneDaysAgo, 16));
}

async function seedProblem({ services, ids, today }: RecordsContext, problem: DemoProblem): Promise<void> {
  const occurredAt = demoMoment(today, problem.daysAgo, WORK_HOUR + 2).toISOString();
  const memberId = ids.optional("person", problem.member);
  const { id } = await services.records.capture({ type: "problem", body: problem.body, occurredAt, memberId });
  const model = demoMachineModel(demoCatalog(), problem.machine);
  await services.records.updateSheet(id, {
    body: problem.body,
    occurredAt,
    memberId,
    lineId: ids.get("line", problem.line),
    machineId: ids.get("machine", problem.machine),
    subassemblyId: ids.get("subassembly", `${model}|${problem.subassembly}`),
  });
}
