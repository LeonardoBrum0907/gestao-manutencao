-- Documentação técnica por máquina: documentos (PDF no disco de anexos) e fichas de conhecimento com busca.

-- Trigram para a busca "contém" em qualquer parte do texto (código, nº de peça, termo em alemão) usar índice.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "TechDocument" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "revision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechCard" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "equipmentId" TEXT,
    "machineId" TEXT,
    "lineId" TEXT,
    "subassemblyId" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "deviceTag" TEXT,
    "originalTerm" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentId" TEXT,
    "page" INTEGER,
    "sheet" TEXT,
    "reviewNeeded" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TechDocument_storageKey_key" ON "TechDocument"("storageKey");

-- CreateIndex
CREATE INDEX "TechDocument_equipmentId_idx" ON "TechDocument"("equipmentId");

-- CreateIndex
CREATE INDEX "TechCard_equipmentId_idx" ON "TechCard"("equipmentId");

-- CreateIndex
CREATE INDEX "TechCard_machineId_idx" ON "TechCard"("machineId");

-- CreateIndex
CREATE INDEX "TechCard_lineId_idx" ON "TechCard"("lineId");

-- CreateIndex
CREATE INDEX "TechCard_documentId_idx" ON "TechCard"("documentId");

-- CreateIndex
CREATE INDEX "TechCard_type_idx" ON "TechCard"("type");

-- Índice da busca: GIN trigram sobre o texto já normalizado (minúsculas, sem acento).
CREATE INDEX "TechCard_searchText_trgm_idx" ON "TechCard" USING GIN ("searchText" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "TechDocument" ADD CONSTRAINT "TechDocument_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MatrixEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechCard" ADD CONSTRAINT "TechCard_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MatrixEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechCard" ADD CONSTRAINT "TechCard_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechCard" ADD CONSTRAINT "TechCard_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechCard" ADD CONSTRAINT "TechCard_subassemblyId_fkey" FOREIGN KEY ("subassemblyId") REFERENCES "Subassembly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechCard" ADD CONSTRAINT "TechCard_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TechDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
