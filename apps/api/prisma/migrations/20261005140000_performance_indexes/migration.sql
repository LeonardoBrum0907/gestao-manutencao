-- DropIndex
DROP INDEX "Record_type_status_idx";

-- DropIndex
DROP INDEX "Record_dueAt_idx";

-- CreateIndex
CREATE INDEX "Record_type_status_dueAt_idx" ON "Record"("type", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Record_machineId_idx" ON "Record"("machineId");

-- CreateIndex
CREATE INDEX "Record_occurredAt_id_idx" ON "Record"("occurredAt", "id");

-- CreateIndex
CREATE INDEX "Record_createdAt_idx" ON "Record"("createdAt");
