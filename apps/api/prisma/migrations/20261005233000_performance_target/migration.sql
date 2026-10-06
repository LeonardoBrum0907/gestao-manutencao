-- Meta das notas de desempenho (marca do gráfico por competência), junto dos ajustes da matriz.

-- AlterTable
ALTER TABLE "MatrixSetting" ADD COLUMN     "performanceTarget" INTEGER NOT NULL DEFAULT 8;
