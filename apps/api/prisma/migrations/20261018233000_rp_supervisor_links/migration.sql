-- CreateTable
CREATE TABLE "RpSupervisorLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RpSupervisorLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RpSupervisorLink_code_key" ON "RpSupervisorLink"("code");

-- AlterTable
ALTER TABLE "RpRevision" ADD COLUMN "actorName" TEXT;
