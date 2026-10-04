-- Comportamento do colaborador e tom do feedback.

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "tone" TEXT;

-- CreateTable
CREATE TABLE "MemberBehavior" (
    "memberId" TEXT NOT NULL,
    "punctuality" TEXT,
    "productivity" TEXT,
    "collaboration" TEXT,
    "tags" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberBehavior_pkey" PRIMARY KEY ("memberId")
);

-- AddForeignKey
ALTER TABLE "MemberBehavior" ADD CONSTRAINT "MemberBehavior_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

