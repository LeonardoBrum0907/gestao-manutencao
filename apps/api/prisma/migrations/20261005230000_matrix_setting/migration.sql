-- Ajustes da matriz: uma linha só (id "default"), com a aderência mínima para contar como qualificado.

-- CreateTable
CREATE TABLE "MatrixSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "qualifiedAdherence" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "MatrixSetting_pkey" PRIMARY KEY ("id")
);
