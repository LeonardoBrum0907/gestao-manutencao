-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "subassemblyId" TEXT;

-- AlterTable
ALTER TABLE "Rp" ADD COLUMN     "machineId" TEXT,
ADD COLUMN     "subassemblyId" TEXT;

-- CreateIndex
CREATE INDEX "Record_subassemblyId_idx" ON "Record"("subassemblyId");

-- CreateIndex
CREATE INDEX "Rp_machineId_idx" ON "Rp"("machineId");

-- CreateIndex
CREATE INDEX "Rp_subassemblyId_idx" ON "Rp"("subassemblyId");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rp" ADD CONSTRAINT "Rp_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rp" ADD CONSTRAINT "Rp_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

