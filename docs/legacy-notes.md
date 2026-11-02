# Notas do código legado

Refatorações em andamento e armadilhas conhecidas (regra em `AGENTS.md`).

## Rotas da API sem tela (2026-10-14)

Com Meu Dia, Agenda e Registros no lugar das abas antigas de Registros, o web deixou de chamar:

- `GET /api/records/board/problems` e `GET /api/records/board/feedbacks` (checklists antigos de Problemas e Feedbacks; a tela Registros lê `GET /api/records`);
- `GET /api/dashboard/overdue-count` (selo de atrasadas no menu, removido a pedido do Léo: o Meu Dia já tem a seção Atrasadas).

Ficaram na API porque são rotas públicas (o `AGENTS.md` pede para perguntar antes de mexer) e algum cliente externo, como o conector MCP, pode usá-las. Antes de removê-las, confira o MCP em `apps/api/src/mcp`.

## Cargo do colaborador vem da função (2026-10-18)

O cadastro não tem mais o campo Cargo. `Member.position` continua gravado porque matriz, desempenho, equipes e dashboard filtram por ele, mas quem decide é a função: `MemberRole.leadsTeams` liga o supervisor (`positionOfRole` em `apps/api/src/cadastro/domain/member-position.ts`).

- Nunca grave `position` direto: salvar o colaborador recalcula pela função, e `PUT /api/member-roles/:id/leads-teams` muda a marca e o cargo de todos com a função numa transação. O `position` que a tela ainda manda no corpo é ignorado.
- Quando der para trocar as leituras de `position` por `role.leadsTeams`, a coluna pode sair em dois PRs (regra das migrações).
- As funções do SIGEM só são criadas num banco sem função (`role-seed.ts`). Antes o boot recriava pelo nome exato e quem renomeava "mecânico" para "Mecânico" ficava com as duas; a migração `20261018200000_role_leads_teams` juntou as repetidas.

## RP sem Problema espelho (2026-10-29)

A pedido do Léo, o RP não cria mais Problema em Registros. O que ficou do espelho, para tirar com calma:

- Os problemas `origin = "rp"` gravados antes continuam no banco, escondidos de Registros, Dashboard e ficha do colaborador por `inRegistros` (`apps/api/src/registro/domain/registros-scope.ts`). Excluir o RP ainda apaga o espelho dele. Apagar os que sobraram é passo à parte, com o ok do Léo.
- `Rp.problemRecordId` fica nulo nos RPs novos. A coluna só sai depois que nenhum código ler (regra das migrações: dois PRs).
- Código que só serve ao espelho antigo: `GET /api/rp/by-problem/:recordId` (rota pública, perguntar antes), `RpMirror` em `RecordSheetPage.tsx`, o desvio de `origin === "rp"` em `sheet-redirect.ts` e `board.ts`, o `rpId` do quadro de Problemas e o aviso de RP em `record-removal.ts`.
