-- Esperado da matriz por grau do colaborador e dificuldade da habilidade. Vazio = padrão da dificuldade (2, 3 e 4).
ALTER TABLE "MemberGrade" ADD COLUMN "expectedBasic" INTEGER;
ALTER TABLE "MemberGrade" ADD COLUMN "expectedIntermediate" INTEGER;
ALTER TABLE "MemberGrade" ADD COLUMN "expectedAdvanced" INTEGER;
