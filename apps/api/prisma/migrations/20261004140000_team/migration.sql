-- Cargo do colaborador (todo mundo que já existe é técnico) e equipes com supervisor.

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'technician',
ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "roleId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "supervisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Team_supervisorId_idx" ON "Team"("supervisorId");

-- CreateIndex
CREATE INDEX "Member_teamId_idx" ON "Member"("teamId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

