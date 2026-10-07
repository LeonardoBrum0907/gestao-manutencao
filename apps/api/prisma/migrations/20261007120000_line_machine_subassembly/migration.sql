-- O cadastro "Machine" guardava as linhas (CAM 08, MED 02). Vira "Line" com os mesmos ids,
-- e "Machine" volta como o equipamento de cada linha. Subconjunto pertence ao modelo (equipamento da matriz).

-- Linha: renomeia a tabela antiga mantendo ids e dados.
ALTER TABLE "Machine" RENAME TO "Line";
ALTER TABLE "Line" RENAME CONSTRAINT "Machine_pkey" TO "Line_pkey";
ALTER TABLE "Line" RENAME CONSTRAINT "Machine_factoryId_fkey" TO "Line_factoryId_fkey";
ALTER INDEX "Machine_factoryId_idx" RENAME TO "Line_factoryId_idx";

-- Linhas do PDI do colaborador.
ALTER TABLE "MemberMachine" RENAME TO "MemberLine";
ALTER TABLE "MemberLine" RENAME COLUMN "machineId" TO "lineId";
ALTER TABLE "MemberLine" RENAME CONSTRAINT "MemberMachine_pkey" TO "MemberLine_pkey";
ALTER TABLE "MemberLine" RENAME CONSTRAINT "MemberMachine_memberId_fkey" TO "MemberLine_memberId_fkey";
ALTER TABLE "MemberLine" RENAME CONSTRAINT "MemberMachine_machineId_fkey" TO "MemberLine_lineId_fkey";
ALTER INDEX "MemberMachine_machineId_idx" RENAME TO "MemberLine_lineId_idx";

-- Item do PDI.
ALTER TABLE "MemberPdiItem" RENAME COLUMN "machineId" TO "lineId";
ALTER TABLE "MemberPdiItem" RENAME CONSTRAINT "MemberPdiItem_machineId_fkey" TO "MemberPdiItem_lineId_fkey";
ALTER INDEX "MemberPdiItem_machineId_idx" RENAME TO "MemberPdiItem_lineId_idx";

-- Registro (Tarefa, Problema, Chamado).
ALTER TABLE "Record" RENAME COLUMN "machineId" TO "lineId";
ALTER TABLE "Record" RENAME COLUMN "machineLabel" TO "lineLabel";
ALTER INDEX "Record_machineId_idx" RENAME TO "Record_lineId_idx";

-- RP.
ALTER TABLE "Rp" RENAME COLUMN "machineId" TO "lineId";
ALTER INDEX "Rp_machineId_idx" RENAME TO "Rp_lineId_idx";

-- Máquina: equipamento da linha, começa vazia.
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "manufacturer" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Machine_lineId_idx" ON "Machine"("lineId");
CREATE INDEX "Machine_equipmentId_idx" ON "Machine"("equipmentId");
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MatrixEquipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subconjunto do modelo de equipamento.
CREATE TABLE "Subassembly" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subassembly_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subassembly_equipmentId_name_key" ON "Subassembly"("equipmentId", "name");
ALTER TABLE "Subassembly" ADD CONSTRAINT "Subassembly_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MatrixEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ponto de partida: os subgrupos que a matriz de habilidades já usa em cada equipamento, na ordem em que aparecem.
INSERT INTO "Subassembly" ("id", "equipmentId", "name", "position", "updatedAt")
SELECT
  'sub_' || md5("equipmentId" || '|' || "name"),
  "equipmentId",
  "name",
  ROW_NUMBER() OVER (PARTITION BY "equipmentId" ORDER BY "first", "name"),
  CURRENT_TIMESTAMP
FROM (
  SELECT "equipmentId", btrim("subgroup") AS "name", MIN("position") AS "first"
  FROM "MatrixSkill"
  WHERE btrim("subgroup") <> ''
  GROUP BY "equipmentId", btrim("subgroup")
) AS "groups";
