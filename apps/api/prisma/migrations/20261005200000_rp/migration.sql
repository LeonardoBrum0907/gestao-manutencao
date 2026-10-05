-- CreateTable
CREATE TABLE "Rp" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT,
    "orderKey" TEXT,
    "factoryId" TEXT NOT NULL,
    "machineId" TEXT,
    "line" TEXT,
    "tag" TEXT,
    "problem" TEXT NOT NULL,
    "problemKey" TEXT NOT NULL,
    "description" TEXT,
    "repeatedFailure" BOOLEAN NOT NULL DEFAULT false,
    "repeatedTimes" TEXT,
    "repeatedPeriod" TEXT,
    "causeMaterial" BOOLEAN NOT NULL DEFAULT false,
    "materialText" TEXT,
    "causeMachine" BOOLEAN NOT NULL DEFAULT false,
    "machineText" TEXT,
    "causeMethod" BOOLEAN NOT NULL DEFAULT false,
    "methodText" TEXT,
    "causeLabor" BOOLEAN NOT NULL DEFAULT false,
    "laborText" TEXT,
    "rootCause" TEXT,
    "corrective" TEXT,
    "preventive" TEXT,
    "status" TEXT NOT NULL,
    "basicConditionImpact" TEXT,
    "unmatchedTechnicians" TEXT,
    "rawText" TEXT NOT NULL,
    "problemRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpMember" (
    "rpId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RpMember_pkey" PRIMARY KEY ("rpId","memberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rp_problemRecordId_key" ON "Rp"("problemRecordId");

-- CreateIndex
CREATE INDEX "Rp_occurredAt_id_idx" ON "Rp"("occurredAt", "id");

-- CreateIndex
CREATE INDEX "Rp_machineId_idx" ON "Rp"("machineId");

-- CreateIndex
CREATE INDEX "Rp_status_idx" ON "Rp"("status");

-- CreateIndex
CREATE INDEX "Rp_orderKey_idx" ON "Rp"("orderKey");

-- CreateIndex
CREATE INDEX "Rp_tag_idx" ON "Rp"("tag");

-- CreateIndex
CREATE INDEX "RpMember_memberId_idx" ON "RpMember"("memberId");

-- AddForeignKey
ALTER TABLE "Rp" ADD CONSTRAINT "Rp_problemRecordId_fkey" FOREIGN KEY ("problemRecordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpMember" ADD CONSTRAINT "RpMember_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "Rp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpMember" ADD CONSTRAINT "RpMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

