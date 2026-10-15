-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "dueHasTime" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TaskReminder" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "at" TIMESTAMP(3),
    "minutesBefore" INTEGER,
    "snoozedUntil" TIMESTAMP(3),
    "sentFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReminder_recordId_idx" ON "TaskReminder"("recordId");

-- AddForeignKey
ALTER TABLE "TaskReminder" ADD CONSTRAINT "TaskReminder_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

