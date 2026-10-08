-- As opções do comportamento viram cadastro do coordenador.
-- As 13 do SIGEM entram com o id igual à chave que MemberBehavior.tags já guardava, então nenhuma ficha muda.

CREATE TABLE "BehaviorTag" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BehaviorTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BehaviorTag_group_name_key" ON "BehaviorTag"("group", "name");

INSERT INTO "BehaviorTag" ("id", "group", "name", "position") VALUES
  ('proactive', 'strengths', 'Proativo', 1),
  ('communicates', 'strengths', 'Comunica bem', 2),
  ('meets_deadlines', 'strengths', 'Cumpre prazos', 3),
  ('organized', 'strengths', 'Organizado', 4),
  ('teamwork', 'strengths', 'Trabalho em equipe', 5),
  ('solves_problems', 'strengths', 'Resolve problemas', 6),
  ('missed_deadlines', 'attention', 'Prazos perdidos', 1),
  ('poor_communication', 'attention', 'Falta comunicação', 2),
  ('frequent_rework', 'attention', 'Retrabalho frequente', 3),
  ('stale_tasks', 'attention', 'Pendências sem atualização', 4),
  ('adapting', 'situation', 'Em adaptação', 1),
  ('new_to_team', 'situation', 'Novo na equipe', 2),
  ('under_supervision', 'situation', 'Sob supervisão', 3);
