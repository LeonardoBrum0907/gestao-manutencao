-- Chamados do turno: turno e máquina do chamado, tarefa gerada a partir dele ("gerar pendência") e RP escrito a partir dele.

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "chamadoId" TEXT,
ADD COLUMN     "machineId" TEXT,
ADD COLUMN     "shift" TEXT;

-- AlterTable
ALTER TABLE "Rp" ADD COLUMN     "chamadoId" TEXT;

-- CreateIndex
CREATE INDEX "Record_machineId_idx" ON "Record"("machineId");

-- CreateIndex
CREATE INDEX "Record_chamadoId_idx" ON "Record"("chamadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Rp_chamadoId_key" ON "Rp"("chamadoId");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rp" ADD CONSTRAINT "Rp_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

