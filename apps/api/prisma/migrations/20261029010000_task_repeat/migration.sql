-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "repeat" JSONB,
ADD COLUMN     "repeatOfId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Record_repeatOfId_key" ON "Record"("repeatOfId");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_repeatOfId_fkey" FOREIGN KEY ("repeatOfId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

