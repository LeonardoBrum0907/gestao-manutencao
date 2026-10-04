-- As competências da avaliação de desempenho viram cadastro do coordenador.
-- As 12 do SIGEM entram com o id igual à chave que as notas já usavam, então nenhuma nota muda.

CREATE TABLE "PerformanceCompetency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PerformanceCompetency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerformanceCompetency_name_key" ON "PerformanceCompetency"("name");

INSERT INTO "PerformanceCompetency" ("id", "name", "position") VALUES
  ('safety', 'Segurança', 1),
  ('teamwork', 'Trabalho em equipe', 2),
  ('proactivity', 'Proatividade', 3),
  ('technical_knowledge', 'Conhecimento técnico', 4),
  ('problem_solving', 'Resolução de problemas', 5),
  ('reports', 'Relatórios', 6),
  ('time_logging', 'Apontamento de horas', 7),
  ('order_closing', 'Encerramento de ordens', 8),
  ('log_book', 'Log book', 9),
  ('oee_logging', 'Apontamento OEE', 10),
  ('improvements', 'Melhorias', 11),
  ('communication', 'Comunicação', 12);

-- Nota com chave fora do catálogo não deveria existir (a API só aceitava as 12); se houver, sai antes da chave estrangeira.
DELETE FROM "MemberEvaluation" WHERE "competency" NOT IN (SELECT "id" FROM "PerformanceCompetency");

ALTER TABLE "MemberEvaluation" RENAME COLUMN "competency" TO "competencyId";

CREATE INDEX "MemberEvaluation_competencyId_idx" ON "MemberEvaluation"("competencyId");

ALTER TABLE "MemberEvaluation" ADD CONSTRAINT "MemberEvaluation_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "PerformanceCompetency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
