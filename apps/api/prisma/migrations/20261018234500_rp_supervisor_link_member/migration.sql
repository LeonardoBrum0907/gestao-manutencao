-- AlterTable
ALTER TABLE "RpSupervisorLink" ADD COLUMN "memberId" TEXT;

-- CreateIndex
CREATE INDEX "RpSupervisorLink_memberId_idx" ON "RpSupervisorLink"("memberId");

-- AddForeignKey
ALTER TABLE "RpSupervisorLink" ADD CONSTRAINT "RpSupervisorLink_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
