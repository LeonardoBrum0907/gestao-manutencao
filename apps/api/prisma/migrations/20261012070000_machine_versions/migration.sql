-- Versões de modelo (M092, NMX) e subconjuntos por versão ou por máquina, com os do modelo que a máquina não tem.
-- O nome do subconjunto deixa de ser único no modelo: dois "só desta máquina" em máquinas diferentes podem ter o mesmo nome;
-- a regra de nome agora fica na aplicação (scopesOverlap em packages/shared).

-- DropIndex
DROP INDEX "Subassembly_equipmentId_name_key";

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "versionId" TEXT;

-- AlterTable
ALTER TABLE "Subassembly" ADD COLUMN     "machineId" TEXT,
ADD COLUMN     "versionId" TEXT;

-- CreateTable
CREATE TABLE "EquipmentVersion" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineHiddenSubassembly" (
    "machineId" TEXT NOT NULL,
    "subassemblyId" TEXT NOT NULL,

    CONSTRAINT "MachineHiddenSubassembly_pkey" PRIMARY KEY ("machineId","subassemblyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentVersion_equipmentId_name_key" ON "EquipmentVersion"("equipmentId", "name");

-- CreateIndex
CREATE INDEX "MachineHiddenSubassembly_subassemblyId_idx" ON "MachineHiddenSubassembly"("subassemblyId");

-- CreateIndex
CREATE INDEX "Machine_versionId_idx" ON "Machine"("versionId");

-- CreateIndex
CREATE INDEX "Subassembly_equipmentId_idx" ON "Subassembly"("equipmentId");

-- CreateIndex
CREATE INDEX "Subassembly_versionId_idx" ON "Subassembly"("versionId");

-- CreateIndex
CREATE INDEX "Subassembly_machineId_idx" ON "Subassembly"("machineId");

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EquipmentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentVersion" ADD CONSTRAINT "EquipmentVersion_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MatrixEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineHiddenSubassembly" ADD CONSTRAINT "MachineHiddenSubassembly_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineHiddenSubassembly" ADD CONSTRAINT "MachineHiddenSubassembly_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subassembly" ADD CONSTRAINT "Subassembly_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EquipmentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subassembly" ADD CONSTRAINT "Subassembly_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

