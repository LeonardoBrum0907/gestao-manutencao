-- Mínimo de técnicos qualificados por equipamento da matriz (0 = sem mínimo).

-- AlterTable
ALTER TABLE "MatrixEquipment" ADD COLUMN     "minQualified" INTEGER NOT NULL DEFAULT 0;
