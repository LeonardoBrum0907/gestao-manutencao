-- Subconjuntos só de uma máquina e os do modelo que a máquina não tem.
-- O nome do subconjunto deixa de ser único no modelo: dois "só desta máquina" em máquinas diferentes podem ter o mesmo nome;
-- a regra de nome agora fica na aplicação (scopesOverlap em packages/shared).

-- DropIndex
DROP INDEX "Subassembly_equipmentId_name_key";

-- AlterTable
ALTER TABLE "Subassembly" ADD COLUMN     "machineId" TEXT;

-- CreateTable
CREATE TABLE "MachineHiddenSubassembly" (
    "machineId" TEXT NOT NULL,
    "subassemblyId" TEXT NOT NULL,

    CONSTRAINT "MachineHiddenSubassembly_pkey" PRIMARY KEY ("machineId","subassemblyId")
);

-- CreateIndex
CREATE INDEX "MachineHiddenSubassembly_subassemblyId_idx" ON "MachineHiddenSubassembly"("subassemblyId");

-- CreateIndex
CREATE INDEX "Subassembly_equipmentId_idx" ON "Subassembly"("equipmentId");

-- CreateIndex
CREATE INDEX "Subassembly_machineId_idx" ON "Subassembly"("machineId");

-- AddForeignKey
ALTER TABLE "MachineHiddenSubassembly" ADD CONSTRAINT "MachineHiddenSubassembly_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineHiddenSubassembly" ADD CONSTRAINT "MachineHiddenSubassembly_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subassembly" ADD CONSTRAINT "Subassembly_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

