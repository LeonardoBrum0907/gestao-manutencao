-- Data de conclusão de tarefa, problema e feedback (Dashboard: concluídas por semana).
ALTER TABLE "Record" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Os já concluídos não têm a hora real: a última edição é a melhor aproximação. Chamado fica de fora (usa closedAt).
UPDATE "Record" SET "completedAt" = "updatedAt" WHERE "status" = 'done' AND "origin" <> 'chamado';

CREATE INDEX "Record_completedAt_idx" ON "Record"("completedAt");
