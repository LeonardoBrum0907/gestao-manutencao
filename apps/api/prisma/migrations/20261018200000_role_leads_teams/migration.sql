-- Cargo e função viram um campo só: a função diz se a pessoa lidera equipe (o antigo cargo Supervisor).
-- Só acrescenta coluna: Member.position continua gravado e certo, então a versão anterior da API roda neste banco.
ALTER TABLE "MemberRole" ADD COLUMN "leadsTeams" BOOLEAN NOT NULL DEFAULT false;

-- Junta as funções repetidas por maiúscula ("mecânico" e "Mecânico"), que a API recriava a cada boot.
-- Fica a que alguém renomeou (tem maiúscula); no empate, a com mais colaboradores e depois o menor id.
CREATE TEMP TABLE "RoleMerge" AS
WITH ranked AS (
  SELECT r."id", lower(r."name") AS "key",
         row_number() OVER (
           PARTITION BY lower(r."name")
           ORDER BY (r."name" <> lower(r."name")) DESC,
                    (SELECT count(*) FROM "Member" m WHERE m."roleId" = r."id") DESC,
                    r."id"
         ) AS "rank"
  FROM "MemberRole" r
)
SELECT dup."id" AS "dupId", keep."id" AS "keepId"
FROM ranked dup
JOIN ranked keep ON keep."key" = dup."key" AND keep."rank" = 1
WHERE dup."rank" > 1;

UPDATE "MemberRole" keep SET "matrixCategory" = dup."matrixCategory"
FROM "RoleMerge" merge JOIN "MemberRole" dup ON dup."id" = merge."dupId"
WHERE keep."id" = merge."keepId" AND keep."matrixCategory" IS NULL AND dup."matrixCategory" IS NOT NULL;
UPDATE "Member" m SET "roleId" = merge."keepId" FROM "RoleMerge" merge WHERE m."roleId" = merge."dupId";
DELETE FROM "MemberRole" WHERE "id" IN (SELECT "dupId" FROM "RoleMerge");
DROP TABLE "RoleMerge";

-- A função Supervisor lidera equipe. Quem tinha o cargo Supervisor passa a ter essa função; a função que
-- tinha antes sai (supervisor não tem matriz nem desempenho, então ela não decidia nada).
UPDATE "MemberRole" SET "leadsTeams" = true WHERE lower("name") = 'supervisor';
INSERT INTO "MemberRole" ("id", "name", "leadsTeams")
SELECT 'funcao-supervisor', 'Supervisor', true
WHERE NOT EXISTS (SELECT 1 FROM "MemberRole" WHERE lower("name") = 'supervisor');
UPDATE "Member" SET "roleId" = (SELECT "id" FROM "MemberRole" WHERE lower("name") = 'supervisor')
WHERE "position" = 'supervisor';

-- Quem já tinha uma função chamada Supervisor sem o cargo vira supervisor, que não entra em equipe como membro.
UPDATE "Member" SET "position" = 'supervisor', "teamId" = NULL
WHERE "position" <> 'supervisor' AND "roleId" IN (SELECT "id" FROM "MemberRole" WHERE "leadsTeams");
