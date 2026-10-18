-- Página pública de RPs (sem login). Só acrescenta: a versão anterior da API roda neste banco.
-- Todo RP que já existe veio do app do coordenador: entra como "paste".
ALTER TABLE "Rp" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'paste';
ALTER TABLE "Rp" ADD COLUMN "checkedAt" TIMESTAMP(3);
ALTER TABLE "Rp" ADD COLUMN "reviewRequest" TEXT;
ALTER TABLE "Rp" ADD COLUMN "reviewRequestedAt" TIMESTAMP(3);
CREATE INDEX "Rp_source_idx" ON "Rp"("source");

-- Ninguém aparece no formulário público até o coordenador ligar na ficha do colaborador.
ALTER TABLE "Member" ADD COLUMN "publicRp" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "RpPublicLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RpPublicLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RpPublicLink_code_key" ON "RpPublicLink"("code");

CREATE TABLE "RpRevision" (
    "id" TEXT NOT NULL,
    "rpId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RpRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RpRevision_rpId_createdAt_idx" ON "RpRevision"("rpId", "createdAt");
ALTER TABLE "RpRevision" ADD CONSTRAINT "RpRevision_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "Rp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
