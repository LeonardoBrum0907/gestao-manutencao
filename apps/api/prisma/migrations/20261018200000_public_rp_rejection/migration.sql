-- Supervisor recusa RP na página pública. Só acrescenta colunas opcionais: a versão anterior da API roda neste banco.
ALTER TABLE "Rp" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Rp" ADD COLUMN "rejectionNote" TEXT;
