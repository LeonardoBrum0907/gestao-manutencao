-- Repasse entre técnicos (quem ensina e quem aprende) e histórico das notas da matriz.

CREATE TABLE "MemberSkillHistory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "score" INTEGER,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberSkillHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberSkillHistory_memberId_changedAt_idx" ON "MemberSkillHistory"("memberId", "changedAt");
CREATE INDEX "MemberSkillHistory_skillId_idx" ON "MemberSkillHistory"("skillId");

ALTER TABLE "MemberSkillHistory" ADD CONSTRAINT "MemberSkillHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberSkillHistory" ADD CONSTRAINT "MemberSkillHistory_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "MatrixSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Linha de base: a nota atual de cada habilidade vira o primeiro registro, com a data da última mudança.
INSERT INTO "MemberSkillHistory" ("id", "memberId", "skillId", "score", "notApplicable", "changedAt")
SELECT gen_random_uuid()::text, "memberId", "skillId", "score", "notApplicable", "updatedAt"
FROM "MemberSkill";

CREATE TABLE "KnowledgeTransfer" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "equipmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeTransfer_teacherId_idx" ON "KnowledgeTransfer"("teacherId");
CREATE INDEX "KnowledgeTransfer_learnerId_idx" ON "KnowledgeTransfer"("learnerId");

ALTER TABLE "KnowledgeTransfer" ADD CONSTRAINT "KnowledgeTransfer_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeTransfer" ADD CONSTRAINT "KnowledgeTransfer_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
