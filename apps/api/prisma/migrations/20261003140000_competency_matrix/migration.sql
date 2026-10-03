CREATE TABLE "TechnicianMatrixEquipment" (
    "technicianId" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,

    CONSTRAINT "TechnicianMatrixEquipment_pkey" PRIMARY KEY ("technicianId","equipment")
);

CREATE TABLE "TechnicianSkill" (
    "technicianId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "score" INTEGER,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "expected" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianSkill_pkey" PRIMARY KEY ("technicianId","skillId")
);

ALTER TABLE "TechnicianMatrixEquipment" ADD CONSTRAINT "TechnicianMatrixEquipment_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
