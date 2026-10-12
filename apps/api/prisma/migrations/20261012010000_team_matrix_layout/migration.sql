-- Disposição da Matriz da equipe salva no sistema (visão, agrupamentos e ordem das colunas arrastadas). Uma linha só, "default".
CREATE TABLE "TeamMatrixLayout" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "view" TEXT NOT NULL DEFAULT 'training',
    "rowGroup" TEXT NOT NULL DEFAULT 'shift',
    "columnGroup" TEXT NOT NULL DEFAULT 'line',
    "columnOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMatrixLayout_pkey" PRIMARY KEY ("id")
);

