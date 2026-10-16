-- Categoria da habilidade da matriz (mecânico ou eletricista) e a categoria que cada função vê.
-- Só acrescenta: as 222 habilidades do SIGEM são do check list mecânico, então todas entram como "mechanical".
ALTER TABLE "MatrixSkill" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'mechanical';

-- Vazio = a função vê as duas categorias (como era antes). Mecânico e Eletricista já nascem cada um na sua;
-- as outras funções o coordenador escolhe em Configurações › Avaliação › Matriz por função.
-- As notas não mudam: só deixam de contar na aderência de quem é de outra categoria, e voltam se ela mudar.
-- lower() pega "Mecânico" e o "mecânico" que a API recria no boot.
ALTER TABLE "MemberRole" ADD COLUMN "matrixCategory" TEXT;
UPDATE "MemberRole" SET "matrixCategory" = 'mechanical' WHERE lower("name") = 'mecânico';
UPDATE "MemberRole" SET "matrixCategory" = 'electrical' WHERE lower("name") = 'eletricista';
