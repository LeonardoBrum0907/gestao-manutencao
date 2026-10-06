-- Itens do PDI formal: ação, prazo, responsável e status, ligados à habilidade da matriz e/ou à máquina.

-- CreateTable
CREATE TABLE "MemberPdiItem" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skillId" TEXT,
    "machineId" TEXT,
    "responsibleId" TEXT,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberPdiItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberPdiItem_memberId_idx" ON "MemberPdiItem"("memberId");

-- CreateIndex
CREATE INDEX "MemberPdiItem_skillId_idx" ON "MemberPdiItem"("skillId");

-- CreateIndex
CREATE INDEX "MemberPdiItem_machineId_idx" ON "MemberPdiItem"("machineId");

-- CreateIndex
CREATE INDEX "MemberPdiItem_responsibleId_idx" ON "MemberPdiItem"("responsibleId");

-- AddForeignKey
ALTER TABLE "MemberPdiItem" ADD CONSTRAINT "MemberPdiItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPdiItem" ADD CONSTRAINT "MemberPdiItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "MatrixSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPdiItem" ADD CONSTRAINT "MemberPdiItem_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPdiItem" ADD CONSTRAINT "MemberPdiItem_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
