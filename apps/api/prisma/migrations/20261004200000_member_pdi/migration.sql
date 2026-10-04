-- PDI do colaborador: máquinas (padrinho e em desenvolvimento) e anexos.

-- CreateTable
CREATE TABLE "MemberMachine" (
    "memberId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "MemberMachine_pkey" PRIMARY KEY ("memberId","machineId","kind")
);

-- CreateTable
CREATE TABLE "MemberAttachment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberMachine_machineId_idx" ON "MemberMachine"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAttachment_storageKey_key" ON "MemberAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "MemberAttachment_memberId_idx" ON "MemberAttachment"("memberId");

-- AddForeignKey
ALTER TABLE "MemberMachine" ADD CONSTRAINT "MemberMachine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMachine" ADD CONSTRAINT "MemberMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberAttachment" ADD CONSTRAINT "MemberAttachment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

