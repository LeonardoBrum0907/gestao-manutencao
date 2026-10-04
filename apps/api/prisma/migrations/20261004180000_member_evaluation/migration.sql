-- Avaliação de desempenho: nota por competência, trimestre e ano.

-- CreateTable
CREATE TABLE "MemberEvaluation" (
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "competency" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberEvaluation_pkey" PRIMARY KEY ("memberId","year","quarter","competency")
);

-- AddForeignKey
ALTER TABLE "MemberEvaluation" ADD CONSTRAINT "MemberEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

