# Regras para agentes

Monorepo pnpm em TypeScript: `apps/api` (NestJS + Prisma), `apps/web` (Vite + React) e `packages/shared`.

Duas partes. **Código novo** vale para tudo que você escreve ou altera. **Código existente** diz como mexer no que já está aqui, que é anterior a estas regras.

Base: "Clean Code para agentes de IA" de Fabio Akita (akitaonrails.com/2026/04/20/clean-code-para-agentes-de-ia), adaptado para TypeScript, mais a regra do escoteiro (Uncle Bob) e testes de caracterização e seams (Michael Feathers).

## Comandos

- Testes: `pnpm test` na raiz. Builda `packages/shared` e roda os `*.spec.ts` do shared, da API e do web com `tsx --test`. No web só as regras puras em `model/` têm teste (os `*.spec.ts` ficam fora do `tsconfig` do web).
- Tipos da API: `pnpm --filter @manutencao/api exec tsc -p tsconfig.json --noEmit`
- Tipos do web: `pnpm --filter @manutencao/web exec tsc -p tsconfig.json --noEmit`
- Build de tudo: `pnpm build`

# Código novo

## Estilo

- Funções: de 4 a 20 linhas. Passou disso, divida.
- Arquivos: abaixo de 500 linhas. Divida por responsabilidade.
- Uma coisa por função, uma responsabilidade por módulo (SRP).
- Nomes específicos e únicos. Evite `data`, `handler`, `Manager`. Prefira nomes que deem menos de 5 resultados num grep no repositório.
- Tipos explícitos. `strict: true` já está ligado nos três `tsconfig.json`. Sem `any`, sem export sem tipo.
- Sem duplicação. Lógica repetida vira função ou módulo compartilhado (o que API e web usam juntos vai para `packages/shared`).
- Retorno antecipado em vez de `if` aninhado. No máximo 2 níveis de indentação.
- Mensagens de erro trazem o valor recebido e o formato esperado.

## Comentários

- Mantenha os seus comentários ao refatorar: eles guardam intenção e origem.
- Escreva o PORQUÊ, não o QUÊ. Nada de `// incrementa o contador` em cima de `i++`.
- TSDoc nas funções exportadas: a intenção e um exemplo de uso.
- Cite o número do PR ou o SHA do commit quando uma linha existe por causa de um bug específico ou de uma limitação externa.

## Testes

- Rodam com um comando só: `pnpm test`.
- Toda função nova ganha teste. Correção de bug ganha teste de regressão.
- I/O externo (API, banco, sistema de arquivos) é substituído por classes falsas com nome (`FakeRecordRepository`), não por stubs inline.
- Testes F.I.R.S.T.: rápidos, independentes, repetíveis, autoverificáveis e escritos junto com o código.

## Dependências

- Injete dependências pelo construtor ou por parâmetro, não por variável global ou import direto.
- Bibliotecas de terceiros ficam atrás de uma interface fina deste projeto (como os repositórios em `apps/api/src/*/infra` fazem com o Prisma).

## Estrutura

- Siga a convenção do framework: módulos NestJS na API, componentes e hooks React no web.
- Prefira módulos pequenos e focados a arquivos-deus.
- Caminhos previsíveis, seguindo o que já existe:
  - API: `apps/api/src/<módulo>/{domain,application,http,infra}`, com o `<módulo>.module.ts` na raiz do módulo.
  - Web: `apps/web/src/modules/<módulo>/{data,model,ui}`; componentes reutilizáveis em `apps/web/src/design/ui`.
  - Testes ficam ao lado do arquivo testado, com o mesmo nome e `.spec.ts`.

## Formatação

- O repositório não tem prettier nem eslint. Siga o estilo do arquivo que estiver editando e não discuta estilo além disso.

## Logs

- JSON estruturado quando o log for para depuração ou observabilidade.
- Texto simples só para saída de linha de comando voltada a pessoas (`scripts/`, `apps/api/scripts/`).

# Código existente

## Regra de ouro

- Este código é anterior a estas regras. Não conserte tudo de uma vez.
- Deixe cada arquivo que você tocar um pouco mais limpo do que encontrou.
- Refatore só o código ligado à tarefa atual. Nada de reescrever de passagem.
- **Nunca** misture refatoração e mudança de comportamento no mesmo commit.

## Rede de segurança primeiro

- Antes de mudar código antigo, escreva testes de caracterização que travem o comportamento atual, mesmo que ele pareça errado.
- Se o código não dá para testar, crie primeiro um seam: extraia uma função ou injete a dependência. Depois teste, depois refatore.
- Os testes passam **antes e depois** de cada passo: `pnpm test`.
- Achou um bug? Registre com um teste que falha. Não corrija em silêncio no meio de uma refatoração.

## Passos pequenos

- Uma refatoração por commit: renomear, extrair, mover ou remover duplicação.
- Diffs pequenos o bastante para revisar em poucos minutos.
- Prefira refatorações mecânicas, feitas com ferramenta (renomear símbolo, extrair função), a reescrever à mão.
- Pare e pergunte antes de mexer em:
  - autenticação e sessão (`apps/api/src/identity`);
  - migrações e schema do banco (`apps/api/prisma`);
  - rotas públicas da API (os controllers em `apps/api/src/*/http`) e o roteamento do `vercel.json`.

## Migrações só acrescentam

- Migração nova só cria tabela, coluna opcional (ou com default) ou índice. O rollback automático do deploy volta o código, mas não o banco: a versão anterior precisa rodar no banco novo.
- Remover ou renomear coluna ou tabela vira dois PRs: primeiro o código para de usar, depois (em outro deploy) a migração remove.

## Subir a régua no código novo

- Código novo e alterado segue todas as regras de **Código novo** acima.
- Código novo: sem `any`. `any` existente: troque quando tocar nele.
- Lógica nova vai em módulos novos e pequenos, chamados pelo código antigo (strangler pattern). Não engorde arquivos-deus.
- Rode a checagem de tipos (comandos acima) no pacote que mudou. **Nunca** acrescente erros ou avisos.

## Preservar conhecimento

- Mantenha os comentários existentes. Podem explicar um comportamento estranho do código antigo.
- Quando descobrir por que um código esquisito existe, escreva um comentário com o PORQUÊ.
- Registre refatorações em andamento e armadilhas conhecidas em `docs/legacy-notes.md` (crie o arquivo na primeira anotação).
