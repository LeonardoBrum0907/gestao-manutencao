-- Item do PDI pode nascer de uma competência da avaliação de desempenho, além da habilidade da matriz.

-- AlterTable
ALTER TABLE "MemberPdiItem" ADD COLUMN     "competencyId" TEXT;

-- CreateIndex
CREATE INDEX "MemberPdiItem_competencyId_idx" ON "MemberPdiItem"("competencyId");

-- AddForeignKey
ALTER TABLE "MemberPdiItem" ADD CONSTRAINT "MemberPdiItem_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "PerformanceCompetency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
