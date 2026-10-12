import type { Prisma, PrismaClient } from "@prisma/client";
import type { RecordStatus } from "@manutencao/shared";
import { completionWrite } from "../domain/completion";

/**
 * Passo de transação que acerta a data de conclusão do registro depois de gravar o status.
 * UPDATE condicional, para não precisar ler a data antiga antes (regra em domain/completion).
 * @example await prisma.$transaction([prisma.record.update(...), completionStep(prisma, id, "done", new Date())])
 */
export function completionStep(
  prisma: Pick<PrismaClient, "record">,
  id: string,
  status: RecordStatus,
  now: Date,
): Prisma.PrismaPromise<Prisma.BatchPayload> {
  if (completionWrite(status) === "clear") {
    return prisma.record.updateMany({ where: { id, completedAt: { not: null } }, data: { completedAt: null } });
  }
  return prisma.record.updateMany({ where: { id, completedAt: null }, data: { completedAt: now } });
}
