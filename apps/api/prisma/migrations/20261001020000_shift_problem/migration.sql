ALTER TABLE "Record" ADD COLUMN "dayNumber" INTEGER,
ADD COLUMN "openedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "durationMin" INTEGER;

CREATE TABLE "RecordTechnician" (
    "recordId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RecordTechnician_pkey" PRIMARY KEY ("recordId","technicianId")
);

ALTER TABLE "RecordTechnician" ADD CONSTRAINT "RecordTechnician_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
