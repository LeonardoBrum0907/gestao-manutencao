-- Técnico vira Colaborador (Member). Tudo é renomeado no lugar: nenhum dado é recriado.

-- Tabelas
ALTER TABLE "Technician" RENAME TO "Member";
ALTER TABLE "TechnicianRole" RENAME TO "MemberRole";
ALTER TABLE "TechnicianGrade" RENAME TO "MemberGrade";
ALTER TABLE "TechnicianMatrixEquipment" RENAME TO "MemberMatrixEquipment";
ALTER TABLE "TechnicianSkill" RENAME TO "MemberSkill";
ALTER TABLE "RecordTechnician" RENAME TO "RecordMember";

-- Colunas
ALTER TABLE "MemberMatrixEquipment" RENAME COLUMN "technicianId" TO "memberId";
ALTER TABLE "MemberSkill" RENAME COLUMN "technicianId" TO "memberId";
ALTER TABLE "RecordMember" RENAME COLUMN "technicianId" TO "memberId";
ALTER TABLE "Record" RENAME COLUMN "technicianId" TO "memberId";

-- Chaves e índices com o nome que o Prisma espera
ALTER TABLE "Member" RENAME CONSTRAINT "Technician_pkey" TO "Member_pkey";
ALTER TABLE "Member" RENAME CONSTRAINT "Technician_roleId_fkey" TO "Member_roleId_fkey";
ALTER TABLE "Member" RENAME CONSTRAINT "Technician_gradeId_fkey" TO "Member_gradeId_fkey";
ALTER INDEX "Technician_roleId_idx" RENAME TO "Member_roleId_idx";
ALTER INDEX "Technician_gradeId_idx" RENAME TO "Member_gradeId_idx";

ALTER TABLE "MemberRole" RENAME CONSTRAINT "TechnicianRole_pkey" TO "MemberRole_pkey";
ALTER INDEX "TechnicianRole_name_key" RENAME TO "MemberRole_name_key";

ALTER TABLE "MemberGrade" RENAME CONSTRAINT "TechnicianGrade_pkey" TO "MemberGrade_pkey";
ALTER INDEX "TechnicianGrade_name_key" RENAME TO "MemberGrade_name_key";

ALTER TABLE "MemberMatrixEquipment" RENAME CONSTRAINT "TechnicianMatrixEquipment_pkey" TO "MemberMatrixEquipment_pkey";
ALTER TABLE "MemberMatrixEquipment" RENAME CONSTRAINT "TechnicianMatrixEquipment_technicianId_fkey" TO "MemberMatrixEquipment_memberId_fkey";

ALTER TABLE "MemberSkill" RENAME CONSTRAINT "TechnicianSkill_pkey" TO "MemberSkill_pkey";
ALTER TABLE "MemberSkill" RENAME CONSTRAINT "TechnicianSkill_technicianId_fkey" TO "MemberSkill_memberId_fkey";

ALTER TABLE "RecordMember" RENAME CONSTRAINT "RecordTechnician_pkey" TO "RecordMember_pkey";
ALTER TABLE "RecordMember" RENAME CONSTRAINT "RecordTechnician_recordId_fkey" TO "RecordMember_recordId_fkey";

-- Referências a técnico já excluído não apontavam para ninguém: saem antes da chave estrangeira.
UPDATE "Record" SET "memberId" = NULL
WHERE "memberId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Member" WHERE "Member"."id" = "Record"."memberId");
DELETE FROM "RecordMember"
WHERE NOT EXISTS (SELECT 1 FROM "Member" WHERE "Member"."id" = "RecordMember"."memberId");

-- Vínculo real: quem aparece em registro não pode ser excluído.
CREATE INDEX "Record_memberId_idx" ON "Record"("memberId");
CREATE INDEX "RecordMember_memberId_idx" ON "RecordMember"("memberId");
ALTER TABLE "Record" ADD CONSTRAINT "Record_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecordMember" ADD CONSTRAINT "RecordMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
