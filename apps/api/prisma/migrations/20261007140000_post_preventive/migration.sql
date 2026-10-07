-- Pós-preventiva: ocorrência depois de uma preventiva, com ação e ponto de atenção para a próxima.

-- CreateTable
CREATE TABLE "PostPreventive" (
    "id" TEXT NOT NULL,
    "preventiveDate" DATE NOT NULL,
    "occurrenceDate" DATE,
    "machineId" TEXT NOT NULL,
    "subassemblyId" TEXT NOT NULL,
    "done" TEXT NOT NULL,
    "occurrence" TEXT NOT NULL,
    "preventiveAction" TEXT NOT NULL,
    "attentionPoint" TEXT NOT NULL,
    "attentionActive" BOOLEAN NOT NULL DEFAULT true,
    "rpId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostPreventive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostPreventiveMember" (
    "postPreventiveId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PostPreventiveMember_pkey" PRIMARY KEY ("postPreventiveId","memberId")
);

-- CreateIndex
CREATE INDEX "PostPreventive_preventiveDate_id_idx" ON "PostPreventive"("preventiveDate", "id");

-- CreateIndex
CREATE INDEX "PostPreventive_machineId_idx" ON "PostPreventive"("machineId");

-- CreateIndex
CREATE INDEX "PostPreventive_subassemblyId_idx" ON "PostPreventive"("subassemblyId");

-- CreateIndex
CREATE INDEX "PostPreventive_rpId_idx" ON "PostPreventive"("rpId");

-- CreateIndex
CREATE INDEX "PostPreventiveMember_memberId_idx" ON "PostPreventiveMember"("memberId");

-- AddForeignKey
ALTER TABLE "PostPreventive" ADD CONSTRAINT "PostPreventive_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPreventive" ADD CONSTRAINT "PostPreventive_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPreventive" ADD CONSTRAINT "PostPreventive_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "Rp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPreventiveMember" ADD CONSTRAINT "PostPreventiveMember_postPreventiveId_fkey" FOREIGN KEY ("postPreventiveId") REFERENCES "PostPreventive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPreventiveMember" ADD CONSTRAINT "PostPreventiveMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

