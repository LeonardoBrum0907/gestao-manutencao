CREATE TABLE "TechnicianGrade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TechnicianGrade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicianGrade_name_key" ON "TechnicianGrade"("name");

ALTER TABLE "Technician" ADD COLUMN "gradeId" TEXT;

CREATE INDEX "Technician_gradeId_idx" ON "Technician"("gradeId");

ALTER TABLE "Technician" ADD CONSTRAINT "Technician_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "TechnicianGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "TechnicianGrade" ("id", "name", "position") VALUES
    ('grade-junior', 'Júnior', 1),
    ('grade-pleno', 'Pleno', 2),
    ('grade-senior', 'Sênior', 3),
    ('grade-especialista', 'Especialista', 4);
